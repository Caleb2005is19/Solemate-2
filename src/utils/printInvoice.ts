import type { Order, SiteSettings } from '../services/types';

// Format currency as KES
const formatKES = (val: number): string => {
  return `KES ${Math.round(val).toLocaleString()}`;
};

// Inline SVG Brand Logo for reliable printing across any print preview engine
const LOGO_SVG = `
<svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 70px; height: 49px; display: inline-block; vertical-align: middle;">
  <!-- Shoe Upper -->
  <path d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z" fill="#F36F21" />
  <!-- Three White Accent Stripes -->
  <line x1="225" y1="75" x2="250" y2="160" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />
  <line x1="270" y1="95" x2="295" y2="170" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />
  <line x1="315" y1="125" x2="340" y2="185" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round" />
  <!-- Sole -->
  <path d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z" fill="#F36F21" />
</svg>
`;

/**
 * Builds printable HTML string for a single order
 */
export function buildSingleOrderHtml(order: Order, siteSettings?: Partial<SiteSettings>): string {
  const customerInfo = order.customerInfo || {
    firstName: 'Guest',
    lastName: 'Customer',
    email: 'N/A',
    phone: 'N/A',
    location: 'N/A',
    city: 'N/A',
  };

  const orderId = order.id || 'N/A';
  const shortId = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
  const orderDate = order.date ? new Date(order.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString();

  const businessName = siteSettings?.businessName || 'Solemate.co.ke';
  const contactPhone = siteSettings?.phoneNumbers?.[0] || '+254 700 000 000';
  const contactEmail = siteSettings?.contactEmail || 'support@solemate.co.ke';

  const items = order.items || [];
  const deliveryFee = Number(order.deliveryFee) || 0;
  const total = Number(order.total) || 0;
  const discount = Number(order.discount) || 0;
  const subtotal = Number(order.subtotal) || (total - deliveryFee + discount);

  const isPaid = order.paymentStatus === 'Paid';
  const paymentBadge = isPaid
    ? `<span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; text-transform: uppercase;">Paid</span>`
    : `<span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; text-transform: uppercase;">${order.paymentStatus || 'Pending'}</span>`;

  const itemsRows = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = price * qty;
    return `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 12px 14px; vertical-align: top; text-align: center; color: #71717a; font-size: 12px; width: 36px;">
          ${index + 1}
        </td>
        <td style="padding: 12px 14px; vertical-align: top;">
          <div style="font-weight: 700; color: #18181b; font-size: 13px;">${item.name || 'Footwear Item'}</div>
          ${item.brand ? `<div style="font-size: 11px; color: #71717a; margin-top: 2px;">Brand: ${item.brand}</div>` : ''}
          <div style="font-size: 11px; color: #f97316; font-weight: 600; margin-top: 2px;">
            Size: EU ${item.selectedSize || 'Standard'}${item.selectedColor ? ` • Color: ${item.selectedColor}` : ''}
          </div>
        </td>
        <td style="padding: 12px 14px; vertical-align: top; text-align: center; font-weight: 600; color: #27272a; font-size: 13px;">
          ${qty}
        </td>
        <td style="padding: 12px 14px; vertical-align: top; text-align: right; color: #52525b; font-size: 13px;">
          ${formatKES(price)}
        </td>
        <td style="padding: 12px 14px; vertical-align: top; text-align: right; font-weight: 700; color: #18181b; font-size: 13px;">
          ${formatKES(lineTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="invoice-container" style="max-width: 800px; margin: 0 auto; background: #ffffff; padding: 36px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #18181b; line-height: 1.45;">
      
      <!-- Top Brand Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #f97316; margin-bottom: 28px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${LOGO_SVG}
          <div>
            <div style="font-size: 24px; font-weight: 900; tracking: -0.03em; color: #18181b; line-height: 1.1;">
              Solemate<span style="color: #f97316;">.co.ke</span>
            </div>
            <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.22em; color: #71717a; text-transform: uppercase; margin-top: 2px;">
              SOLE MATE KE • PREMIUM FOOTWEAR
            </div>
            <div style="font-size: 11px; color: #71717a; margin-top: 4px;">
              Nairobi, Kenya • ${contactPhone} • ${contactEmail}
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 26px; font-weight: 900; color: #18181b; letter-spacing: -0.02em;">INVOICE</div>
          <div style="font-size: 13px; font-weight: 700; color: #f97316; margin-top: 2px;">#INV-${shortId}</div>
          <div style="font-size: 11px; color: #71717a; margin-top: 3px;">Date: ${orderDate}</div>
          <div style="margin-top: 6px;">${paymentBadge}</div>
        </div>
      </div>

      <!-- Customer & Shipping Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; background: #fafafa; padding: 18px 20px; border-radius: 12px; border: 1px solid #f4f4f5;">
        <div>
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 6px;">
            CUSTOMER DETAILS
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #18181b;">
            ${customerInfo.firstName} ${customerInfo.lastName}
          </div>
          <div style="font-size: 12px; color: #52525b; margin-top: 2px;">📞 ${customerInfo.phone || 'No phone provided'}</div>
          <div style="font-size: 12px; color: #52525b; margin-top: 1px;">✉️ ${customerInfo.email || 'No email provided'}</div>
        </div>

        <div>
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 6px;">
            DELIVERY DESTINATION
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #18181b;">
            📍 ${customerInfo.location || 'Standard Delivery'}
          </div>
          <div style="font-size: 12px; color: #52525b; margin-top: 2px;">
            City / Area: <strong>${customerInfo.city || 'Nairobi'}</strong>
          </div>
          <div style="font-size: 11px; color: #71717a; margin-top: 4px;">
            Status: <span style="font-weight: 700; color: #f97316;">${order.status}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 28px; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase; text-align: center; width: 36px;">#</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase;">Item Description</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase; text-align: center; width: 60px;">Qty</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase; text-align: right; width: 110px;">Unit Price</th>
              <th style="padding: 10px 14px; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase; text-align: right; width: 110px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Summary & Payment Info Row -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; margin-bottom: 28px; align-items: start;">
        
        <!-- Left Column: Payment Details -->
        <div style="background: #fafafa; border: 1px solid #f4f4f5; border-radius: 8px; padding: 14px 18px;">
          <div style="font-size: 11px; font-weight: 800; color: #71717a; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
            PAYMENT SUMMARY
          </div>
          <div style="font-size: 12px; color: #3f3f46; margin-bottom: 4px;">
            <strong>Method:</strong> ${order.paymentMethod || 'M-Pesa'}
          </div>
          ${order.mpesaReceipt ? `
            <div style="font-size: 12px; color: #15803d; font-weight: 600; margin-bottom: 4px; background: #f0fdf4; padding: 4px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
              M-Pesa Receipt: <strong>${order.mpesaReceipt}</strong>
            </div>
          ` : ''}
          <div style="font-size: 12px; color: #3f3f46; margin-bottom: 4px;">
            <strong>Payment Status:</strong> ${order.paymentStatus || 'Pending'}
          </div>
          ${order.couponCode ? `
            <div style="font-size: 11px; color: #f97316; margin-top: 4px;">
              🎟️ Promo Code Applied: <strong>${order.couponCode}</strong>
            </div>
          ` : ''}
        </div>

        <!-- Right Column: Financial Totals -->
        <div style="border: 1px solid #e4e4e7; border-radius: 8px; padding: 14px 18px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #71717a; margin-bottom: 6px;">
            <span>Subtotal:</span>
            <span style="font-weight: 600; color: #27272a;">${formatKES(subtotal)}</span>
          </div>

          ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #16a34a; margin-bottom: 6px;">
              <span>Coupon Discount:</span>
              <span style="font-weight: 700;">-${formatKES(discount)}</span>
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #71717a; margin-bottom: 10px;">
            <span>Delivery Fee:</span>
            <span style="font-weight: 600; color: #27272a;">${deliveryFee === 0 ? 'FREE' : formatKES(deliveryFee)}</span>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #18181b; padding-top: 10px; border-top: 2px solid #f4f4f5;">
            <span>Total:</span>
            <span style="color: #f97316;">${formatKES(total)}</span>
          </div>
        </div>

      </div>

      <!-- Footer Policy & Guarantee -->
      <div style="padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center; color: #71717a; font-size: 11px; line-height: 1.6;">
        <div style="font-weight: 700; color: #27272a; margin-bottom: 3px;">
          Authenticity Guaranteed • Hand-Inspected Quality
        </div>
        <div>
          Thank you for shopping with ${businessName}! If you have questions regarding this order or require size exchange within 48 hours, reach us via WhatsApp or phone at <strong>${contactPhone}</strong> or email <strong>${contactEmail}</strong>.
        </div>
        <div style="font-size: 10px; color: #a1a1aa; margin-top: 6px;">
          Solemate Kenya • Official Order #${orderId}
        </div>
      </div>

    </div>
  `;
}

/**
 * Builds printable HTML document for one or more orders with page break styling
 */
export function generateFullPrintDocument(orders: Order | Order[], siteSettings?: Partial<SiteSettings>): string {
  const orderList = Array.isArray(orders) ? orders : [orders];

  const pagesHtml = orderList.map((order, i) => {
    const isLast = i === orderList.length - 1;
    return `
      <div class="print-page ${!isLast ? 'page-break' : ''}">
        ${buildSingleOrderHtml(order, siteSettings)}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solemate.co.ke - Invoices (${orderList.length})</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          .print-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #18181b;
            color: #ffffff;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .print-toolbar button {
            background: #f97316;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            font-weight: 700;
            font-size: 13px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .print-toolbar button:hover {
            background: #ea580c;
          }
          .content-wrapper {
            padding-top: 60px;
            padding-bottom: 40px;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          @media print {
            .print-toolbar {
              display: none !important;
            }
            .content-wrapper {
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
            body {
              background: #ffffff !important;
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar no-print">
          <div style="font-size: 14px; font-weight: 700;">
            Solemate.co.ke — Invoices Preview (${orderList.length} ${orderList.length === 1 ? 'order' : 'orders'})
          </div>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.print()">🖨️ Print / Save as PDF</button>
            <button onclick="window.close()" style="background: #3f3f46;">Close</button>
          </div>
        </div>

        <div class="content-wrapper">
          ${pagesHtml}
        </div>

        <script>
          // Automatic trigger for clean popup/iframe printing
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 300);
          });
        </script>
      </body>
    </html>
  `;
}

/**
 * Triggers printing using a hidden iframe (bypasses popup blockers completely)
 * Falls back to popup if iframe printing fails
 */
export function printOrders(orders: Order | Order[], siteSettings?: Partial<SiteSettings>): void {
  const orderList = Array.isArray(orders) ? orders : [orders];
  if (!orderList || orderList.length === 0) {
    console.warn("No orders provided for printing.");
    return;
  }

  const html = generateFullPrintDocument(orderList, siteSettings);

  try {
    // 1. Try invisible iframe print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.border = 'none';
    iframe.setAttribute('title', 'Print Invoice Window');

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn("Direct iframe print blocked, opening print window fallback", err);
          openPrintPopup(html);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn("Iframe setup error, falling back to popup", err);
  }

  // 2. Fallback to popup window if iframe is not allowed
  openPrintPopup(html);
}

function openPrintPopup(html: string): void {
  try {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // If popup blocked, create hidden iframe and print
      window.location.href = url;
    }
  } catch (e) {
    console.error('Failed to open print popup:', e);
  }
}

/**
 * Downloads a standalone HTML invoice file for archiving or sending to customers
 */
export function downloadInvoiceHtmlFile(order: Order, siteSettings?: Partial<SiteSettings>): void {
  const html = generateFullPrintDocument(order, siteSettings);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${order.id.slice(-8).toUpperCase()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
