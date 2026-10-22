import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  LogOut, 
  User as UserIcon, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Save, 
  Printer, 
  FileText, 
  Loader2,
  Search,
  X,
  Phone,
  MessageSquare,
  AlertCircle,
  Truck,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { formatPrice } from '../utils';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';
import { printOrders } from '../utils/printInvoice';
import { downloadOrderPdf } from '../utils/pdfGenerator';
import { initiateStkPush, checkPaymentStatus, verifyMpesaReceipt } from '../services/payments';
import { DELIVERY_AREAS } from '../constants';
import { useSearchParams } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import type { CartItem, Product, Order, OrderStatus } from '../types';

interface ProfileProps {
  initialTab?: 'orders' | 'profile' | 'addresses';
}

const SHOE_SIZES = [
  { eu: '36', us: '4.5', uk: '3.5' },
  { eu: '37', us: '5.0', uk: '4.0' },
  { eu: '38', us: '5.5', uk: '4.5' },
  { eu: '39', us: '6.5', uk: '5.5' },
  { eu: '40', us: '7.0', uk: '6.0' },
  { eu: '41', us: '8.0', uk: '7.0' },
  { eu: '42', us: '8.5', uk: '7.5' },
  { eu: '43', us: '9.5', uk: '8.5' },
  { eu: '44', us: '10.0', uk: '9.0' },
  { eu: '45', us: '11.0', uk: '10.0' },
  { eu: '46', us: '12.0', uk: '11.0' },
  { eu: '47', us: '13.0', uk: '12.0' },
];

