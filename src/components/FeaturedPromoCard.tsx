import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Ticket, Check, ArrowRight, Sparkles } from 'lucide-react';
import { PromoCampaign } from '../types';

interface FeaturedPromoCardProps {
  campaign: PromoCampaign;
  className?: string;
}

function calculateTimeLeft(endDateStr?: string) {
  if (!endDateStr) return null;
  const diff = new Date(endDateStr).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function FeaturedPromoCard({ campaign, className = '' }: FeaturedPromoCardProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(campaign.endDate));

  useEffect(() => {
    if (!campaign.countdown || !campaign.endDate) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(campaign.endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [campaign.countdown, campaign.endDate]);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (campaign.couponCode) {
      navigator.clipboard.writeText(campaign.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isDark = campaign.theme !== 'clean';

  return (
    <div 
      className={`group relative rounded-2xl overflow-hidden border transition-all flex flex-col justify-between p-5 min-h-[360px] sm:min-h-[400px] shadow-sm hover:shadow-md ${
        isDark 
          ? 'bg-zinc-950 text-white border-zinc-800' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 text-zinc-900 border-orange-200'
      } ${className}`}
    >
      {/* Background sneaker imagery with subtle gradient overlay */}
      {campaign.image && (
        <img
          src={campaign.image}
          alt={campaign.title}
          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      )}
      <div 
        className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/30' 
            : 'bg-gradient-to-t from-orange-50/95 via-orange-50/75 to-transparent'
        }`} 
      />

      {/* Top Header Badge & Countdown */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        {campaign.badgeText && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white font-black text-[10px] tracking-wider uppercase rounded-md shadow-xs">
            <Sparkles className="w-3 h-3" />
            {campaign.badgeText}
          </span>
        )}

        {campaign.countdown && timeLeft && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white rounded-md text-[11px] font-mono tabular-nums border border-white/10">
            <Clock className="w-3 h-3 text-orange-400" />
            <span>
              {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="relative z-10 mt-auto pt-8 space-y-3">
        <div>
          <h3 className={`text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1.5 ${isDark ? 'text-white' : 'text-zinc-950'}`}>
            {campaign.title}
          </h3>
          <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            {campaign.subtitle}
          </p>
        </div>

        {/* Voucher button if coupon code attached */}
        {campaign.couponCode && (
          <button
            type="button"
            onClick={handleCopyCode}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDark 
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white' 
                : 'bg-white hover:bg-zinc-50 border-orange-200 text-zinc-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-orange-400" />
              <span>Code: <strong className="font-mono text-orange-400">{campaign.couponCode}</strong></span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                'Tap to copy'
              )}
            </span>
          </button>
        )}

        {/* Action Button */}
        <Link
          to={campaign.link || '/shop'}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-98 cursor-pointer ${
            isDark 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-zinc-900 hover:bg-zinc-800 text-white'
          }`}
        >
          <span>{campaign.ctaText || 'Shop Now'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
