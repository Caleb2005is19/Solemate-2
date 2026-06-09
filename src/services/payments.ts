import api from './api';

export interface StkPushParams {
  phone: string;
  amount: number;
  orderId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface PaymentStatus {
  status: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  paymentError?: string;
  mpesaReceipt?: string;
}

/**
 * Initiates an M-Pesa STK push prompt using IntaSend.
 * Resolves to the response indicating success or failure of the payment trigger.
 */
export async function initiateStkPush(params: StkPushParams): Promise<{ success: boolean; invoiceId: string; checkoutRequestId?: string; message: string }> {
  const response = await api.post('/api/intasend/stkpush', params);
  return response.data;
}

/**
 * Checks the status/state of an order and its associated IntaSend invoice.
 */
export async function checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
  const response = await api.get(`/api/intasend/status/${orderId}`);
  return response.data;
}

/**
 * Submits an M-Pesa receipt code for manual verification.
 */
export async function verifyMpesaReceipt(orderId: string, receiptCode: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post('/api/mpesa/verify-receipt', { orderId, receiptCode });
  return response.data;
}

/**
 * Dynamically loads the official IntaSend client script.
 * Allows launching cards / checkout panels inline on the frontend.
 */
export function loadIntasendScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.IntaSend) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://assets.intasend.com/sdk/v1/intasend.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load IntaSend client script'));
    document.body.appendChild(script);
  });
}

/**
 * Initializes and binds the IntaSend inline checkout dialog.
 */
export function setupIntaSendCheckout(options: {
  publicKey: string;
  amount: number;
  currency: 'KES' | 'USD';
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  apiRef: string;
  onSuccess: (res: any) => void;
  onError: (err: any) => void;
}) {
  if (typeof window === 'undefined' || !window.IntaSend) {
    throw new Error('IntaSend SDK script has not been loaded yet.');
  }

  const intasend = new window.IntaSend({
    publicAPIKey: options.publicKey,
    live: !options.publicKey.includes('_TEST_')
  });

  return intasend.setup({
    amount: options.amount,
    currency: options.currency,
    email: options.email,
    first_name: options.firstName,
    last_name: options.lastName,
    phone_number: options.phone,
    api_ref: options.apiRef,
  })
  .on('COMPLETE', options.onSuccess)
  .on('FAILED', options.onError)
  .on('IN-PROGRESS', () => console.log('Payment checkout in progress...'));
}

declare global {
  interface Window {
    IntaSend: any;
  }
}
