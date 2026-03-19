import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Clock } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { motion } from 'motion/react';

export function Home() {
  const { products } = useStore();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1552346154-21d32810baa3?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Background"
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-medium text-sm tracking-wide uppercase"
          >
            Nairobi's Premium Sneaker Plug
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6"
          >
            Find Your <span className="text-orange-500">Solemate</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-zinc-300 mb-10 max-w-2xl mx-auto font-light"
          >
            Discover the latest drops, exclusive collaborations, and timeless classics delivered right to your doorstep.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/shop?gender=Men"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white backdrop-blur-md rounded-full font-bold text-lg hover:bg-white/20 transition-all"
            >
              Shop Men
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Fast Delivery</h3>
              <p className="text-zinc-500 text-sm">Same day delivery within Nairobi CBD. 24-48hrs countrywide via Fargo Courier.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">100% Authentic</h3>
              <p className="text-zinc-500 text-sm">All our sneakers are verified authentic. Shop with complete confidence.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Pay on Delivery</h3>
              <p className="text-zinc-500 text-sm">Available for orders within Nairobi. Inspect your shoes before paying.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">New Arrivals</h2>
              <p className="text-zinc-500 mt-2">The freshest kicks just landed in Kenya.</p>
            </div>
            <Link
              to="/shop"
              className="hidden sm:flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center sm:hidden">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories / Banners */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link to="/shop?gender=Men" className="group relative h-96 rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&q=80&w=1000"
                alt="Men's Collection"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white mb-2">Men's Collection</h3>
                <p className="text-zinc-200 font-medium flex items-center gap-2">
                  Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
            
            <Link to="/shop?gender=Women" className="group relative h-96 rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=1000"
                alt="Women's Collection"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <h3 className="text-3xl font-bold text-white mb-2">Women's Collection</h3>
                <p className="text-zinc-200 font-medium flex items-center gap-2">
                  Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
