import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // M-Pesa Credentials
  const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
  const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
  const PASSKEY = process.env.MPESA_PASSKEY;
  const SHORTCODE = process.env.MPESA_SHORTCODE;
  const ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';

  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !SHORTCODE) {
    console.warn('M-Pesa credentials missing. STK Push will not work.');
  }

  const getBaseUrl = () => {
    return ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  };

  // Helper to get OAuth Token
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

  // Store transaction mapping (CheckoutRequestID -> OrderID)
  // In a real app, you might use a database for this
  const transactionMap = new Map<string, string>();

  // M-Pesa STK Push
  app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
      const { phone, amount, orderId } = req.body;
      
      if (!phone || !amount || !orderId) {
        return res.status(400).json({ error: 'Phone, amount, and orderId are required' });
      }

      // Format phone number to 254...
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

      // Use the container URL for the callback
      const callbackUrl = `${process.env.APP_URL || 'https://your-app.run.app'}/api/mpesa/callback`;

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
        // Map the checkout request ID to the order ID
        transactionMap.set(data.CheckoutRequestID, orderId);
        
        // Also update the order in Firestore with the checkout ID
        try {
          await db.collection('orders').doc(orderId).set({
            mpesaCheckoutId: data.CheckoutRequestID,
            status: 'Processing'
          }, { merge: true });
        } catch (fsError: any) {
          console.error('Firestore Update Error during STK Push:', fsError);
          if (fsError.message?.includes('PERMISSION_DENIED')) {
            return res.status(500).json({ 
              success: false, 
              error: 'Database permission denied. Please ensure Firebase setup is complete and terms are accepted.' 
            });
          }
          // Continue even if Firestore update fails, as the STK push was successful
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

  // Callback Route
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
          // Success
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
          // Failure
          await orderRef.update({
            status: 'Cancelled',
            paymentStatus: 'Failed',
            paymentError: resultDesc
          });
        }
        
        transactionMap.delete(checkoutRequestId);
      } else {
        // If not in map, try finding by field in Firestore
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

  // Manual Receipt Verification Route
  app.post('/api/mpesa/verify-receipt', async (req, res) => {
    try {
      const { orderId, receiptCode } = req.body;
      
      if (!orderId || !receiptCode) {
        return res.status(400).json({ error: 'Order ID and Receipt Code are required' });
      }

      // Basic validation of receipt code (usually 10 chars, starting with S, T, etc.)
      const cleanReceipt = receiptCode.trim().toUpperCase();
      if (cleanReceipt.length < 8 || cleanReceipt.length > 15) {
        return res.status(400).json({ error: 'Invalid M-Pesa receipt code format' });
      }

      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // In a real production app, you would verify this code against Safaricom's API
      // For this prototype, we'll mark it as "Paid" and store the receipt for manual review by the seller
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

  // Status Check Route
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

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      firebase: db ? "initialized" : "not initialized",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "missing"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not in a serverless environment (like Vercel)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
export default appPromise;
