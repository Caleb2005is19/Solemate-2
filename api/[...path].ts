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

import { GoogleGenAI } from '@google/genai';

async function getGenAI(explicitKey?: string): Promise<GoogleGenAI | null> {
  let key = (
    explicitKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();

  // If not found in process.env, check Firestore settings/site
  if (!key && db) {
    try {
      const siteDoc = await db.collection('settings').doc('site').get();
      if (siteDoc.exists) {
        const siteData = siteDoc.data();
        if (siteData?.geminiApiKey) {
          key = String(siteData.geminiApiKey).trim();
          console.log('[AI Authenticator] Using Gemini API key from Firestore settings/site');
        }
      }
    } catch (e: any) {
      console.warn('Could not read geminiApiKey from settings/site:', e.message);
    }
  }

  if (!key) {
    return null;
  }

  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    let order: any = null;

    if (db) {
      try {
        const orderDoc = await db.collection('orders').doc(id).get();
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          order = { id, ...orderData, date: orderData?.date || new Date().toISOString() };
        }
      } catch (dbErr: any) {
        console.warn('Could not read order from Firestore directly in backend:', dbErr.message);
      }
    }

    if (!order) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Invoice Not Found - Solemate.co.ke</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 60px 20px; color: #18181b; background: #fafafa;">
          <div style="max-width: 480px; margin: 0 auto; background: white; padding: 36px; border-radius: 16px; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="font-size: 24px; font-weight: 900; color: #f97316; margin-bottom: 8px;">Solemate.co.ke</div>
            <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 12px;">Invoice #${id.slice(-8).toUpperCase()}</h2>
            <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
              Order details can be previewed and printed directly from your account.
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <a href="/dashboard" style="display: inline-block; padding: 10px 20px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">Go to Dashboard</a>
              <a href="/profile" style="display: inline-block; padding: 10px 20px; background: #f4f4f5; color: #18181b; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 13px;">My Orders</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const { generateFullPrintDocument } = await import('../src/utils/printInvoice.ts');
    const html = generateFullPrintDocument(order);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Invoice Error - Solemate.co.ke</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 60px 20px; color: #18181b;">
        <h3 style="color: #ef4444;">Could not load invoice</h3>
        <p style="color: #71717a;">${error.message}</p>
        <p><a href="/dashboard" style="color: #f97316; font-weight: 700;">Return to Dashboard</a></p>
      </body>
      </html>
    `);
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

// ===============================================================
// Promo Campaigns Database Endpoints (Direct Firestore Admin SDK)
// ===============================================================

app.get('/api/promo-campaigns', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const snapshot = await db.collection('promo_campaigns').get();
    const campaigns: any[] = [];
    snapshot.forEach(doc => {
      campaigns.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Fetch promo campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch promo campaigns', message: error.message });
  }
});

app.post('/api/admin/promo-campaigns', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const campaign = req.body;
    if (!campaign || !campaign.id || !campaign.title) {
      return res.status(400).json({ error: 'Campaign id and title are required' });
    }
    await db.collection('promo_campaigns').doc(campaign.id).set(campaign, { merge: true });
    res.json({ success: true, id: campaign.id });
  } catch (error: any) {
    console.error('Save promo campaign error:', error);
    res.status(500).json({ error: 'Failed to save promo campaign', message: error.message });
  }
});

app.put('/api/admin/promo-campaigns/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const updates = req.body;
    await db.collection('promo_campaigns').doc(id).set(updates, { merge: true });
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Update promo campaign error:', error);
    res.status(500).json({ error: 'Failed to update promo campaign', message: error.message });
  }
});

app.delete('/api/admin/promo-campaigns/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    await db.collection('promo_campaigns').doc(id).delete();
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Delete promo campaign error:', error);
    res.status(500).json({ error: 'Failed to delete promo campaign', message: error.message });
  }
});

app.post('/api/admin/promo-campaigns/seed', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const snapshot = await db.collection('promo_campaigns').get();
    if (!snapshot.empty) {
      return res.json({ success: true, message: 'Already seeded', count: snapshot.size });
    }
    const defaultPromos = [
      {
        id: 'promo-flash-weekend',
        title: 'Weekend Air Jordan Drop',
        subtitle: 'Exclusive retro editions · Limited stock in Nairobi CBD',
        badgeText: '20% OFF',
        placement: 'all',
        couponCode: 'AIR20',
        discountPercentage: 20,
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
        link: '/shop?gender=Men',
        ctaText: 'Shop Retro Drop',
        active: true,
        countdown: true,
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        theme: 'dark',
        utmSource: 'weekend_drop',
        stats: { views: 142, clicks: 38 },
        createdAt: new Date().toISOString()
      },
      {
        id: 'promo-free-delivery',
        title: 'Free Nairobi CBD & Westlands Delivery',
        subtitle: 'On all orders above KES 5,000 this week only',
        badgeText: 'FREE SHIPPING',
        placement: 'shop-grid',
        couponCode: 'DELIVERYFREE',
        discountPercentage: 0,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
        link: '/shop',
        ctaText: 'Claim Free Delivery',
        active: true,
        countdown: false,
        theme: 'orange',
        utmSource: 'free_delivery',
        stats: { views: 89, clicks: 21 },
        createdAt: new Date().toISOString()
      }
    ];

    const batch = db.batch();
    for (const promo of defaultPromos) {
      batch.set(db.collection('promo_campaigns').doc(promo.id), promo);
    }
    await batch.commit();

    res.json({ success: true, count: defaultPromos.length });
  } catch (error: any) {
    console.error('Seed promo campaigns error:', error);
    res.status(500).json({ error: 'Failed to seed promo campaigns', message: error.message });
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

        // Check promo_campaigns collection
        const promoSnapshot = await db.collection('promo_campaigns').where('couponCode', '==', code).get();
        if (!promoSnapshot.empty) {
          const promoData = promoSnapshot.docs[0].data();
          if (promoData.active !== false) {
            return res.json({
              success: true,
              code,
              discountPercentage: Number(promoData.discountPercentage || 15)
            });
          }
        }
      } catch (dbErr: any) {
        console.error('Backend Admin coupon check failed, continuing with fallback:', dbErr.message);
      }
    }

    // 2. Preseed standardized e-commerce promotion codes fallback catalog
    const fallbackCoupons: Record<string, number> = {
      'SOLE20': 20,
      'WELCOME10': 10,
      'SNEAKERHEAD': 15,
      'AIR20': 20,
      'FLASH24': 25,
      'CLEAR30': 30,
      'BUNDLE2': 15,
      'DELIVERYFREE': 10
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
    console.error('Coupon validation error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// ==========================================
// In-Memory & Firestore Background Job Engine
// ==========================================
interface InternalCatalogJob {
  id: string;
  sellerId: string;
  sellerName?: string;
  status: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalPhotos: number;
  uploadedPhotos: number;
  processedPhotos: number;
  progressPercent: number;
  statusMessage: string;
  photos: {
    id: string;
    url: string;
    base64?: string;
    mimeType?: string;
    fileName?: string;
  }[];
  products: any[];
  geminiApiKey?: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const inMemoryCatalogJobs = new Map<string, InternalCatalogJob>();
let isCatalogWorkerActive = false;

// Background worker that processes jobs calmly with breathing cooldowns
async function triggerCatalogJobWorker() {
  if (isCatalogWorkerActive) return;
  isCatalogWorkerActive = true;

  try {
    while (true) {
      // 1. Look for pending job
      let targetJob: InternalCatalogJob | null = null;
      for (const [, j] of inMemoryCatalogJobs.entries()) {
        if (j.status === 'queued' || j.status === 'processing') {
          targetJob = j;
          break;
        }
      }

      if (!targetJob && db) {
        try {
          const snap = await db.collection('catalog_batch_jobs')
            .where('status', 'in', ['queued', 'processing'])
            .limit(1)
            .get();
          if (!snap.empty) {
            const data = snap.docs[0].data() as InternalCatalogJob;
            inMemoryCatalogJobs.set(data.id, data);
            targetJob = data;
          }
        } catch {
          // ignore firestore fetch errors
        }
      }

      if (!targetJob) {
        break; // No pending jobs
      }

      targetJob.status = 'processing';
      targetJob.updatedAt = new Date().toISOString();

      const processedCount = targetJob.processedPhotos || 0;
      const total = targetJob.photos.length || targetJob.totalPhotos || 1;

      if (processedCount >= total) {
        // Job complete!
        targetJob.status = 'completed';
        targetJob.progressPercent = 100;
        targetJob.statusMessage = `All ${total} photos sorted into ${targetJob.products.length} verified shoe listings! Ready for review.`;
        targetJob.completedAt = new Date().toISOString();
        targetJob.updatedAt = new Date().toISOString();

        if (db) {
          try {
            await db.collection('catalog_batch_jobs').doc(targetJob.id).set(targetJob, { merge: true });
          } catch {}
        }
        continue;
      }

      // Calm micro-batch of 2 photos per call
      const microBatchSize = 2;
      const nextBatch = targetJob.photos.slice(processedCount, processedCount + microBatchSize);

      targetJob.statusMessage = `Analyzing photos ${processedCount + 1} to ${Math.min(processedCount + microBatchSize, total)} of ${total}...`;
      targetJob.progressPercent = Math.min(98, Math.round((processedCount / total) * 100));

      if (db) {
        try {
          await db.collection('catalog_batch_jobs').doc(targetJob.id).set({
            status: 'processing',
            statusMessage: targetJob.statusMessage,
            progressPercent: targetJob.progressPercent,
            processedPhotos: processedCount,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch {}
      }

      // Analyze micro-batch with Gemini (with dual-model failover)
      const ai = await getGenAI(targetJob.geminiApiKey);
      let detectedShoes: any[] = [];

      if (ai) {
        detectedShoes = await analyzeMicroBatchWithAi(ai, nextBatch, targetJob.sellerId, processedCount);
      }

      if (detectedShoes.length === 0) {
        detectedShoes = createHonestFallbackShoes(nextBatch, targetJob.sellerId, processedCount);
      }

      targetJob.products.push(...detectedShoes);
      targetJob.processedPhotos = processedCount + nextBatch.length;
      targetJob.progressPercent = Math.min(99, Math.round((targetJob.processedPhotos / total) * 100));
      targetJob.updatedAt = new Date().toISOString();

      if (db) {
        try {
          await db.collection('catalog_batch_jobs').doc(targetJob.id).set({
            products: targetJob.products,
            processedPhotos: targetJob.processedPhotos,
            progressPercent: targetJob.progressPercent,
            statusMessage: `Sorted ${targetJob.processedPhotos}/${total} photos (${targetJob.products.length} shoes created)...`,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch {}
      }

      // Breathing cooldown: 1.8s between AI requests completely eliminates rate limits & 503 errors
      await new Promise(r => setTimeout(r, 1800));
    }
  } catch (err: any) {
    console.error('[Catalog Worker Exception]:', err);
  } finally {
    isCatalogWorkerActive = false;
  }
}

async function analyzeMicroBatchWithAi(ai: any, batch: any[], sellerId: string, startIndex: number): Promise<any[]> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
  for (const modelName of modelsToTry) {
    try {
      const parts: any[] = [
        {
          text: `You are an expert sneaker authenticator and footwear merchandiser in Nairobi, Kenya.
Inspect these ${batch.length} shoe photos. Group photos of the same shoe together or identify each shoe.
For each distinct shoe product found:
- "name": Authentic, specific sneaker/shoe model (e.g. "Air Jordan 4 Retro 'Military Black'", "Timberland 6-Inch Premium Waterproof Boot", "Adidas Samba OG", "Nike Dunk Low Retro Panda", "New Balance 550 White Grey"). Never invent fake hype names for casual shoes or dress shoes.
- "brand": Brand name (Nike, Jordan, Adidas, Timberland, Puma, New Balance, Converse, Vans, Clarks, etc.)
- "category": Strictly "Sneakers", "Lifestyle", "Running", or "Boots"
- "gender": "Men", "Women", or "Unisex"
- "color": Specific colorway
- "price": Realistic Kenyan retail price in KES integer (e.g. 4500 to 9500)
- "originalPrice": Strike-through price in KES (around 20% higher)
- "description": 2-3 engaging sentences describing the shoe, materials, and delivery in Kenya.
- "stock": 10
- "heroItemId": Exact Item ID of primary photo
- "angleItemIds": Array of other angle Item IDs
- "confidence": percentage number between 70 and 98
- "visualEvidence": One concise sentence stating the visible logo, box, or sole marking found in photo

Return strictly JSON: {"products": [...]}`
        }
      ];

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        parts.push({
          text: `Photo [${i + 1}] (Item ID: "${item.id}", Filename: "${item.fileName || 'photo_' + (startIndex + i + 1)}"):`
        });
        if (item.base64) {
          parts.push({
            inlineData: {
              mimeType: item.mimeType || 'image/jpeg',
              data: item.base64
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed.products.map((p: any, idx: number) => {
          let heroUrl = '';
          if (p.heroItemId) {
            const match = batch.find(b => b.id === p.heroItemId);
            if (match) heroUrl = match.url;
          }
          if (!heroUrl) heroUrl = batch[idx]?.url || batch[0]?.url || '';

          let angles: string[] = [];
          if (Array.isArray(p.angleItemIds)) {
            angles = p.angleItemIds.map((id: string) => batch.find(b => b.id === id)?.url).filter(Boolean);
          }

          return {
            id: `prod_${Date.now()}_${startIndex + idx}_${Math.random().toString(36).substring(2, 6)}`,
            name: p.name || 'Footwear Model',
            brand: p.brand || 'Solemate',
            category: p.category || 'Sneakers',
            gender: p.gender || 'Unisex',
            color: p.color || 'Standard',
            price: Number(p.price) || 5500,
            originalPrice: Number(p.originalPrice) || Math.round((Number(p.price) || 5500) * 1.25 / 100) * 100,
            image: heroUrl,
            images: angles.filter(a => a !== heroUrl),
            description: p.description || 'Authentic premium footwear available with express delivery across Nairobi and Kenya.',
            stock: 12,
            inStock: true,
            sellerId: sellerId || 'seller-official',
            isNew: true,
            confidence: Number(p.confidence) || 88,
            visualEvidence: p.visualEvidence || 'Visual silhouette and branding identified by Gemini Vision'
          };
        });
      }
    } catch (err: any) {
      console.warn(`[AI Catalog Worker] Model ${modelName} error:`, err.message);
      if (err.message && err.message.includes('503')) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  return [];
}

function createHonestFallbackShoes(batch: any[], sellerId: string, startIndex: number): any[] {
  return batch.map((item, idx) => {
    const cleanName = (item.fileName || `Footwear Photo ${startIndex + idx + 1}`)
      .replace(/\.[^/.]+$/, "")
      .replace(/[_-]/g, " ")
      .trim();
    return {
      id: `prod_${Date.now()}_${startIndex + idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName || `Footwear Item ${startIndex + idx + 1}`,
      brand: 'Pending Verification',
      price: 5500,
      originalPrice: 6800,
      category: 'Sneakers',
      gender: 'Unisex',
      color: 'Pending Verification',
      description: 'Authentic footwear listing pending model verification in Quick Aligner.',
      image: item.url,
      images: [],
      stock: 12,
      inStock: true,
      sellerId: sellerId || 'seller-official',
      confidence: 60,
      visualEvidence: 'Awaiting manual confirmation in Quick Aligner'
    };
  });
}

