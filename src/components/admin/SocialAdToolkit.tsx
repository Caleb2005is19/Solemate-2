import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Instagram, 
  Sparkles, 
  Link2, 
  ExternalLink, 
  Send,
  Ticket,
  Smartphone,
  Globe,
  Flame,
  Zap
} from 'lucide-react';
import { formatPrice } from '../../utils';

export function SocialAdToolkit() {
  const { products, promoCampaigns, siteSettings } = useStore();

  // Campaign builder state
  const [targetType, setTargetType] = useState<'home' | 'shop' | 'men' | 'women' | 'product'>('shop');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'instagram' | 'tiktok' | 'facebook' | 'google'>('whatsapp');
  const [campaignName, setCampaignName] = useState('weekend_flash');
  const [attachedCoupon, setAttachedCoupon] = useState('AIR20');
  const [discountValue, setDiscountValue] = useState('20%');

  // Copy success states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Derive base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://solemate.co.ke';

  // Construct target link path
  const targetPath = useMemo(() => {
    switch (targetType) {
      case 'home':
        return '/';
      case 'men':
        return '/shop?gender=Men';
      case 'women':
        return '/shop?gender=Women';
      case 'product':
        return selectedProduct ? `/product/${selectedProduct.id}` : '/shop';
      case 'shop':
      default:
        return '/shop';
    }
  }, [targetType, selectedProduct]);

  // Generate UTM trackable link
  const generatedLink = useMemo(() => {
    const params = new URLSearchParams();
    params.set('utm_source', selectedChannel);
    params.set('utm_medium', selectedChannel === 'whatsapp' ? 'social_broadcast' : selectedChannel === 'google' ? 'cpc' : 'social_ad');
    if (campaignName.trim()) {
      params.set('utm_campaign', campaignName.trim().toLowerCase().replace(/\s+/g, '_'));
    }
    if (attachedCoupon.trim()) {
      params.set('coupon', attachedCoupon.trim().toUpperCase());
    }

    const separator = targetPath.includes('?') ? '&' : '?';
    return `${baseUrl}${targetPath}${separator}${params.toString()}`;
  }, [baseUrl, targetPath, selectedChannel, campaignName, attachedCoupon]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Pre-formatted high-converting copy templates for the Kenyan sneaker audience
  const adCopies = useMemo(() => {
    const productName = selectedProduct ? selectedProduct.name : 'Exclusive Sneakers';
    const priceFormatted = selectedProduct ? formatPrice(selectedProduct.price) : 'KES 5,500';
    const couponStr = attachedCoupon ? `Use voucher code *${attachedCoupon}* for ${discountValue} OFF!` : '';

    return {
      whatsapp: `🔥 *EXCLUSIVE SNEAKER DROP | SOLEMATE KENYA* 🔥\n\n` +
        `Hey Sneakerheads! Fresh drop alert on authentic ${productName}!\n\n` +
        `👟 *Price:* Only ${priceFormatted}\n` +
        `🚚 *Delivery:* Same-day in Nairobi CBD & Westlands\n` +
        `💳 *Payment:* Secure M-Pesa on Delivery / STK push\n` +
        (couponStr ? `🎉 *Special Promo:* ${couponStr}\n\n` : '\n') +
        `👇 *Tap to grab your size before pairs sell out:*\n` +
        `${generatedLink}\n\n` +
        `_Solemate Kenya • Authentic Footwear & Sneakers_`,

      instagram: `FRESH HEAT ALERT 🔥👟 The ${productName} just landed at Solemate Kenya!\n\n` +
        `Grab yours today with seamless M-Pesa checkout & same-day delivery across Nairobi!\n\n` +
        (attachedCoupon ? `Use code "${attachedCoupon}" at checkout to unlock your discount! 💸\n\n` : '') +
        `📍 Tap the link in bio or visit the link below:\n` +
        `${generatedLink}\n\n` +
        `#SolemateKE #SneakersKenya #NairobiStreetwear #KenyaFootwear #SneakerheadKE #AuthenticSneakers`,

      tiktok: `POV: You found authentic sneakers in Nairobi without the insane mall prices 🤯🇰🇪\n\n` +
        `${productName} is in stock at Solemate Kenya!\n` +
        `Same day delivery in Nairobi CBD & fast doorstep shipping countrywide.\n` +
        (attachedCoupon ? `Discount code: ${attachedCoupon} for ${discountValue} off!\n` : '') +
        `Link in bio to order before your size is out! ⚡`,

      sms: `Solemate KE Alert: Authentic ${productName} available now at ${priceFormatted}! Same-day Nairobi delivery + M-Pesa. ${couponStr ? `Use code ${attachedCoupon} for discount. ` : ''}Shop: ${generatedLink}`
    };
  }, [selectedProduct, attachedCoupon, discountValue, generatedLink]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 text-white p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold mb-3 border border-orange-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Social Ads & Campaign Growth Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Turn Social Media into Guaranteed Sneaker Orders
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Generate trackable links with UTM tags, create ready-to-post Kenyan sneaker ad copy, and broadcast directly to WhatsApp status and customer groups in one tap.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <Share2 className="w-80 h-80 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Link & Campaign Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
              <Link2 className="w-4 h-4 text-orange-500" />
              1. Campaign Destination & Channel
            </h3>

            {/* Target Destination */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Destination Page
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'shop', label: 'All Shop' },
                  { id: 'men', label: "Men's" },
                  { id: 'women', label: "Women's" },
                  { id: 'home', label: 'Homepage' },
                  { id: 'product', label: 'Product' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTargetType(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl font-medium transition-all text-center cursor-pointer ${
                      targetType === item.id
                        ? 'bg-zinc-900 text-white shadow-xs font-semibold'
                        : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200/70'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Picker if 'product' is selected */}
            {targetType === 'product' && products.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Select Featured Sneaker
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Channel Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Target Ad Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
                  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
                  { id: 'tiktok', label: 'TikTok', icon: Smartphone, color: 'text-zinc-900' },
                  { id: 'facebook', label: 'Facebook', icon: Globe, color: 'text-blue-600' },
                  { id: 'google', label: 'Google Ads', icon: Zap, color: 'text-amber-600' },
                ].map(ch => {
                  const Icon = ch.icon;
                  const active = selectedChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannel(ch.id as any)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'border-orange-500 bg-orange-50/40 text-zinc-950 font-bold shadow-xs'
                          : 'border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${ch.color}`} />
                      <span className="text-[11px]">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Parameters */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. weekend_flash"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Auto-Apply Coupon
                </label>
                <input
                  type="text"
                  value={attachedCoupon}
                  onChange={(e) => setAttachedCoupon(e.target.value.toUpperCase())}
                  placeholder="e.g. AIR20"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-orange-600 focus:outline-hidden focus:ring-2 focus:ring-orange-500 uppercase"
                />
              </div>
            </div>

            {/* Generated Smart Link Output */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 flex items-center justify-between">
                <span>Generated Trackable URL</span>
                <span className="text-[10px] text-zinc-400 font-normal">Auto-applies UTM & coupon</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 px-3 py-2 bg-zinc-100 border border-zinc-200/90 rounded-xl text-xs font-mono text-zinc-800 truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedLink, 'smart-link')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    copiedField === 'smart-link'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {copiedField === 'smart-link' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Ready-to-Post Copy Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  2. Ready-to-Post Ad Copy & Broadcasts
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Optimized for high CTR with the Kenyan streetwear audience.
                </p>
              </div>
            </div>

            {/* Template Tabs */}
            <div className="space-y-4">
              {/* WhatsApp Broadcast Card */}
              <div className="border border-emerald-200/80 bg-emerald-50/20 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      WhatsApp Broadcast / Status Post
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(adCopies.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Open in WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(adCopies.whatsapp, 'whatsapp-copy')}
                      className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedField === 'whatsapp-copy' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <pre className="p-3 bg-white rounded-xl text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed border border-emerald-100/80 max-h-44 overflow-y-auto">
                  {adCopies.whatsapp}
                </pre>
              </div>

              {/* Instagram / Facebook Caption Card */}
              <div className="border border-zinc-200/80 bg-zinc-50/40 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Instagram / Facebook Caption & Ad Text
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(adCopies.instagram, 'ig-copy')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedField === 'ig-copy' ? 'Copied!' : 'Copy Caption'}
                  </button>
                </div>
                <pre className="p-3 bg-white rounded-xl text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed border border-zinc-200/60 max-h-36 overflow-y-auto">
                  {adCopies.instagram}
                </pre>
              </div>

              {/* TikTok Video Script Hook */}
              <div className="border border-zinc-200/80 bg-zinc-50/40 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-zinc-900" />
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      TikTok Hook & Video Description
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(adCopies.tiktok, 'tiktok-copy')}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedField === 'tiktok-copy' ? 'Copied!' : 'Copy TikTok Hook'}
                  </button>
                </div>
                <pre className="p-3 bg-white rounded-xl text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed border border-zinc-200/60 max-h-32 overflow-y-auto">
                  {adCopies.tiktok}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
