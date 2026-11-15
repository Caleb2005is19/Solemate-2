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

const LEGACY_STORAGE_KEY = 'solemate_app_notifications_v2';
const STORAGE_KEY = 'solemate_app_notifications_v3';
const SEEN_ORDERS_STORAGE_KEY = 'solemate_notif_seen_order_events_v1';
const SOUND_STORAGE_KEY = 'solemate_notification_sound_enabled';

// Max age (15 minutes) for an order to trigger a brand-new order notification on snapshot arrival
const NEW_ORDER_RECENCY_MS = 15 * 60 * 1000;

function loadSeenOrderEvents(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveSeenOrderEvents(map: Record<string, number>) {
  try {
    const entries = Object.entries(map);
    // Keep only the latest 600 keys so localStorage stays lean
    const pruned =
      entries.length > 600
        ? Object.fromEntries(entries.sort((a, b) => b[1] - a[1]).slice(0, 600))
        : map;
    localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(pruned));
  } catch {}
}

function loadInitialNotifications(): AppNotification[] {
  try {
    const v3 = localStorage.getItem(STORAGE_KEY);
    if (v3) {
      const parsed = JSON.parse(v3);
      if (Array.isArray(parsed)) return parsed;
    }

    // One-time migration from v2: deduplicate repeated order alerts and mark stale pre-fix order/payment alerts read
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        const seenSignatures = new Set<string>();
        const cleaned: AppNotification[] = [];
        for (const item of parsed) {
          if (!item || typeof item !== 'object') continue;
          const sig = `${item.type}|${item.title}|${item.message}`;
          if (seenSignatures.has(sig)) continue;
          seenSignatures.add(sig);
          cleaned.push({
            ...item,
            read: item.type === 'order' || item.type === 'payment' ? true : Boolean(item.read)
          });
        }
        const trimmed = cleaned.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return trimmed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored notifications:', e);
  }

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
}

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
  const { currentUser, isAdmin, authResolved, orders } = useStore();

  // Persistent notifications state
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(loadInitialNotifications);

  // Persistent seen order-event registry so old/read orders never re-trigger
  const seenOrderEventsRef = useRef<Record<string, number>>(loadSeenOrderEvents());

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

  const persistNotifications = useCallback((list: AppNotification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  }, []);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    persistNotifications(allNotifications);
  }, [allNotifications, persistNotifications]);

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

    setAllNotifications(prev => {
      const next = [newNotification, ...prev.slice(0, 49)];
      persistNotifications(next);
      return next;
    });

    // Add to toast queue
    setToasts(prev => [newNotification, ...prev.slice(0, 2)]);

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
  }, [soundEnabled, persistNotifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const acknowledgeCurrentOrders = useCallback(() => {
    const now = Date.now();
    let changed = false;
    orders.forEach(o => {
      const keys = [`new:${o.id}`, `status:${o.id}:${o.status}`];
      if (o.paymentStatus === 'Paid') keys.push(`paid:${o.id}`);
      keys.forEach(k => {
        if (!seenOrderEventsRef.current[k]) {
          seenOrderEventsRef.current[k] = now;
          changed = true;
        }
      });
    });
    if (changed) {
      saveSeenOrderEvents(seenOrderEventsRef.current);
    }
  }, [orders]);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persistNotifications(next);
      return next;
    });
  }, [persistNotifications]);

  const markAllAsRead = useCallback(() => {
    acknowledgeCurrentOrders();
    setAllNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      persistNotifications(next);
      return next;
    });
  }, [acknowledgeCurrentOrders, persistNotifications]);

  const clearAll = useCallback(() => {
    acknowledgeCurrentOrders();
    setAllNotifications([]);
    persistNotifications([]);
  }, [acknowledgeCurrentOrders, persistNotifications]);

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

  // Live order diffing & automatic notifications for genuinely new orders/changes
  const prevOrdersRef = useRef<Map<string, { status: string; paymentStatus?: string }>>(new Map());
  const initializedScopeRef = useRef<string | null>(null);
  const currentScopeKey = `${currentUser?.uid || 'guest'}:${isAdmin ? 'admin' : 'user'}`;

  // Reset baseline whenever the user or role scope changes
  useEffect(() => {
    prevOrdersRef.current.clear();
    initializedScopeRef.current = null;
  }, [currentScopeKey]);

  useEffect(() => {
    if (!authResolved || !currentUser || !orders || orders.length === 0) return;

    const now = Date.now();
    let seenMapDirty = false;

    const markSeen = (key: string): boolean => {
      if (seenOrderEventsRef.current[key]) return false;
      seenOrderEventsRef.current[key] = now;
      seenMapDirty = true;
      return true;
    };

    // First snapshot for this user+role scope: silently index all existing orders as baseline
    if (initializedScopeRef.current !== currentScopeKey) {
      orders.forEach(o => {
        prevOrdersRef.current.set(o.id, { status: o.status, paymentStatus: o.paymentStatus });
        markSeen(`new:${o.id}`);
        markSeen(`status:${o.id}:${o.status}`);
        if (o.paymentStatus === 'Paid') {
          markSeen(`paid:${o.id}`);
        }
      });
      if (seenMapDirty) saveSeenOrderEvents(seenOrderEventsRef.current);
      initializedScopeRef.current = currentScopeKey;
      return;
    }

    // Subsequent live snapshots while user is actively viewing the app
    orders.forEach(o => {
      // Skip synthetic stress-test orders
      if (o.userId === 'stress-test-user' || o.id?.startsWith('stress-')) {
        prevOrdersRef.current.set(o.id, { status: o.status, paymentStatus: o.paymentStatus });
        return;
      }

      const prev = prevOrdersRef.current.get(o.id);
      const isMyOrder =
        o.userId === currentUser.uid ||
        o.customerInfo?.email?.toLowerCase() === currentUser.email?.toLowerCase();

      if (!prev) {
        const orderEpoch = new Date(o.date).getTime();
        const isOldHistoricalOrder = !Number.isNaN(orderEpoch) && now - orderEpoch > NEW_ORDER_RECENCY_MS;
        const shouldNotifyNew = markSeen(`new:${o.id}`) && !isOldHistoricalOrder;

        // Also record current status & payment as seen so initial state doesn't double-fire
        markSeen(`status:${o.id}:${o.status}`);
        if (o.paymentStatus === 'Paid') markSeen(`paid:${o.id}`);

        if (shouldNotifyNew) {
          if (isAdmin) {
            notify({
              recipient: 'admin',
              title: 'New Customer Order',
              message: `Order #${o.id.slice(-6)} received for KES ${Math.round(o.total).toLocaleString()} from ${o.customerInfo?.firstName || 'Customer'}.`,
              type: 'order',
              link: '/admin',
              metadata: { orderId: o.id }
            });
          }

          if (isMyOrder) {
            notify({
              recipient: 'customer',
              userId: o.userId,
              title: 'Order Confirmed',
              message: `Your order #${o.id.slice(-6)} has been placed and is currently pending fulfillment.`,
              type: 'order',
              link: '/profile?tab=orders',
              metadata: { orderId: o.id }
            });
          }
        }
      } else {
        // Status change
        if (prev.status !== o.status && markSeen(`status:${o.id}:${o.status}`)) {
          if (isAdmin) {
            notify({
              recipient: 'admin',
              title: `Order #${o.id.slice(-6)} Updated`,
              message: `Status changed from ${prev.status} to ${o.status}.`,
              type: 'order',
              link: '/admin',
              metadata: { orderId: o.id }
            });
          }

          if (isMyOrder) {
            notify({
              recipient: 'customer',
              userId: o.userId,
              title: `Order Status: ${o.status}`,
              message: `Your order #${o.id.slice(-6)} is now ${o.status.toLowerCase()}.`,
              type: 'order',
              link: '/profile?tab=orders',
              metadata: { orderId: o.id }
            });
          }
        }

        // Payment status change
        if (
          prev.paymentStatus !== o.paymentStatus &&
          o.paymentStatus === 'Paid' &&
          markSeen(`paid:${o.id}`)
        ) {
          notify({
            recipient: 'all',
            title: 'Payment Received',
            message: `M-Pesa payment confirmed for Order #${o.id.slice(-6)} (KES ${Math.round(o.total).toLocaleString()}).`,
            type: 'payment',
            link: isAdmin ? '/admin' : '/profile?tab=orders',
            metadata: { orderId: o.id }
          });
        }
      }

      prevOrdersRef.current.set(o.id, { status: o.status, paymentStatus: o.paymentStatus });
    });

    if (seenMapDirty) {
      saveSeenOrderEvents(seenOrderEventsRef.current);
    }
  }, [authResolved, orders, isAdmin, currentUser, currentScopeKey, notify]);

  // Filter notifications appropriate for current viewer (Admin vs Customer)
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter(n => {
      if (isAdmin) {
        return n.recipient === 'admin' || n.recipient === 'all' || !n.userId;
      }

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
