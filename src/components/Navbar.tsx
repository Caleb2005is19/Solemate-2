import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, Search, X, Heart, Phone, User, LogIn, LogOut, ShieldCheck, Zap, Bell } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useNotifications } from '../context/NotificationContext';
import { loginWithGoogle, logout } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { HamburgerNotificationTab, NotificationToastDock } from './NotificationCenter';
import { StickyPromoBanner } from './StickyPromoBanner';

export function Navbar() {
  const { cartCount, setIsCartOpen, wishlistItems, searchQuery, setSearchQuery } = useCart();
  const { currentUser, isAdmin, currentSellerId, setIsAuthModalOpen, siteSettings } = useStore();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const contactPhone = siteSettings?.phoneNumbers?.[0] || siteSettings?.whatsappNumber || '+254 700 000 000';
  const cleanTel = contactPhone.replace(/[^\d+]/g, '');

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
      <StickyPromoBanner />
      {/* Top Bar */}
      <div className="bg-zinc-900 text-white text-xs sm:text-sm py-2 px-4 text-center flex justify-center items-center gap-4">
        <span>🚚 Free Delivery in Nairobi CBD</span>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <span className="hidden sm:inline">📦 Countrywide Delivery via Fargo Courier</span>
        <span className="hidden sm:inline text-zinc-600">|</span>
        <a 
          href={`tel:${cleanTel}`}
          className="flex items-center gap-1.5 hover:text-orange-400 transition-colors font-medium text-white"
          title="Call store support directly"
        >
          <Phone className="w-3 h-3 text-orange-500" />
          <span>{contactPhone}</span>
        </a>
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
            {/* Hamburger menu button */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors relative cursor-pointer flex items-center gap-1.5 focus-visible:outline-hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="hidden lg:inline text-xs font-semibold text-zinc-700">Menu</span>
                {unreadCount > 0 && !isMobileMenuOpen && (
                  <span 
                    className="absolute top-1.5 right-1.5 lg:top-2 lg:right-2 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white" 
                    title={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
                  />
                )}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center sm:justify-start ml-2 sm:ml-4">
              <Link to="/" className="flex items-center gap-2 group" aria-label="Solemate Home">
                <Logo variant="horizontal" size={38} />
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

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setIsMobileMenuOpen(true);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-zinc-500" />
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[11px] font-semibold text-orange-600 tabular-nums">
                              {unreadCount}
                            </span>
                          )}
                        </button>

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

        {/* Navigation & Notifications Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-white border-b border-zinc-200 shadow-xl"
            >
              <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
                {/* 1. Notifications Tab (First-class item in Hamburger Menu) */}
                <HamburgerNotificationTab onCloseMenu={() => setIsMobileMenuOpen(false)} />

                {/* 2. Menu Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 text-sm font-medium">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1">Shop Collections</p>
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">Home</Link>
                    <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">Shop All Sneakers</Link>
                    <Link to="/shop?gender=Men" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">Men's Sneakers</Link>
                    <Link to="/shop?gender=Women" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">Women's Sneakers</Link>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1">Customer Account</p>
                    <Link to="/shop?wishlist=true" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">My Wishlist ({wishlistItems.length})</Link>
                    <Link to="/my-orders" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">My Orders & Tracking</Link>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-zinc-800 hover:bg-zinc-50 hover:text-orange-600 transition-colors">My Profile & Addresses</Link>
                  </div>

                  {(isAdmin || currentSellerId) && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1">Portals</p>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-orange-600 font-semibold hover:bg-orange-50 transition-colors">Admin Dashboard</Link>
                      )}
                      {currentSellerId && (
                        <Link to={`/seller/${currentSellerId}`} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-orange-600 font-semibold hover:bg-orange-50 transition-colors">Seller Portal</Link>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 py-1">Session</p>
                    {currentUser ? (
                      <button 
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Sign Out ({currentUser.displayName || currentUser.email?.split('@')[0]})
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          handleLogin();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-zinc-900 font-semibold hover:bg-zinc-100 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Toast Dock for Real-Time Order & System Alerts */}
        <NotificationToastDock />
      </nav>
    </header>
  );
}
