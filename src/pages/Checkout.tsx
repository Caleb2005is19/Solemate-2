import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck, UserCircle, Store, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils';
import { DELIVERY_AREAS } from '../constants';
import { SEO } from '../components/SEO';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';
import { initiateStkPush, checkPaymentStatus, loadIntasendScript, setupIntaSendCheckout } from '../services/payments';
import { db, loginWithGoogle } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function Checkout() {
  const { items, cartTotal, cartCount, clearCart } = useCart();
  const { addOrder, currentUser, userProfile, featureToggles } = useStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
  const mpesaStatusRef = React.useRef(mpesaStatus);

  // Coupons & Pricing states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercentage: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const formattedCode = couponCode.trim().toUpperCase();
    if (!formattedCode) return;
    setCouponError(null);
    setCouponSuccess(null);
    setIsValidatingCoupon(true);

    const fallbackCoupons: Record<string, number> = {
      'SOLE20': 20,
      'WELCOME10': 10,
      'SNEAKERHEAD': 15
    };

    try {
      let foundCoupon = false;

      if (db) {
        const qRef = query(collection(db, 'coupons'), where('code', '==', formattedCode));
        const querySnapshot = await getDocs(qRef);
        
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          const isActive = data.isActive !== false;
          const maxUses = data.maxUses ?? 100;
          const usedCount = data.usedCount ?? 0;
          const discountPercentage = Number(data.discountPercentage ?? data.discount ?? 0);
          
          let expired = false;
          if (data.expiryDate) {
            const expiry = data.expiryDate.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
            if (expiry && expiry < new Date()) {
              expired = true;
            }
          }

          if (!isActive) {
            setCouponError('This coupon is currently inactive');
            setIsValidatingCoupon(false);
            return;
          }

          if (expired) {
            setCouponError('This coupon code has expired');
            setIsValidatingCoupon(false);
            return;
          }

          if (usedCount >= maxUses) {
            setCouponError('This coupon has reached its maximum uses');
            setIsValidatingCoupon(false);
            return;
          }

          setAppliedCoupon({
            code: formattedCode,
            discountPercentage
          });
          setCouponSuccess(`Coupon "${formattedCode}" applied! ${discountPercentage}% discount added.`);
          foundCoupon = true;
        }
      }

      if (!foundCoupon) {
        if (fallbackCoupons[formattedCode] !== undefined) {
          const discount = fallbackCoupons[formattedCode];
          setAppliedCoupon({
            code: formattedCode,
            discountPercentage: discount
          });
          setCouponSuccess(`Coupon "${formattedCode}" applied! ${discount}% discount added.`);
        } else {
          setCouponError('Invalid coupon code. Try SOLE20 or WELCOME10');
        }
      }
    } catch (err: any) {
      console.warn('Client-side coupon lookup failed:', err.message);
      // Fallback
      if (fallbackCoupons[formattedCode] !== undefined) {
        const discount = fallbackCoupons[formattedCode];
        setAppliedCoupon({
          code: formattedCode,
          discountPercentage: discount
        });
        setCouponSuccess(`Coupon "${formattedCode}" applied! ${discount}% discount added.`);
      } else {
        setCouponError('Error validating coupon. Try SOLE20 or WELCOME10');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess(null);
    setCouponError(null);
  };

  useEffect(() => {
    mpesaStatusRef.current = mpesaStatus;
  }, [mpesaStatus]);
  
  const [selectedCity, setSelectedCity] = useState(userProfile?.city || 'Nairobi CBD');
  const [deliveryFee, setDeliveryFee] = useState(0);

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedPickupStation, setSelectedPickupStation] = useState('Solemate Nairobi Showroom (CBD - Kenya Cinema Plaza, 4th Floor)');

  const PICKUP_STATIONS = [
    { name: 'Solemate Nairobi Showroom (CBD - Kenya Cinema Plaza, 4th Floor)', hours: 'Mon-Sat: 8am - 8pm' },
    { name: 'Westlands Mall Pickup Point (Ground Floor kiosk)', hours: 'Mon-Sat: 9am - 7pm' },
    { name: 'Kilimani / Junction Mall Hub (Gate 2)', hours: 'Mon-Sat: 9am - 6pm' }
  ];

  // Auto-fill form state
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    location: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        firstName: userProfile.displayName?.split(' ')[0] || '',
        lastName: userProfile.displayName?.split(' ').slice(1).join(' ') || '',
        location: userProfile.location || '',
      });
      if (userProfile.city) {
        setSelectedCity(userProfile.city);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setDeliveryFee(0);
    } else {
      const area = DELIVERY_AREAS.find(a => a.name === selectedCity);
      setDeliveryFee(area ? area.fee : 0);
    }
  }, [selectedCity, deliveryMethod]);

  const discountAmount = appliedCoupon ? (cartTotal * appliedCoupon.discountPercentage) / 100 : 0;
  const subtotalAfterDiscount = cartTotal - discountAmount;
  const finalTotal = subtotalAfterDiscount + deliveryFee;

  // 16% inclusive VAT calculation (Standard in Kenya)
  const vatRate = 0.16;
  const vatAmount = subtotalAfterDiscount - (subtotalAfterDiscount / (1 + vatRate));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fData = new FormData(form);
    const phone = fData.get('phone') as string;
    
    const finalLocation = deliveryMethod === 'pickup' 
      ? selectedPickupStation 
      : (fData.get('location') as string || '');
    const finalCity = deliveryMethod === 'pickup'
      ? 'Showroom Pickup'
      : selectedCity;
    
    const orderId = Math.random().toString(36).substr(2, 9);
    const sellerIds = Array.from(new Set(items.map(item => item.sellerId).filter(Boolean) as string[]));

    if (paymentMethod === 'mpesa') {
      setIsProcessing(true);
      setPaymentError(null);
      
      try {
        // 1. Create the order first in Pending/Unpaid state with complete coupon and VAT details
        await addOrder({
          id: orderId,
          userId: currentUser?.uid,
          sellerIds,
          customerInfo: {
            firstName: fData.get('firstName') as string,
            lastName: fData.get('lastName') as string,
            email: fData.get('email') as string,
            phone,
            location: finalLocation,
            city: finalCity,
          },
          items: [...items],
          subtotal: cartTotal,
          discount: discountAmount,
          couponCode: appliedCoupon?.code || null,
          vatAmount,
          total: finalTotal,
          deliveryFee,
          status: 'Pending',
          paymentStatus: 'Pending',
          date: new Date().toISOString(),
          paymentMethod: 'IntaSend M-Pesa',
        });

        // 2. Initiate STK Push via IntaSend Payments Service
        await initiateStkPush({
          phone,
          amount: finalTotal,
          orderId,
          email: fData.get('email') as string,
          firstName: fData.get('firstName') as string,
          lastName: fData.get('lastName') as string,
        });

        setShowMpesaModal(true);
        setMpesaStatus('waiting');

        // 3. Start polling for status via IntaSend status endpoint
        const pollInterval = setInterval(async () => {
          try {
            const statusData = await checkPaymentStatus(orderId);

            if (statusData.paymentStatus === 'Paid') {
              clearInterval(pollInterval);
              setMpesaStatus('success');
              setTimeout(() => {
                clearCart();
                setIsProcessing(false);
                setShowMpesaModal(false);
                setIsSubmitted(true);
              }, 2000);
            } else if (statusData.paymentStatus === 'Failed') {
              clearInterval(pollInterval);
              setMpesaStatus('failed');
              setPaymentError(statusData.paymentError || 'Payment failed');
              setTimeout(() => {
                setShowMpesaModal(false);
                setIsProcessing(false);
              }, 3000);
            }
          } catch (err) {
            console.error('Polling error:', err);
          }
        }, 3000);

        // Stop polling after 120 seconds (timeout)
        setTimeout(() => {
          clearInterval(pollInterval);
          if (mpesaStatusRef.current === 'waiting') {
            setShowMpesaModal(false);
            setIsProcessing(false);
            setPaymentError('Payment timeout. Please check your phone or try again.');
          }
        }, 120000);

      } catch (err: any) {
        console.error('M-Pesa Error:', err);
        setPaymentError(err.message || 'An error occurred during payment initiation');
        setIsProcessing(false);
      }
      
      return;
    }

    if (paymentMethod === 'card') {
      setIsProcessing(true);
      setPaymentError(null);

      try {
        // 1. Fetch publishable key from backend config dynamically to prevent leak
        const keyConfigResponse = await fetch('/api/intasend/publishable-key');
        const keyConfig = await keyConfigResponse.json();
        const publicKey = keyConfig.publishableKey;

        if (!publicKey) {
          throw new Error('M-Pesa and Card Payment Gateway is not configured. Please supply keys in Settings.');
        }

        // 2. Hydrate official client script to make inline secure iframe checkout ready
        await loadIntasendScript();

        // 3. Register the order in unpaid state
        await addOrder({
          id: orderId,
          userId: currentUser?.uid,
          sellerIds,
          customerInfo: {
            firstName: fData.get('firstName') as string,
            lastName: fData.get('lastName') as string,
            email: fData.get('email') as string,
            phone,
            location: finalLocation,
            city: finalCity,
          },
          items: [...items],
          subtotal: cartTotal,
          discount: discountAmount,
          couponCode: appliedCoupon?.code || null,
          vatAmount,
          total: finalTotal,
          deliveryFee,
          status: 'Pending',
          paymentStatus: 'Pending',
          date: new Date().toISOString(),
          paymentMethod: 'IntaSend Card',
        });

        // 4. Open the secure checkout dialog inline
        setupIntaSendCheckout({
          publicKey,
          amount: finalTotal,
          currency: 'KES',
          email: fData.get('email') as string,
          firstName: fData.get('firstName') as string,
          lastName: fData.get('lastName') as string,
          phone,
          apiRef: orderId,
          onSuccess: async (res: any) => {
            console.log('IntaSend payment success event:', res);
            try {
              // Confirm order paymentStatus to Paid
              await checkPaymentStatus(orderId);
            } catch (err) {
              console.warn('Backend confirmation poll check failed but payment succeeded:', err);
            }
            clearCart();
            setIsProcessing(false);
            setIsSubmitted(true);
          },
          onError: (err: any) => {
            console.error('IntaSend inline checkout exited/failed:', err);
            setPaymentError('The Credit/Debit card checkout process was closed or was declined by the bank.');
            setIsProcessing(false);
          }
        });

      } catch (err: any) {
        console.error('IntaSend Card Payment Initialization Error:', err);
        setPaymentError(err.message || 'An error occurred during transaction setup. Switch to M-Pesa if card fails.');
        setIsProcessing(false);
      }
      return;
    }

    // Default Fallback path
    completeOrder(fData, orderId, phone);
  };

  const completeOrder = (fData: FormData, orderId: string, phone: string) => {
    const sellerIds = Array.from(new Set(items.map(item => item.sellerId).filter(Boolean) as string[]));
    const finalLocation = deliveryMethod === 'pickup' 
      ? selectedPickupStation 
      : (fData.get('location') as string || '');
    const finalCity = deliveryMethod === 'pickup'
      ? 'Showroom Pickup'
      : selectedCity;
    
    addOrder({
      id: orderId,
      userId: currentUser?.uid,
      sellerIds,
      customerInfo: {
        firstName: fData.get('firstName') as string,
        lastName: fData.get('lastName') as string,
        email: fData.get('email') as string,
        phone,
        location: finalLocation,
        city: finalCity,
      },
      items: [...items],
      subtotal: cartTotal,
      discount: discountAmount,
      couponCode: appliedCoupon?.code || null,
      vatAmount,
      total: finalTotal,
      deliveryFee,
      status: 'Pending',
      paymentStatus: 'Pending',
      date: new Date().toISOString(),
      paymentMethod,
    });
    
    clearCart();
    setIsProcessing(false);
    setShowMpesaModal(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Celebration Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              top: '50%', 
              left: '50%', 
              scale: 0,
              rotate: 0,
              opacity: 1 
            }}
            animate={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              scale: [0, 1.5, 0],
              rotate: 360,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className={`absolute w-3 h-3 rounded-full ${['bg-orange-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'][i % 4]}`}
          />
        ))}

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6 relative z-10"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black text-zinc-900 mb-4 relative z-10">Order Confirmed!</h1>
        <p className="text-lg text-zinc-500 max-w-md mx-auto mb-8 relative z-10">
          Thank you for shopping with Solemate.co.ke. Your order has been received and our team will contact you shortly for delivery.
        </p>
        <Link
          to="/shop"
          className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors relative z-10"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (!currentUser && featureToggles?.enableGuestCheckout === false) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-12 animate-in fade-in zoom-in-95 duration-500 font-sans">
        <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-md shadow-orange-50/50">
          <UserCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-3">
          Sign In to Checkout
        </h1>
        <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
          Guest checkout is disabled by the store administrator. Please login with Google to finalize your order details and secure your sneakers.
        </p>
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold transition-all shadow-lg shadow-zinc-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Sign In with Google
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Your cart is empty</h2>
        <Link
          to="/shop"
          className="flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12">
      <SEO 
        title="Checkout - Secure Payment | Solemate.co.ke"
        description="Securely complete your purchase at Solemate.co.ke. We offer M-Pesa and card payments with fast delivery across Kenya."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/shop"
            className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100">
              <h2 className="text-2xl font-bold text-zinc-900 mb-8">Checkout</h2>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">Email address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">Phone Number (Safaricom/Airtel)</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        placeholder="07XX XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                 {/* Shipping Info */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-zinc-900">
                      {deliveryMethod === 'pickup' ? 'Store Pickup Details' : 'Delivery Address'}
                    </h3>
                    
                    {featureToggles?.enablePickupStation !== false && (
                      <div className="flex bg-zinc-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('delivery')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            deliveryMethod === 'delivery'
                              ? 'bg-white text-zinc-900 shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryMethod('pickup')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            deliveryMethod === 'pickup'
                              ? 'bg-white text-zinc-900 shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-900'
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                          Pickup
                        </button>
                      </div>
                    )}
                  </div>

                  {deliveryMethod === 'pickup' ? (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Pickup Station Selection */}
                      <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100/50 text-left">
                        <p className="text-xs font-black text-orange-600 uppercase tracking-wider mb-3">Choose a showroom pickup station:</p>
                        <div className="space-y-3">
                          {PICKUP_STATIONS.map((station) => (
                            <label
                              key={station.name}
                              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedPickupStation === station.name
                                  ? 'border-orange-500 bg-white shadow-sm'
                                  : 'border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50'
                              }`}
                              onClick={() => setSelectedPickupStation(station.name)}
                            >
                              <input
                                type="radio"
                                name="pickupStationSelection"
                                value={station.name}
                                checked={selectedPickupStation === station.name}
                                onChange={() => setSelectedPickupStation(station.name)}
                                className="mt-1 accent-orange-500"
                              />
                              <div>
                                <span className="block text-sm font-bold text-zinc-900">{station.name}</span>
                                <span className="block text-xs text-zinc-400 mt-1">{station.hours}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Customer Name details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-1">First name</label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-1">Last name</label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300 text-left">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-1">First name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-1">Last name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-1">Location / Estate / Building</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          required={deliveryMethod === 'delivery'}
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                          placeholder="e.g. Kilimani, Yaya Centre"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="city" className="block text-sm font-medium text-zinc-700 mb-1">City / Town</label>
                        <select
                          id="city"
                          name="city"
                          required={deliveryMethod === 'delivery'}
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white animate-in"
                        >
                          {DELIVERY_AREAS.map(area => (
                            <option key={area.name} value={area.name}>{area.name} (KSh {area.fee})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">Payment Method</h3>
                  
                  <div className="flex gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                        paymentMethod === 'mpesa' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      Card / Bank Transfer
                    </button>
                  </div>

                  {paymentMethod === 'mpesa' && (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">M-PESA</div>
                        <h3 className="text-lg font-bold text-green-900">Lipa na M-Pesa Online</h3>
                      </div>
                      <p className="text-green-800 text-sm mb-4 leading-relaxed">
                        We will send an M-Pesa prompt to your phone number. Enter your PIN to complete the payment of <strong>{formatPrice(finalTotal)}</strong>.
                      </p>
                      {paymentError && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium">
                          {paymentError}
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">CARD</div>
                        <h3 className="text-lg font-bold text-orange-900">Visa / Mastercard / Banks</h3>
                      </div>
                      <p className="text-orange-850 text-sm mb-4 leading-relaxed text-left">
                        We accept Visa, Mastercard, and secure Bank Transfer APIs. A secure IntaSend checkout dialogue popup will open to authorize and complete your transaction of <strong>{formatPrice(finalTotal)}</strong>.
                      </p>
                      {paymentError && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium">
                          {paymentError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-4 px-8 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing Checkout...
                    </>
                  ) : (
                    'Pay and Confirm Order'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 sticky top-24">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {items.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0">
                      <ImageWithSkeleton
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        containerClassName="h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900 text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {item.selectedColor && <span className="mr-2">Color: {item.selectedColor}</span>}
                        Size: {item.selectedSize} | Qty: {item.quantity}
                      </p>
                      <p className="font-bold text-zinc-900 text-sm mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Form */}
              {featureToggles?.enableCoupons !== false && (
                <div className="border-t border-zinc-100 pt-6 pb-2">
                  <label className="text-xs font-black text-zinc-400 uppercase tracking-wider block mb-2">Have a coupon code?</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. SOLE20, WELCOME10"
                      disabled={isValidatingCoupon || appliedCoupon !== null}
                      className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl text-sm outline-none uppercase font-bold focus:ring-2 focus:ring-orange-500 bg-zinc-50 disabled:opacity-60"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5 font-semibold">{couponError}</p>}
                  {couponSuccess && <p className="text-green-600 text-xs mt-1.5 font-semibold">{couponSuccess}</p>}
                </div>
              )}

              <div className="border-t border-zinc-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-medium text-zinc-900">{formatPrice(cartTotal)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold bg-green-50 p-2.5 rounded-xl">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(discountAmount)} ({appliedCoupon.discountPercentage}%)</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Delivery ({selectedCity})</span>
                  </div>
                  <span className={`font-medium ${deliveryFee === 0 ? 'text-green-500' : 'text-zinc-900'}`}>
                    {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-zinc-400 border-t border-dashed border-zinc-100 pt-2.5">
                  <span>VAT Inclusive (16%)</span>
                  <span>{formatPrice(vatAmount)}</span>
                </div>

                <div className="border-t border-zinc-100 pt-4 mt-4 flex justify-between items-center">
                  <span className="font-bold text-zinc-900">Total</span>
                  <span className="text-2xl font-black text-zinc-900">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center"
          >
            {mpesaStatus === 'waiting' ? (
              <>
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Check your phone</h3>
                <p className="text-zinc-500 mb-6">
                  We've sent an M-Pesa prompt to your phone. Please enter your PIN to complete the payment of <strong>{formatPrice(finalTotal)}</strong>.
                </p>
                <div className="text-sm text-zinc-400 animate-pulse">Waiting for payment...</div>
              </>
            ) : mpesaStatus === 'success' ? (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-8 h-8" />
                </motion.div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">Payment Successful!</h3>
                <p className="text-zinc-500">Your M-Pesa payment was received.</p>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </div>
  );
}
