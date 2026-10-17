import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Printer, 
  FileText, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  RotateCcw,
  ShoppingCart,
  ChevronDown,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle
} from 'lucide-react';
import type { Order, OrderStatus } from '../../services/types';
import { formatPrice } from '../../utils';

export type SortField = 'date' | 'total' | 'customer' | 'status' | 'id';
export type SortDirection = 'asc' | 'desc';

interface OrdersTabProps {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void> | void;
  onViewOrder: (order: Order) => void;
  onPreviewInvoice: (order: Order) => void;
  onDownloadPdf: (order: Order) => void;
  onPrintAllInvoices: (filteredOrders?: Order[]) => void;
  role: 'admin' | 'seller';
}

const STATUS_ORDER_RANK: Record<OrderStatus, number> = {
  Pending: 1,
  Processing: 2,
  Shipped: 3,
  Delivered: 4,
  Cancelled: 5,
};

export function OrdersTab({
  orders,
  updateOrderStatus,
  onViewOrder,
  onPreviewInvoice,
  onDownloadPdf,
  onPrintAllInvoices,
  role,
}: OrdersTabProps) {
  // Sort state: default to newest orders first
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Handle column header clicks
  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Sensible defaults: date & total default to descending (newest / highest), text to ascending
      if (field === 'date' || field === 'total') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  // Synchronized dropdown preset handler
  const currentDropdownValue = `${sortField}-${sortDirection}`;
  const handleDropdownChange = (val: string) => {
    const [field, dir] = val.split('-') as [SortField, SortDirection];
    setSortField(field);
    setSortDirection(dir);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSortField('date');
    setSortDirection('desc');
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatus !== 'all' || sortField !== 'date' || sortDirection !== 'desc';

  // Filtered & Sorted orders
  const processedOrders = useMemo(() => {
    // 1. Search Filter
    const q = searchQuery.trim().toLowerCase();
    let result = orders.filter(o => {
      // Status filter
      if (selectedStatus !== 'all' && o.status !== selectedStatus) {
        return false;
      }

      if (!q) return true;

      // Match ID
      const cleanId = (o.id || '').toLowerCase();
      if (cleanId.includes(q)) return true;

      // Match Customer Name
      const firstName = (o.customerInfo?.firstName || '').toLowerCase();
      const lastName = (o.customerInfo?.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName.includes(q) || firstName.includes(q) || lastName.includes(q)) return true;

      // Match City / Location / Phone
      const city = (o.customerInfo?.city || '').toLowerCase();
      const location = (o.customerInfo?.location || '').toLowerCase();
      const phone = (o.customerInfo?.phone || '').toLowerCase();
      const email = (o.customerInfo?.email || '').toLowerCase();
      if (city.includes(q) || location.includes(q) || phone.includes(q) || email.includes(q)) return true;

      // Match Items
      const hasItemMatch = o.items?.some(it => (it.name || '').toLowerCase().includes(q));
      if (hasItemMatch) return true;

      return false;
    });

    // 2. Sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date': {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          comparison = timeA - timeB;
          break;
        }
        case 'total': {
          const totalA = Number(a.total) || 0;
          const totalB = Number(b.total) || 0;
          comparison = totalA - totalB;
          break;
        }
        case 'customer': {
          const nameA = `${a.customerInfo?.firstName || ''} ${a.customerInfo?.lastName || ''}`.trim().toLowerCase();
          const nameB = `${b.customerInfo?.firstName || ''} ${b.customerInfo?.lastName || ''}`.trim().toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'status': {
          const rankA = STATUS_ORDER_RANK[a.status] || 99;
          const rankB = STATUS_ORDER_RANK[b.status] || 99;
          comparison = rankA - rankB;
          break;
        }
        case 'id': {
          comparison = (a.id || '').localeCompare(b.id || '');
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [orders, searchQuery, selectedStatus, sortField, sortDirection]);

  // Financial total of currently filtered orders
  const filteredTotalValue = useMemo(() => {
    return processedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [processedOrders]);

  // Render sort icon on column header
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity ml-1.5 inline shrink-0" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-orange-600 font-black ml-1.5 inline shrink-0 animate-in fade-in" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-orange-600 font-black ml-1.5 inline shrink-0 animate-in fade-in" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Orders Management</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Sort, filter, track delivery, and fulfill customer orders in real time.
          </p>
        </div>
        
        {orders.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPrintAllInvoices(processedOrders)}
              className="flex items-center gap-2 bg-white text-zinc-900 border border-zinc-200 px-4 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors font-bold text-sm shadow-sm cursor-pointer active:scale-95 shrink-0"
              title="Print Invoices for current filtered orders"
            >
              <Printer className="w-4 h-4 text-orange-500" />
              <span>Print Invoices ({processedOrders.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Bar: Status Filters, Search, and Quick Sort Dropdown */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
          >
            All Orders ({statusCounts.all})
          </button>

          <button
            onClick={() => setSelectedStatus('Pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'Pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({statusCounts.Pending})
          </button>

          <button
            onClick={() => setSelectedStatus('Processing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'Processing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-800 border border-blue-200/60 hover:bg-blue-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Processing ({statusCounts.Processing})
          </button>

          <button
            onClick={() => setSelectedStatus('Shipped')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'Shipped'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-purple-50 text-purple-800 border border-purple-200/60 hover:bg-purple-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Shipped ({statusCounts.Shipped})
          </button>

          <button
            onClick={() => setSelectedStatus('Delivered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'Delivered'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered ({statusCounts.Delivered})
          </button>

          <button
            onClick={() => setSelectedStatus('Cancelled')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedStatus === 'Cancelled'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled ({statusCounts.Cancelled})
          </button>
        </div>

        {/* Search & Quick Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, customer, city, or phone..."
              className="w-full pl-9 pr-9 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-md"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Sort Dropdown + Reset */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <span className="text-xs font-bold text-zinc-500 mr-2 whitespace-nowrap hidden md:inline">
                Sort by:
              </span>
              <div className="relative">
                <select
                  value={currentDropdownValue}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="appearance-none bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 pl-3 pr-8 py-2 rounded-xl text-xs sm:text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer transition-colors"
                >
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="total-desc">Total Amount: High to Low</option>
                  <option value="total-asc">Total Amount: Low to High</option>
                  <option value="customer-asc">Customer Name: A to Z</option>
                  <option value="customer-desc">Customer Name: Z to A</option>
                  <option value="status-asc">Status: Actionable Priority</option>
                  <option value="status-desc">Status: Completed First</option>
                  <option value="id-desc">Order ID: High to Low</option>
                  <option value="id-asc">Order ID: Low to High</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Reset filters and sorting to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Live Summary */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <div>
          Showing <span className="font-bold text-zinc-900">{processedOrders.length}</span> of {orders.length} orders
          {selectedStatus !== 'all' && (
            <span> in <span className="font-semibold text-zinc-800">{selectedStatus}</span></span>
          )}
          {searchQuery && (
            <span> matching &ldquo;<span className="font-semibold text-zinc-800">{searchQuery}</span>&rdquo;</span>
          )}
          <span className="mx-2 text-zinc-300">·</span>
          Total value: <span className="font-bold font-mono text-zinc-900">{formatPrice(filteredTotalValue)}</span>
        </div>

        <div className="hidden sm:block text-zinc-400">
          Tip: Click table column headers to toggle sorting
        </div>
      </div>

      {/* Orders Table with Sortable Column Headers */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 select-none">
                {/* Order ID */}
                <th className="p-0">
                  <button
                    onClick={() => handleSortClick('id')}
                    className={`w-full p-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider group transition-colors ${
                      sortField === 'id' ? 'text-orange-600 bg-orange-50/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span>Order ID</span>
                    {renderSortIndicator('id')}
                  </button>
                </th>

                {/* Customer */}
                <th className="p-0">
                  <button
                    onClick={() => handleSortClick('customer')}
                    className={`w-full p-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider group transition-colors ${
                      sortField === 'customer' ? 'text-orange-600 bg-orange-50/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span>Customer</span>
                    {renderSortIndicator('customer')}
                  </button>
                </th>

                {/* Date */}
                <th className="p-0">
                  <button
                    onClick={() => handleSortClick('date')}
                    className={`w-full p-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider group transition-colors ${
                      sortField === 'date' ? 'text-orange-600 bg-orange-50/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </button>
                </th>

                {/* Total */}
                <th className="p-0">
                  <button
                    onClick={() => handleSortClick('total')}
                    className={`w-full p-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider group transition-colors ${
                      sortField === 'total' ? 'text-orange-600 bg-orange-50/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span>Total (KES)</span>
                    {renderSortIndicator('total')}
                  </button>
                </th>

                {/* Status */}
                <th className="p-0">
                  <button
                    onClick={() => handleSortClick('status')}
                    className={`w-full p-4 flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider group transition-colors ${
                      sortField === 'status' ? 'text-orange-600 bg-orange-50/50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
                    }`}
                  >
                    <span>Fulfillment Status</span>
                    {renderSortIndicator('status')}
                  </button>
                </th>

                {/* Action Column */}
                <th className="p-4 font-bold text-zinc-600 text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {processedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-zinc-900 text-base">No orders found</h3>
                      <p className="text-xs text-zinc-500">
                        {hasActiveFilters 
                          ? 'No orders match your current search and filter settings.' 
                          : 'There are no customer orders recorded yet in the system.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                processedOrders.map(o => (
                  <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                    {/* Order ID */}
                    <td className="p-4 text-sm font-mono font-bold text-zinc-900">
                      #{o.id.length > 12 ? o.id.slice(-8).toUpperCase() : o.id}
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-bold text-zinc-900 text-sm">
                        {o?.customerInfo?.firstName ?? ''} {o?.customerInfo?.lastName ?? ''}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {o?.customerInfo?.city || o?.customerInfo?.location || o?.customerInfo?.phone || 'Guest Checkout'}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="p-4 text-sm text-zinc-600 font-mono tabular-nums">
                      {o.date ? new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </td>

                    {/* Total */}
                    <td className="p-4 text-sm font-bold font-mono tabular-nums text-zinc-900">
                      {formatPrice(o.total)}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none border cursor-pointer transition-all shadow-xs ${
                          o.status === 'Pending' ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' :
                          o.status === 'Processing' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                          o.status === 'Shipped' ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' :
                          o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' :
                          'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => onViewOrder(o)} 
                          className="px-2.5 py-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => onPreviewInvoice(o)}
                          className="p-1.5 text-zinc-500 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                          title="Preview & Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDownloadPdf(o)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                          title="Download Official PDF Receipt"
                        >
                          <FileText className="w-4 h-4 text-orange-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
