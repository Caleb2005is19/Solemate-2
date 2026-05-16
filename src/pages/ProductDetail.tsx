import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Star, Truck, ShieldCheck, ArrowRight, MessageCircle, Heart, ShoppingBag, ChevronRight, ChevronLeft, Shirt, Layers, Watch, Glasses, Link as LinkIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../utils';
import { SEO } from '../components/SEO';
import { ProductCard } from '../components/ProductCard';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { ImageZoom } from '../components/ImageZoom';
import { Product, Review } from '../types';
import { ShoppingCart, X, Info, Send, User } from 'lucide-react';
import { reviewService } from '../services/reviewService';

const SIZES = [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13];

const getStyleAdvice = (product: Product) => {
  const category = product.category.toLowerCase();
  
  if (category.includes('basketball') || category.includes('high')) {
    return {
      vibe: "Urban Streetwear",
      description: "A bold, court-inspired look that dominates the streets.",
      tips: [
        "Pair with tapered joggers to highlight the high-top silhouette.",
        "Go for an oversized graphic hoodie for that relaxed urban feel.",
        "Add a matching snapback cap to complete the aesthetic."
      ],
      items: [
        { name: "Tapered Joggers", icon: Shirt },
        { name: "Oversized Hoodie", icon: Layers },
        { name: "Snapback Cap", icon: Watch }
      ]
    };
  }
  
  if (category.includes('run') || category.includes('sport') || category.includes('train')) {
    return {
      vibe: "Modern Athleisure",
      description: "Where performance meets everyday comfort and style.",
      tips: [
        "Perfect with tech-fleece pants or high-performance leggings.",
        "Keep it sleek with a moisture-wicking quarter-zip pullover.",
        "Minimalist accessories like a sports watch work best here."
      ],
      items: [
        { name: "Tech Fleece", icon: Shirt },
        { name: "Performance Tee", icon: Layers },
        { name: "Sports Watch", icon: Watch }
      ]
    };
  }
  
  if (category.includes('boot') || category.includes('leather')) {
    return {
      vibe: "Rugged & Refined",
      description: "A sophisticated look that's built for durability and character.",
      tips: [
        "Elevate with dark-wash selvedge denim and a leather jacket.",
        "Works beautifully with a heavy-knit sweater in earthy tones.",
        "Classic aviator sunglasses add a touch of timeless cool."
      ],
      items: [
        { name: "Selvedge Denim", icon: Shirt },
        { name: "Leather Jacket", icon: Layers },
        { name: "Aviators", icon: Glasses }
      ]
    };
  }

  if (category.includes('skate')) {
    return {
      vibe: "Skate Culture",
      description: "A laid-back, durable aesthetic that's ready for any session.",
      tips: [
        "Pair with baggy cargo pants or loose-fit work trousers.",
        "A classic boxy tee and an open flannel shirt is the way to go.",
        "Don't forget a durable canvas belt and a beanie."
      ],
      items: [
        { name: "Cargo Pants", icon: Shirt },
        { name: "Boxy Tee", icon: Layers },
        { name: "Beanie", icon: Watch }
      ]
    };
  }

  if (category.includes('outdoor') || category.includes('hike') || category.includes('trail')) {
    return {
      vibe: "Adventure Ready",
      description: "Functional and rugged, designed for the great outdoors.",
      tips: [
        "Style with utility pants or water-resistant hiking shorts.",
        "Layer with a technical windbreaker or a fleece vest.",
        "A sturdy backpack and a wide-brim hat are essential."
      ],
      items: [
        { name: "Utility Pants", icon: Shirt },
        { name: "Windbreaker", icon: Layers },
        { name: "Wide-Brim Hat", icon: Watch }
      ]
    };
  }

  if (category.includes('lifestyle') || category.includes('fashion')) {
    return {
      vibe: "High-Street Chic",
      description: "A trend-forward look that blends luxury with street style.",
      tips: [
        "Contrast with tailored trousers for a high-low fashion mix.",
        "A long-line trench coat or a puffer jacket adds drama.",
        "Statement jewelry and designer shades complete the look."
      ],
      items: [
        { name: "Tailored Pants", icon: Shirt },
        { name: "Trench Coat", icon: Layers },
        { name: "Statement Shades", icon: Glasses }
      ]
    };
  }

  // Default: Casual/Sneakers
  return {
    vibe: "Effortless Casual",
    description: "The versatile daily driver for a clean, laid-back appearance.",
    tips: [
      "Classic look with slim-fit chinos or well-fitted blue jeans.",
      "Layer a simple white tee under an unbuttoned flannel shirt.",
      "Keep it simple with a canvas tote or a minimalist backpack."
    ],
    items: [
      { name: "Slim Chinos", icon: Shirt },
      { name: "Flannel Shirt", icon: Layers },
      { name: "Minimalist Bag", icon: Watch }
    ]
  };
};

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, currentUser } = useStore();
  const { addToCart, toggleWishlist, isInWishlist, addToRecentlyViewed } = useCart();
  
  const product = products.find(p => p.id === id);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(product?.color || null);
  const [activeImage, setActiveImage] = useState<string>(product?.image || '');
  const [error, setError] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [qvSize, setQvSize] = useState<number | null>(null);
  const [qvColor, setQvColor] = useState<string | null>(null);
  const [qvImageIndex, setQvImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchReviews = async () => {
    if (!id) return;
    setLoadingReviews(true);
    const fetchedReviews = await reviewService.getReviews(id);
    setReviews(fetchedReviews);
    setLoadingReviews(false);
  };

  const checkPurchase = async () => {
    if (!id || !currentUser) {
      setHasPurchased(false);
      return;
    }
    const bought = await reviewService.hasPurchasedProduct(currentUser.uid, id);
    setHasPurchased(bought);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    setSubmittingReview(true);
    const result = await reviewService.addReview(
      id, 
      currentUser.uid, 
      currentUser.displayName || 'Anonymous User', 
      rating, 
      comment
    );
    if (result) {
      setReviews(prev => [result, ...prev]);
      setShowReviewForm(false);
      setComment('');
      setRating(5);
    }
    setSubmittingReview(false);
  };

  // Reset state when product changes
  React.useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      setSelectedColor(product.color || null);
      setSelectedSize(null);
      setError(null);
      window.scrollTo(0, 0);
      addToRecentlyViewed(product);
      fetchReviews();
      checkPurchase();
    }
  }, [id, product, addToRecentlyViewed, currentUser]);

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
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
          <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <Link to="/shop" className="hover:text-orange-500 transition-colors">Shop</Link>
          <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          <span className="text-zinc-900 truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 relative shadow-inner">
              <ImageZoom
                src={activeImage || product.image}
                alt={product.name}
                className="w-full h-full"
                loading="eager"
                fetchPriority="high"
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
                   <img 
                    src={img} 
                    alt={`${product.name} ${idx}`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                    loading="lazy"
                    decoding="async"
                  />
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
              <div className="flex items-center justify-between gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight">
                  {product.name}
                </h1>
                <button 
                  onClick={handleCopyLink}
                  className={`flex-shrink-0 p-3 rounded-2xl transition-all duration-300 border ${
                    copied 
                      ? 'bg-green-50 text-green-600 border-green-100' 
                      : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:text-blue-500 hover:bg-white hover:shadow-md'
                  }`}
                  title="Copy product link"
                >
                  {copied ? (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Copied</span>
                    </div>
                  ) : (
                    <LinkIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
                            ? 'fill-orange-500 text-orange-500' 
                            : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-zinc-900">
                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-sm text-zinc-400 font-medium">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

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

        {/* Minimalist Style Guide Section */}
        <section className="mt-24 pt-16 border-t border-zinc-100">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Style Guide</h2>
                <p className="text-sm text-zinc-500 font-medium">How to wear your new {product.brand}s</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">
                    The <span className="text-orange-500">{getStyleAdvice(product).vibe}</span> Vibe
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {getStyleAdvice(product).description}
                  </p>
                </div>

                <div className="space-y-4">
                  {getStyleAdvice(product).tips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-orange-500 font-black text-sm">0{idx + 1}</span>
                      <p className="text-sm text-zinc-600 font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-8">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">Essential Pairings</h4>
                <div className="grid grid-cols-3 gap-4">
                  {getStyleAdvice(product).items.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-colors">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{item.name}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-zinc-200">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Color Palette</h4>
                  <div className="flex gap-2">
                    {['#18181b', '#3f3f46', '#71717a', '#f97316'].map((color, i) => (
                      <div 
                        key={i} 
                        className="w-6 h-6 rounded-full border border-zinc-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* User Reviews Section */}
        <section className="mt-24 pt-16 border-t border-zinc-100">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Review Summary */}
            <div className="lg:w-1/3">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">User Reviews</h2>
                  <p className="text-sm text-zinc-500 font-medium">What Solemates are saying</p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-3xl p-8 sticky top-24">
                <div className="text-center mb-8">
                  <div className="text-5xl font-black text-zinc-900 mb-2">
                    {reviews.length > 0 
                      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
                      : '0.0'}
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0)
                            ? 'fill-orange-500 text-orange-500' 
                            : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">
                    Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {[5, 4, 3, 2, 1].map((ratingVal) => {
                    const count = reviews.filter(r => r.rating === ratingVal).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={ratingVal} className="flex items-center gap-4">
                        <div className="text-xs font-bold text-zinc-400 w-4">{ratingVal}</div>
                        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-orange-500" 
                          />
                        </div>
                        <div className="text-xs font-bold text-zinc-400 w-8">{count}</div>
                      </div>
                    );
                  })}
                </div>

                {currentUser ? (
                  hasPurchased ? (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-lg"
                    >
                      {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                    </button>
                  ) : (
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                      <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-800 leading-relaxed font-medium">
                        Only customers who have purchased this product can leave a review.
                      </p>
                    </div>
                  )
                ) : (
                  <Link
                    to="/profile"
                    className="block w-full py-4 bg-zinc-100 text-zinc-900 text-center rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    Login to Review
                  </Link>
                )}
              </div>
            </div>

            {/* Review List & Form */}
            <div className="flex-1">
              <AnimatePresence>
                {showReviewForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-12 bg-white border border-zinc-100 rounded-3xl p-8 shadow-xl relative"
                  >
                    <button 
                      onClick={() => setShowReviewForm(false)}
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold text-zinc-900 mb-6">Write your review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRating(r)}
                              className="p-1 transition-transform active:scale-110"
                            >
                              <Star 
                                className={`w-8 h-8 ${
                                  r <= rating ? 'fill-orange-500 text-orange-500' : 'text-zinc-200'
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Your Feedback</label>
                        <textarea
                          required
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="What did you like about these sneakers?"
                          className="w-full p-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all h-32 resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-500 disabled:opacity-50 transition-all shadow-xl"
                      >
                        {submittingReview ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Submit Review
                            <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-8">
                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                    <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <motion.div 
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-b border-zinc-100 pb-8 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-zinc-900">{review.userName}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-zinc-200'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-600 leading-relaxed text-sm">
                        {review.comment}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300 mb-4">
                      <MessageCircle className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 mb-2">No reviews yet</h4>
                    <p className="text-sm text-zinc-500 max-w-xs">
                      Be the first to share your thoughts on the {product.name}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        <div className="mt-24 pt-16 border-t border-zinc-100">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Related Products</h2>
              <p className="text-zinc-500 font-medium">You might also like these sneakers</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-orange-500 transition-colors group">
              View All Shop
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative group/carousel">
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
              {products
                .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
                .slice(0, 8)
                .map((relatedProduct) => (
                  <div key={relatedProduct.id} className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start">
                    <ProductCard 
                      product={relatedProduct} 
                      onQuickView={(p) => {
                        setQuickViewProduct(p);
                        setQvSize(null);
                        setQvColor(p.color || null);
                        setQvImageIndex(0);
                      }}
                    />
                  </div>
                ))}
            </div>
            
            {/* Carousel Navigation Hints (Mobile) */}
            <div className="sm:hidden flex justify-center gap-1 mt-2">
              <div className="w-8 h-1 bg-orange-500 rounded-full" />
              <div className="w-2 h-1 bg-zinc-200 rounded-full" />
              <div className="w-2 h-1 bg-zinc-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Quick View Modal (Reused from Shop for consistency) */}
        <AnimatePresence>
          {quickViewProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQuickViewProduct(null)}
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              >
                <button 
                  onClick={() => setQuickViewProduct(null)}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md rounded-full text-zinc-400 hover:text-zinc-900 z-10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-1/2 bg-zinc-100 relative group/gallery">
                  <img 
                    src={(quickViewProduct.colors?.find(c => c.name === qvColor)?.images || quickViewProduct.images || [quickViewProduct.image])[qvImageIndex]} 
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Gallery Navigation */}
                  {(quickViewProduct.images?.length || 0) > 1 && (
                    <>
                      <button 
                        onClick={() => setQvImageIndex(prev => (prev === 0 ? (quickViewProduct.images?.length || 1) - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setQvImageIndex(prev => (prev === (quickViewProduct.images?.length || 1) - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Right: Product Info */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 overflow-y-auto">
                  <div className="mb-6">
                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">{quickViewProduct.brand}</p>
                    <h2 className="text-2xl font-black text-zinc-900 leading-tight mb-2">{quickViewProduct.name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-zinc-900">{formatPrice(quickViewProduct.price)}</span>
                      {quickViewProduct.originalPrice && (
                        <span className="text-lg text-zinc-400 line-through font-medium">{formatPrice(quickViewProduct.originalPrice)}</span>
                      )}
                    </div>
                  </div>

                  {/* Color Selection */}
                  {quickViewProduct.colors && quickViewProduct.colors.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Color: <span className="text-zinc-900">{qvColor}</span></h4>
                      <div className="flex gap-2">
                        {quickViewProduct.colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQvColor(c.name);
                              setQvImageIndex(0);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${qvColor === c.name ? 'border-zinc-900 scale-110' : 'border-transparent hover:border-zinc-200'}`}
                            style={{ backgroundColor: c.hex || '#ccc' }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Size (US)</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[7, 8, 9, 10, 11, 12].map(size => (
                        <button
                          key={size}
                          onClick={() => setQvSize(size)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            qvSize === size
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg'
                              : 'bg-white text-zinc-900 border-zinc-200 hover:border-zinc-900'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (!qvSize) return alert('Please select a size');
                        addToCart(quickViewProduct, qvSize, qvColor || undefined);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-xl flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(quickViewProduct)}
                      className={`p-4 rounded-2xl border transition-all ${
                        isInWishlist(quickViewProduct.id)
                          ? 'bg-red-50 text-red-500 border-red-100'
                          : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist(quickViewProduct.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setQuickViewProduct(null);
                      navigate(`/product/${quickViewProduct.id}`);
                    }}
                    className="w-full mt-4 text-center text-xs font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest transition-colors"
                  >
                    View Full Details
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-20">
        <RecentlyViewed />
      </div>
    </div>
  );
}
