import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

export function Shop() {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery, wishlistItems } = useCart();
  
  const genderParam = searchParams.get('gender') || 'All';
  const showWishlist = searchParams.get('wishlist') === 'true';
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>(genderParam);
  const [selectedColor, setSelectedColor] = useState<string>('All');
  
  useEffect(() => {
    if (genderParam) {
      setSelectedGender(genderParam);
    }
  }, [genderParam]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const genders = ['All', 'Men', 'Women', 'Unisex', 'Kids'];
  const colors = ['All', ...Array.from(new Set(products.map(p => p.color))).filter(Boolean)];
  
  let filteredProducts = showWishlist ? wishlistItems : products;

  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-zinc-50 pt-8 pb-24">
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
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-sm text-zinc-500 font-medium">
                {filteredProducts.length} Results
              </span>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                Sort
              </button>
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
              <ProductCard product={product} />
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
                setSearchParams({});
              }}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
