import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useCart();
  const isWishlisted = isInWishlist(product.id);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              New
            </div>
          )}
          {product.originalPrice && (
            <div className="bg-zinc-900 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              Sale
            </div>
          )}
        </div>

        {/* Wishlist Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-zinc-400 hover:text-red-500 transition-colors shadow-sm z-10"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">{product.brand} • {product.gender}</p>
            <h3 className="text-sm sm:text-base font-semibold text-zinc-900 leading-tight line-clamp-2">
              <Link to={`/product/${product.id}`} className="hover:text-orange-500 transition-colors">
                {product.name}
              </Link>
            </h3>
          </div>
        </div>
        <div className="mt-auto pt-3 flex items-center gap-2">
          <p className="text-lg font-bold text-zinc-900">{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-sm text-zinc-400 line-through">{formatPrice(product.originalPrice)}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
