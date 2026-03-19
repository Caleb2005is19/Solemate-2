import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { CartDrawer } from './components/CartDrawer';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';

export default function App() {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-orange-500/30">
          <Navbar />
          <CartDrawer />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          
          {/* Simple Footer */}
          <footer className="bg-zinc-900 text-zinc-400 py-12 text-center">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-center items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl leading-none">S</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Solemate</span>
              </div>
              <p className="text-sm">© {new Date().getFullYear()} Solemate. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </CartProvider>
  );
}
