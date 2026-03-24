import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils';
import { DELIVERY_AREAS } from '../constants';
import { SEO } from '../components/SEO';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';

export function Checkout() {
  const { items, cartTotal, cartCount, clearCart } = useCart();
  const { addOrder, currentUser, userProfile } = useStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<'waiting' | 'success' | 'failed'>('waiting');
  const mpesaStatusRef = React.useRef(mpesaStatus);

  useEffect(() => {
    mpesaStatusRef.current = mpesaStatus;
  }, [mpesaStatus]);
  
  const [selectedCity, setSelectedCity] = useState(userProfile?.city || 'Nairobi CBD');
  const [deliveryFee, setDeliveryFee] = useState(0);

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
    const area = DELIVERY_AREAS.find(a => a.name === selectedCity);
    setDeliveryFee(area ? area.fee : 0);
  }, [selectedCity]);

  const finalTotal = cartTotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fData = new FormData(form);
    const phone = fData.get('phone') as string;
    
    const orderId = Math.random().toString(36).substr(2, 9);

    const sellerIds = Array.from(new Set(items.map(item => item.sellerId).filter(Boolean) as string[]));

    if (paymentMethod === 'mpesa') {
      setIsProcessing(true);
      setPaymentError(null);
      
      try {
        // 1. Create the order first in Pending state
        await addOrder({
          id: orderId,
          userId: currentUser?.uid,
          sellerIds,
          customerInfo: {
            firstName: fData.get('firstName') as string,
            lastName: fData.get('lastName') as string,
            email: fData.get('email') as string,
            phone,
            location: fData.get('location') as string,
            city: selectedCity,
          },
          items: [...items],
          total: finalTotal,
          deliveryFee,
          status: 'Pending',
          paymentStatus: 'Pending',
          date: new Date().toISOString(),
          paymentMethod,
        });

        // 2. Initiate STK Push
        const response = await fetch('/api/mpesa/stkpush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, amount: finalTotal, orderId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initiate M-Pesa payment');
        }

        setShowMpesaModal(true);
        setMpesaStatus('waiting');

        // 3. Start polling for status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/mpesa/status/${orderId}`);
            const statusData = await statusRes.json();

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
    
    // For Card/COD, complete immediately
    completeOrder(fData, orderId, phone);
  };

  const completeOrder = (fData: FormData, orderId: string, phone: string) => {
    const sellerIds = Array.from(new Set(items.map(item => item.sellerId).filter(Boolean) as string[]));
    
    addOrder({
      id: orderId,
      userId: currentUser?.uid,
      sellerIds,
      customerInfo: {
        firstName: fData.get('firstName') as string,
        lastName: fData.get('lastName') as string,
        email: fData.get('email') as string,
        phone,
        location: fData.get('location') as string,
        city: selectedCity,
      },
      items: [...items],
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
                  <h3 className="text-lg font-bold text-zinc-900 mb-4">Delivery Address</h3>
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
                    <div className="sm:col-span-2">
                      <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-1">Location / Estate / Building</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        required
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
                        required
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                      >
                        {DELIVERY_AREAS.map(area => (
                          <option key={area.name} value={area.name}>{area.name} (KSh {area.fee})</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
                      Card / Cash on Delivery
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
                    <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 text-center">
                      <p className="text-zinc-600 font-medium">
                        You can pay via Card or Cash upon delivery. Our rider will carry a PDQ machine.
                      </p>
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
                      Processing Payment...
                    </>
                  ) : (
                    'Confirm Order'
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

              <div className="border-t border-zinc-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm text-zinc-500">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-medium text-zinc-900">{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Delivery ({selectedCity})</span>
                  </div>
                  <span className={`font-medium ${deliveryFee === 0 ? 'text-green-500' : 'text-zinc-900'}`}>
                    {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
                  </span>
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
