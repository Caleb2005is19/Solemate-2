import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { 
  Product, 
  Order, 
  OrderStatus, 
  Seller, 
  UserProfile, 
  SiteSettings, 
  ThemeSettings, 
  FeatureToggles, 
  ContentBlock, 
  Announcement, 
  ContactMessage, 
  HomepageSection 
} from '../types';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc, query, where, Query, or, orderBy, writeBatch } from 'firebase/firestore';
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
  siteSettings: SiteSettings | null;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  themeSettings: ThemeSettings | null;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => Promise<void>;
  featureToggles: FeatureToggles | null;
  updateFeatureToggles: (toggles: Partial<FeatureToggles>) => Promise<void>;
  contentBlocks: ContentBlock[];
  addContentBlock: (block: ContentBlock) => Promise<void>;
  updateContentBlock: (id: string, block: Partial<ContentBlock>) => Promise<void>;
  deleteContentBlock: (id: string) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (a: Announcement) => Promise<void>;
  updateAnnouncement: (id: string, a: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  contactMessages: ContactMessage[];
  addContactMessage: (msg: ContactMessage) => Promise<void>;
  updateContactMessage: (id: string, updates: Partial<ContactMessage>) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  homepageSections: HomepageSection[];
  addHomepageSection: (section: HomepageSection) => Promise<void>;
  updateHomepageSection: (id: string, updates: Partial<HomepageSection>) => Promise<void>;
  deleteHomepageSection: (id: string) => Promise<void>;
  reorderHomepageSections: (sections: HomepageSection[]) => Promise<void>;
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
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggles | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
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

    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (snapshot) => {
      if (snapshot.exists()) setSiteSettings(snapshot.data() as SiteSettings);
    }, (error) => {
      console.warn('Silent fallback for site settings subscription:', error.message);
    });

    const unsubTheme = onSnapshot(doc(db, 'settings', 'theme'), (snapshot) => {
      if (snapshot.exists()) setThemeSettings(snapshot.data() as ThemeSettings);
    }, (error) => {
      console.warn('Silent fallback for theme settings subscription:', error.message);
    });

    const unsubFeatures = onSnapshot(doc(db, 'settings', 'features'), (snapshot) => {
      if (snapshot.exists()) setFeatureToggles(snapshot.data() as FeatureToggles);
    }, (error) => {
      console.warn('Silent fallback for feature toggles subscription:', error.message);
    });

    const unsubContent = onSnapshot(collection(db, 'content_blocks'), (snapshot) => {
      const blocks: ContentBlock[] = [];
      snapshot.forEach(doc => blocks.push({ id: doc.id, ...doc.data() } as ContentBlock));
      setContentBlocks(blocks);
    }, (error) => {
      console.warn('Silent fallback for content blocks subscription:', error.message);
    });

    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const anns: Announcement[] = [];
      snapshot.forEach(doc => anns.push({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(anns);
    }, (error) => {
      console.warn('Silent fallback for announcements subscription:', error.message);
    });

    const unsubHomepage = onSnapshot(query(collection(db, 'homepage_sections'), orderBy('order', 'asc')), (snapshot) => {
      const sections: HomepageSection[] = [];
      snapshot.forEach(doc => sections.push({ id: doc.id, ...doc.data() } as HomepageSection));
      setHomepageSections(sections);
    }, (error) => {
      console.warn('Silent fallback for homepage sections subscription:', error.message);
    });

    return () => {
      unsubProducts();
      unsubSellers();
      unsubSite();
      unsubTheme();
      unsubFeatures();
      unsubContent();
      unsubAnnouncements();
      unsubHomepage();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!isAdmin) {
      setContactMessages([]);
      return;
    }

    const unsubMessages = onSnapshot(collection(db, 'contact_messages'), (snapshot) => {
      const msgs: ContactMessage[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as ContactMessage));
      msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setContactMessages(msgs);
    }, (error) => {
      console.warn('Silent fallback for contact_messages subscription error:', error);
    });

    return () => {
      unsubMessages();
    };
  }, [currentUser, isAdmin]);

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

  const updateSiteSettings = useCallback(async (updates: Partial<SiteSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'site'), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/site');
    }
  }, []);

  const updateThemeSettings = useCallback(async (updates: Partial<ThemeSettings>) => {
    try {
      await setDoc(doc(db, 'settings', 'theme'), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/theme');
    }
  }, []);

  const updateFeatureToggles = useCallback(async (updates: Partial<FeatureToggles>) => {
    try {
      await setDoc(doc(db, 'settings', 'features'), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/features');
    }
  }, []);

  const addContentBlock = useCallback(async (block: ContentBlock) => {
    try {
      await setDoc(doc(db, 'content_blocks', block.id), block);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `content_blocks/${block.id}`);
    }
  }, []);

  const updateContentBlock = useCallback(async (id: string, updates: Partial<ContentBlock>) => {
    try {
      await updateDoc(doc(db, 'content_blocks', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `content_blocks/${id}`);
    }
  }, []);

  const deleteContentBlock = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'content_blocks', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `content_blocks/${id}`);
    }
  }, []);

  const addAnnouncement = useCallback(async (a: Announcement) => {
    try {
      await setDoc(doc(db, 'announcements', a.id), a);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `announcements/${a.id}`);
    }
  }, []);

  const updateAnnouncement = useCallback(async (id: string, updates: Partial<Announcement>) => {
    try {
      await updateDoc(doc(db, 'announcements', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `announcements/${id}`);
    }
  }, []);

  const deleteAnnouncement = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    }
  }, []);

  const addContactMessage = useCallback(async (msg: ContactMessage) => {
    try {
      await setDoc(doc(db, 'contact_messages', msg.id), msg);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `contact_messages/${msg.id}`);
    }
  }, []);

  const updateContactMessage = useCallback(async (id: string, updates: Partial<ContactMessage>) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `contact_messages/${id}`);
    }
  }, []);

  const deleteContactMessage = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contact_messages/${id}`);
    }
  }, []);

  const addHomepageSection = useCallback(async (section: HomepageSection) => {
    try {
      await setDoc(doc(db, 'homepage_sections', section.id), section);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `homepage_sections/${section.id}`);
    }
  }, []);

  const updateHomepageSection = useCallback(async (id: string, updates: Partial<HomepageSection>) => {
    try {
      await updateDoc(doc(db, 'homepage_sections', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `homepage_sections/${id}`);
    }
  }, []);

  const deleteHomepageSection = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, 'homepage_sections', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `homepage_sections/${id}`);
    }
  }, []);

  const reorderHomepageSections = useCallback(async (sections: HomepageSection[]) => {
    try {
      const batch = writeBatch(db);
      sections.forEach((section, index) => {
        batch.update(doc(db, 'homepage_sections', section.id), { order: index });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'homepage_sections_reorder');
    }
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
      loading,
      siteSettings, updateSiteSettings,
      themeSettings, updateThemeSettings,
      featureToggles, updateFeatureToggles,
      contentBlocks, addContentBlock, updateContentBlock, deleteContentBlock,
      announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
      contactMessages, addContactMessage, updateContactMessage, deleteContactMessage,
      homepageSections, addHomepageSection, updateHomepageSection, deleteHomepageSection, reorderHomepageSections
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
