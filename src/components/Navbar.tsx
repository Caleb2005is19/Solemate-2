import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, Search, X, Heart, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { cartCount, setIsCartOpen, wishlistItems, searchQuery, setSearchQuery } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/shop');
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-zinc-900 text-white text-xs sm:text-sm py-2 px-4 text-center flex justify-center items-center gap-4">
        <span>🚚 Free Delivery in Nairobi CBD</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">📦 Countrywide Delivery via Fargo Courier</span>
        <span className="hidden sm:inline">|</span>
        <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> +254 700 000 000</span>
      </div>
      
      <nav className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center sm:justify-start">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl leading-none">S</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-zinc-900">Solemate.co.ke</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex sm:items-center sm:space-x-8">
              <Link to="/" className="text-zinc-600 hover:text-orange-500 px-3 py-2 text-sm font-medium transition-colors">Home</Link>
              <Link to="/shop" className="text-zinc-600 hover:text-orange-500 px-3 py-2 text-sm font-medium transition-colors">Shop All</Link>
              <Link to="/shop?gender=Men" className="text-zinc-600 hover:text-orange-500 px-3 py-2 text-sm font-medium transition-colors">Men</Link>
              <Link to="/shop?gender=Women" className="text-zinc-600 hover:text-orange-500 px-3 py-2 text-sm font-medium transition-colors">Women</Link>
            </div>

            {/* Right side icons */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              
              <Link to="/shop?wishlist=true" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative hidden sm:block">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-500 rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-500 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-zinc-100 bg-white overflow-hidden"
            >
              <div className="max-w-3xl mx-auto px-4 py-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search for sneakers, brands, etc..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                    autoFocus
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800">
                    Search
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden overflow-hidden bg-white border-b border-zinc-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">Home</Link>
                <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">Shop All</Link>
                <Link to="/shop?gender=Men" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">Men's</Link>
                <Link to="/shop?gender=Women" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">Women's</Link>
                <Link to="/shop?wishlist=true" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">My Wishlist ({wishlistItems.length})</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
