import React from 'react';
import { X, Printer, Download, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import type { Order, SiteSettings } from '../../services/types';
import { buildSingleOrderHtml, printOrders, downloadInvoiceHtmlFile } from '../../utils/printInvoice';
import { downloadOrderPdf } from '../../utils/pdfGenerator';

interface InvoiceModalProps {
  order: Order | null;
  siteSettings: SiteSettings | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, siteSettings, onClose }) => {
  const [downloadedHtml, setDownloadedHtml] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [downloadedPdf, setDownloadedPdf] = React.useState(false);

  if (!order) return null;

  const invoiceHtml = buildSingleOrderHtml(order, siteSettings || undefined);

  const handlePrint = () => {
    printOrders(order, siteSettings || undefined);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadOrderPdf(order, siteSettings || undefined);
      setDownloadedPdf(true);
      setTimeout(() => setDownloadedPdf(false), 2500);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadInvoiceHtmlFile(order, siteSettings || undefined);
    setDownloadedHtml(true);
    setTimeout(() => setDownloadedHtml(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm">
              S
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Invoice Preview — #{order.id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-xs text-zinc-400">
                Customer: {order.customerInfo?.firstName} {order.customerInfo?.lastName} • KES {Math.round(order.total).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Real PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
              title="Download official PDF document"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadedPdf ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm"
              title="Print directly or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            {/* Download HTML Button */}
            <button
              onClick={handleDownloadHtml}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs sm:text-sm font-semibold transition"
              title="Download standalone HTML invoice"
            >
              {downloadedHtml ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>HTML</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Invoice Rendered Paper */}
        <div className="flex-1 overflow-y-auto bg-zinc-100 p-4 sm:p-8 flex justify-center">
          <div 
            className="bg-white shadow-lg rounded-xl w-full max-w-3xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: invoiceHtml }}
          />
        </div>

        {/* Modal Bottom Bar for mobile devices */}
        <div className="p-3 bg-white border-t border-zinc-200 flex sm:hidden items-center justify-between shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 text-white rounded-xl text-xs font-bold mr-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={handleDownloadHtml}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>HTML</span>
          </button>
        </div>
      </div>
    </div>
  );
};
