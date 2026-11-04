import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  ToggleRight, 
  Star, 
  Ticket, 
  Heart, 
  Store, 
  UserCircle, 
  ShieldAlert, 
  Save, 
  Loader2,
  Wrench,
  Clock,
  Eye,
  CheckCircle2,
  Power,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { FeatureToggles } from '../../types';

export function FeatureTogglesTab() {
  const { featureToggles, updateFeatureToggles } = useStore();
  const [formData, setFormData] = useState<Partial<FeatureToggles>>({
    enableReviews: true,
    enableCoupons: true,
    enableWishlist: true,
    enablePickupStation: true,
    enableGuestCheckout: true,
    maintenanceMode: false,
    maintenanceTitle: 'Upgrades in Progress',
    maintenanceMessage: "We're currently performing scheduled platform maintenance and catalog upgrades. We will be back online shortly!",
    maintenanceEstimatedEnd: 'Within the hour'
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (featureToggles) {
      setFormData(prev => ({
        ...prev,
        ...featureToggles,
        maintenanceTitle: featureToggles.maintenanceTitle || 'Upgrades in Progress',
        maintenanceMessage: featureToggles.maintenanceMessage || "We're currently performing scheduled platform maintenance and catalog upgrades. We will be back online shortly!",
        maintenanceEstimatedEnd: featureToggles.maintenanceEstimatedEnd || ''
      }));
    }
  }, [featureToggles]);

  const handleToggle = async (field: keyof FeatureToggles) => {
    const newValue = !formData[field];
    setFormData(prev => ({ ...prev, [field]: newValue }));
    await updateFeatureToggles({ [field]: newValue });
  };

  const handleSaveMaintenanceDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await updateFeatureToggles({
        maintenanceTitle: formData.maintenanceTitle,
        maintenanceMessage: formData.maintenanceMessage,
        maintenanceEstimatedEnd: formData.maintenanceEstimatedEnd
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save maintenance details:', err);
    } finally {
      setSavingDetails(false);
    }
  };

  const isMaintenanceOn = formData.maintenanceMode === true;

  const standardFeatures = [
    { id: 'enableReviews', name: 'Product Reviews', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', desc: 'Allow customers to leave ratings and comments on products.' },
    { id: 'enableCoupons', name: 'Coupon Codes', icon: Ticket, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Enable coupon discount fields in checkout and cart.' },
    { id: 'enableWishlist', name: 'Wishlist System', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Allow users to save favorite shoes for later.' },
    { id: 'enablePickupStation', name: 'Pickup Stations', icon: Store, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Enable "Collect from Store" option during checkout in Nairobi CBD.' },
    { id: 'enableGuestCheckout', name: 'Guest Checkout', icon: UserCircle, color: 'text-zinc-500', bg: 'bg-zinc-50', desc: 'Allow orders without mandatory account creation.' },
  ] as const;

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">System Controls & Maintenance</h1>
          <p className="text-sm text-zinc-500">Manage platform upgrade states, maintenance mode, and feature switches in real time.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
          <ToggleRight className="w-4 h-4" />
          Live Firestore Sync
        </div>
      </div>

      {/* DEDICATED MAINTENANCE MODE CONTROL CENTER */}
      <div className={`rounded-3xl border transition-all overflow-hidden ${
        isMaintenanceOn 
          ? 'bg-rose-950/20 border-rose-400/50 shadow-xl shadow-rose-500/5' 
          : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isMaintenanceOn ? 'bg-rose-500/10 border-rose-500/20' : 'bg-zinc-50/50 border-zinc-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isMaintenanceOn ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-100 text-zinc-600'}`}>
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-zinc-900">Maintenance Mode for Upgrades</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isMaintenanceOn 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isMaintenanceOn ? 'ACTIVE (STORE LOCKED)' : 'INACTIVE (STORE LIVE)'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isMaintenanceOn
                  ? 'The public storefront is currently locked with the upgrade screen. Only administrators can view the store.'
                  : 'The storefront is open to all visitors. Turn ON when performing mass catalog updates, schema migrations, or theme redesigns.'}
              </p>
            </div>
          </div>

          {/* Big Master Toggle Button */}
          <button
            onClick={() => handleToggle('maintenanceMode')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 ${
              isMaintenanceOn
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            {isMaintenanceOn ? 'Turn Off / Go Live' : 'Activate Maintenance'}
          </button>
        </div>

        {/* Maintenance Configuration & Customizer */}
        <form onSubmit={handleSaveMaintenanceDetails} className="p-6 space-y-5 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Customer Upgrade Notice Customization
            </h3>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              View Storefront
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Announcement Headline
              </label>
              <input
                type="text"
                value={formData.maintenanceTitle || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maintenanceTitle: e.target.value }))}
                placeholder="e.g. Scheduled Upgrades in Progress"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Estimated Completion Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.maintenanceEstimatedEnd || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceEstimatedEnd: e.target.value }))}
                  placeholder="e.g. 45 minutes / Today at 6:00 PM EAT"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Customer Message
            </label>
            <textarea
              rows={3}
              value={formData.maintenanceMessage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
              placeholder="Explain the upgrade reason and assure customers you will be back shortly..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-zinc-400">
              Changes update immediately in Firestore and display on the customer screen when maintenance is enabled.
            </p>
            <button
              type="submit"
              disabled={savingDetails}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {savingDetails ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Notice
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* STANDARD FEATURE SWITCHES */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
          Store Features & Functionality
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standardFeatures.map(feature => (
            <button
              key={feature.id}
              onClick={() => handleToggle(feature.id as keyof FeatureToggles)}
              className={`flex items-start gap-4 p-5 rounded-3xl border transition-all text-left group ${
                formData[feature.id as keyof FeatureToggles] 
                  ? 'bg-white border-emerald-200 shadow-sm' 
                  : 'bg-zinc-50/50 border-zinc-100 opacity-60 hover:opacity-100'
              }`}
            >
              <div className={`p-3.5 rounded-2xl ${feature.bg} ${feature.color} shrink-0`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-bold text-zinc-900 text-sm truncate">{feature.name}</h3>
                  <div className={`w-11 h-6 rounded-full relative transition-colors ${
                    formData[feature.id as keyof FeatureToggles] ? 'bg-emerald-500' : 'bg-zinc-200'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      formData[feature.id as keyof FeatureToggles] ? 'right-1' : 'left-1'
                    }`} />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Warning Card */}
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Administrator Guarantee</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            When <strong>Maintenance Mode</strong> is activated, the public storefront is locked for regular customers, 
            but you can freely browse and test the store using your Admin account, and the <strong>/admin</strong> dashboard 
            remains fully accessible to add products, modify inventory, or run upgrades.
          </p>
        </div>
      </div>
    </div>
  );
}
