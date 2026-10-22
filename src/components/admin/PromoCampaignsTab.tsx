import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  Megaphone, 
  Plus, 
  Sparkles, 
  Calendar, 
  Clock, 
  Share2, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  Eye, 
  MousePointerClick, 
  LayoutGrid, 
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Zap,
  Ticket,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import { PromoCampaign } from '../../types';
import { SocialAdToolkit } from './SocialAdToolkit';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export function PromoCampaignsTab() {
  const { promoCampaigns, addPromoCampaign, updatePromoCampaign, deletePromoCampaign } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'social-toolkit'>('campaigns');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCampaign | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<PromoCampaign>>({
    title: '',
    subtitle: '',
    badgeText: '20% OFF',
    placement: 'all',
    couponCode: '',
    discountPercentage: 20,
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
    link: '/shop',
    ctaText: 'Claim Deal',
    active: true,
    countdown: true,
    theme: 'dark',
    endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Quick 1-click Preset Launchers
  const handleLaunchPreset = async (presetType: 'flash-drop' | 'free-delivery' | 'clearance' | 'bundle') => {
    let preset: PromoCampaign;
    const now = Date.now();

    if (presetType === 'flash-drop') {
      preset = {
        id: `promo-flash-${now}`,
        title: 'Flash Sneaker Drop: 20% Off',
        subtitle: 'Limited pairs in Nairobi · Authentic streetwear guaranteed',
        badgeText: 'FLASH 20% OFF',
        placement: 'all',
        couponCode: 'FLASH20',
        discountPercentage: 20,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        link: '/shop',
        ctaText: 'Shop Flash Drop',
        active: true,
        countdown: true,
        endDate: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
        theme: 'dark',
        utmSource: 'flash_drop',
        stats: { views: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      };
    } else if (presetType === 'free-delivery') {
      preset = {
        id: `promo-delivery-${now}`,
        title: 'Free Doorstep Delivery in Nairobi',
        subtitle: 'Zero delivery fee to CBD, Westlands & Kilimani on orders above KES 5,000',
        badgeText: 'FREE SHIPPING',
        placement: 'shop-grid',
        couponCode: 'DELIVERYFREE',
        discountPercentage: 0,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
        link: '/shop',
        ctaText: 'Claim Free Delivery',
        active: true,
        countdown: false,
        theme: 'orange',
        utmSource: 'free_delivery',
        stats: { views: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      };
    } else if (presetType === 'clearance') {
      preset = {
        id: `promo-clearance-${now}`,
        title: 'End of Month Sneaker Clearance',
        subtitle: 'Save up to 30% on selected low tops and runners',
        badgeText: 'UP TO 30% OFF',
        placement: 'all',
        couponCode: 'CLEAR30',
        discountPercentage: 30,
        image: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
        link: '/shop',
        ctaText: 'Shop Clearance',
        active: true,
        countdown: true,
        endDate: new Date(now + 72 * 60 * 60 * 1000).toISOString(),
        theme: 'dark',
        utmSource: 'clearance',
        stats: { views: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      };
    } else {
      preset = {
        id: `promo-bundle-${now}`,
        title: 'Buy 2 Pairs, Get KES 1,000 Off',
        subtitle: 'Upgrade your rotation with the ultimate sneaker bundle deal',
        badgeText: 'BUNDLE SAVER',
        placement: 'homepage-grid',
        couponCode: 'BUNDLE1000',
        discountPercentage: 15,
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
        link: '/shop',
        ctaText: 'Get Bundle',
        active: true,
        countdown: false,
        theme: 'clean',
        utmSource: 'bundle',
        stats: { views: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      };
    }

    await addPromoCampaign(preset);
  };

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      subtitle: '',
      badgeText: '20% OFF',
      placement: 'all',
      couponCode: 'AIR20',
      discountPercentage: 20,
      image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      link: '/shop',
      ctaText: 'Claim Deal',
      active: true,
      countdown: true,
      theme: 'dark',
      endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: PromoCampaign) => {
    setEditingPromo(promo);
    setFormData({
      ...promo,
      endDate: promo.endDate ? new Date(promo.endDate).toISOString().slice(0, 16) : '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    if (editingPromo) {
      await updatePromoCampaign(editingPromo.id, {
        ...formData,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      });
    } else {
      const newCampaign: PromoCampaign = {
        id: `promo-${Date.now()}`,
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || '',
        badgeText: formData.badgeText?.trim() || 'PROMO',
        placement: formData.placement || 'all',
        couponCode: formData.couponCode?.trim().toUpperCase(),
        discountPercentage: Number(formData.discountPercentage) || 0,
        image: formData.image || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
        link: formData.link?.trim() || '/shop',
        ctaText: formData.ctaText?.trim() || 'Shop Now',
        active: formData.active ?? true,
        countdown: formData.countdown ?? true,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        theme: formData.theme || 'dark',
        utmSource: formData.title.toLowerCase().replace(/\s+/g, '_'),
        stats: { views: 0, clicks: 0 },
        createdAt: new Date().toISOString()
      };
      await addPromoCampaign(newCampaign);
    }

    setIsModalOpen(false);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, image: res.secure_url }));
    } catch (err) {
      console.error('Failed to upload promo image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-orange-500" />
            Ad & Promo Engine
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Launch featured grid promo cards, sticky countdown banners, and generate trackable social media ad campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-xs cursor-pointer active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'campaigns'
              ? 'border-orange-500 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Active & Scheduled Promos ({promoCampaigns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('social-toolkit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'social-toolkit'
              ? 'border-orange-500 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Social Media Ad Toolkit & UTM Generator</span>
        </button>
      </div>

      {activeSubTab === 'social-toolkit' ? (
        <SocialAdToolkit />
      ) : (
        <div className="space-y-6">
          {/* 1-Click Quick Presets Bar */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-500" />
                1-Click Promo Presets (Instant Launch)
              </h3>
              <span className="text-[11px] text-zinc-400">Creates fully scheduled promotional cards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleLaunchPreset('flash-drop')}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:border-orange-500/60 bg-zinc-50/50 hover:bg-orange-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    24h Flash Drop (20% Off)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Countdown + code FLASH20</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchPreset('free-delivery')}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:border-orange-500/60 bg-zinc-50/50 hover:bg-orange-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold">
                  🚚
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    Free Nairobi Delivery
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">CBD & Westlands promo banner</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchPreset('clearance')}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:border-orange-500/60 bg-zinc-50/50 hover:bg-orange-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
                  🔥
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    Weekend Clearance (30%)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">72-hour markdown promo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLaunchPreset('bundle')}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-zinc-200 hover:border-orange-500/60 bg-zinc-50/50 hover:bg-orange-50/20 text-left transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                  🎁
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                    Buy 2 Pairs Bundle
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Multi-shoe checkout deal</p>
                </div>
              </button>
            </div>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 text-base">
              Configured Promotional Campaigns ({promoCampaigns.length})
            </h3>

            {promoCampaigns.length === 0 ? (
              <div className="bg-white p-16 rounded-2xl border border-zinc-200 text-center space-y-3">
                <Megaphone className="w-10 h-10 text-zinc-300 mx-auto" />
                <h4 className="font-bold text-zinc-800 text-base">No active promotions yet</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Click Create Campaign above or choose a 1-click preset to start running ads across your storefront.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promoCampaigns.map(promo => {
                  const isExpired = promo.endDate && new Date(promo.endDate).getTime() < Date.now();
                  return (
                    <div 
                      key={promo.id} 
                      className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                        promo.active && !isExpired 
                          ? 'border-zinc-300 shadow-sm' 
                          : 'border-zinc-200 opacity-70 bg-zinc-50/50'
                      }`}
                    >
                      <div>
                        {/* Status bar */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${promo.active && !isExpired ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                            <span className="text-xs font-semibold text-zinc-700">
                              {promo.active && !isExpired ? 'Active & Running' : isExpired ? 'Expired' : 'Paused'}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">
                              {promo.placement}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updatePromoCampaign(promo.id, { active: !promo.active })}
                              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                                promo.active 
                                  ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200' 
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {promo.active ? 'Pause' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(promo)}
                              className="p-1.5 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Edit campaign"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePromoCampaign(promo.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete campaign"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Banner preview card thumbnail */}
                        <div className="relative rounded-xl overflow-hidden mb-3.5 aspect-video bg-zinc-900 flex flex-col justify-end p-4 text-white">
                          {promo.image && (
                            <img
                              src={promo.image}
                              alt={promo.title}
                              className="absolute inset-0 w-full h-full object-cover opacity-60"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                          <div className="relative z-10">
                            {promo.badgeText && (
                              <span className="inline-block px-2 py-0.5 bg-orange-500 text-white font-black text-[10px] rounded-md tracking-wider uppercase mb-1.5">
                                {promo.badgeText}
                              </span>
                            )}
                            <h4 className="text-base font-black tracking-tight text-white leading-tight">
                              {promo.title}
                            </h4>
                            <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
                              {promo.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="space-y-1.5 text-xs text-zinc-600">
                          {promo.couponCode && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <Ticket className="w-3.5 h-3.5 text-orange-500" />
                              <span>Voucher: <strong className="font-mono text-zinc-900">{promo.couponCode}</strong></span>
                              {promo.discountPercentage ? <span>({promo.discountPercentage}% discount)</span> : null}
                            </div>
                          )}

                          {promo.endDate && (
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Ends: {new Date(promo.endDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer stats & action */}
                      <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            {promo.stats?.views || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3.5 h-3.5 text-zinc-400" />
                            {promo.stats?.clicks || 0} clicks
                          </span>
                        </div>
                        <a
                          href={promo.link || '/shop'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline"
                        >
                          <span>Preview on store</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-100">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">
                  {editingPromo ? 'Edit Promotion Campaign' : 'Create New Promotion Campaign'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Set banner details, countdowns, coupon discounts, and display placements.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Headline & Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Campaign Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Weekend Air Jordan Flash Drop"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Subtitle / Offer Details
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g. Exclusive retro editions · Limited stock in Nairobi"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Placement & Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Storefront Placement
                  </label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData(prev => ({ ...prev, placement: e.target.value as any }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">All Surfaces (Grid + Banner)</option>
                    <option value="homepage-grid">Homepage Grid Card</option>
                    <option value="shop-grid">Shop Catalog Grid Card</option>
                    <option value="top-banner">Sticky Top Banner Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => setFormData(prev => ({ ...prev, badgeText: e.target.value }))}
                    placeholder="e.g. 20% OFF, LIMITED DROP"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-orange-600 uppercase focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Coupon code & Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Linked Coupon Code
                  </label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                    placeholder="e.g. AIR20"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 uppercase focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Media Image Upload or URL */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Promo Visual Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="Paste image URL or upload below"
                    className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <label className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors shrink-0">
                    {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Target Link & CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Target Click Link
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    placeholder="/shop or /product/..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="e.g. Shop Retro Drop"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Countdown & End Date */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="countdown-toggle"
                    checked={formData.countdown}
                    onChange={(e) => setFormData(prev => ({ ...prev, countdown: e.target.checked }))}
                    className="w-4 h-4 text-orange-500 rounded border-zinc-300 focus:ring-orange-500 cursor-pointer"
                  />
                  <label htmlFor="countdown-toggle" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                    Enable Countdown Timer
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Campaign End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {editingPromo ? 'Save Changes' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