export function Profile({ initialTab }: ProfileProps) {
  const { currentUser, userProfile, updateUserProfile, orders, siteSettings } = useStore();
  const { addToCart, setIsCartOpen } = useCart();
  const { notify } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: prioritize prop -> query param -> default 'orders'
  const tabFromQuery = searchParams.get('tab') as 'orders' | 'profile' | 'addresses' | null;
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>(() => {
    if (initialTab) return initialTab;
    if (tabFromQuery && ['orders', 'profile', 'addresses'].includes(tabFromQuery)) return tabFromQuery;
    return 'orders';
  });

  // Sync tab change to URL search params
  const handleTabChange = (tab: 'orders' | 'profile' | 'addresses') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Auth state
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Orders filtering & search state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // PDF & print states
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [downloadedOrderId, setDownloadedOrderId] = useState<string | null>(null);

  // M-Pesa inline assist states
  const [activeMpesaOrderId, setActiveMpesaOrderId] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaReceiptCode, setMpesaReceiptCode] = useState('');
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaFeedback, setMpesaFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: userProfile?.displayName || currentUser?.displayName || '',
    phone: userProfile?.phone || '',
    secondaryPhone: userProfile?.secondaryPhone || '',
    preferredShoeSize: userProfile?.preferredShoeSize || '42',
    genderPreference: userProfile?.genderPreference || 'Unisex',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    city: userProfile?.city || 'Nairobi CBD',
    location: userProfile?.location || '',
    deliveryNotes: userProfile?.deliveryNotes || '',
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressSaveSuccess, setAddressSaveSuccess] = useState(false);

  // Re-sync forms when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        displayName: userProfile.displayName || currentUser?.displayName || '',
        phone: userProfile.phone || '',
        secondaryPhone: userProfile.secondaryPhone || '',
        preferredShoeSize: userProfile.preferredShoeSize || '42',
        genderPreference: userProfile.genderPreference || 'Unisex',
      });
      setAddressForm({
        city: userProfile.city || 'Nairobi CBD',
        location: userProfile.location || '',
        deliveryNotes: userProfile.deliveryNotes || '',
      });
      if (userProfile.phone && !mpesaPhone) {
        setMpesaPhone(userProfile.phone);
      }
    }
  }, [userProfile, currentUser]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      await updateUserProfile({
        displayName: profileForm.displayName.trim(),
        phone: profileForm.phone.trim(),
        secondaryPhone: profileForm.secondaryPhone.trim(),
        preferredShoeSize: profileForm.preferredShoeSize,
        genderPreference: profileForm.genderPreference as any,
      });
      setProfileSaveSuccess(true);
      notify({
        recipient: 'customer',
        userId: currentUser?.uid,
        title: 'Profile Updated',
        message: 'Your personal info and shoe size preference (EU ' + profileForm.preferredShoeSize + ') have been saved.',
        type: 'settings',
        link: '/profile?tab=profile'
      });
      setTimeout(() => setProfileSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setAddressSaveSuccess(false);
    try {
      await updateUserProfile({
        city: addressForm.city,
        location: addressForm.location.trim(),
        deliveryNotes: addressForm.deliveryNotes.trim(),
      });
      setAddressSaveSuccess(true);
      notify({
        recipient: 'customer',
        userId: currentUser?.uid,
        title: 'Delivery Address Saved',
        message: `Default address updated to ${addressForm.location || addressForm.city}.`,
        type: 'settings',
        link: '/profile?tab=addresses'
      });
      setTimeout(() => setAddressSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update address:', err);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Re-order shoe item
  const handleReorderItem = (item: CartItem) => {
    const productLike: Product = {
      id: item.id,
      name: item.name,
      brand: 'Solemate',
      price: item.price,
      image: item.image,
      images: [item.image],
      category: item.category || 'Sneakers',
      gender: 'Unisex',
      color: item.selectedColor || 'Original',
      description: '',
      inStock: true,
      sellerId: item.sellerId,
    };
    addToCart(productLike, Number(item.selectedSize) || 42, item.selectedColor);
    setIsCartOpen(true);
  };

  // Trigger M-Pesa STK Push Retry
  const handleRetryMpesa = async (order: Order) => {
    const phoneToUse = (mpesaPhone || order.customerInfo?.phone || userProfile?.phone || '').trim();
    if (!phoneToUse) {
      setMpesaFeedback({
        type: 'error',
        message: 'Please enter a valid Safaricom phone number (e.g. 0712345678).'
      });
      return;
    }

    setIsProcessingMpesa(true);
    setMpesaFeedback(null);

    try {
      await initiateStkPush({
        phone: phoneToUse,
        amount: order.total,
        orderId: order.id,
        email: order.customerInfo?.email || currentUser?.email || 'customer@solemate.co.ke',
        firstName: order.customerInfo?.firstName || currentUser?.displayName || 'Solemate',
        lastName: order.customerInfo?.lastName || 'Customer',
      });

      setMpesaFeedback({
        type: 'success',
        message: 'STK push sent to your phone! Enter your M-Pesa PIN on the prompt, then click Check Status.'
      });
    } catch (err: any) {
      setMpesaFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Could not send M-Pesa STK push. Try verifying your receipt code below.'
      });
    } finally {
      setIsProcessingMpesa(false);
    }
  };

  // Verify M-Pesa receipt code
  const handleVerifyMpesaCode = async (orderId: string) => {
    if (!mpesaReceiptCode.trim()) {
      setMpesaFeedback({
        type: 'error',
        message: 'Please enter your 10-character M-Pesa confirmation code (e.g. QK89XY72AZ).'
      });
      return;
    }

    setIsProcessingMpesa(true);
    setMpesaFeedback(null);

    try {
      const res = await verifyMpesaReceipt(orderId, mpesaReceiptCode.trim().toUpperCase());
      setMpesaFeedback({
        type: 'success',
        message: res.message || 'Payment confirmed! Your order is now being processed for dispatch.'
      });
      setMpesaReceiptCode('');
    } catch (err: any) {
      setMpesaFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Could not verify M-Pesa receipt code. Please check and retry.'
      });
    } finally {
      setIsProcessingMpesa(false);
    }
  };

  // Check payment status from IntaSend
  const handleCheckStatus = async (orderId: string) => {
    setIsProcessingMpesa(true);
    setMpesaFeedback(null);

    try {
      const res = await checkPaymentStatus(orderId);
      if (res.paymentStatus === 'Paid') {
        setMpesaFeedback({
          type: 'success',
          message: 'Payment verified! Your order is officially paid and queued for delivery.'
        });
      } else {
        setMpesaFeedback({
          type: 'error',
          message: 'Payment is still pending. If you completed M-Pesa checkout, paste your confirmation receipt code below.'
        });
      }
    } catch (err: any) {
      setMpesaFeedback({
        type: 'error',
        message: 'Could not fetch payment status right now. Please retry shortly.'
      });
    } finally {
      setIsProcessingMpesa(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-zinc-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-orange-100 text-orange-500 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-orange-200/50"
        >
          <UserIcon className="w-10 h-10" />
        </motion.div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">Welcome to Solemate Kenya</h1>
        <p className="text-zinc-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
          Sign in to track your sneaker orders in real time, customize your delivery preferences, and save your preferred shoe sizes.
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="px-8 py-3.5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-3 cursor-pointer"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserIcon className="w-5 h-5 text-orange-400" />
          )}
          <span>Continue with Google</span>
        </button>
      </div>
    );
  }

  // Filter orders belonging to this user
  const userOrders = orders.filter(o => o.userId === currentUser.uid || o.customerInfo?.email?.toLowerCase() === currentUser.email?.toLowerCase());

  // Aggregate user statistics
  const totalSpent = userOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const activeDeliveriesCount = userOrders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Shipped').length;
  const completedOrdersCount = userOrders.filter(o => o.status === 'Delivered').length;

  // Filtered orders list based on active customer filters
  const filteredUserOrders = userOrders.filter(order => {
    // 1. Status Filter
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'active') {
        const isActive = order.status === 'Pending' || order.status === 'Processing' || order.status === 'Shipped';
        if (!isActive) return false;
      } else if (order.status !== orderStatusFilter) {
        return false;
      }
    }

    // 2. Search query
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.trim().toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchItems = order.items?.some(it => (it.name || '').toLowerCase().includes(q));
      const matchCity = (order.customerInfo?.city || '').toLowerCase().includes(q);
      if (!matchId && !matchItems && !matchCity) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50/60 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Customer Profile Banner Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/5 via-transparent to-transparent pointer-events-none rounded-full blur-2xl" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* User Credentials */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-zinc-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                {currentUser.photoURL ? (
                  <ImageWithSkeleton 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Customer'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-black text-xl">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    {currentUser.displayName || userProfile?.displayName || 'Sneaker Enthusiast'}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Customer
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">{currentUser.email}</p>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 flex-wrap">
                  {userProfile?.preferredShoeSize && (
                    <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                      Size: EU {userProfile.preferredShoeSize}
                    </span>
                  )}
                  {userProfile?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {userProfile.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Summary Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6">
              <div className="text-left">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Orders</p>
                <p className="text-lg sm:text-xl font-bold font-mono text-zinc-900">{userOrders.length}</p>
                <p className="text-[10px] text-zinc-400">Total placed</p>
              </div>

              <div className="text-left">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">In Transit</p>
                <p className={`text-lg sm:text-xl font-bold font-mono ${activeDeliveriesCount > 0 ? 'text-orange-600' : 'text-zinc-900'}`}>
                  {activeDeliveriesCount}
                </p>
                <p className="text-[10px] text-zinc-400">Active status</p>
              </div>

              <div className="text-left">
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Spent</p>
                <p className="text-base sm:text-lg font-bold font-mono text-zinc-900 truncate">
                  {formatPrice(totalSpent)}
                </p>
                <p className="text-[10px] text-zinc-400">Footwear value</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between border-t border-zinc-100 mt-6 pt-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleTabChange('orders')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Package className="w-4 h-4 text-orange-400" />
                <span>Orders & Tracking</span>
                {activeDeliveriesCount > 0 && (
                  <span className="w-5 h-5 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                    {activeDeliveriesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <UserIcon className="w-4 h-4 text-orange-400" />
                <span>Personal & Sizing</span>
              </button>

              <button
                onClick={() => handleTabChange('addresses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'addresses'
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <MapPin className="w-4 h-4 text-orange-400" />
                <span>Delivery Address</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS & LIVE TRACKING */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Orders Search and Status Filter Bar */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by Order ID or sneaker name..."
                    className="w-full pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Segmented Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <button
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      orderStatusFilter === 'all'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    All ({userOrders.length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('active')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      orderStatusFilter === 'active'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Active ({activeDeliveriesCount})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('Delivered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      orderStatusFilter === 'Delivered'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    Delivered ({completedOrdersCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Feed */}
            {filteredUserOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-xs">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400 mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">No orders found</h3>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mb-6">
                  {orderSearchQuery || orderStatusFilter !== 'all'
                    ? 'No orders match your current search or filter criteria.'
                    : 'You haven’t placed any sneaker orders with Solemate yet.'}
                </p>
                {(orderSearchQuery || orderStatusFilter !== 'all') ? (
                  <button
                    onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <a
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4 text-orange-400" />
                    <span>Explore Footwear Catalog</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredUserOrders.map(order => {
                  const isPaid = order.paymentStatus === 'Paid' || order.status === 'Delivered';
                  const isPendingPayment = !isPaid && order.status !== 'Cancelled';
                  const isExpanded = expandedOrderId === order.id;

                  // 4-Stage Visual Fulfillment Timeline
                  const timelineStages = [
                    { title: 'Order Placed', desc: 'Received in store system', done: true },
                    { title: 'Payment Confirmed', desc: isPaid ? 'M-Pesa verified' : 'Awaiting payment', done: isPaid },
                    { title: 'Dispatched & In Transit', desc: 'Courier on route', done: order.status === 'Shipped' || order.status === 'Delivered' },
                    { title: 'Delivered', desc: 'Received & finalized', done: order.status === 'Delivered' },
                  ];

                  return (
                    <div 
                      key={order.id} 
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-xs hover:border-zinc-300 transition-all"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-bold text-zinc-900 text-base">
                              #{order.id.length > 10 ? order.id.slice(-8).toUpperCase() : order.id}
                            </span>
                            
                            {/* Fulfillment Status Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              order.status === 'Shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              order.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {order.status}
                            </span>

                            {/* Payment Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              isPaid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {order.date ? new Date(order.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'N/A'}
                          </p>
                        </div>

                        {/* Order Total & Receipts */}
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total</span>
                            <span className="text-xl font-black font-mono text-zinc-900">
                              {formatPrice(order.total)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Download PDF Receipt */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setDownloadingOrderId(order.id);
                                  await downloadOrderPdf(order, siteSettings || undefined);
                                  setDownloadedOrderId(order.id);
                                  setTimeout(() => setDownloadedOrderId(null), 3500);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setDownloadingOrderId(null);
                                }
                              }}
                              disabled={downloadingOrderId === order.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              title="Download Solemate Official PDF Receipt"
                            >
                              {downloadingOrderId === order.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                                  <span>PDF...</span>
                                </>
                              ) : downloadedOrderId === order.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Downloaded</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Receipt PDF</span>
                                </>
                              )}
                            </button>

                            {/* Print Receipt */}
                            <button
                              type="button"
                              onClick={() => printOrders(order, siteSettings || undefined)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all cursor-pointer"
                              title="Print receipt directly"
                            >
                              <Printer className="w-4 h-4 text-zinc-700" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4-Stage Visual Fulfillment Timeline */}
                      <div className="my-6 bg-zinc-50/70 p-4 sm:p-5 rounded-2xl border border-zinc-100">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-orange-500" />
                            Fulfillment & Dispatch Progress
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            Destination: <strong className="text-zinc-800">{order.customerInfo?.city || 'Nairobi'}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                          {timelineStages.map((st, sIdx) => (
                            <div key={st.title} className="flex flex-col space-y-1">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  st.done 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-zinc-200 text-zinc-500'
                                }`}>
                                  {st.done ? '✓' : sIdx + 1}
                                </div>
                                <span className={`text-xs font-bold ${st.done ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                  {st.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-400 pl-7 leading-tight">{st.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pending M-Pesa Payment Assist Module */}
                      {isPendingPayment && (
                        <div className="my-5 p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="text-xs sm:text-sm font-bold text-amber-900">
                                Action Required: M-Pesa Payment Pending
                              </h5>
                              <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                                Your order is saved and reserved. To initiate instant dispatch, complete your payment via M-Pesa STK push or enter your confirmation code if already paid.
                              </p>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={activeMpesaOrderId === order.id ? mpesaPhone : (order.customerInfo?.phone || userProfile?.phone || '')}
                                onChange={(e) => {
                                  setActiveMpesaOrderId(order.id);
                                  setMpesaPhone(e.target.value);
                                }}
                                placeholder="Safaricom phone (0712...)"
                                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleRetryMpesa(order)}
                                disabled={isProcessingMpesa}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                              >
                                {isProcessingMpesa && activeMpesaOrderId === order.id ? 'Sending...' : 'Prompt M-Pesa'}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={activeMpesaOrderId === order.id ? mpesaReceiptCode : ''}
                                onChange={(e) => {
                                  setActiveMpesaOrderId(order.id);
                                  setMpesaReceiptCode(e.target.value.toUpperCase());
                                }}
                                placeholder="Receipt code (e.g. QK89...)"
                                className="w-36 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono uppercase text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleVerifyMpesaCode(order.id)}
                                disabled={isProcessingMpesa}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                Verify
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCheckStatus(order.id)}
                              disabled={isProcessingMpesa}
                              className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                            >
                              Check Status
                            </button>
                          </div>

                          {/* M-Pesa Live Feedback Notice */}
                          {mpesaFeedback && activeMpesaOrderId === order.id && (
                            <div className={`p-3 rounded-xl text-xs font-medium border ${
                              mpesaFeedback.type === 'success'
                                ? 'bg-emerald-100/60 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100/60 text-rose-800 border-rose-300'
                            }`}>
                              {mpesaFeedback.message}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Items List */}
                      <div className="space-y-3 pt-2">
                        {order.items?.map((item, itIdx) => (
                          <div 
                            key={`${item.id}-${itIdx}`} 
                            className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-zinc-50/60 transition-colors border border-transparent hover:border-zinc-100"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/60">
                                <ImageWithSkeleton 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="min-w-0">
                                <h5 className="font-bold text-zinc-900 text-sm truncate">{item.name}</h5>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                  <span>Size: <strong className="text-zinc-700">EU {item.selectedSize}</strong></span>
                                  <span>·</span>
                                  <span>Qty: <strong className="text-zinc-700">{item.quantity}</strong></span>
                                  {item.selectedColor && (
                                    <>
                                      <span>·</span>
                                      <span>Color: {item.selectedColor}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-mono font-bold text-sm text-zinc-900">
                                {formatPrice((item.price || 0) * (item.quantity || 1))}
                              </span>

                              {/* Buy Again Button */}
                              <button
                                type="button"
                                onClick={() => handleReorderItem(item)}
                                className="px-3 py-1 bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-zinc-700 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                                title="Add same shoe & size back to your bag"
                              >
                                Reorder
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address & Customer Notes Toggle */}
                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>
                            Delivering to: <strong className="text-zinc-800">{order.customerInfo?.firstName} {order.customerInfo?.lastName}</strong> ({order.customerInfo?.location || order.customerInfo?.city})
                          </span>
                        </div>

                        <span className="text-zinc-400">
                          Solemate Helpline: +254 700 000 000
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & SHOE SIZING */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Personal Details & Sizing Profile</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Configure your contact numbers and preferred shoe sizing for 1-click tailored checkout recommendations.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-8">
              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Account Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-sm text-zinc-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Linked to your secure Google authentication login.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Primary Phone Number (For Delivery & M-Pesa)
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 0712 345 678"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Secondary Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={profileForm.secondaryPhone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, secondaryPhone: e.target.value }))}
                    placeholder="e.g. 0798 765 432"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Preferred Shoe Size Matrix */}
              <div className="pt-4 border-t border-zinc-100 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                      Preferred Sneaker Sizing
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Select your primary footwear size so we highlight availability and auto-select your fit at checkout.
                    </p>
                  </div>

                  {/* Gender / Fit Selector */}
                  <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                    {(['Unisex', 'Men', 'Women'] as const).map(fit => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() => setProfileForm(prev => ({ ...prev, genderPreference: fit }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          profileForm.genderPreference === fit
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizing Pill Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                  {SHOE_SIZES.map(s => {
                    const isSelected = profileForm.preferredShoeSize === s.eu;
                    return (
                      <button
                        key={s.eu}
                        type="button"
                        onClick={() => setProfileForm(prev => ({ ...prev, preferredShoeSize: s.eu }))}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 border-orange-500 text-white font-black shadow-sm ring-2 ring-orange-500/20 scale-102'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        <div className="text-sm font-bold">EU {s.eu}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-orange-100' : 'text-zinc-400'}`}>
                          US {s.us}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button & Confirmation */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                {profileSaveSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Profile & Sizing preferences saved successfully!
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">
                    Preferences are securely stored in your personal account profile.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SAVED DELIVERY ADDRESS */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Saved Delivery Address</h2>
              <p className="text-zinc-500 text-sm mt-1">
                Your default shipping destination for dispatch riders and courier drop-offs across Kenya.
              </p>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Region / City Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Primary Region / Delivery City
                  </label>
                  <select
                    value={addressForm.city}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                  >
                    {DELIVERY_AREAS.map(area => (
                      <option key={area.name} value={area.name}>
                        {area.name} (Delivery Fee: KES {area.fee})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Specific Street / Estate / Landmark */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Street Address, Estate or Area
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.location}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Kilimani, Wood Avenue, Casa Bella Apts"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Rider Landmark / Delivery Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Rider Drop-off Instructions & Landmarks
                </label>
                <textarea
                  rows={3}
                  value={addressForm.deliveryNotes}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                  placeholder="e.g. House No. B4, 2nd Floor. Opposite Shell petrol station. Call when approaching the main security gate."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                />
              </div>

              {/* Action Button & Confirmation */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                {addressSaveSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    Delivery destination saved as default!
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400">
                    This address will automatically pre-fill your future checkouts.
                  </span>
                )}

                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-orange-400" />
                      <span>Save Default Address</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
