import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, Order, OrderStatus, Seller, UserProfile } from '../types';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where, Query, or } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function stripUndefined(obj: any) {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
}

interface StoreContextType {
  products: Product[];
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  orders: Order[];
  addOrder: (o: Order) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  sellers: Seller[];
  addSeller: (s: Seller) => Promise<void>;
  updateSeller: (id: string, s: Partial<Seller>) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  currentUser: User | null;
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  currentSellerId: string | null;
  unreadOrdersCount: number;
  markOrdersAsRead: () => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(null);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(() => {
    const saved = localStorage.getItem('lastReadOrders');
    return saved ? parseInt(saved) : Date.now();
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user profile
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            // Create default profile
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 'client'
            };
            await setDoc(docRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }

        // Check if admin (for prototype, hardcode the email or check custom claims)
        if (user.email === 'carlisat19@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods: Product[] = [];
      snapshot.forEach(doc => prods.push({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      const slrs: Seller[] = [];
      snapshot.forEach(doc => slrs.push({ id: doc.id, ...doc.data() } as Seller));
      setSellers(slrs);
      
      // Update currentSellerId if user is logged in
      if (currentUser) {
        const seller = slrs.find(s => s.email.toLowerCase() === currentUser.email?.toLowerCase());
        if (seller) {
          setCurrentSellerId(seller.id);
        } else {
          setCurrentSellerId(null);
        }
      }

      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sellers');
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubSellers();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }

    let q: Query;
    if (isAdmin) {
      q = collection(db, 'orders');
    } else {
      // For non-admins, we show orders where they are either the customer or a seller
      q = query(
        collection(db, 'orders'), 
        or(
          where('userId', '==', currentUser.uid),
          where('sellerIds', 'array-contains', currentUser.uid)
        )
      );
    }

    const unsubOrders = onSnapshot(q, (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach(doc => ords.push({ id: doc.id, ...doc.data() } as Order));
      // Sort by date descending locally
      ords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(ords);

      // Calculate unread orders for sellers
      if (currentSellerId) {
        const unread = ords.filter(o => 
          o.sellerIds?.includes(currentSellerId) && 
          new Date(o.date).getTime() > lastReadTimestamp
        ).length;
        setUnreadOrdersCount(unread);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    return () => unsubOrders();
  }, [currentUser, isAdmin, currentSellerId, lastReadTimestamp]);

  const markOrdersAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTimestamp(now);
    localStorage.setItem('lastReadOrders', now.toString());
    setUnreadOrdersCount(0);
  }, []);

  const addProduct = useCallback(async (p: Product) => {
    try {
      await setDoc(doc(db, 'products', p.id), stripUndefined(p));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${p.id}`);
    }
  }, []);
  
  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      await updateDoc(doc(db, 'products', id), stripUndefined(updates));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  }, []);
    
  const deleteProduct = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  }, []);

  const addOrder = useCallback(async (o: Order) => {
    try {
      // Extract unique seller IDs from items
      const sellerIds = Array.from(new Set(o.items.map(item => item.sellerId).filter(Boolean)));
      const orderWithSellers = { ...o, sellerIds };
      await setDoc(doc(db, 'orders', o.id), stripUndefined(orderWithSellers));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${o.id}`);
    }
  }, []);
  
  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  }, []);

  const addSeller = useCallback(async (s: Seller) => {
    try {
      await setDoc(doc(db, 'sellers', s.id), s);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `sellers/${s.id}`);
    }
  }, []);
  
  const updateSeller = useCallback(async (id: string, updates: Partial<Seller>) => {
    try {
      await updateDoc(doc(db, 'sellers', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sellers/${id}`);
    }
  }, []);
    
  const deleteSeller = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'sellers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sellers/${id}`);
    }
  }, []);

  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), profile);
      setUserProfile(prev => prev ? { ...prev, ...profile } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  }, [currentUser]);

  return (
    <StoreContext.Provider value={{ 
      products, addProduct, updateProduct, deleteProduct, 
      orders, addOrder, updateOrderStatus,
      sellers, addSeller, updateSeller, deleteSeller,
      currentUser, userProfile, updateUserProfile, isAdmin, currentSellerId,
      unreadOrdersCount, markOrdersAsRead,
      loading
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
