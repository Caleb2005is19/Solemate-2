import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product, Order, OrderStatus, Seller } from '../types';
import { products as initialProducts } from '../data/products';

const initialSellers: Seller[] = [
  { id: 'seller-1', name: 'Nairobi Kicks', email: 'hello@nairobikicks.co.ke', status: 'Active', joinedDate: '2023-01-15' },
  { id: 'seller-2', name: 'SneakerHead KE', email: 'sales@sneakerhead.co.ke', status: 'Active', joinedDate: '2023-03-22' },
];

interface StoreContextType {
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  orders: Order[];
  addOrder: (o: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  sellers: Seller[];
  addSeller: (s: Seller) => void;
  updateSeller: (id: string, s: Partial<Seller>) => void;
  deleteSeller: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);

  const addProduct = (p: Product) => setProducts([p, ...products]);
  
  const updateProduct = (id: string, updates: Partial<Product>) => 
    setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
    
  const deleteProduct = (id: string) => 
    setProducts(products.filter(p => p.id !== id));

  const addOrder = (o: Order) => setOrders([o, ...orders]);
  
  const updateOrderStatus = (id: string, status: OrderStatus) =>
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));

  const addSeller = (s: Seller) => setSellers([s, ...sellers]);
  
  const updateSeller = (id: string, updates: Partial<Seller>) =>
    setSellers(sellers.map(s => s.id === id ? { ...s, ...updates } : s));
    
  const deleteSeller = (id: string) =>
    setSellers(sellers.filter(s => s.id !== id));

  return (
    <StoreContext.Provider value={{ 
      products, addProduct, updateProduct, deleteProduct, 
      orders, addOrder, updateOrderStatus,
      sellers, addSeller, updateSeller, deleteSeller
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