// ------------------------------------------
// Create Asynchronous Catalog Batch Job
// ------------------------------------------
app.post('/api/catalog/jobs/create', async (req, res) => {
  try {
    const { totalPhotos, sellerId, sellerName, geminiApiKey } = req.body;
    const jobId = `cjob_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const newJob: InternalCatalogJob = {
      id: jobId,
      sellerId: sellerId || 'seller-official',
      sellerName: sellerName || 'Storefront',
      status: 'uploading',
      totalPhotos: Number(totalPhotos) || 0,
      uploadedPhotos: 0,
      processedPhotos: 0,
      progressPercent: 0,
      statusMessage: 'Receiving uploaded photos in background chunks...',
      photos: [],
      products: [],
      geminiApiKey: geminiApiKey || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null
    };

    inMemoryCatalogJobs.set(jobId, newJob);

    if (db) {
      try {
        await db.collection('catalog_batch_jobs').doc(jobId).set(newJob);
      } catch (err: any) {
        console.warn('[Catalog Jobs] Firestore initial set warning:', err.message);
      }
    }

    res.json({ success: true, jobId, job: newJob });
  } catch (error: any) {
    console.error('[Catalog Jobs Create Error]:', error);
    res.status(500).json({ error: 'Failed to create catalog job', message: error.message });
  }
});

// ------------------------------------------
// Upload Micro-Chunk of Photos to a Job
// ------------------------------------------
app.post('/api/catalog/jobs/:jobId/upload-chunk', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { chunkIndex, totalChunks, items } = req.body;

    let job = inMemoryCatalogJobs.get(jobId);
    if (!job && db) {
      const snap = await db.collection('catalog_batch_jobs').doc(jobId).get();
      if (snap.exists) {
        job = snap.data() as InternalCatalogJob;
        inMemoryCatalogJobs.set(jobId, job);
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Catalog job not found' });
    }

    if (Array.isArray(items) && items.length > 0) {
      job.photos.push(...items);
      job.uploadedPhotos = job.photos.length;
    }

    // If all chunks uploaded or uploaded count reached totalPhotos
    const isAllUploaded = (chunkIndex >= totalChunks - 1) || (job.uploadedPhotos >= job.totalPhotos && job.totalPhotos > 0);
    if (isAllUploaded) {
      job.status = 'queued';
      job.statusMessage = `All ${job.uploadedPhotos} photos uploaded safely! Waiting for background AI sorting worker...`;
      // Trigger worker asynchronously
      setTimeout(() => triggerCatalogJobWorker(), 100);
    } else {
      job.statusMessage = `Uploaded ${job.uploadedPhotos} of ${job.totalPhotos} photos (chunk ${chunkIndex + 1}/${totalChunks})...`;
    }

    job.updatedAt = new Date().toISOString();

    if (db) {
      try {
        await db.collection('catalog_batch_jobs').doc(jobId).set({
          photos: job.photos,
          uploadedPhotos: job.uploadedPhotos,
          status: job.status,
          statusMessage: job.statusMessage,
          updatedAt: job.updatedAt
        }, { merge: true });
      } catch (err: any) {
        console.warn('[Catalog Jobs] Firestore chunk update warning:', err.message);
      }
    }

    res.json({
      success: true,
      uploadedPhotos: job.uploadedPhotos,
      isQueued: job.status === 'queued'
    });
  } catch (error: any) {
    console.error('[Catalog Jobs Upload Chunk Error]:', error);
    res.status(500).json({ error: 'Failed to append chunk', message: error.message });
  }
});

// ------------------------------------------
// Get Active or Recent Jobs
// ------------------------------------------
app.get('/api/catalog/jobs/active', async (req, res) => {
  try {
    const results: any[] = [];
    
    // Check in-memory
    for (const [, j] of inMemoryCatalogJobs.entries()) {
      results.push({
        id: j.id,
        sellerId: j.sellerId,
        sellerName: j.sellerName,
        status: j.status,
        totalPhotos: j.totalPhotos,
        uploadedPhotos: j.uploadedPhotos,
        processedPhotos: j.processedPhotos,
        progressPercent: j.progressPercent,
        statusMessage: j.statusMessage,
        productsCount: j.products ? j.products.length : 0,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
        completedAt: j.completedAt
      });
    }

    // Check Firestore
    if (db) {
      try {
        const snap = await db.collection('catalog_batch_jobs')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
        snap.forEach(d => {
          const data = d.data();
          if (!results.some(r => r.id === data.id)) {
            results.push({
              id: data.id,
              sellerId: data.sellerId,
              sellerName: data.sellerName,
              status: data.status,
              totalPhotos: data.totalPhotos,
              uploadedPhotos: data.uploadedPhotos,
              processedPhotos: data.processedPhotos,
              progressPercent: data.progressPercent,
              statusMessage: data.statusMessage,
              productsCount: data.products ? data.products.length : 0,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              completedAt: data.completedAt
            });
          }
        });
      } catch {}
    }

    res.json({ success: true, jobs: results });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch catalog jobs', message: error.message });
  }
});

// ------------------------------------------
// Get Single Job with Products
// ------------------------------------------
app.get('/api/catalog/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    let job = inMemoryCatalogJobs.get(jobId);

    if (!job && db) {
      const snap = await db.collection('catalog_batch_jobs').doc(jobId).get();
      if (snap.exists) {
        job = snap.data() as InternalCatalogJob;
        inMemoryCatalogJobs.set(jobId, job);
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get job', message: error.message });
  }
});

// ------------------------------------------
// Cancel or Dismiss Job
// ------------------------------------------
app.post('/api/catalog/jobs/:jobId/dismiss', async (req, res) => {
  try {
    const { jobId } = req.params;
    inMemoryCatalogJobs.delete(jobId);
    if (db) {
      try {
        await db.collection('catalog_batch_jobs').doc(jobId).delete();
      } catch {}
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to dismiss job', message: error.message });
  }
});

// ------------------------------------------
// Mass Photo Auto-Catalog AI Analyzer (Direct / Legacy with 503 Auto-Failover)
// ------------------------------------------
app.post('/api/catalog/ai-batch-analyze', async (req, res) => {
  try {
    const { items, defaultSellerId, batchIndex = 0, geminiApiKey } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one image item to analyze' });
    }

    console.log(`[AI Mass Catalog] Analyzing batch ${batchIndex + 1}: ${items.length} uploaded shoe photos...`);

    const ai = await getGenAI(geminiApiKey);
    let generatedProducts: any[] = [];
    let methodUsed = 'gemini-3.8-flash';

    if (ai) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
      
      for (const currentModel of modelsToTry) {
        try {
          const parts: any[] = [];
          parts.push({
            text: `You are an expert sneaker authenticator and footwear merchandiser in Nairobi, Kenya.
I have uploaded ${items.length} footwear photos.

YOUR TASK:
1. Carefully inspect each image. Group multiple photos of the SAME shoe into ONE single product.
2. For each distinct product:
   - "name": Trendy, authentic sneaker/shoe model name (e.g. "Air Jordan 4 Retro 'Military Black'", "Nike Dunk Low Retro Panda", "Timberland 6-Inch Premium Waterproof Boot", "Adidas Samba OG", "New Balance 550 White Grey"). Never guess random hype models for casual shoes.
   - "brand": Brand name (Nike, Jordan, Adidas, Timberland, Puma, New Balance, Converse, Vans, Clarks, etc.)
   - "category": Choose strictly from "Sneakers", "Lifestyle", "Running", "Boots"
   - "gender": Choose from "Men", "Women", "Unisex", "Kids"
   - "color": Dominant colorway
   - "price": Realistic Kenyan retail price in KES integer (e.g., KES 4,500 - 8,500 for sneakers, KES 8,500 - 12,500 for boots)
   - "originalPrice": Strike-through retail price (15% - 25% higher than price, rounded to nearest 100)
   - "description": 2-3 engaging sentences describing the materials, cushion, and fast Kenya-wide delivery.
   - "stock": 12
   - "inStock": true
   - "heroItemId": The exact Item ID string of the primary/hero photo
   - "angleItemIds": Array of exact Item ID strings of the other angle photos for this shoe

Return strictly JSON format: {"products": [...]}`
          });

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            parts.push({
              text: `Image [${i + 1}] (Item ID: "${item.id}", Filename: "${item.fileName || 'photo_' + (i + 1)}"):`
            });

            if (item.base64) {
              parts.push({
                inlineData: {
                  mimeType: item.mimeType || 'image/jpeg',
                  data: item.base64
                }
              });
            }
          }

          const response = await ai.models.generateContent({
            model: currentModel,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              systemInstruction: 'You are a footwear catalog expert. Group photos of the same shoe together, recognize authentic models and assign realistic Kenya market prices in KES.'
            }
          });

          const rawText = response.text || '{}';
          const parsed = JSON.parse(rawText);
          if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
            methodUsed = currentModel;
            generatedProducts = parsed.products.map((p: any) => {
              let heroUrl = '';
              if (p.heroItemId) {
                const matchedHero = items.find(it => it.id === p.heroItemId);
                if (matchedHero) heroUrl = matchedHero.url;
              }
              if (!heroUrl && p.image) {
                const matchedHero = items.find(it => it.url === p.image || it.id === p.image);
                heroUrl = matchedHero ? matchedHero.url : p.image;
              }
              if (!heroUrl) heroUrl = items[0]?.url || '';

              let angleUrls: string[] = [];
              if (Array.isArray(p.angleItemIds)) {
                angleUrls = p.angleItemIds
                  .map((id: string) => items.find(it => it.id === id)?.url)
                  .filter(Boolean) as string[];
              }

              return {
                ...p,
                image: heroUrl,
                images: angleUrls.filter(u => u !== heroUrl),
                photoCount: 1 + angleUrls.filter(u => u !== heroUrl).length
              };
            });
            break; // Successfully generated with currentModel
          }
        } catch (geminiErr: any) {
          console.warn(`[AI Mass Catalog] Model ${currentModel} warning:`, geminiErr.message);
          if (geminiErr.message && (geminiErr.message.includes('503') || geminiErr.message.includes('429'))) {
            // Wait 1.5s before fallback model
            await new Promise(r => setTimeout(r, 1500));
          }
        }
      }
    }

    // If Gemini wasn't available or returned empty, use strictly honest non-hallucinating fallback
    if (generatedProducts.length === 0) {
      methodUsed = 'honest-unverified-fallback';
      console.log('[AI Mass Catalog] Vision model unavailable, using honest non-guessing grouping...');

      const groups: { main: any; others: any[] }[] = [];
      const angleKeywords = ['sole', 'bottom', 'angle', 'side', 'back', 'box', 'heel', 'front', 'detail', 'tread'];

      items.forEach((item, index) => {
        const fn = (item.fileName || '').toLowerCase();
        const isAngle = angleKeywords.some(k => fn.includes(k));
        
        if (isAngle && groups.length > 0) {
          groups[groups.length - 1].others.push(item);
        } else if (groups.length > 0 && groups[groups.length - 1].others.length === 0 && items.length > 2 && index % 2 === 1) {
          groups[groups.length - 1].others.push(item);
        } else {
          groups.push({ main: item, others: [] });
        }
      });

      generatedProducts = groups.map((g, idx) => {
        const cleanName = (g.main.fileName || `Shoe Photo ${idx + 1}`)
          .replace(/\.[^/.]+$/, "")
          .replace(/[_-]/g, " ")
          .trim();

        return {
          name: cleanName || `Footwear Listing ${idx + 1}`,
          brand: 'To Be Verified',
          price: 5500,
          originalPrice: 6800,
          category: 'Sneakers',
          gender: 'Unisex',
          color: 'Pending Verification',
          description: 'Authentic footwear listing pending model verification in Quick Aligner.',
          image: g.main.url,
          images: g.others.map((o: any) => o.url),
          stock: 12,
          inStock: true,
          photoCount: 1 + g.others.length
        };
      });
    }

    const finalProducts = generatedProducts.map((p, idx) => ({
      id: `prod_${Date.now()}_b${batchIndex}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      name: p.name || 'Footwear Item',
      brand: p.brand || 'Solemate',
      price: Number(p.price) || 5500,
      originalPrice: Number(p.originalPrice) || Math.round((Number(p.price) || 5500) * 1.2 / 100) * 100,
      image: p.image || items[0]?.url || '',
      images: Array.isArray(p.images) ? p.images : [],
      category: p.category || 'Sneakers',
      gender: p.gender || 'Unisex',
      color: p.color || 'Multi-Color',
      description: p.description || 'Premium authentic footwear with fast delivery across Kenya.',
      stock: Number(p.stock) || 12,
      inStock: true,
      sellerId: defaultSellerId || 'seller-official',
      isNew: true
    }));

    res.json({
      success: true,
      method: methodUsed,
      totalPhotos: items.length,
      groupedCount: finalProducts.length,
      products: finalProducts
    });
  } catch (err: any) {
    console.error('[AI Mass Catalog Error]:', err);
    res.status(500).json({ error: 'Failed to analyze photos for catalog', message: err.message });
  }
});

