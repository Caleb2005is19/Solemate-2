import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  X, 
  Package, 
  DollarSign, 
  SlidersHorizontal, 
  AlertCircle, 
  Trash2, 
  Smartphone,
  CheckCircle2,
  Volume2,
  VolumeX,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import type { AppNotification } from '../services/types';

function formatTimeAgo(timestamp: string): string {
  const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function getNotificationIcon(type: AppNotification['type']) {
  switch (type) {
    case 'order':
      return <Package className="w-4 h-4 text-emerald-700" />;
    case 'payment':
      return <DollarSign className="w-4 h-4 text-orange-600" />;
    case 'settings':
      return <SlidersHorizontal className="w-4 h-4 text-zinc-700" />;
    case 'inventory':
      return <AlertCircle className="w-4 h-4 text-amber-700" />;
    default:
      return <Bell className="w-4 h-4 text-zinc-700" />;
  }
}

/**
 * Floating real-time toast alert dock.
 * Rendered globally so order and status changes pop up smoothly.
 */
export function NotificationToastDock() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 pointer-events-none"
      aria-live="polite"
      role="region"
      aria-label="Notification alerts"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-white rounded-xl shadow-lg border border-zinc-200/90 p-3.5 flex items-start gap-3 pointer-events-auto"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200/60">
              {getNotificationIcon(toast.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className="text-xs font-semibold text-zinc-950 truncate">
                  {toast.title}
                </h4>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-zinc-600 leading-snug line-clamp-2">
                {toast.message}
              </p>
              {toast.link && (
                <Link
                  to={toast.link}
                  onClick={() => dismissToast(toast.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline mt-1.5"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export interface HamburgerNotificationTabProps {
  onCloseMenu?: () => void;
  defaultOpen?: boolean;
}

/**
 * First-class Notification Tab embedded directly inside the Hamburger Menu.
 */
export function HamburgerNotificationTab({ onCloseMenu, defaultOpen = false }: HamburgerNotificationTabProps) {
  const { 
    notifications, 
    unreadCount, 
    permissionStatus, 
    soundEnabled,
    toggleSound,
    markAsRead, 
    markAllAsRead, 
    clearAll, 
    requestBrowserPermission 
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeCategory, setActiveCategory] = useState<'all' | 'order' | 'payment' | 'settings'>('all');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const handleEnablePush = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRequestingPermission(true);
    try {
      await requestBrowserPermission();
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const filteredList = notifications.filter(n => {
    if (activeCategory === 'all') return true;
    return n.type === activeCategory;
  });

  return (
    <div className="w-full border-b border-zinc-200/80 pb-2 mb-2">
      {/* Accordion Header / Tab Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
          isOpen ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'hover:bg-zinc-50 text-zinc-800 font-medium'
        }`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-5 h-5 text-zinc-700" />
            {unreadCount > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-sm">Notifications</span>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="text-xs font-semibold text-orange-600 tabular-nums">
              {unreadCount} unread
            </span>
          ) : (
            <span className="text-xs text-zinc-400 font-normal">All caught up</span>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2 bg-zinc-50/70 rounded-xl border border-zinc-200/70"
          >
            {/* Header controls inside tab */}
            <div className="px-3.5 py-2.5 border-b border-zinc-200/60 flex items-center justify-between bg-white">
              <span className="text-xs text-zinc-500">
                {notifications.length} total notification{notifications.length === 1 ? '' : 's'}
              </span>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors cursor-pointer hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Browser push opt-in if not enabled */}
            {permissionStatus !== 'granted' && (
              <div className="px-3.5 py-2 bg-amber-50/60 border-b border-amber-200/40 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Smartphone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-[11px] leading-tight">Enable device alerts for delivery updates</span>
                </div>
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isRequestingPermission}
                  className="font-semibold text-orange-600 hover:text-orange-700 text-[11px] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isRequestingPermission ? '...' : 'Turn on'}
                </button>
              </div>
            )}

            {/* Category Segment Tabs */}
            <div className="px-3 py-2 border-b border-zinc-200/60 bg-zinc-100/50 flex items-center gap-1 overflow-x-auto scrollbar-none">
              {(['all', 'order', 'payment', 'settings'] as const).map(cat => {
                const label = cat === 'all' 
                  ? 'All' 
                  : cat === 'order' 
                  ? 'Orders' 
                  : cat === 'payment' 
                  ? 'Payments' 
                  : 'Settings';
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      active 
                        ? 'bg-white text-zinc-900 font-semibold shadow-xs border border-zinc-200/80' 
                        : 'text-zinc-600 hover:text-zinc-900 font-medium'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Notification items */}
            <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200/40 bg-white">
              {filteredList.length === 0 ? (
                <div className="py-8 px-4 text-center space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-zinc-300 mx-auto stroke-1" />
                  <p className="text-xs font-semibold text-zinc-800">You're all caught up</p>
                  <p className="text-[11px] text-zinc-400">
                    Real-time order progress and updates will show up here.
                  </p>
                </div>
              ) : (
                filteredList.map(item => (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={`p-3 flex items-start gap-2.5 transition-colors cursor-pointer text-left ${
                      !item.read ? 'bg-orange-50/30 hover:bg-orange-50/50' : 'hover:bg-zinc-50'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200/60">
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h4 className="text-xs font-semibold text-zinc-900 truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-normal shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600 leading-normal">
                        {item.message}
                      </p>

                      {item.link && (
                        <Link
                          to={item.link}
                          onClick={() => {
                            markAsRead(item.id);
                            onCloseMenu?.();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline mt-1"
                        >
                          <span>View details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    {!item.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" aria-hidden="true" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Utility footer */}
            <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-200/60 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleSound}
                className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                title={soundEnabled ? 'Chime sound enabled (click to mute)' : 'Chime sound muted (click to enable)'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Chime: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Chime: Muted</span>
                  </>
                )}
              </button>

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Clear notification history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Default NotificationCenter wrapper:
 * Keeps backward compatibility while providing HamburgerNotificationTab and NotificationToastDock.
 */
export function NotificationCenter({ variant = 'hamburger', onCloseMenu }: { variant?: 'hamburger' | 'navbar'; onCloseMenu?: () => void }) {
  if (variant === 'hamburger') {
    return <HamburgerNotificationTab onCloseMenu={onCloseMenu} />;
  }

  // Fallback for navbar placement if ever needed
  return (
    <>
      <HamburgerNotificationTab onCloseMenu={onCloseMenu} />
      <NotificationToastDock />
    </>
  );
}
