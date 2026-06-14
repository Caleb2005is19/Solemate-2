import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { ThemeAndSettingsManager } from './components/ThemeAndSettingsManager';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import BackToTop from './components/BackToTop';
import ScrollToTop from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const MyOrders = lazy(() => import('./pages/MyOrders').then(m => ({ default: m.MyOrders })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const StressTest = lazy(() => import('./pages/StressTest').then(m => ({ default: m.StressTest })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));

// Loading component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ThemeAndSettingsManager>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-orange-500/30">
                <AuthModal />
                <Navbar />
                <CartDrawer />
                <main>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/admin" element={<Dashboard role="admin" />} />
                      <Route path="/seller/:sellerId" element={<Dashboard role="seller" />} />
                      <Route path="/my-orders" element={<MyOrders />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/stress-test" element={<StressTest />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="*" element={<Home />} />
                    </Routes>
                  </Suspense>
                </main>
                
                <Footer />
                <BackToTop />
              </div>
            </Router>
          </CartProvider>
        </ThemeAndSettingsManager>
      </StoreProvider>
    </ErrorBoundary>
  );
}
