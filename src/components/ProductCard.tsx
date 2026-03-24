import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Eye, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { toggleWishlist, isInWishlist, addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
        <Link to={`/product/${product.id}`} aria-label={`View details for ${product.name}`} className="block h-full">
          <img
            src={product.image}
            alt={`${product.brand} ${product.name}`}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors duration-300" />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              New
            </div>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="bg-zinc-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}
        </div>

        {/* Action Buttons (Floating) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <button 
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product);
            }}
            className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-zinc-400 hover:text-red-500 hover:scale-110'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              onQuickView?.(product);
            }}
            className="p-2.5 bg-white/90 backdrop-blur-md rounded-full text-zinc-400 hover:text-orange-500 hover:scale-110 transition-all duration-300 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 sm:translate-x-4 sm:group-hover:translate-x-0"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add to Cart (Bottom) */}
        <div className="absolute inset-x-3 bottom-3 z-20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 ease-out hidden sm:block">
          <button 
            onClick={(e) => {
              e.preventDefault();
              // Default to first size if available, or just open product page
              // For simplicity in card, we might just navigate or open quick view
              onQuickView?.(product);
            }}
            className="w-full py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors shadow-xl flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Quick Add
          </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">{product.brand}</p>
          <h3 className="text-sm font-bold text-zinc-900 leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors">
            <Link to={`/product/${product.id}`}>
              {product.name}
            </Link>
          </h3>
        </div>

        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            {product.colors.slice(0, 4).map((c, i) => (
              <div 
                key={i}
                className="w-3 h-3 rounded-full border border-zinc-200 shadow-sm"
                style={{ backgroundColor: c.hex || '#ccc' }}
                title={c.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-zinc-400 font-medium">+{product.colors.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-zinc-900">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-zinc-400 line-through font-medium">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{product.gender}</span>
        </div>
      </div>
    </motion.article>
  );
}
