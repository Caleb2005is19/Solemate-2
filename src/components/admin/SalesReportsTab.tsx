import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Users, 
  Package, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatPrice } from '../../utils';
import { downloadSalesReportCsv, ReportFilterOptions, ReportSummaryMetrics } from '../../utils/reportCsvExporter';
import { downloadSalesReportPdf, previewSalesReportPdf, printSalesReportPdf } from '../../utils/reportPdfGenerator';
import type { Order, OrderStatus } from '../../services/types';

type DatePreset = 'today' | '7d' | '30d' | 'this_month' | 'this_year' | 'all' | 'custom';

interface SalesReportsTabProps {
  initialSellerId?: string | 'all';
  onClearSellerFilter?: () => void;
  role?: 'admin' | 'seller';
}

export function SalesReportsTab({ 
  initialSellerId = 'all', 
  onClearSellerFilter,
  role = 'admin' 
}: SalesReportsTabProps) {
  const { orders, products, sellers, siteSettings } = useStore();

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedSellerId, setSelectedSellerId] = useState<string>(initialSellerId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Export Loading States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync if initialSellerId changes
  React.useEffect(() => {
    if (initialSellerId) {
      setSelectedSellerId(initialSellerId);
    }
  }, [initialSellerId]);

  // Derive unique categories from products & orders
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    orders.forEach(o => {
      o.items?.forEach(i => { if (i.category) cats.add(i.category); });
    });
    return Array.from(cats).sort();
  }, [products, orders]);

  // Date Range Boundary Calculations
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (datePreset === 'today') {
      return { start: todayStr, end: todayStr, label: 'Today' };
    }
    if (datePreset === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split('T')[0], end: todayStr, label: 'Last 7 Days' };
    }
    if (datePreset === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().split('T')[0], end: todayStr, label: 'Last 30 Days' };
    }
    if (datePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { start, end: todayStr, label: 'This Month' };
    }
    if (datePreset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      return { start, end: todayStr, label: 'This Year' };
    }
    if (datePreset === 'all') {
      return { start: '', end: '', label: 'All Time' };
    }
    return { 
      start: customStartDate, 
      end: customEndDate, 
      label: `Custom (${customStartDate || 'Start'} to ${customEndDate || 'Now'})` 
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Date Filter
      if (dateRangeBounds.start || dateRangeBounds.end) {
        const orderDate = order.date ? order.date.split('T')[0] : '';
        if (dateRangeBounds.start && orderDate < dateRangeBounds.start) return false;
        if (dateRangeBounds.end && orderDate > dateRangeBounds.end) return false;
      }

      // 2. Seller Filter
      if (selectedSellerId !== 'all') {
        const hasSellerInItems = order.items?.some(it => it.sellerId === selectedSellerId);
        const hasSellerInOrder = order.sellerIds?.includes(selectedSellerId);
        if (!hasSellerInItems && !hasSellerInOrder) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all') {
        const hasCategory = order.items?.some(it => it.category?.toLowerCase() === selectedCategory.toLowerCase());
        if (!hasCategory) return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'Paid') {
          const isPaid = order.paymentStatus === 'Paid' || order.status === 'Delivered';
          if (!isPaid) return false;
        } else if (selectedStatus === 'Pending') {
          const isPending = order.paymentStatus === 'Pending' || order.status === 'Pending';
          if (!isPending) return false;
        } else if (selectedStatus === 'Cancelled') {
          const isCancelled = order.status === 'Cancelled' || order.paymentStatus === 'Failed';
          if (!isCancelled) return false;
        } else if (order.status !== selectedStatus) {
          return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cust = order.customerInfo || { firstName: '', lastName: '', phone: '', email: '' };
        const matchesName = `${cust.firstName || ''} ${cust.lastName || ''}`.toLowerCase().includes(q);
        const matchesPhone = (cust.phone || '').includes(q);
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesReceipt = (order.mpesaReceipt || '').toLowerCase().includes(q);
        const matchesItems = order.items?.some(it => it.name?.toLowerCase().includes(q));

        if (!matchesName && !matchesPhone && !matchesId && !matchesReceipt && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, dateRangeBounds, selectedSellerId, selectedCategory, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const summaryMetrics: ReportSummaryMetrics = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let paidOrdersCount = 0;

    filteredOrders.forEach(order => {
      const isCancelled = order.status === 'Cancelled' || order.paymentStatus === 'Failed';
      const isPaid = order.paymentStatus === 'Paid' || order.status === 'Delivered';
      const isPending = order.paymentStatus === 'Pending' || order.status === 'Pending';

      if (!isCancelled) {
        totalRevenue += order.total || 0;
      }

      if (isPaid) {
        paidRevenue += order.total || 0;
        paidOrdersCount += 1;
      } else if (isPending) {
        pendingRevenue += order.total || 0;
      }
    });

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalOrders,
      paidOrdersCount,
      avgOrderValue,
    };
  }, [filteredOrders]);

  // Category Breakdown Aggregations
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();

    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return;
      order.items?.forEach(item => {
        const cat = item.category || 'General';
        const current = map.get(cat) || { count: 0, revenue: 0 };
        current.count += item.quantity || 1;
        current.revenue += (item.price || 0) * (item.quantity || 1);
        map.set(cat, current);
      });
    });

    return Array.from(map.entries())
      .map(([category, val]) => ({ category, count: val.count, revenue: val.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Top Products Aggregations
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; category: string; units: number; revenue: number }>();

    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return;
      order.items?.forEach(item => {
        const key = item.id || item.name;
        const current = map.get(key) || { 
          name: item.name, 
          category: item.category || 'General', 
          units: 0, 
          revenue: 0 
        };
        current.units += item.quantity || 1;
        current.revenue += (item.price || 0) * (item.quantity || 1);
        map.set(key, current);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.units - a.units);
  }, [filteredOrders]);

  // Per-Seller Aggregations
  const sellerBreakdown = useMemo(() => {
    const sellerMap = new Map<string, string>();
    sellers.forEach(s => sellerMap.set(s.id, s.name));

    const map = new Map<string, { sellerName: string; orderCount: number; units: number; revenue: number }>();

    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return;
      order.items?.forEach(item => {
        const sellerId = item.sellerId || 'direct';
        const sellerName = sellerId === 'direct' ? 'Direct Store' : (sellerMap.get(sellerId) || `Seller ${sellerId.slice(0, 6)}`);
        const current = map.get(sellerId) || { sellerName, orderCount: 0, units: 0, revenue: 0 };
        current.units += item.quantity || 1;
        current.revenue += (item.price || 0) * (item.quantity || 1);
        map.set(sellerId, current);
      });
    });

    return Array.from(map.entries()).map(([id, val]) => ({
      sellerId: id,
      ...val
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, sellers]);

  // Timeline Trend Data for Chart
  const trendChartData = useMemo(() => {
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();

    filteredOrders.forEach(order => {
      if (order.status === 'Cancelled') return;
      const rawDate = order.date ? order.date.split('T')[0] : 'Unknown';
      const current = dayMap.get(rawDate) || { date: rawDate, revenue: 0, orders: 0 };
      current.revenue += order.total || 0;
      current.orders += 1;
      dayMap.set(rawDate, current);
    });

    const list = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Format readable short date
    return list.map(item => {
      const parts = item.date.split('-');
      const formatted = parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
      return {
        ...item,
        displayDate: formatted,
      };
    });
  }, [filteredOrders]);

  // Handler: Export CSV
  const handleExportCsv = () => {
    try {
      setIsExportingCsv(true);
      const selectedSellerObj = sellers.find(s => s.id === selectedSellerId);
      const filterOpts: ReportFilterOptions = {
        datePresetLabel: dateRangeBounds.label,
        startDate: dateRangeBounds.start,
        endDate: dateRangeBounds.end,
        sellerName: selectedSellerObj?.name || (selectedSellerId === 'all' ? undefined : 'Direct Store'),
        category: selectedCategory,
        status: selectedStatus,
      };

      downloadSalesReportCsv(
        filteredOrders, 
        summaryMetrics, 
        filterOpts, 
        sellers, 
        siteSettings?.businessName || 'Solemate.co.ke'
      );

      setExportNotice({
        type: 'success',
        message: `Solemate.co.ke CSV report generated successfully with ${filteredOrders.length} transactions!`
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      setExportNotice({
        type: 'error',
        message: 'Could not export CSV. Please try again.'
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Handler: Export PDF
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const selectedSellerObj = sellers.find(s => s.id === selectedSellerId);
      const filterOpts: ReportFilterOptions = {
        datePresetLabel: dateRangeBounds.label,
        startDate: dateRangeBounds.start,
        endDate: dateRangeBounds.end,
        sellerName: selectedSellerObj?.name || (selectedSellerId === 'all' ? undefined : 'Direct Store'),
        category: selectedCategory,
        status: selectedStatus,
      };

      await downloadSalesReportPdf({
        orders: filteredOrders,
        summary: summaryMetrics,
        filterOptions: filterOpts,
        siteSettings: siteSettings || undefined,
        sellers,
        categoryBreakdown,
        topProducts,
      });

      setExportNotice({
        type: 'success',
        message: 'Solemate.co.ke PDF Sales Report downloaded successfully!'
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
      setExportNotice({
        type: 'error',
        message: 'Could not generate PDF report. Falling back to CSV export.'
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handler: Preview / Print PDF with native printer dialogue
  const handlePrintPdf = async () => {
    try {
      setIsPrintingPdf(true);
      const selectedSellerObj = sellers.find(s => s.id === selectedSellerId);
      const filterOpts: ReportFilterOptions = {
        datePresetLabel: dateRangeBounds.label,
        startDate: dateRangeBounds.start,
        endDate: dateRangeBounds.end,
        sellerName: selectedSellerObj?.name || (selectedSellerId === 'all' ? undefined : 'Direct Store'),
        category: selectedCategory,
        status: selectedStatus,
      };

      await printSalesReportPdf({
        orders: filteredOrders,
        summary: summaryMetrics,
        filterOptions: filterOpts,
        siteSettings: siteSettings || undefined,
        sellers,
        categoryBreakdown,
        topProducts,
      });

      setExportNotice({
        type: 'success',
        message: 'Solemate.co.ke printable report triggered. Check printer dialog or new tab.'
      });
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error(err);
      setExportNotice({
        type: 'error',
        message: 'Could not open print preview. You can also click Download PDF.'
      });
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const handleResetFilters = () => {
    setDatePreset('30d');
    setSelectedSellerId('all');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSearchQuery('');
    if (onClearSellerFilter) onClearSellerFilter();
  };

  const currentSellerName = sellers.find(s => s.id === selectedSellerId)?.name;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {exportNotice && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border shadow-lg animate-in slide-in-from-top-2 duration-300 ${
          exportNotice.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-3">
            {exportNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <p className="text-sm font-bold">{exportNotice.message}</p>
          </div>
          <button 
            onClick={() => setExportNotice(null)} 
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Sales & Revenue Reports</h1>
            {selectedSellerId !== 'all' && (
              <span className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Seller: {currentSellerName || selectedSellerId}
                <button 
                  onClick={() => setSelectedSellerId('all')} 
                  className="ml-1 hover:text-orange-950 font-black"
                  title="Clear seller filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <p className="text-zinc-500 text-sm mt-1">
            Generate, filter, and export financial reports for accounting, auditing, and vendor payouts.
          </p>
        </div>

        {/* Export Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || filteredOrders.length === 0}
            className="flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Download CSV spreadsheet compatible with Excel and Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            {isExportingCsv ? 'Generating CSV...' : 'Export CSV'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || filteredOrders.length === 0}
            className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
            title="Download formatted executive PDF report"
          >
            <Download className="w-4 h-4" />
            {isExportingPdf ? 'Rendering PDF...' : 'Download PDF'}
          </button>

          <button
            onClick={handlePrintPdf}
            disabled={isPrintingPdf || filteredOrders.length === 0}
            className="flex items-center gap-2 bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Open printable Solemate.co.ke official PDF report"
          >
            <Printer className="w-4 h-4 text-orange-500" />
            {isPrintingPdf ? 'Preparing...' : 'Print Report'}
          </button>
        </div>
      </div>

      {/* Date Range Presets Segmented Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-orange-500" />
            Timeframe Preset:
          </div>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 rounded-xl">
            {(['today', '7d', '30d', 'this_month', 'this_year', 'all', 'custom'] as DatePreset[]).map(preset => {
              const labels: Record<DatePreset, string> = {
                today: 'Today',
                '7d': '7 Days',
                '30d': '30 Days',
                this_month: 'This Month',
                this_year: 'This Year',
                all: 'All Time',
                custom: 'Custom Range'
              };
              const isActive = datePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isActive 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {labels[preset]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Pickers (visible when custom selected) */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-600">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-zinc-200 rounded-lg outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-600">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-zinc-200 rounded-lg outline-none focus:border-orange-500"
              />
            </div>
          </div>
        )}

        {/* Multi-Filter Bar: Seller, Category, Status, Search */}
        <div className="pt-3 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Seller Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Seller / Vendor
            </label>
            <select
              value={selectedSellerId}
              onChange={e => setSelectedSellerId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800"
            >
              <option value="all">All Sellers & Direct Store</option>
              {sellers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Payment & Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800"
            >
              <option value="all">All Payment Statuses</option>
              <option value="Paid">Confirmed Paid (Settled)</option>
              <option value="Pending">Pending Payment / Review</option>
              <option value="Cancelled">Cancelled / Failed</option>
              <option value="Processing">Processing Order</option>
              <option value="Shipped">Shipped Order</option>
              <option value="Delivered">Delivered Order</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
              Search Orders / Items
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Name, phone, item..."
                className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-zinc-800 placeholder:text-zinc-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Gross Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tabular-nums">
            {formatPrice(summaryMetrics.totalRevenue)}
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
            <span>{summaryMetrics.totalOrders} total orders in period</span>
          </div>
        </div>

        {/* Paid / Settled Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Paid / Settled</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums">
            {formatPrice(summaryMetrics.paidRevenue)}
          </div>
          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1.5">
            <span className="font-bold text-emerald-700 font-mono">
              {summaryMetrics.totalOrders ? Math.round((summaryMetrics.paidOrdersCount / summaryMetrics.totalOrders) * 100) : 0}%
            </span>
            <span>settlement rate ({summaryMetrics.paidOrdersCount} orders)</span>
          </div>
        </div>

        {/* Pending / Unsettled */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending / Unsettled</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono tabular-nums">
            {formatPrice(summaryMetrics.pendingRevenue)}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            <span>Awaiting payment verification</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono tabular-nums">
            {formatPrice(summaryMetrics.avgOrderValue)}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            <span>Per customer transaction</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Daily Revenue Timeline & Category Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Revenue Trajectory
              </h2>
              <p className="text-xs text-zinc-500">Daily sales volume across {dateRangeBounds.label}</p>
            </div>
            <div className="text-xs font-mono font-bold text-zinc-500">
              {trendChartData.length} active sales days
            </div>
          </div>

          <div className="h-64 w-full">
            {trendChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <AlertCircle className="w-6 h-6" />
                <p className="text-xs font-bold">No sales records in this timeframe</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="salesReportGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#a1a1aa" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={v => `K${Math.round(v / 1000)}k`} 
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatPrice(val), 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e4e4e7',
                      fontSize: '12px',
                      fontWeight: 700 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f97316" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#salesReportGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Share Breakdown (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" />
              Category Share
            </h2>
            <p className="text-xs text-zinc-500">Revenue contribution by category</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56 pr-1 custom-scrollbar">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-8">No categories recorded</p>
            ) : (
              categoryBreakdown.map(cat => {
                const totalGross = summaryMetrics.totalRevenue || 1;
                const percentage = Math.round((cat.revenue / totalGross) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-800">{cat.category}</span>
                      <span className="font-mono tabular-nums text-zinc-500">
                        {formatPrice(cat.revenue)} ({cat.count} units)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex justify-between text-xs font-bold text-zinc-600">
            <span>Total Categories</span>
            <span className="font-mono">{categoryBreakdown.length}</span>
          </div>
        </div>
      </div>

      {/* Top Products & Seller Breakdown Dual Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products Table */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Top Selling Products</h2>
              <p className="text-xs text-zinc-500">Ranked by unit sales volume</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
              {topProducts.length} Products Sold
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase">
                  <th className="pb-2">Product</th>
                  <th className="pb-2 text-center">Category</th>
                  <th className="pb-2 text-center">Units</th>
                  <th className="pb-2 text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {topProducts.slice(0, 5).map((prod, idx) => (
                  <tr key={prod.name} className="hover:bg-zinc-50">
                    <td className="py-2.5 font-bold text-zinc-900 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 font-mono w-4">#{idx + 1}</span>
                      <span className="truncate max-w-[180px]">{prod.name}</span>
                    </td>
                    <td className="py-2.5 text-center text-zinc-500">{prod.category}</td>
                    <td className="py-2.5 text-center font-bold font-mono tabular-nums text-zinc-800">{prod.units}</td>
                    <td className="py-2.5 text-right font-bold font-mono tabular-nums text-zinc-900">{formatPrice(prod.revenue)}</td>
                  </tr>
                ))}
                {topProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400">No product sales in this timeframe</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seller Contribution Table */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Seller & Vendor Share</h2>
              <p className="text-xs text-zinc-500">Revenue attributed per seller</p>
            </div>
            <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
              {sellerBreakdown.length} Vendors Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase">
                  <th className="pb-2">Seller Name</th>
                  <th className="pb-2 text-center">Units</th>
                  <th className="pb-2 text-right">Gross Sales</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {sellerBreakdown.map(item => (
                  <tr key={item.sellerId} className="hover:bg-zinc-50">
                    <td className="py-2.5 font-bold text-zinc-900">{item.sellerName}</td>
                    <td className="py-2.5 text-center font-mono tabular-nums text-zinc-600">{item.units}</td>
                    <td className="py-2.5 text-right font-bold font-mono tabular-nums text-zinc-900">{formatPrice(item.revenue)}</td>
                    <td className="py-2.5 text-right">
                      {item.sellerId !== 'direct' && (
                        <button
                          onClick={() => setSelectedSellerId(item.sellerId)}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 underline"
                        >
                          Filter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sellerBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-400">No seller sales recorded</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filtered Transactions Detailed Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              Filtered Orders Ledger
            </h2>
            <p className="text-xs text-zinc-500">
              Showing {filteredOrders.length} transaction{filteredOrders.length === 1 ? '' : 's'} matching current criteria
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(selectedSellerId !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all' || searchQuery || datePreset !== '30d') && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Items Summary</th>
                <th className="p-3.5 text-center">Payment Status</th>
                <th className="p-3.5 text-center">Order Status</th>
                <th className="p-3.5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-400">
                    <p className="font-bold text-zinc-600 mb-1">No orders found for this criteria.</p>
                    <p className="text-xs">Try selecting a wider timeframe or clearing specific filters.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const cust = order.customerInfo || { firstName: '', lastName: '', phone: '', city: '' };
                  const custName = `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Guest Customer';
                  const isPaid = order.paymentStatus === 'Paid' || order.status === 'Delivered';
                  const isCancelled = order.status === 'Cancelled' || order.paymentStatus === 'Failed';
                  const isPending = order.paymentStatus === 'Pending' || order.status === 'Pending';

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="p-3.5 font-bold font-mono text-zinc-900">
                        {order.id.slice(0, 10)}
                      </td>
                      <td className="p-3.5 text-zinc-600 whitespace-nowrap">
                        {order.date ? order.date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">{custName}</div>
                        <div className="text-[11px] text-zinc-500">{cust.phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5 max-w-xs truncate text-zinc-700">
                        {order.items?.map(it => `${it.quantity || 1}x ${it.name}`).join(', ') || 'No items'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' :
                          isCancelled ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus || (isPaid ? 'Paid' : 'Pending')}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-[11px] font-bold text-zinc-600">
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black font-mono text-zinc-900 tabular-nums">
                        {formatPrice(order.total || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
