import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useStore } from './StoreContext';
import { AppNotification } from '../services/types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  toasts: AppNotification[];
  permissionStatus: NotificationPermission;
  soundEnabled: boolean;
  toggleSound: () => void;
  notify: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: (id: string) => void;
  requestBrowserPermission: () => Promise<boolean>;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'solemate_app_notifications_v2';
const SOUND_STORAGE_KEY = 'solemate_notification_sound_enabled';

// Pleasant, clean synthesized chime using Web Audio API (zero external sound file dependencies)
function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    
    // Crisp two-tone chime (F5 -> A5)
    osc.frequency.setValueAtTime(698.46, now); // F5
    osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08); // A5
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Gracefully ignore audio errors (e.g. user hasn't interacted with page yet)
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin, orders } = useStore();
  
  // Persistent notifications state
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored notifications:', e);
    }
    // Default initial notification
    return [
      {
        id: 'welcome-solemate',
        recipient: 'all',
        title: 'Welcome to Solemate Kenya',
        message: 'Your portal for authentic sneakers, tracked deliveries, and store updates.',
        type: 'general',
        timestamp: new Date().toISOString(),
        read: false,
        link: '/shop'
      }
    ];
  });

  // Sound preference state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      return stored !== null ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  }, []);

  // Ephemeral floating toast queue
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  // Browser Web Notification Permission
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  // Save to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allNotifications));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  }, [allNotifications]);

  // Request native browser/device notification permission
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Web notifications are not supported in this browser environment.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        try {
          new Notification('Solemate Alerts Enabled', {
            body: 'You will receive real-time order tracking and store notifications.',
            icon: '/favicon.ico',
          });
        } catch (_) {}
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  // Dispatch a notification
  const notify = useCallback((item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setAllNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep latest 50

    // Add to toast queue
    setToasts(prev => [newNotification, ...prev.slice(0, 2)]); // Keep at most 3 visible toasts

    // Play subtle chime if enabled
    if (soundEnabled) {
      playNotificationChime();
    }

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newNotification.id));
    }, 6000);

    // Trigger Native Browser / Device Notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
        });
        if (newNotification.link) {
          nativeNotif.onclick = () => {
            window.focus();
            window.location.href = newNotification.link!;
          };
        }
      } catch (err) {
        console.warn('Native notification trigger failed:', err);
      }
    }
  }, [soundEnabled]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setAllNotifications([]);
  }, []);

  // Send interactive test notification to let user immediately verify it works
  const sendTestNotification = useCallback(() => {
    notify({
      recipient: 'all',
      title: 'Solemate Order Tracking Active',
      message: 'Real-time updates are functioning. You will be alerted whenever orders or settings change.',
      type: 'order',
      link: '/profile?tab=orders'
    });
  }, [notify]);

  // Live order diffing & automatic notifications for orders
  const prevOrdersRef = useRef<Map<string, { status: string; paymentStatus?: string }>>(new Map());
  const initializedOrdersRef = useRef(false);

  useEffect(() => {
    if (!orders || orders.length === 0) return;

    if (!initializedOrdersRef.current) {
      // First snapshot: index existing orders without triggering alerts
      orders.forEach(o => {
        prevOrdersRef.current.set(o.id, { status: o.status, paymentStatus: o.paymentStatus });
      });
      initializedOrdersRef.current = true;
      return;
    }

    // On subsequent updates, find differences
    orders.forEach(o => {
      const prev = prevOrdersRef.current.get(o.id);
      
      if (!prev) {
        // New order placed!
        const isMyOrder = currentUser && (o.userId === currentUser.uid || o.customerInfo?.email?.toLowerCase() === currentUser.email?.toLowerCase());
        
        if (isAdmin) {
          notify({
            recipient: 'admin',
            title: 'New Customer Order',
            message: `Order #${o.id.slice(-6)} received for KES ${Math.round(o.total).toLocaleString()} from ${o.customerInfo?.firstName || 'Customer'}.`,
            type: 'order',
            link: '/admin'
          });
        }
        
        if (isMyOrder) {
          notify({
            recipient: 'customer',
            userId: o.userId,
            title: 'Order Confirmed',
            message: `Your order #${o.id.slice(-6)} has been placed and is currently pending fulfillment.`,
            type: 'order',
            link: '/profile?tab=orders'
          });
        }
      } else {
        // Status change
        if (prev.status !== o.status) {
          const isMyOrder = currentUser && (o.userId === currentUser.uid || o.customerInfo?.email?.toLowerCase() === currentUser.email?.toLowerCase());
          
          if (isAdmin) {
            notify({
              recipient: 'admin',
              title: `Order #${o.id.slice(-6)} Updated`,
              message: `Status changed from ${prev.status} to ${o.status}.`,
              type: 'order',
              link: '/admin'
            });
          }
          
          if (isMyOrder) {
            notify({
              recipient: 'customer',
              userId: o.userId,
              title: `Order Status: ${o.status}`,
              message: `Your order #${o.id.slice(-6)} is now ${o.status.toLowerCase()}.`,
              type: 'order',
              link: '/profile?tab=orders'
            });
          }
        }

        // Payment status change
        if (prev.paymentStatus !== o.paymentStatus && o.paymentStatus === 'Paid') {
          notify({
            recipient: 'all',
            title: 'Payment Received',
            message: `M-Pesa payment confirmed for Order #${o.id.slice(-6)} (KES ${Math.round(o.total).toLocaleString()}).`,
            type: 'payment',
            link: isAdmin ? '/admin' : '/profile?tab=orders'
          });
        }
      }

      // Update ref
      prevOrdersRef.current.set(o.id, { status: o.status, paymentStatus: o.paymentStatus });
    });
  }, [orders, isAdmin, currentUser, notify]);

  // Filter notifications appropriate for current viewer (Admin vs Customer)
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(n => {
      if (isAdmin) {
        // Admin sees admin alerts and store-wide alerts
        return n.recipient === 'admin' || n.recipient === 'all' || !n.userId;
      }
      
      // Customer sees alerts targeting 'customer' or 'all'
      if (n.recipient === 'admin') return false;
      if (n.userId && currentUser?.uid && n.userId !== currentUser.uid) return false;
      return true;
    });
  }, [allNotifications, isAdmin, currentUser]);

  const unreadCount = useMemo(() => {
    return filteredNotifications.filter(n => !n.read).length;
  }, [filteredNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: filteredNotifications,
        unreadCount,
        toasts,
        permissionStatus,
        soundEnabled,
        toggleSound,
        notify,
        markAsRead,
        markAllAsRead,
        clearAll,
        dismissToast,
        requestBrowserPermission,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