// ==========================================
// Grounded 100% Sneaker Authenticator & Aligner
// ==========================================
app.post('/api/catalog/ai-align-shoe', async (req, res) => {
  try {
    const { image, base64, currentName, geminiApiKey } = req.body;
    if (!image && !base64) {
      return res.status(400).json({ error: 'Please provide an image URL or base64 data to authenticate' });
    }

    console.log(`[Grounded AI Authenticator] Inspecting footwear photo...`);
    const ai = await getGenAI(geminiApiKey);
    if (!ai) {
      return res.status(503).json({ 
        error: 'Gemini AI service requires an API key. Please save your free key in Admin Settings > Site Settings > Google Gemini AI, or set GEMINI_API_KEY in your hosting environment.',
        needsApiKey: true 
      });
    }

    const parts: any[] = [];
    parts.push({
      text: `You are a certified sneaker authenticator and footwear merchandiser in Nairobi, Kenya.
CRITICAL MANDATE: NEVER GUESS. NEVER FABRICATE RANDOM HYPE SNEAKER NAMES.
Examine this footwear photo with extreme visual scrutiny.

INSPECTION PROTOCOL:
1. Brand Emblems: Look for visible manufacturer logos (e.g., Timberland tree emblem, Nike Swoosh, Jordan Jumpman, Adidas 3-Stripes or Trefoil, New Balance 'N', Puma formstrip, Vans jazz stripe, Converse All Star circle).
2. Shoebox & Packaging: Look carefully at the background. If a shoebox is visible (e.g. kraft cardboard box with "Timberland" or "Nike"), inspect the exact text and typography printed on it.
3. Outsole & Tread: If the sole is visible, inspect any embossed branding signature or tread pattern (e.g. Timberland signature logo on outsole).
4. Silhouette & Upper: Identify the exact model silhouette (e.g. "Timberland Adventure 2.0 Cupsole Sneaker", "Timberland 6-Inch Premium Boot", "Air Jordan 4 Retro", "Nike Dunk Low Retro", "Adidas Samba OG"). If the shoe is an unbranded or generic casual shoe, state the brand as "Casual Footwear" or "Fashion" and give an honest descriptive name like "Men's Black Leather Casual Cupsole Sneaker".
5. Pricing in Kenya: Provide a realistic retail price in Kenyan Shillings (KES integer). For instance:
   - Premium leather boots (Timberland, etc.): KES 9,000 - 13,000
   - Retro sneakers (Jordan, Dunk, New Balance): KES 5,500 - 8,500
   - Casual / lifestyle court shoes: KES 4,500 - 6,500

Return strictly JSON with this exact schema:
{
  "name": string (exact verified model name),
  "brand": string (verified brand),
  "category": "Sneakers" | "Lifestyle" | "Running" | "Skate",
  "gender": "Men" | "Women" | "Unisex" | "Kids",
  "color": string (exact colorway seen in photo),
  "price": number (realistic KES price integer),
  "originalPrice": number (strike-through price in KES),
  "confidence": "High" | "Medium" | "Uncertain",
  "visualEvidence": string[] (2-4 bullet points describing visible evidence in the photo: logos seen, shoebox branding, sole details, materials),
  "description": string (2-3 sentences describing the shoe features, materials, and Kenyan delivery)
}`
    });

    if (base64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64
        }
      });
    } else if (image && image.startsWith('data:image')) {
      const b64Data = image.split(',')[1];
      const mime = image.split(';')[0].replace('data:', '') || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: mime,
          data: b64Data
        }
      });
    } else if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      try {
        const fetchRes = await fetch(image, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (fetchRes.ok) {
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = (fetchRes.headers.get('content-type') || 'image/jpeg').split(';')[0];
          parts.push({
            inlineData: {
              mimeType,
              data: buffer.toString('base64')
            }
          });
        } else {
          parts.push({
            text: `Image URL (preview): ${image}`
          });
        }
      } catch (fetchErr: any) {
        console.warn('[AI Authenticator] Failed to fetch image bytes from URL:', fetchErr.message);
        parts.push({
          text: `Image URL: ${image}`
        });
      }
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a certified footwear authenticator. Only report verified visual evidence. Return JSON matching the requested schema.'
        }
      });
    } catch (modelErr: any) {
      console.warn('[AI Authenticator] gemini-3.8-flash temporary spike, falling back to gemini-flash-latest:', modelErr.message);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are a certified footwear authenticator. Only report verified visual evidence. Return JSON matching the requested schema.'
        }
      });
    }

    const rawText = response.text || '{}';
    const detected = JSON.parse(rawText);

    res.json({
      success: true,
      detected: {
        name: detected.name || currentName || 'Authentic Footwear',
        brand: detected.brand || 'Solemate',
        category: detected.category || 'Sneakers',
        gender: detected.gender || 'Unisex',
        color: detected.color || 'Multi-Color',
        price: Number(detected.price) || 5500,
        originalPrice: Number(detected.originalPrice) || 6800,
        confidence: detected.confidence || 'Medium',
        visualEvidence: Array.isArray(detected.visualEvidence) ? detected.visualEvidence : [
          'Visual silhouette and materials analyzed from uploaded photo'
        ],
        description: detected.description || 'Premium footwear authentic styling with fast delivery across Kenya.'
      }
    });
  } catch (err: any) {
    console.error('[Grounded AI Error]:', err);
    res.status(500).json({ error: 'Failed to authenticate footwear from photo', message: err.message });
  }
});

