import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { SEO } from '../components/SEO';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { ShoppingBag, Heart, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageWithSkeleton } from '../components/ImageWithSkeleton';

export function Shop() {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery, wishlistItems, addToCart, toggleWishlist, isInWishlist } = useCart();
  
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quickViewColor, setQuickViewColor] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const genderParam = searchParams.get('gender') || 'All';
  const showWishlist = searchParams.get('wishlist') === 'true';

  const shopSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": showWishlist ? "My Wishlist | Solemate.co.ke" : "Shop All Sneakers & Shoes | Solemate.co.ke",
    "description": "Browse our extensive collection of premium sneakers, boots, and casual shoes. Filter by brand, color, and price to find your perfect pair.",
    "url": window.location.href,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `${window.location.origin}/product/${p.id}`,
        "name": p.name
      }))
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>(genderParam);
  const [selectedColor, setSelectedColor] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(50000);
  const [sortBy, setSortBy] = useState<'Newest' | 'Price: Low to High' | 'Price: High to Low' | 'Discount'>('Newest');
  const [showOnlySale, setShowOnlySale] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  useEffect(() => {
    if (genderParam) {
      setSelectedGender(genderParam);
    }
  }, [genderParam]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const genders = ['All', 'Men', 'Women', 'Unisex', 'Kids'];
  const colors = ['All', ...Array.from(new Set(products.map(p => p.color))).filter(Boolean)];
  const brands = ['All', ...Array.from(new Set(products.map(p => p.brand))).filter(Boolean)];
  
  let filteredProducts = showWishlist ? wishlistItems : products;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.brand.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );
  }

  if (selectedCategory !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (selectedGender !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.gender === selectedGender || p.gender === 'Unisex');
  }

  if (selectedColor !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.color === selectedColor);
  }

  if (selectedBrand !== 'All') {
    filteredProducts = filteredProducts.filter(p => p.brand === selectedBrand);
  }

  if (showOnlySale) {
    filteredProducts = filteredProducts.filter(p => p.originalPrice && p.originalPrice > p.price);
  }

  filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);

  // Sorting
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High': return a.price - b.price;
      case 'Price: High to Low': return b.price - a.price;
      case 'Discount': 
        const discA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      default: return 0; // Newest is default (already sorted by Firestore if we add createdAt, or just default order)
    }
  });

  return (
    <div className="min-h-screen bg-zinc-50 pt-8 pb-24">
      <SEO 
        title={showWishlist ? "My Wishlist" : "Shop All Sneakers & Shoes"} 
        description="Browse our extensive collection of premium sneakers, boots, and casual shoes. Filter by brand, color, and price to find your perfect pair."
        schemaData={shopSchema}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-4">
            {showWishlist ? 'My Wishlist' : 'Shop All'}
          </h1>
          {searchQuery && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-zinc-600">Showing results for: <strong>"{searchQuery}"</strong></span>
              <button onClick={() => setSearchQuery('')} className="p-1 bg-zinc-200 rounded-full hover:bg-zinc-300">
                <X className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {!showWishlist && (
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-6 border-b border-zinc-200">
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              {/* Gender Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mr-2">Gender:</span>
                {genders.map(gender => (
                  <button
                    key={gender}
                    onClick={() => {
                      setSelectedGender(gender);
                      setSearchParams(gender === 'All' ? {} : { gender });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedGender === gender
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>

              {/* Color Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mr-2">Color:</span>
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedColor === color
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              {/* Brand Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider mr-2">Brand:</span>
                {brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedBrand === brand
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>

              {/* Price Filter */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Max Price:</span>
                  <input 
                    type="range" 
                    min="1000" 
                    max="50000" 
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-32 accent-zinc-900"
                  />
                  <span className="text-sm font-medium text-zinc-700">KSh {maxPrice.toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={() => setShowOnlySale(!showOnlySale)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${showOnlySale ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-500'}`}
                >
                  🔥 Sale Items
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end relative">
              <span className="text-sm text-zinc-500 font-medium">
                {filteredProducts.length} Results
              </span>
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {sortBy}
                </button>
                
                {isSortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-2 z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {(['Newest', 'Price: Low to High', 'Price: High to Low', 'Discount'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-6 py-3 text-sm font-bold transition-colors ${sortBy === option ? 'bg-orange-50 text-orange-600' : 'text-zinc-600 hover:bg-zinc-50'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard 
                product={product} 
                onQuickView={(p) => {
                  setQuickViewProduct(p);
                  setSelectedSize(null);
                  setQuickViewColor(p.color || null);
                  setActiveImageIndex(0);
                }} 
              />
            </motion.div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100 mt-8">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No products found</h3>
            <p className="text-zinc-500">Try adjusting your filters or search query.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedGender('All');
                setSelectedCategory('All');
                setSelectedColor('All');
                setSelectedBrand('All');
                setMaxPrice(50000);
                setSearchParams({});
              }}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Quick View Modal */}
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
                  <ImageWithSkeleton 
                    src={(quickViewProduct.colors?.find(c => c.name === quickViewColor)?.images || quickViewProduct.images || [quickViewProduct.image])[activeImageIndex]} 
                    alt={quickViewProduct.name}
                    className="w-full h-full object-cover"
                    containerClassName="h-full"
                  />
                  
                  {/* Gallery Navigation */}
                  {(quickViewProduct.images?.length || 0) > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev === 0 ? (quickViewProduct.images?.length || 1) - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full opacity-0 group-hover/gallery:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev === (quickViewProduct.images?.length || 1) - 1 ? 0 : prev + 1))}
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
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Color: <span className="text-zinc-900">{quickViewColor}</span></h4>
                      <div className="flex gap-2">
                        {quickViewProduct.colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setQuickViewColor(c.name);
                              setActiveImageIndex(0);
                            }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${quickViewColor === c.name ? 'border-zinc-900 scale-110' : 'border-transparent hover:border-zinc-200'}`}
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
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedSize === size
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
                        if (!selectedSize) return alert('Please select a size');
                        addToCart(quickViewProduct, selectedSize, quickViewColor || undefined);
                        setQuickViewProduct(null);
                      }}
                      className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-xl flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
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
                      // Navigate to full product page
                      window.location.href = `/product/${quickViewProduct.id}`;
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
    </div>
  );
}
