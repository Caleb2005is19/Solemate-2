import { Order, CartItem, Seller } from '../services/types';
import { formatPrice } from '../utils';

export interface ReportFilterOptions {
  datePresetLabel: string;
  startDate?: string;
  endDate?: string;
  sellerName?: string;
  category?: string;
  status?: string;
}

export interface ReportSummaryMetrics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  paidOrdersCount: number;
  avgOrderValue: number;
}

/**
 * Escapes a cell value for RFC 4180 CSV compliance.
 */
function escapeCsv(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string from filtered orders and summary metrics.
 */
export function generateSalesReportCsv(
  orders: Order[],
  summary: ReportSummaryMetrics,
  filterOptions: ReportFilterOptions,
  sellers: Seller[] = [],
  businessName = 'KicksKE'
): string {
  const sellerMap = new Map<string, string>();
  sellers.forEach(s => sellerMap.set(s.id, s.name));

  const lines: string[] = [];

  // Metadata & Summary Header Block
  lines.push(`${escapeCsv(businessName + ' - Sales & Financial Performance Report')}`);
  lines.push(`${escapeCsv('Generated Date')},${escapeCsv(new Date().toLocaleString())}`);
  lines.push(`${escapeCsv('Report Period')},${escapeCsv(filterOptions.datePresetLabel)}`);
  if (filterOptions.startDate && filterOptions.endDate) {
    lines.push(`${escapeCsv('Date Range')},${escapeCsv(`${filterOptions.startDate} to ${filterOptions.endDate}`)}`);
  }
  if (filterOptions.sellerName) {
    lines.push(`${escapeCsv('Seller Filter')},${escapeCsv(filterOptions.sellerName)}`);
  }
  if (filterOptions.category && filterOptions.category !== 'all') {
    lines.push(`${escapeCsv('Category Filter')},${escapeCsv(filterOptions.category)}`);
  }
  if (filterOptions.status && filterOptions.status !== 'all') {
    lines.push(`${escapeCsv('Status Filter')},${escapeCsv(filterOptions.status)}`);
  }
  lines.push(''); // Empty line

  // KPI Summary Block
  lines.push(`${escapeCsv('METRICS SUMMARY')}`);
  lines.push(`${escapeCsv('Total Gross Revenue (KES)')},${escapeCsv(summary.totalRevenue)}`);
  lines.push(`${escapeCsv('Confirmed Paid Revenue (KES)')},${escapeCsv(summary.paidRevenue)}`);
  lines.push(`${escapeCsv('Pending / Unsettled Revenue (KES)')},${escapeCsv(summary.pendingRevenue)}`);
  lines.push(`${escapeCsv('Total Orders Count')},${escapeCsv(summary.totalOrders)}`);
  lines.push(`${escapeCsv('Paid Orders Count')},${escapeCsv(summary.paidOrdersCount)}`);
  lines.push(`${escapeCsv('Average Order Value (KES)')},${escapeCsv(Math.round(summary.avgOrderValue))}`);
  lines.push(''); // Empty line

  // Detailed Transaction Header
  const headers = [
    'Order ID',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Delivery City / Location',
    'Items Count',
    'Items Detail (Qty x Name [Size/Color])',
    'Product Categories',
    'Sellers / Vendors',
    'Subtotal (KES)',
    'Discount (KES)',
    'Coupon Used',
    'Delivery Fee (KES)',
    'Total Amount (KES)',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'M-Pesa Receipt'
  ];
  lines.push(headers.map(escapeCsv).join(','));

  // Rows
  orders.forEach(order => {
    const customer = order.customerInfo || { firstName: '', lastName: '', phone: '', email: '', city: '', location: '' };
    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Guest Customer';
    const cityLocation = `${customer.city || ''} ${customer.location ? `(${customer.location})` : ''}`.trim() || 'N/A';
    
    const items = order.items || [];
    const itemsSummary = items
      .map(item => `${item.quantity || 1}x ${item.name}${item.selectedSize ? ` (Sz ${item.selectedSize})` : ''}`)
      .join(' | ');

    const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))).join(', ') || 'General';
    
    const sellerNames = Array.from(new Set(
      items.map(item => item.sellerId ? (sellerMap.get(item.sellerId) || item.sellerId) : null).filter(Boolean)
    )).join(', ') || (order.sellerIds?.map(id => sellerMap.get(id) || id).join(', ') || 'Direct Store');

    const subtotal = order.subtotal ?? (order.total - (order.deliveryFee || 0) + (order.discount || 0));
    const discount = order.discount || 0;
    const deliveryFee = order.deliveryFee || 0;
    const total = order.total || 0;

    const row = [
      order.id,
      order.date || 'N/A',
      fullName,
      customer.phone || 'N/A',
      customer.email || 'N/A',
      cityLocation,
      items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      itemsSummary || 'No items listed',
      categories,
      sellerNames,
      subtotal,
      discount,
      order.couponCode || 'None',
      deliveryFee,
      total,
      order.paymentMethod || 'M-Pesa',
      order.paymentStatus || (order.status === 'Cancelled' ? 'Cancelled' : 'Pending'),
      order.status || 'Pending',
      order.mpesaReceipt || 'N/A'
    ];

    lines.push(row.map(escapeCsv).join(','));
  });

  return lines.join('\r\n');
}

/**
 * Generates and triggers automatic download of the Sales Report CSV.
 */
export function downloadSalesReportCsv(
  orders: Order[],
  summary: ReportSummaryMetrics,
  filterOptions: ReportFilterOptions,
  sellers: Seller[] = [],
  businessName = 'KicksKE'
): void {
  const csvContent = generateSalesReportCsv(orders, summary, filterOptions, sellers, businessName);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const dateStr = new Date().toISOString().split('T')[0];
  const sanitizedFilter = (filterOptions.datePresetLabel || 'custom')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
  const filename = `${businessName.toLowerCase()}_sales_report_${sanitizedFilter}_${dateStr}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
