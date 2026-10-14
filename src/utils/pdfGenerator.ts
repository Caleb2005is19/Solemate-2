import React from 'react';
import { pdf } from '@react-pdf/renderer';
import InvoiceDocument from '../components/InvoiceDocument';
import type { Order, SiteSettings } from '../services/types';
import { printOrders } from './printInvoice';

/**
 * Generates a real binary PDF Blob for an order using @react-pdf/renderer
 */
export async function generateOrderPdfBlob(
  order: Order,
  siteSettings?: Partial<SiteSettings>
): Promise<Blob> {
  const element = React.createElement(InvoiceDocument, { order, siteSettings });
  const instance = pdf(element as any);
  return await instance.toBlob();
}

/**
 * Downloads the official PDF receipt/invoice directly to the user's device
 * with automatic fallback to print dialog if the browser restricts blob downloads
 */
export async function downloadOrderPdf(
  order: Order,
  siteSettings?: Partial<SiteSettings>,
  customFilename?: string
): Promise<void> {
  const shortId = (order.id || 'ORDER').slice(-8).toUpperCase();
  const filename = customFilename || `Solemate-Receipt-INV-${shortId}.pdf`;

  try {
    const blob = await generateOrderPdfBlob(order, siteSettings);
    
    // Create download anchor
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up memory
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  } catch (err) {
    console.warn('Direct PDF blob download encountered an error, falling back to printer dialog:', err);
    // Bulletproof fallback: trigger native print / save as PDF
    printOrders(order, siteSettings);
  }
}

/**
 * Opens the PDF in a new tab / viewer for instant on-screen review
 */
export async function viewOrderPdf(
  order: Order,
  siteSettings?: Partial<SiteSettings>
): Promise<void> {
  try {
    const blob = await generateOrderPdfBlob(order, siteSettings);
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // If popup blocked, download instead
      await downloadOrderPdf(order, siteSettings);
    }
  } catch (err) {
    console.warn('Could not open PDF in new tab, falling back to print preview:', err);
    printOrders(order, siteSettings);
  }
}
