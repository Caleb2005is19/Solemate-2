import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { Package, LogOut, User as UserIcon, MapPin, Clock, CheckCircle2, Edit2, Save } from 'lucide-react';
import { formatPrice } from '../utils';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';

export function Profile() {
  const { currentUser, userProfile, updateUserProfile, orders } = useStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'address'>('orders');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
    city: userProfile?.city || 'Nairobi',
  });

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile(addressForm);
    setIsEditingAddress(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-zinc-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-6"
        >
          <UserIcon className="w-12 h-12" />
        </motion.div>
        <h1 className="text-3xl font-black text-zinc-900 mb-4">Welcome to Solemate</h1>
        <p className="text-zinc-500 max-w-md mx-auto mb-8">
          Sign in to track your orders, save your delivery addresses, and manage your account.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          Sign in with Google
        </button>
      </div>
    );
  }

  const userOrders = orders.filter(o => o.userId === currentUser.uid);

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 sticky top-24">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-zinc-100 overflow-hidden mb-4 border-4 border-white shadow-sm">
                  {currentUser.photoURL ? (
                    <ImageWithSkeleton src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-500">
                      <UserIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold text-zinc-900">{currentUser.displayName || 'Customer'}</h2>
                <p className="text-sm text-zinc-500">{currentUser.email}</p>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                  <Package className="w-5 h-5" />
                  My Orders
                </button>
                <button 
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'address' ? 'bg-orange-50 text-orange-600' : 'text-zinc-600 hover:bg-zinc-50'}`}
                >
                  <MapPin className="w-5 h-5" />
                  Saved Address
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-zinc-600 hover:bg-zinc-50 rounded-xl font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeTab === 'orders' && (
              <>
                <h1 className="text-3xl font-black text-zinc-900">My Orders</h1>
                
                {userOrders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-zinc-100 shadow-sm">
                    <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-zinc-900 mb-2">No orders yet</h3>
                    <p className="text-zinc-500">When you place an order, it will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-bold text-zinc-900">Order #{order.id}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(order.date).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm text-zinc-500 mb-1">Total Amount</p>
                            <p className="text-xl font-black text-zinc-900">{formatPrice(order.total)}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0">
                                <ImageWithSkeleton src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-zinc-900 truncate">{item.name}</h4>
                                <p className="text-sm text-zinc-500">Size: {item.selectedSize} • Qty: {item.quantity}</p>
                              </div>
                              <div className="text-right font-medium text-zinc-900">
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <h4 className="text-sm font-bold text-zinc-900 mb-4">Order Status Timeline</h4>
                          <div className="relative">
                            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-zinc-200" />
                            <div className="space-y-6 relative">
                              {[
                                { label: 'Order Placed', status: 'Pending', date: order.date },
                                { label: 'Processing', status: 'Processing', date: order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' ? 'Updated' : null },
                                { label: 'Shipped', status: 'Shipped', date: order.status === 'Shipped' || order.status === 'Delivered' ? 'Updated' : null },
                                { label: 'Delivered', status: 'Delivered', date: order.status === 'Delivered' ? 'Updated' : null },
                              ].map((step, i) => {
                                const isCompleted = step.date !== null;
                                const isCurrent = order.status === step.status;
                                
                                return (
                                  <div key={i} className="flex items-start gap-4 ml-1">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 z-10 ${
                                      isCompleted ? 'bg-orange-500 ring-4 ring-orange-100' : 'bg-zinc-300'
                                    }`} />
                                    <div>
                                      <p className={`text-sm font-bold ${isCompleted ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                        {step.label}
                                        {isCurrent && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full uppercase">Current</span>}
                                      </p>
                                      {isCompleted && step.date !== 'Updated' && (
                                        <p className="text-xs text-zinc-500">{new Date(step.date).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-bold text-zinc-900 mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-zinc-400" /> Delivery Address
                            </h5>
                            <p className="text-sm text-zinc-600">
                              {order?.customerInfo?.firstName ?? ''} {order?.customerInfo?.lastName ?? ''}<br />
                              {order?.customerInfo?.location ?? ''}<br />
                              {order?.customerInfo?.city ?? ''}<br />
                              {order?.customerInfo?.phone ?? ''}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-zinc-900 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-zinc-400" /> Payment Method
                            </h5>
                            <p className="text-sm text-zinc-600 capitalize">
                              {order.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card / Cash on Delivery'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'address' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-black text-zinc-900">Saved Address</h1>
                  {!isEditingAddress && (
                    <button 
                      onClick={() => {
                        setAddressForm({
                          phone: userProfile?.phone || '',
                          location: userProfile?.location || '',
                          city: userProfile?.city || 'Nairobi',
                        });
                        setIsEditingAddress(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
                  {isEditingAddress ? (
                    <form onSubmit={handleSaveAddress} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={addressForm.phone}
                          onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          placeholder="07XX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Location / Estate / Building</label>
                        <input
                          type="text"
                          required
                          value={addressForm.location}
                          onChange={e => setAddressForm({...addressForm, location: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          placeholder="e.g. Kilimani, Yaya Centre"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">City / Town</label>
                        <select
                          required
                          value={addressForm.city}
                          onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                        >
                          <option value="Nairobi">Nairobi</option>
                          <option value="Mombasa">Mombasa</option>
                          <option value="Kisumu">Kisumu</option>
                          <option value="Nakuru">Nakuru</option>
                          <option value="Eldoret">Eldoret</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(false)}
                          className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-900 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Save Address
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {userProfile?.location ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-zinc-500 mb-1">Phone Number</p>
                            <p className="text-zinc-900 font-medium">{userProfile.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-500 mb-1">Location</p>
                            <p className="text-zinc-900 font-medium">{userProfile.location}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-500 mb-1">City</p>
                            <p className="text-zinc-900 font-medium">{userProfile.city}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-zinc-900 mb-2">No address saved</h3>
                          <p className="text-zinc-500 mb-6">Save your delivery details for faster checkout.</p>
                          <button 
                            onClick={() => setIsEditingAddress(true)}
                            className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                          >
                            Add Address
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
