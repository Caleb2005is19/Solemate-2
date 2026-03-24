import React from 'react';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { motion } from 'motion/react';
import { History } from 'lucide-react';

export function RecentlyViewed() {
  const { recentlyViewed } = useCart();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="py-12 border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-orange-50 rounded-lg">
            <History className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Recently Viewed</h2>
            <p className="text-sm text-zinc-500">Products you've looked at lately</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {recentlyViewed.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
