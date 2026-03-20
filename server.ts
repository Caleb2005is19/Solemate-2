import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

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

  // API Routes
  app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
      const { phone, amount, orderId } = req.body;
      
      if (!phone || !amount) {
        return res.status(400).json({ error: 'Phone and amount are required' });
      }

      // Format phone number to 254...
      let formattedPhone = phone.replace(/\s+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = `254${formattedPhone.substring(1)}`;
      } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
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
        Amount: Math.ceil(amount), // M-Pesa requires integer amounts
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `Order ${orderId || '123'}`,
        TransactionDesc: 'Payment for Sneakers',
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
        res.json({ success: true, message: 'STK Push initiated successfully', data });
      } else {
        res.status(400).json({ success: false, error: data.errorMessage || 'Failed to initiate STK push', data });
      }
    } catch (error) {
      console.error('STK Push Error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // Callback Route
  app.post('/api/mpesa/callback', (req, res) => {
    console.log('M-Pesa Callback Received:', JSON.stringify(req.body, null, 2));
    
    // Here you would typically update the order status in Firestore
    // based on req.body.Body.stkCallback.ResultCode (0 means success)
    
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
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
