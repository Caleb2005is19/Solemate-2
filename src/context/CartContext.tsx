import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number, color?: string) => void;
  removeFromCart: (id: string, size: number, color?: string) => void;
  updateQuantity: (id: string, size: number, quantity: number, color?: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
  cartCount: number;
  
  wishlistItems: Product[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: string) => boolean;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wishlist_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('wishlist_items', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  useEffect(() => {
    localStorage.setItem('recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addToRecentlyViewed = useCallback((product: Product) => {
    setRecentlyViewed((prev) => {
      // If the product is already at the front, don't update state to avoid unnecessary re-renders
      if (prev.length > 0 && prev[0].id === product.id) {
        return prev;
      }
      // Remove if already exists to move to front
      const filtered = prev.filter(p => p.id !== product.id);
      // Add to front and limit to 10
      return [product, ...filtered].slice(0, 10);
    });
  }, []);

  const addToCart = useCallback((product: Product, size: number, color?: string) => {
    const colorData = product.colors?.find(c => c.name === color);
    const itemImage = (colorData && colorData.images.length > 0) ? colorData.images[0] : product.image;

    setItems((prev) => {
      const existing = prev.find((item) => 
        item.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size && item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, image: itemImage, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id: string, size: number, color?: string) => {
    setItems((prev) => prev.filter((item) => 
      !(item.id === id && item.selectedSize === size && item.selectedColor === color)
    ));
  }, []);

  const updateQuantity = useCallback((id: string, size: number, quantity: number, color?: string) => {
    if (quantity < 1) {
      removeFromCart(id, size, color);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedSize === size && item.selectedColor === color 
          ? { ...item, quantity } 
          : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const toggleWishlist = useCallback((product: Product) => {
    setWishlistItems((prev) => {
      if (prev.find(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return wishlistItems.some(item => item.id === id);
  }, [wishlistItems]);

  const cartTotal = useMemo(() => items.reduce((total, item) => total + item.price * item.quantity, 0), [items]);
  const cartCount = useMemo(() => items.reduce((count, item) => count + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartTotal,
        cartCount,
        wishlistItems,
        toggleWishlist,
        isInWishlist,
        searchQuery,
        setSearchQuery,
        recentlyViewed,
        addToRecentlyViewed
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
