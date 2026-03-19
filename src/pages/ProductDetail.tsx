import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Star, Truck, ShieldCheck, ArrowRight, MessageCircle, Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils';

const SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  
  const product = products.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  
  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Product not found</h2>
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 text-orange-500 font-medium hover:text-orange-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop
        </button>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size first.');
      return;
    }
    addToCart(product, selectedSize);
  };

  const handleWhatsAppOrder = () => {
    const message = `Hello Solemate, I would like to order:\n\n*${product.name}*\nSize: US ${selectedSize || 'Not selected'}\nPrice: ${formatPrice(product.price)}\n\nPlease confirm availability.`;
    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 relative"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-zinc-400 hover:text-red-500 transition-colors shadow-sm"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <p className="text-orange-500 font-bold tracking-wider uppercase text-sm mb-2">
                {product.brand} • {product.gender}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold text-zinc-900">{formatPrice(product.price)}</p>
                {product.originalPrice && (
                  <p className="text-lg text-zinc-400 line-through">{formatPrice(product.originalPrice)}</p>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                  Select Size (US)
                </h3>
                <button className="text-sm text-zinc-500 underline hover:text-zinc-900">Size Guide</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      selectedSize === size
                        ? 'bg-zinc-900 text-white shadow-md scale-105'
                        : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-sm text-red-500 mt-2 font-medium">Please select a size to continue</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-8 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                Add to Cart
                <ShoppingBag className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleWhatsAppOrder}
                className="w-full py-4 px-8 bg-[#25D366] text-white rounded-2xl font-bold text-lg hover:bg-[#20bd5a] transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
              >
                Order via WhatsApp
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-zinc mb-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-2">Description</h3>
              <p className="text-zinc-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-zinc-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-50 rounded-lg text-zinc-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Delivery</h4>
                  <p className="text-xs text-zinc-500 mt-1">Same day within Nairobi.<br/>24-48hrs countrywide.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zinc-50 rounded-lg text-zinc-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 text-sm">Authentic</h4>
                  <p className="text-xs text-zinc-500 mt-1">100% guaranteed authentic products.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
