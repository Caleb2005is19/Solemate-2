import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Package, ChevronRight, MapPin, Phone, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatPrice } from '../utils';
import { Navigate } from 'react-router-dom';
import { OrderStatus } from '../types';

export function MyOrders() {
  const { currentUser, userProfile, orders, loading } = useStore();
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [receiptCode, setReceiptCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  const handleVerifyReceipt = async (orderId: string) => {
    if (!receiptCode.trim()) return;
    
    setIsVerifying(true);
    setVerifyError(null);
    setVerifySuccess(null);

    try {
      const response = await fetch('/api/mpesa/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, receiptCode: receiptCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify receipt');
      }

      setVerifySuccess('Receipt submitted successfully! Your order is now being processed.');
      setReceiptCode('');
      // The Firestore listener will update the UI automatically
    } catch (err: any) {
      setVerifyError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleOrder = (orderId: string) => {
    if (activeOrder === orderId) {
      setActiveOrder(null);
    } else {
      setActiveOrder(orderId);
      setVerifyError(null);
      setVerifySuccess(null);
      setReceiptCode('');
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <Navigate to="/" />;

  const myOrders = orders.filter(o => o.userId === currentUser.uid);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Shipped': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Processing': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Cancelled': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 mb-2">My Orders</h1>
            <p className="text-zinc-500 font-medium">Track and manage your recent purchases</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-xl font-black text-zinc-900">{myOrders.length}</p>
            </div>
          </div>
        </div>

        {myOrders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-zinc-200 shadow-sm">
            <div className="w-20 h-20 bg-zinc-50 text-zinc-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">No orders yet</h2>
            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Looks like you haven't placed any orders yet. Start shopping to see your orders here!</p>
            <a href="/" className="inline-block px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {myOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div 
                  className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                  onClick={() => toggleOrder(order.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 flex-shrink-0">
                      <img 
                        src={order.items[0].image} 
                        alt={order.items[0].name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-zinc-400">#{order.id?.slice(-6).toUpperCase()}</span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {order.paymentStatus && (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            order.paymentStatus === 'Paid' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
                            order.paymentStatus === 'Failed' ? 'text-rose-600 bg-rose-50 border-rose-100' : 
                            'text-zinc-600 bg-zinc-50 border-zinc-100'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900">
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </h3>
                      <p className="text-sm text-zinc-500 font-medium">Placed on {new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8">
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Amount</p>
                      <p className="text-xl font-black text-zinc-900">{formatPrice(order.total)}</p>
                    </div>
                    <div className={`p-2 rounded-xl transition-transform ${activeOrder === order.id ? 'rotate-90 bg-zinc-100' : 'bg-zinc-50'}`}>
                      <ChevronRight className="w-5 h-5 text-zinc-400" />
                    </div>
                  </div>
                </div>

                {activeOrder === order.id && (
                  <div className="px-6 md:px-8 pb-8 pt-2 border-t border-zinc-50 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Order Items</h4>
                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500">{item.brand} • {item.color}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-zinc-900">{formatPrice(item.price)}</p>
                                <p className="text-xs text-zinc-400">Qty: 1</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Delivery Details</h4>
                        <div className="bg-zinc-900 text-white p-6 rounded-[2rem] space-y-4 shadow-xl shadow-zinc-200">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Shipping Address</p>
                              <p className="text-sm font-medium leading-relaxed">
                                {order.customerInfo.location}<br />
                                {order.customerInfo.city}, Kenya
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Phone className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Phone</p>
                              <p className="text-sm font-medium">{order.customerInfo.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Clock className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Payment Method</p>
                              <p className="text-sm font-medium">{order.paymentMethod} {order.mpesaReceipt && `(${order.mpesaReceipt})`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Delivery Fee</p>
                              <p className="text-sm font-medium">{order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
                          <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <h5 className="font-bold text-orange-900">Order Status Timeline</h5>
                          </div>
                          
                          {order.status === 'Pending' && order.paymentMethod === 'mpesa' && (
                            <div className="mb-6 p-4 bg-white rounded-2xl border border-orange-200 shadow-sm">
                              <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3">Manual Payment Verification</p>
                              <p className="text-sm text-zinc-600 mb-4">Already paid? Enter your M-Pesa receipt code below to verify your payment.</p>
                              
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="e.g. RKL7T8X9Y0"
                                  value={receiptCode}
                                  onChange={(e) => setReceiptCode(e.target.value.toUpperCase())}
                                  className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                                <button 
                                  onClick={() => handleVerifyReceipt(order.id)}
                                  disabled={isVerifying || !receiptCode.trim()}
                                  className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                  {isVerifying ? 'Verifying...' : 'Verify'}
                                </button>
                              </div>
                              
                              {verifyError && <p className="mt-2 text-xs font-bold text-rose-600">{verifyError}</p>}
                              {verifySuccess && <p className="mt-2 text-xs font-bold text-emerald-600">{verifySuccess}</p>}
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                              <p className="text-sm text-orange-800 font-medium">Order Placed - {new Date(order.date).toLocaleTimeString()}</p>
                            </div>
                            {order.paymentStatus && (
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-emerald-600' : 'bg-orange-600'}`}></div>
                                <p className={`text-sm font-medium ${order.paymentStatus === 'Paid' ? 'text-emerald-800' : 'text-orange-800'}`}>
                                  Payment {order.paymentStatus} {order.verificationMethod && `(${order.verificationMethod})`}
                                </p>
                              </div>
                            )}
                            {order.status !== 'Pending' && (
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                                <p className="text-sm text-orange-800 font-medium">Order {order.status}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
