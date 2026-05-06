import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '(default)';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: projectId,
    });
    console.log(`Firebase Admin initialized for project: ${projectId || 'default'}`);
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

db = getFirestore(databaseId);
db.settings({ ignoreUndefinedProperties: true });

const app = express();

app.use(express.json());

// Rate Limiting for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/mpesa/stkpush', apiLimiter);
app.use('/api/mpesa/verify-receipt', apiLimiter);

app.post('/api/load-test/bulk-orders', async (req, res) => {
  try {
    const { count = 10, userId = 'test-user' } = req.body;
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const orderId = `load-test-${Date.now()}-${i}`;
      orders.push(
        db.collection('orders').doc(orderId).set({
          userId,
          items: [{ id: 'test-product', name: 'Test Product', price: 100, quantity: 1 }],
          total: 100,
          status: 'Pending',
          paymentStatus: 'Unpaid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isLoadTest: true
        })
      );
    }
    
    await Promise.all(orders);
    res.json({ success: true, message: `Successfully created ${count} test orders` });
  } catch (error) {
    console.error('Load Test Error:', error);
    res.status(500).json({ error: 'Internal server error during load test' });
  }
});

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

const getBaseUrl = () => {
  return ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
};

const getOAuthToken = async () => {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting OAuth token:', error);
    throw error;
  }
};

const transactionMap = new Map<string, string>();

app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;
    
    if (!phone || !amount || !orderId) {
      return res.status(400).json({ error: 'Phone, amount, and orderId are required' });
    }

    let formattedPhone = phone.replace(/\s+/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
      formattedPhone = `254${formattedPhone}`;
    }

    const token = await getOAuthToken();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const callbackUrl = `${process.env.APP_URL || 'https://solemate.co.ke'}/api/mpesa/callback`;

    const payload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId,
      TransactionDesc: `Payment for Order ${orderId}`,
    };

    const response = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.ResponseCode === '0') {
      transactionMap.set(data.CheckoutRequestID, orderId);
      try {
        await db.collection('orders').doc(orderId).set({
          mpesaCheckoutId: data.CheckoutRequestID,
          status: 'Processing'
        }, { merge: true });
      } catch (fsError: any) {
        console.error('Firestore Update Error during STK Push:', fsError);
      }
      res.json({ success: true, message: 'STK Push initiated', checkoutRequestId: data.CheckoutRequestID });
    } else {
      res.status(400).json({ success: false, error: data.CustomerMessage || 'Failed to initiate STK push' });
    }
  } catch (error) {
    console.error('STK Push Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    console.log(`M-Pesa Callback for ${checkoutRequestId}: ${resultDesc} (${resultCode})`);

    const orderId = transactionMap.get(checkoutRequestId);
    
    if (orderId) {
      const orderRef = db.collection('orders').doc(orderId);
      if (resultCode === 0) {
        const metadata = callbackData.CallbackMetadata.Item;
        const mpesaReceipt = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
        
        await orderRef.update({
          status: 'Processing',
          paymentStatus: 'Paid',
          mpesaReceipt: mpesaReceipt,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          verificationMethod: 'Automatic'
        });
      } else {
        await orderRef.update({
          status: 'Cancelled',
          paymentStatus: 'Failed',
          paymentError: resultDesc
        });
      }
      transactionMap.delete(checkoutRequestId);
    } else {
      const ordersSnapshot = await db.collection('orders').where('mpesaCheckoutId', '==', checkoutRequestId).limit(1).get();
      if (!ordersSnapshot.empty) {
        const orderDoc = ordersSnapshot.docs[0];
        if (resultCode === 0) {
          const metadata = callbackData.CallbackMetadata.Item;
          const mpesaReceipt = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;
          await orderDoc.ref.update({
            status: 'Processing',
            paymentStatus: 'Paid',
            mpesaReceipt: mpesaReceipt,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            verificationMethod: 'Automatic'
          });
        } else {
          await orderDoc.ref.update({
            status: 'Cancelled',
            paymentStatus: 'Failed',
            paymentError: resultDesc
          });
        }
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Callback Error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Internal Error' });
  }
});

app.post('/api/mpesa/verify-receipt', async (req, res) => {
  try {
    const { orderId, receiptCode } = req.body;
    
    if (!orderId || !receiptCode) {
      return res.status(400).json({ error: 'Order ID and Receipt Code are required' });
    }

    const cleanReceipt = receiptCode.trim().toUpperCase();
    if (cleanReceipt.length < 8 || cleanReceipt.length > 15) {
      return res.status(400).json({ error: 'Invalid M-Pesa receipt code format' });
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await orderRef.update({
      status: 'Processing',
      paymentStatus: 'Paid',
      mpesaReceipt: cleanReceipt,
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
      verificationMethod: 'Manual'
    });

    res.json({ success: true, message: 'Payment receipt submitted for verification' });
  } catch (error) {
    console.error('Receipt Verification Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/mpesa/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data();
    res.json({ 
      status: orderData?.status, 
      paymentStatus: orderData?.paymentStatus,
      paymentError: orderData?.paymentError
    });
  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok",
    firebase: db ? "initialized" : "not initialized",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "missing"
  });
});

export default app;
