import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Clock, Ticket, Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function calculateTimeLeft(endDateStr?: string) {
  if (!endDateStr) return null;
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { hours, minutes, seconds };
}

export function StickyPromoBanner() {
  const { promoCampaigns } = useStore();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('solemate_promo_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);

  // Find active campaign for top-banner or all
  const activePromo = promoCampaigns.find(p => {
    if (!p.active) return false;
    if (p.placement !== 'all' && p.placement !== 'top-banner') return false;
    if (p.endDate && new Date(p.endDate).getTime() < Date.now()) return false;
    return true;
  });

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(activePromo?.endDate));

  useEffect(() => {
    if (!activePromo?.countdown || !activePromo?.endDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(activePromo.endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [activePromo]);

  if (!activePromo || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('solemate_promo_banner_dismissed', 'true');
    } catch {}
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePromo.couponCode) {
      navigator.clipboard.writeText(activePromo.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-zinc-950 text-white border-b border-zinc-800 text-xs px-4 py-2 relative z-50 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left / Center content */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            {activePromo.badgeText && (
              <span className="px-2 py-0.5 bg-orange-500 text-white font-black text-[10px] tracking-wider rounded uppercase">
                {activePromo.badgeText}
              </span>
            )}
            <span className="font-bold tracking-tight truncate text-white">
              {activePromo.title}
            </span>
          </div>

          {activePromo.countdown && timeLeft && (
            <div className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-orange-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 tabular-nums shrink-0">
              <Clock className="w-3 h-3" />
              <span>
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}

          {activePromo.couponCode && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] font-mono cursor-pointer transition-colors shrink-0"
              title="Click to copy voucher code"
            >
              <Ticket className="w-3 h-3 text-orange-400" />
              <span>{activePromo.couponCode}</span>
              <span className="text-[10px] text-zinc-400">({copied ? 'Copied!' : 'Copy'})</span>
            </button>
          )}

          <Link
            to={activePromo.link || '/shop'}
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 hover:underline shrink-0"
          >
            <span>{activePromo.ctaText || 'Shop Now'}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
