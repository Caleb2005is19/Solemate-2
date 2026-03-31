import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { MyOrders } from './pages/MyOrders';
import { Profile } from './pages/Profile';
import { StressTest } from './pages/StressTest';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-orange-500/30">
              <Navbar />
              <CartDrawer />
              <main>
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
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
              
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
