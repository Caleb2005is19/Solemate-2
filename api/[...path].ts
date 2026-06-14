// REQUIRED ENV VARS ON VERCEL:
// INTASEND_PUBLISHABLE_KEY=ISPubKey_live_...
// INTASEND_SECRET_KEY=ISSecretKey_live_...
// INTASEND_TEST=false
// APP_URL=https://solemate-2.vercel.app
// VITE_FIREBASE_PROJECT_ID=your-project-id

import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import IntaSend_raw from 'intasend-node';

dotenv.config();

// Handle ES module and CommonJS default export wrapping defensively
const IntaSend = (typeof IntaSend_raw === 'function') 
  ? IntaSend_raw 
  : ((IntaSend_raw as any).default || IntaSend_raw);

// Initialize IntaSend lazily
function getIntasend(): any {
  const pubKey = (process.env.INTASEND_PUBLISHABLE_KEY || '').trim();
  const secKey = (process.env.INTASEND_SECRET_KEY || '').trim();
  if (!pubKey || !secKey) {
    throw new Error('IntaSend keys missing. Set INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY in Vercel environment variables.');
  }
  const isTestEnv = process.env.INTASEND_TEST !== 'false';
  return new IntaSend(pubKey, secKey, isTestEnv);
}

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

import fs from 'fs';
import path from 'path';

let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
let databaseId = (process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '').trim();

// Read from firebase-applet-config.json if variables are missing
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!projectId && configData.projectId) {
      projectId = configData.projectId;
      console.log('Using backend Firebase projectId from config file:', projectId);
    }
    if (!databaseId && (configData.firestoreDatabaseId || configData.databaseId)) {
      databaseId = configData.firestoreDatabaseId || configData.databaseId;
      console.log('Using backend Firebase databaseId from config file:', databaseId);
    }
  }
} catch (e: any) {
  console.warn('Could not load backup config file for Firebase in backend:', e.message);
}

console.log('Firebase Config Debug:', {
  projectId: projectId || 'MISSING',
  databaseId: databaseId || 'DEFAULT',
  env_PROJECT_ID: process.env.PROJECT_ID || 'MISSING',
  env_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'MISSING',
  env_VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'MISSING'
});

let appInstance: admin.app.App;
try {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      appInstance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      });
    } else {
      appInstance = admin.initializeApp(projectId ? { projectId } : {});
    }
  } else {
    appInstance = admin.apps[0]!;
  }
  db = (databaseId && databaseId !== '(default)' && databaseId !== '')
    ? getFirestore(appInstance, databaseId)
    : getFirestore(appInstance);
  db.settings({ ignoreUndefinedProperties: true });
} catch (e: any) {
  console.error('Firebase init error:', e.message);
}

// Background dynamic prober to find the working Firestore project/credential connection
async function runFailsafeInitialization() {
  try {
    await db.collection('orders').limit(1).get();
    console.log('Firebase connection verified.');
  } catch (err: any) {
    console.warn('Firebase probe failed:', err.message);
  }
}

runFailsafeInitialization().catch(err => {
  console.error('Background failsafe init encountered an error:', err);
});

const app = express();
app.set('trust proxy', 1);

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
app.use('/api/intasend/stkpush', apiLimiter);

