import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Star, Truck, ShieldCheck, ArrowRight, MessageCircle, Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '../utils';
import { SEO } from '../components/SEO';

const SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useStore();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  
  const product = products.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product?.color || null);
  const [activeImage, setActiveImage] = useState<string>(product?.image || '');
  const [error, setError] = useState<string | null>(null);

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

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.image, ...(product.images || [])],
    "description": product.description,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "KES",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "KES"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "KE"
        }
      }
    }
  };

  const isWishlisted = isInWishlist(product.id);

  // Update active image when color changes
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    const colorData = product?.colors?.find(c => c.name === colorName);
    if (colorData && colorData.images.length > 0) {
      setActiveImage(colorData.images[0]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setError('Please select a size first.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    addToCart(product, selectedSize, selectedColor || undefined);
  };

  const whatsAppUrl = `https://wa.me/254700000000?text=${encodeURIComponent(`Hello Solemate, I would like to order:\n\n*${product?.name}*\nColor: ${selectedColor || 'Default'}\nSize: US ${selectedSize || 'Not selected'}\nPrice: ${formatPrice(product?.price || 0)}\n\nPlease confirm availability.`)}`;

  // Get current images based on selected color or general images
  const currentImages = product.colors?.find(c => c.name === selectedColor)?.images || product.images || [product.image];

  return (
    <div className="min-h-screen bg-white pt-8 pb-24">
      <SEO 
        title={product.name} 
        description={`${product.brand} ${product.name} - ${product.description.slice(0, 150)}...`}
        ogImage={product.image}
        ogType="product"
        schemaData={productSchema}
      />
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
            className="space-y-6"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 relative shadow-inner">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-zinc-400 hover:text-red-500 transition-colors shadow-sm z-10"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === img ? 'border-zinc-900 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <p className="text-orange-500 font-bold tracking-wider uppercase text-sm mb-2">
                {product.brand} • {product.gender}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight mb-4">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-bold text-zinc-900">{formatPrice(product.price)}</p>
                {product.originalPrice && (
                  <p className="text-xl text-zinc-400 line-through">{formatPrice(product.originalPrice)}</p>
                )}
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">
                  Select Color: <span className="text-zinc-500 font-medium">{selectedColor}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => handleColorSelect(color.name)}
                      className={`group relative p-1 rounded-full border-2 transition-all ${
                        selectedColor === color.name ? 'border-zinc-900 scale-110' : 'border-transparent hover:border-zinc-200'
                      }`}
                      title={color.name}
                    >
                      <div 
                        className="w-8 h-8 rounded-full border border-black/10 shadow-inner"
                        style={{ backgroundColor: color.hex || '#ccc' }}
                      />
                      {selectedColor === color.name && (
                        <motion.div 
                          layoutId="color-active"
                          className="absolute -inset-1 border-2 border-zinc-900 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              {error && (
                <p className="text-sm text-red-500 mt-2 font-bold animate-pulse">{error}</p>
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
              
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-8 bg-[#25D366] text-white rounded-2xl font-bold text-lg hover:bg-[#20bd5a] transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2"
              >
                Order via WhatsApp
                <MessageCircle className="w-5 h-5" />
              </a>
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
