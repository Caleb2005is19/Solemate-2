import { Order, Product, Seller, SiteSettings } from './types';
import { logSystemError } from './loggingService';

/**
 * Normalizes phone numbers to WhatsApp international format (e.g. 254712345678)
 */
export function formatWhatsAppPhone(phone: string): string {
  if (!phone) return '';
  // Remove non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Handle Kenyan phone formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('2540')) {
    cleaned = '254' + cleaned.slice(4);
  }
  return cleaned;
}

/**
 * Creates a direct WhatsApp Web or Mobile click-to-chat URL
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message.trim());
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Builds formatted WhatsApp message for a paid order
 */
export function formatPaidOrderWhatsAppMessage(order: Order, seller?: Seller): string {
  const orderId = order.id.slice(-6).toUpperCase();
  const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
  const totalStr = Number(order.total || 0).toLocaleString();
  const mpesaCode = order.mpesaReceipt || 'Paid via Card/M-Pesa';

  const itemsList = order.items
    .map(i => `• ${i.name} (Size: ${i.selectedSize || 'Standard'}${i.selectedColor ? `, Color: ${i.selectedColor}` : ''}) x${i.quantity} @ KES ${Number(i.price).toLocaleString()}`)
    .join('\n');

  let text = `🛍️ *NEW PAID ORDER — SOLEMATE.CO.KE*\n\n`;
  text += `*Order #:* ${orderId}\n`;
  text += `*Date:* ${new Date(order.date).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n`;
  text += `*Customer:* ${customerName}\n`;
  text += `*Phone:* ${order.customerInfo.phone}\n`;
  text += `*Location:* ${order.customerInfo.location}, ${order.customerInfo.city}\n\n`;
  text += `*ITEMS ORDERED:*\n${itemsList}\n\n`;
  text += `*TOTAL AMOUNT PAID:* KES ${totalStr}\n`;
  text += `*PAYMENT RECEIPT:* ${mpesaCode}\n`;
  text += `*STATUS:* ✅ Paid & Ready for Fulfillment\n`;

  if (seller) {
    text += `\n*Assigned Shop / Seller:* ${seller.name} (${seller.phone || seller.email})\n`;
  }

  text += `\n👉 View order details in Dashboard: ${window.location.origin}/admin`;
  return text;
}

/**
 * Builds formatted WhatsApp message for newly added product (Sent to Admin)
 */
export function formatNewProductWhatsAppMessage(product: Product, sellerName?: string): string {
  let text = `👟 *NEW PRODUCT ADDED TO SITE — SOLEMATE.CO.KE*\n\n`;
  text += `*Product Name:* ${product.name}\n`;
  text += `*Brand:* ${product.brand}\n`;
  text += `*Category:* ${product.category} (${product.gender})\n`;
  text += `*Price:* KES ${Number(product.price).toLocaleString()}\n`;
  text += `*Color:* ${product.color}\n`;
  text += `*Initial Stock:* ${product.stock || 0} pairs\n`;
  text += `*Shop / Seller:* ${sellerName || 'Main Store / Solemate'}\n`;
  text += `*In Stock Status:* ${product.inStock ? '✅ Live & Buyable' : '⚠️ Marked Out of Stock'}\n\n`;
  text += `👉 Check catalog: ${window.location.origin}/shop`;
  return text;
}

/**
 * Builds formatted WhatsApp message for inventory/stock updates (Sent to Admin)
 */
export function formatStockUpdateWhatsAppMessage(product: Product, oldStock?: number, newStock?: number): string {
  const stockVal = newStock !== undefined ? newStock : (product.stock || 0);
  const isLowStock = stockVal <= 3 && stockVal > 0;
  const isOutOfStock = stockVal <= 0;

  let emoji = '📦';
  let statusText = 'Stock Level Updated';
  if (isOutOfStock) {
    emoji = '🚨';
    statusText = 'OUT OF STOCK ALERT';
  } else if (isLowStock) {
    emoji = '⚠️';
    statusText = 'LOW INVENTORY ALERT (Restock Recommended)';
  }

  let text = `${emoji} *${statusText} — SOLEMATE.CO.KE*\n\n`;
  text += `*Product:* ${product.name} (${product.brand})\n`;
  text += `*Category:* ${product.category}\n`;
  if (oldStock !== undefined) {
    text += `*Previous Stock:* ${oldStock} pairs\n`;
  }
  text += `*Current Remaining Stock:* ${stockVal} pairs\n`;
  text += `*Status:* ${isOutOfStock ? '❌ Out of stock' : isLowStock ? '⚠️ Low stock' : '✅ Well stocked'}\n\n`;
  text += `👉 Manage inventory: ${window.location.origin}/admin`;
  return text;
}

/**
 * Helper to dispatch notification:
 * Calls server webhook /api/whatsapp/notify and returns direct URL for instant user action
 */
export async function sendWhatsAppNotification(payload: {
  type: 'paid_order' | 'new_product' | 'stock_update';
  recipientRole: 'admin' | 'seller' | 'both';
  targetPhone?: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; directUrl: string }> {
  const directUrl = createWhatsAppUrl(payload.targetPhone || '', payload.message);

  try {
    const res = await fetch('/api/whatsapp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return { success: data.success || true, directUrl };
  } catch (err: any) {
    logSystemError('system', `WhatsApp notification endpoint failure: ${err.message}`, { payload }, 'warn');
    return { success: true, directUrl };
  }
}
