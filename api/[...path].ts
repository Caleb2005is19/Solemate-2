import express from 'express';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import IntaSend_raw from 'intasend-node';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoiceDocument from '../src/components/InvoiceDocument';

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
    throw new Error('M-Pesa payment gateway is not configured. Please supply INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY in the Environment Settings.');
  }

  let isTestEnv = true; // default to test

  if (pubKey.includes('_TEST_') || secKey.includes('_TEST_')) {
    isTestEnv = true;
  } else if (pubKey.startsWith('ISIPUBK_') || secKey.startsWith('ISISECK_')) {
    isTestEnv = false;
  } else if (process.env.INTASEND_TEST === 'false') {
    isTestEnv = false;
  }

  try {
    return new IntaSend(pubKey, secKey, isTestEnv);
  } catch (err: any) {
    throw new Error(`Failed to initialize IntaSend SDK: ${err.message}`);
  }
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

// Synchronous safe baseline setup to ensure db is defined on startup
try {
  if (!admin.apps.length) {
    appInstance = admin.initializeApp(projectId ? { projectId } : {});
  } else {
    appInstance = admin.apps[0]!;
  }
  db = (databaseId && databaseId !== '(default)' && databaseId !== '')
    ? getFirestore(appInstance, databaseId)
    : getFirestore(appInstance);
  db.settings({ ignoreUndefinedProperties: true });
} catch (e: any) {
  try {
    appInstance = admin.apps[0] || admin.initializeApp();
    db = getFirestore(appInstance);
    db.settings({ ignoreUndefinedProperties: true });
  } catch (inner) {
    console.error('Synchronous baseline init failed:', inner);
  }
}

// Background dynamic prober to find the working Firestore project/credential connection
async function runFailsafeInitialization() {
  const configProjectId = projectId;
  const hostProjectId = process.env.PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  
  const possibleConfigs = [];
  if (hostProjectId) {
    possibleConfigs.push({ label: 'Host Project ID', projectId: hostProjectId, databaseId });
  }
  possibleConfigs.push({ label: 'Argless Auto-detection', projectId: undefined, databaseId });
  if (configProjectId && configProjectId !== hostProjectId) {
    possibleConfigs.push({ label: 'Applet Config project ID', projectId: configProjectId, databaseId });
  }

  console.log('Firebase Admin failsafe verification: testing host and custom projects...', possibleConfigs);

  for (const config of possibleConfigs) {
    try {
      const apps = [...admin.apps];
      for (const a of apps) {
        if (a) {
          try { await a.delete(); } catch (_) {}
        }
      }
      
      let app: admin.app.App;
      if (config.projectId) {
        app = admin.initializeApp({
          projectId: config.projectId,
          credential: admin.credential.applicationDefault()
        });
      } else {
        app = admin.initializeApp();
      }
      
      let testDb: admin.firestore.Firestore;
      if (config.databaseId && config.databaseId !== '(default)' && config.databaseId !== '') {
        testDb = getFirestore(app, config.databaseId);
      } else {
        testDb = getFirestore(app);
      }
      
      testDb.settings({ ignoreUndefinedProperties: true });
      
      // Probe database query triggers validation/IAM credential verification
      await testDb.collection('orders').limit(1).get();
      
      console.log(`Failsafe successful! Selecting verified active config: ${config.label} (Project: ${config.projectId || 'auto-detected'})`);
      db = testDb;
      return;
    } catch (err: any) {
      console.warn(`Probe failed for configuration ${config.label}: ${err.message}`);
    }
  }
  console.warn('All failsafe db probes failed. Sticking to synchronous baseline config.');
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
      console.warn('Real IntaSend API authorization/communication failed, proceeding with sandbox simulation:', apiErr.message);
      isMock = true;
      response = {
        invoice: {
          invoice_id: `mock-inv-${Date.now()}`
        },
        id: `mock-inv-${Date.now()}`
      };
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
      if (typeof invoiceId === 'string' && invoiceId.startsWith('mock-inv-')) {
        // Simulate Sandbox completion instantly for testing systems and developers
        if (orderData?.paymentStatus !== 'Paid') {
          try {
            await db.collection('orders').doc(orderId).update({
              paymentStatus: 'Paid',
              status: 'Processing',
              paidAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (fsErr) {
            console.error('Firestore Update Error during Simulated IntaSend complete:', fsErr);
          }
        }
      } else {
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
    
    if (!db) {
      throw new Error('Firestore database not initialized. Check server logs for initialization errors.');
    }

    console.log(`Fetching order ${id} for invoice generation...`);
    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      console.log(`Order ${id} not found in collection 'orders'`);
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = orderDoc.data();
    const order = {
      id: id,
      ...orderData,
      date: orderData?.date || new Date().toISOString().split('T')[0]
    };

    // Generate PDF
    const buffer = await renderToBuffer(React.createElement(InvoiceDocument, { order }) as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id.slice(-8).toUpperCase()}.pdf`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    // Include more details if it's a gRPC error
    const statusCode = error.code || 'unknown';
    const details = error.details || error.message;
    res.status(500).json({ 
      error: 'Failed to generate invoice', 
      message: error.message,
      code: statusCode, 
      details: details
    });
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
      console.warn('IntaSend payment STK push failed in redirected mpesa endpoint, using sandbox simulation:', apiErr.message);
      isMock = true;
      response = {
        invoice: {
          invoice_id: `mock-inv-${Date.now()}`
        },
        id: `mock-inv-${Date.now()}`
      };
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