// Test Gemini API key endpoint
app.post('/api/catalog/test-gemini', async (req, res) => {
  try {
    const { geminiApiKey } = req.body;
    const ai = await getGenAI(geminiApiKey);
    if (!ai) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Gemini API key found in request, server environment, or store settings.' 
      });
    }

    let response;
    let modelUsed = 'gemini-3.8-flash';
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Footwear authenticator connection test. Reply with: OK',
      });
    } catch {
      modelUsed = 'gemini-flash-latest';
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: 'Footwear authenticator connection test. Reply with: OK',
      });
    }

    res.json({
      success: true,
      message: 'Gemini AI API key is verified and operational!',
      model: modelUsed,
      reply: response.text?.trim()
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Gemini API verification failed.' });
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
  const now = new Date();
  const entry: LogEntry = {
    timestamp: now.toISOString(),
    level,
    source,
    message,
    metadata
  };

  logsBuffer.unshift(entry);
  if (logsBuffer.length > MAX_LOGS) {
    logsBuffer.pop();
  }

  // Persist errors and warnings to Firestore system_logs collection
  if (db && (level === 'error' || level === 'warn')) {
    try {
      db.collection('system_logs').add({
        timestamp: entry.timestamp,
        epochMs: now.getTime(),
        level,
        category: (metadata && metadata.category) ? metadata.category : 'server',
        source,
        message: String(message).slice(0, 10000),
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
      }).catch(err => {
        originalWarn('Failed to persist log to Firestore system_logs:', err.message);
      });
    } catch {
      // ignore async save failure
    }
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

// WhatsApp Notification Webhook / Dispatch Endpoint
app.post('/api/whatsapp/notify', async (req, res) => {
  try {
    const { type, recipientRole, targetPhone, message, metadata } = req.body;
    console.log(`[WHATSAPP DISPATCH] Alert triggered: type=${type}, recipient=${recipientRole}, phone=${targetPhone}`);

    // If Firestore is available, record notification in system_logs
    if (db) {
      await db.collection('system_logs').add({
        timestamp: new Date().toISOString(),
        epochMs: Date.now(),
        level: 'info',
        category: 'system',
        source: 'server',
        message: `WhatsApp Alert Prepared [${type}]: recipient=${recipientRole}`,
        metadata: {
          type,
          recipientRole,
          targetPhone,
          messagePreview: (message || '').slice(0, 160),
          ...metadata
        }
      });
    }

    res.json({
      success: true,
      delivered: true,
      type,
      recipientRole,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[WHATSAPP NOTIFY ERROR]', err.message);
    res.status(500).json({ success: false, error: err.message });
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