// IntaSend STK Push
app.post('/api/intasend/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId, email, firstName, lastName } = req.body;

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

    const customerName = `${firstName || 'Customer'} ${lastName || 'User'}`.trim();

    let response;
    let isMock = false;

    try {
      const client = getIntasend();
      response = await client.collection().mpesaStkPush({
        first_name: firstName || 'Customer',
        last_name: lastName || 'User',
        name: customerName,
        email: email || 'customer@example.com',
        host: process.env.APP_URL || 'https://solemate.co.ke',
        amount: Math.ceil(amount),
        phone_number: formattedPhone,
        api_ref: orderId
      });
    } catch (apiErr: any) {
      let errMsg = 'IntaSend API error';
      if (Buffer.isBuffer(apiErr)) {
        try { const p = JSON.parse(apiErr.toString()); errMsg = p.error || p.detail || p.message || apiErr.toString(); } 
        catch { errMsg = apiErr.toString(); }
      } else {
        errMsg = apiErr?.message || JSON.stringify(apiErr) || 'Unknown IntaSend error';
      }
      console.error('IntaSend STK Push failed:', errMsg);
      return res.status(502).json({ success: false, error: errMsg });
    }

    if (response) {
      // Intasend returns an invoice object with invoice_id if successful
      const invoiceId = response.invoice?.invoice_id || response.id;
      
      try {
        await db.collection('orders').doc(orderId).set({
          intasendInvoiceId: invoiceId,
          status: 'Processing',
          paymentMethod: 'IntaSend M-Pesa'
        }, { merge: true });
      } catch (fsError: any) {
        console.error('Firestore Update Error during IntaSend STK Push:', fsError);
      }

      res.json({ 
        success: true, 
        message: isMock ? 'IntaSend STK Push initiated (Simulated Sandbox)' : 'IntaSend STK Push initiated', 
        invoiceId 
      });
    } else {
      res.status(400).json({ success: false, error: 'Failed to initiate IntaSend STK push' });
    }
  } catch (error: any) {
    console.error('IntaSend STK Push Error:', error);
    let errorMessage = 'Internal server error';
    
    if (error) {
      if (Buffer.isBuffer(error)) {
        try {
          const str = error.toString();
          const parsed = JSON.parse(str);
          if (parsed.errors && Array.isArray(parsed.errors) && parsed.errors[0]) {
            errorMessage = parsed.errors[0].detail || parsed.errors[0].message || str;
          } else {
            errorMessage = parsed.error || parsed.message || str;
          }
        } catch {
          errorMessage = error.toString();
        }
      } else if (typeof error === 'string') {
        try {
          const parsed = JSON.parse(error);
          errorMessage = parsed.error || parsed.message || error;
        } catch {
          errorMessage = error;
        }
      } else if (typeof error === 'object') {
        errorMessage = error.message || error.error || JSON.stringify(error);
      }
    }
    
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// IntaSend Webhook
app.post('/api/intasend/webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('IntaSend Webhook Received:', payload);

    // Intasend payload structure can vary, but usually contains invoice_id and state
    const invoiceId = payload.invoice_id || payload.id;
    const state = payload.state; // e.g., 'COMPLETE', 'FAILED', 'PENDING'
    const orderId = payload.api_ref;

    if (orderId) {
      const orderRef = db.collection('orders').doc(orderId);
      
      if (state === 'COMPLETE') {
        await orderRef.update({
          status: 'Processing',
          paymentStatus: 'Paid',
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          intasendTransactionId: payload.transaction_id,
          verificationMethod: 'Automatic'
        });
      } else if (state === 'FAILED') {
        await orderRef.update({
          status: 'Cancelled',
          paymentStatus: 'Failed',
          paymentError: 'Payment failed via IntaSend'
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('IntaSend Webhook Error:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
});

// IntaSend Status Check
app.get('/api/intasend/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data();
    const invoiceId = orderData?.intasendInvoiceId;

    if (invoiceId) {
      try {
          const client = getIntasend();
          const response = await client.collection().status(invoiceId);
          // Update order status if IntaSend returns a new state
          if (response && response.invoice) {
             const state = response.invoice.state;
             if (state === 'COMPLETE' && orderData?.paymentStatus !== 'Paid') {
                await db.collection('orders').doc(orderId).update({
                  paymentStatus: 'Paid',
                  status: 'Processing',
                  paidAt: admin.firestore.FieldValue.serverTimestamp()
                });
             }
          }
        } catch (statusError) {
          console.error('IntaSend Status API Error:', statusError);
        }
    }

    // Return the latest data from our DB
    const updatedOrderDoc = await db.collection('orders').doc(orderId).get();
    const updatedOrderData = updatedOrderDoc.data();

    res.json({ 
      status: updatedOrderData?.status, 
      paymentStatus: updatedOrderData?.paymentStatus,
      paymentError: updatedOrderData?.paymentError
    });
  } catch (error) {
    console.error('IntaSend Status Check Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    if (!db) throw new Error('Firestore not initialized.');

    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data();
    const order = { id, ...orderData, date: orderData?.date || new Date().toISOString().split('T')[0] };

    const React = (await import('react')).default;
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { default: InvoiceDocument } = await import('../src/components/InvoiceDocument.js');

    const buffer = await renderToBuffer(React.createElement(InvoiceDocument, { order }) as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id.slice(-8).toUpperCase()}.pdf`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

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

// Re-route M-Pesa endpoints to use IntaSend under the hood
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId, email, firstName, lastName } = req.body;
    
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

    // Try to load customer details from existing order if not sent directly
    let finalEmail = email || 'customer@example.com';
    let finalFirstName = firstName || 'Customer';
    let finalLastName = lastName || 'User';

    try {
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        if (orderData?.customerInfo) {
          finalEmail = orderData.customerInfo.email || finalEmail;
          finalFirstName = orderData.customerInfo.firstName || finalFirstName;
          finalLastName = orderData.customerInfo.lastName || finalLastName;
        }
      }
    } catch (fsErr) {
      console.warn('Could not load order customer info from Firestore for IntaSend STK push redirect:', fsErr);
    }

    const customerName = `${finalFirstName} ${finalLastName}`.trim();

    let response;
    let isMock = false;

    try {
      const client = getIntasend();
      response = await client.collection().mpesaStkPush({
        first_name: finalFirstName,
        last_name: finalLastName,
        name: customerName,
        email: finalEmail,
        host: process.env.APP_URL || 'https://solemate.co.ke',
        amount: Math.ceil(amount),
        phone_number: formattedPhone,
        api_ref: orderId
      });
    } catch (apiErr: any) {
      let errMsg = 'IntaSend API error';
      if (Buffer.isBuffer(apiErr)) {
        try { const p = JSON.parse(apiErr.toString()); errMsg = p.error || p.detail || p.message || apiErr.toString(); } 
        catch { errMsg = apiErr.toString(); }
      } else {
        errMsg = apiErr?.message || JSON.stringify(apiErr) || 'Unknown IntaSend error';
      }
      console.error('IntaSend STK Push failed:', errMsg);
      return res.status(502).json({ success: false, error: errMsg });
    }

    if (response) {
      const invoiceId = response.invoice?.invoice_id || response.id;
      
      try {
        await db.collection('orders').doc(orderId).set({
          intasendInvoiceId: invoiceId,
          mpesaCheckoutId: invoiceId, // Keep both fields populated for maximum compatibility
          status: 'Processing',
          paymentMethod: 'IntaSend M-Pesa'
        }, { merge: true });
      } catch (fsError: any) {
        console.error('Firestore Update Error during IntaSend STK Push (mpesa redirect):', fsError);
      }

      res.json({ 
        success: true, 
        message: isMock ? 'STK Push initiated (Simulated Sandbox)' : 'STK Push initiated', 
        checkoutRequestId: invoiceId, // Return as checkoutRequestId for legacy client endpoints
        invoiceId
      });
    } else {
      res.status(400).json({ success: false, error: 'Failed to initiate STK push via IntaSend' });
    }
  } catch (error: any) {
    console.error('STK Push Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Deprecated direct Safaricom webhook. Kept as stub for backward compatibility.
app.post('/api/mpesa/callback', async (req, res) => {
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

// Securely fetch the IntaSend publishable key to prevent hardcoding on clients
app.get('/api/intasend/publishable-key', (req, res) => {
  res.json({ publishableKey: process.env.INTASEND_PUBLISHABLE_KEY || '' });
});

// Helper middleware to verify admin requests securely
async function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user has direct admin email or admin role in DB
    const isOwnerByEmail = decodedToken.email === 'carlisat19@gmail.com';
    let isAdminRole = false;
    
    if (!isOwnerByEmail && db) {
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        isAdminRole = true;
      }
    }

    if (isOwnerByEmail || isAdminRole) {
      (req as any).user = decodedToken;
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
  } catch (error: any) {
    console.error('Admin verification failed:', error.message);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Secure Admin Coupon CRUD endpoints - completely bypass firestore rules via admin sdk
app.get('/api/admin/coupons', verifyAdmin, async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database is not initialized' });
    }
    const querySnapshot = await db.collection('coupons').get();
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        code: data.code,
        discountPercentage: Number(data.discountPercentage ?? data.discount ?? 0),
        isActive: data.isActive !== false,
        maxUses: data.maxUses ?? 100,
        usedCount: data.usedCount ?? 0,
        expiryDate: data.expiryDate || '',
      });
    });
    res.json({ success: true, coupons: list });
  } catch (error: any) {
    console.error('Fetch admin coupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons', message: error.message });
  }
});

app.post('/api/admin/coupons', verifyAdmin, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { code, discountPercentage, isActive, maxUses, usedCount, expiryDate } = req.body;
    
    const docRef = await db.collection('coupons').add({
      code: String(code).trim().toUpperCase(),
      discountPercentage: Number(discountPercentage),
      isActive: isActive !== false,
      maxUses: Number(maxUses ?? 100),
      usedCount: Number(usedCount ?? 0),
      expiryDate: expiryDate || ''
    });
    
    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon', message: error.message });
  }
});

app.put('/api/admin/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const body = req.body;
    
    const updateData: any = {};
    if (body.code !== undefined) updateData.code = String(body.code).toUpperCase();
    if (body.discountPercentage !== undefined) updateData.discountPercentage = Number(body.discountPercentage);
    if (body.isActive !== undefined) updateData.isActive = !!body.isActive;
    if (body.maxUses !== undefined) updateData.maxUses = Number(body.maxUses);
    if (body.usedCount !== undefined) updateData.usedCount = Number(body.usedCount);
    if (body.expiryDate !== undefined) updateData.expiryDate = body.expiryDate;
    
    await db.collection('coupons').doc(id).update(updateData);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon', message: error.message });
  }
});

app.delete('/api/admin/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    await db.collection('coupons').doc(id).delete();
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon', message: error.message });
  }
});

app.post('/api/admin/coupons/seed', verifyAdmin, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { samples } = req.body;
    if (!samples || !Array.isArray(samples)) {
      return res.status(400).json({ error: 'Samples active list is required' });
    }
    
    // Check existing coupons to prevent duplicates
    const snapshot = await db.collection('coupons').get();
    const existingCodes = new Set<string>();
    snapshot.forEach(docSnap => {
      if (docSnap.data().code) {
        existingCodes.add(String(docSnap.data().code).trim().toUpperCase());
      }
    });

    const batch = db.batch();
    let seededCount = 0;
    
    for (const sample of samples) {
      const codeUpper = String(sample.code).trim().toUpperCase();
      if (!existingCodes.has(codeUpper)) {
        const docRef = db.collection('coupons').doc();
        batch.set(docRef, {
          code: codeUpper,
          discountPercentage: Number(sample.discountPercentage),
          isActive: sample.isActive !== false,
          maxUses: Number(sample.maxUses ?? 100),
          usedCount: Number(sample.usedCount ?? 0),
          expiryDate: sample.expiryDate || ''
        });
        seededCount++;
      }
    }
    
    if (seededCount > 0) {
      await batch.commit();
    }
    
    res.json({ success: true, seededCount });
  } catch (error: any) {
    console.error('Seed coupons error:', error);
    res.status(500).json({ error: 'Failed to seed coupons', message: error.message });
  }
});

// Validate Coupon codes for Checkout discount triggers
app.get('/api/coupons/validate', async (req, res) => {
  try {
    const code = (req.query.code as string || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    // 1. Try Admin SDK to securely fetch coupons from raw database first (completely bypasses rules)
    if (db) {
      try {
        const querySnapshot = await db.collection('coupons').where('code', '==', code).get();
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          const isActive = data.isActive !== false;
          const maxUses = data.maxUses ?? 100;
          const usedCount = data.usedCount ?? 0;
          const discountPercentage = Number(data.discountPercentage ?? data.discount ?? 0);
          
          let expired = false;
          if (data.expiryDate) {
            let expiryDateObj: Date;
            if (data.expiryDate.toDate) {
              expiryDateObj = data.expiryDate.toDate();
            } else {
              expiryDateObj = new Date(data.expiryDate);
            }
            if (!isNaN(expiryDateObj.getTime()) && expiryDateObj < new Date()) {
              expired = true;
            }
          }

          if (!isActive) {
            return res.status(400).json({ error: 'This coupon is currently inactive' });
          }

          if (expired) {
            return res.status(400).json({ error: 'This coupon code has expired' });
          }

          if (usedCount >= maxUses) {
            return res.status(400).json({ error: 'This coupon has reached its maximum uses' });
          }

          return res.json({
            success: true,
            code,
            discountPercentage
          });
        }
      } catch (dbErr: any) {
        console.error('Backend Admin coupon check failed, continuing with fallback:', dbErr.message);
      }
    }

    // 2. Preseed standardized e-commerce promotion codes fallback catalog
    const fallbackCoupons: Record<string, number> = {
      'SOLE20': 20,
      'WELCOME10': 10,
      'SNEAKERHEAD': 15
    };

    if (fallbackCoupons[code] !== undefined) {
      return res.json({ 
        success: true, 
        code, 
        discountPercentage: fallbackCoupons[code] 
      });
    }

    res.status(400).json({ error: 'Invalid coupon code. Try SOLE20 or WELCOME10' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error validating coupon', message: error.message });
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

    let orderData = orderDoc.data();
    const invoiceId = orderData?.intasendInvoiceId || orderData?.mpesaCheckoutId;

    if (invoiceId) {
      if (typeof invoiceId === 'string' && (invoiceId.startsWith('mock-mpesa-') || invoiceId.startsWith('mock-inv-'))) {
        // Complete simulated payments instantly
        if (orderData?.paymentStatus !== 'Paid') {
          try {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'Paid',
              status: 'Processing',
              mpesaReceipt: `MOCK${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              verificationMethod: 'Automatic'
            });
            const updated = await db.collection('orders').doc(orderId).get();
            orderData = updated.data();
          } catch (fsErr) {
            console.error('Firestore Update Error during Simulated M-Pesa status complete:', fsErr);
          }
        }
      } else {
        try {
          const client = getIntasend();
          const response = await client.collection().status(invoiceId);
          if (response && response.invoice) {
             const state = response.invoice.state;
             if (state === 'COMPLETE' && orderData?.paymentStatus !== 'Paid') {
                await db.collection('orders').doc(orderId).update({
                  paymentStatus: 'Paid',
                  status: 'Processing',
                  paidAt: admin.firestore.FieldValue.serverTimestamp()
                });
                const updated = await db.collection('orders').doc(orderId).get();
                orderData = updated.data();
             }
          }
        } catch (statusError) {
          console.error('IntaSend Status API Error during legacy status check endpoint:', statusError);
        }
      }
    }

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

// ==========================================
// Log Aggregator System
// ==========================================
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: 'server' | 'client';
  message: string;
  metadata?: any;
}

const logsBuffer: LogEntry[] = [];
const MAX_LOGS = 300;

function addLog(level: 'info' | 'warn' | 'error', source: 'server' | 'client', message: string, metadata?: any) {
  logsBuffer.unshift({
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    metadata
  });
  if (logsBuffer.length > MAX_LOGS) {
    logsBuffer.pop();
  }
}

// Hook console logs to capture server errors/actions
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args: any[]) => {
  originalLog(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (!msg.includes('/api/logs')) {
    addLog('info', 'server', msg);
  }
};

console.warn = (...args: any[]) => {
  originalWarn(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (!msg.includes('/api/logs')) {
    addLog('warn', 'server', msg);
  }
};

console.error = (...args: any[]) => {
  originalError(...args);
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  if (!msg.includes('/api/logs')) {
    addLog('error', 'server', msg);
  }
};

// Log Endpoints
app.get('/api/logs', (req, res) => {
  res.json({ success: true, logs: logsBuffer });
});

app.post('/api/logs', (req, res) => {
  try {
    const { level, message, metadata } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    addLog(level || 'info', 'client', message, metadata);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to ingest log', message: err.message });
  }
});

app.post('/api/logs/clear', (req, res) => {
  logsBuffer.length = 0;
  res.json({ success: true });
});

app.post('/api/logs/test', (req, res) => {
  const { level, message } = req.body;
  if (level === 'info') {
    console.log(`[TEST INFO EFFECT] ${message || 'Simulated informational log on server'}`);
  } else if (level === 'warn') {
    console.warn(`[TEST WARNING EFFECT] ${message || 'Simulated warning log on server'}`);
  } else if (level === 'error') {
    console.error(`[TEST ERROR EFFECT] ${message || 'Simulated error log on server'}`);
  }
  res.json({ success: true });
});

app.get("/api/health", async (req, res) => {
  let firestoreStatus = "not initialized";
  let firestoreTest = "not attempted";
  
  if (db) {
    firestoreStatus = "initialized";
    try {
      // Try a simple operation to check permissions
      const testDoc = await db.collection('orders').limit(1).get();
      firestoreTest = "connected (read successful)";
    } catch (err: any) {
      firestoreTest = `connection failed: ${err.message} (code: ${err.code})`;
    }
  }

  res.json({ 
    status: "ok",
    firebase: firestoreStatus,
    firestoreTest: firestoreTest,
    config: {
      projectId: projectId || "missing",
      databaseId: databaseId || "(default)",
      runningInVercel: !!process.env.VERCEL
    }
  });
});

export default app;
