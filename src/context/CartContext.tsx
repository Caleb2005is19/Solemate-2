import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number) => void;
  removeFromCart: (id: string, size: number) => void;
  updateQuantity: (id: string, size: number, quantity: number) => void;
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product: Product, size: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size: number) => {
    setItems((prev) => prev.filter((item) => !(item.id === id && item.selectedSize === size)));
  };

  const updateQuantity = (id: string, size: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && item.selectedSize === size ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const toggleWishlist = (product: Product) => {
    setWishlistItems((prev) => {
      if (prev.find(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (id: string) => {
    return wishlistItems.some(item => item.id === id);
  };

  const cartTotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = items.reduce((count, item) => count + item.quantity, 0);

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
        setSearchQuery
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
