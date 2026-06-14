import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, Search, X, Heart, Phone, User, LogIn, LogOut, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { loginWithGoogle, logout } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { cartCount, setIsCartOpen, wishlistItems, searchQuery, setSearchQuery } = useCart();
  const { currentUser, isAdmin, currentSellerId, setIsAuthModalOpen } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/shop');
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top Bar */}
      <div className="bg-zinc-900 text-white text-xs sm:text-sm py-2 px-4 text-center flex justify-center items-center gap-4">
        <span>🚚 Free Delivery in Nairobi CBD</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">📦 Countrywide Delivery via Fargo Courier</span>
        <span className="hidden sm:inline">|</span>
        <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> +254 700 000 000</span>
      </div>
      
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-500 text-white text-xs py-2 px-4 text-center font-bold"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 focus:outline-none"
                aria-label={isMobileMenuOpen ? "Close main navigation menu" : "Open main navigation menu"}
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
                aria-label={isSearchOpen ? "Close search drawer" : "Open search drawer"}
              >
                <Search className="h-5 w-5" />
              </button>
              
              <Link to="/shop?wishlist=true" aria-label={`View wishlist (contains ${wishlistItems.length} items)`} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative hidden sm:block">
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-orange-500 rounded-full">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button 
                  onClick={() => currentUser ? setIsProfileOpen(!isProfileOpen) : handleLogin()}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-2"
                  aria-label={currentUser ? `User profile menu. Managed email: ${currentUser.email}` : "Sign in to account with Google"}
                >
                  {currentUser ? (
                    currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Profile" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="h-5 w-5" />
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-orange-500">
                      <LogIn className="h-5 w-5" />
                      <span className="hidden md:inline">Sign In</span>
                    </div>
                  )}
                </button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && currentUser && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 py-1 z-50 overflow-hidden"
                      >
                        <div className="px-4 py-2 border-b border-zinc-50">
                          <p className="text-xs text-zinc-500">Signed in as</p>
                          <p className="text-sm font-medium text-zinc-900 truncate">{currentUser.email}</p>
                        </div>
                        
                        <Link 
                          to="/profile" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>

                        <Link 
                          to="/my-orders" 
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          My Orders
                        </Link>

                        {isAdmin && (
                          <>
                            <Link 
                              to="/admin" 
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Admin Portal
                            </Link>
                            <Link 
                              to="/stress-test" 
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              <Zap className="w-4 h-4 text-orange-500" />
                              Stress Test
                            </Link>
                          </>
                        )}

                        {currentSellerId && (
                          <Link 
                            to={`/seller/${currentSellerId}`} 
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Seller Portal
                          </Link>
                        )}

                        <button 
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors relative"
                aria-label={`Open shopping cart drawer (contains ${cartCount} items)`}
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
                <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">My Orders</Link>
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500">My Profile</Link>
                
                {isAdmin && (
                  <>
                    <div className="h-px bg-zinc-200 my-2 mx-3"></div>
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-orange-600 hover:bg-orange-50 uppercase tracking-wider">Admin Portal</Link>
                  </>
                )}

                {currentSellerId && (
                  <>
                    <div className="h-px bg-zinc-200 my-2 mx-3"></div>
                    <Link to={`/seller/${currentSellerId}`} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-orange-600 hover:bg-orange-50 uppercase tracking-wider">Seller Portal</Link>
                  </>
                )}

                <div className="h-px bg-zinc-200 my-2 mx-3"></div>
                {currentUser ? (
                  <button 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-zinc-900 hover:bg-zinc-50 hover:text-orange-500"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
