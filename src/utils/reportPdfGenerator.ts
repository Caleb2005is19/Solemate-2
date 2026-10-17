import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { SalesReportPdfDocument } from '../components/admin/SalesReportPdfDocument';
import type { Order, Seller, SiteSettings } from '../services/types';
import type { ReportFilterOptions, ReportSummaryMetrics } from './reportCsvExporter';

export interface SalesReportPdfData {
  orders: Order[];
  summary: ReportSummaryMetrics;
  filterOptions: ReportFilterOptions;
  siteSettings?: SiteSettings;
  sellers?: Seller[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  topProducts: { name: string; category: string; units: number; revenue: number }[];
}

/**
 * Generates a real binary PDF Blob for the Sales Report using @react-pdf/renderer
 */
export async function generateSalesReportPdfBlob(data: SalesReportPdfData): Promise<Blob> {
  const element = React.createElement(SalesReportPdfDocument, data);
  const instance = pdf(element as any);
  return await instance.toBlob();
}

/**
 * Downloads the official Sales Report PDF directly to the user's device
 */
export async function downloadSalesReportPdf(data: SalesReportPdfData): Promise<void> {
  const businessName = data.siteSettings?.businessName || 'KicksKE';
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedFilter = (data.filterOptions.datePresetLabel || 'sales_report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  const filename = `${businessName.toLowerCase()}_sales_report_${sanitizedFilter}_${dateStr}.pdf`;

  try {
    const blob = await generateSalesReportPdfBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  } catch (err) {
    console.error('Failed to generate sales report PDF:', err);
    throw err;
  }
}

/**
 * Opens the Sales Report PDF in a new tab for previewing or printing
 */
export async function previewSalesReportPdf(data: SalesReportPdfData): Promise<void> {
  try {
    const blob = await generateSalesReportPdfBlob(data);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 15000);
  } catch (err) {
    console.error('Failed to preview sales report PDF:', err);
    throw err;
  }
}
