import React from 'react';
import { X, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, cartTotal } = useCart();

  const handleWhatsAppCheckout = () => {
    const orderDetails = items.map(item => 
      `- ${item.name} (Size: US ${item.selectedSize}) x${item.quantity} = ${formatPrice(item.price * item.quantity)}`
    ).join('\n');
    
    const message = `Hello Solemate, I would like to place an order:\n\n${orderDetails}\n\n*Total: ${formatPrice(cartTotal)}*\n\nPlease advise on delivery.`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Your Cart
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-zinc-900">Your cart is empty</p>
                    <p className="text-zinc-500 mt-1">Looks like you haven't added any shoes yet.</p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl bg-zinc-100 overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-zinc-900 line-clamp-1">{item.name}</h3>
                            <p className="text-sm text-zinc-500 mt-0.5">Size: US {item.selectedSize}</p>
                          </div>
                          <p className="font-bold text-zinc-900">{formatPrice(item.price)}</p>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-zinc-200 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-zinc-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-zinc-100 p-6 bg-zinc-50 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-xl font-bold text-zinc-900">{formatPrice(cartTotal)}</span>
                </div>
                <p className="text-xs text-zinc-500 text-center">Delivery fees calculated at checkout.</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <Link
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full flex items-center justify-center py-3.5 px-8 bg-zinc-900 text-white rounded-xl font-bold text-base hover:bg-zinc-800 transition-colors"
                  >
                    Secure Checkout
                  </Link>
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-8 bg-[#25D366] text-white rounded-xl font-bold text-base hover:bg-[#20bd5a] transition-colors shadow-sm shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Order via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
