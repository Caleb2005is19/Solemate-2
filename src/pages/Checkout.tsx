import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils';

export function Checkout() {
  const { items, cartTotal, cartCount, clearCart } = useCart();
  const { addOrder } = useStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card'>('mpesa');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    addOrder({
      id: Math.random().toString(36).substr(2, 9),
      customerInfo: {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        location: formData.get('location') as string,
        city: formData.get('city') as string,
      },
      items: [...items],
      total: cartTotal,
      status: 'Pending',
      date: new Date().toISOString(),
      paymentMethod,
    });
    
    clearCart();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <h1 className="text-4xl font-black text-zinc-900 mb-4">Order Confirmed!</h1>
        <p className="text-lg text-zinc-500 max-w-md mx-auto mb-8">
          Thank you for shopping with Solemate.co.ke. Your order has been received and our team will contact you shortly for delivery.
        </p>
        <Link
          to="/shop"
          className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                      >
                        <option value="Nairobi">Nairobi</option>
                        <option value="Mombasa">Mombasa</option>
                        <option value="Kisumu">Kisumu</option>
                        <option value="Nakuru">Nakuru</option>
                        <option value="Eldoret">Eldoret</option>
                        <option value="Other">Other (Specify in notes)</option>
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
                        <h3 className="text-lg font-bold text-green-900">Lipa na M-Pesa</h3>
                      </div>
                      <p className="text-green-800 text-sm mb-4 leading-relaxed">
                        1. Go to M-Pesa menu<br/>
                        2. Select Lipa na M-Pesa -&gt; Buy Goods and Services<br/>
                        3. Enter Till Number: <strong>123456</strong><br/>
                        4. Enter Amount: <strong>{formatPrice(cartTotal)}</strong><br/>
                        5. Enter your M-Pesa PIN and confirm.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-green-900 mb-1">M-Pesa Confirmation Code</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. QWE123RTY4" 
                          className="w-full px-4 py-3 rounded-xl border border-green-200 focus:ring-2 focus:ring-green-500 outline-none bg-white" 
                        />
                      </div>
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
                  className="w-full py-4 px-8 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25"
                >
                  Confirm Order
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
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-900 text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Size: {item.selectedSize} | Qty: {item.quantity}</p>
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
                  <span>Delivery (Nairobi)</span>
                  <span className="font-medium text-green-500">Free</span>
                </div>
                <div className="border-t border-zinc-100 pt-4 mt-4 flex justify-between items-center">
                  <span className="font-bold text-zinc-900">Total</span>
                  <span className="text-2xl font-black text-zinc-900">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
