import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ToggleRight, Star, Ticket, Heart, Store, UserCircle, ShieldAlert, Save, Loader2 } from 'lucide-react';
import { FeatureToggles } from '../../types';

export function FeatureTogglesTab() {
  const { featureToggles, updateFeatureToggles } = useStore();
  const [formData, setFormData] = useState<Partial<FeatureToggles>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (featureToggles) {
      setFormData(featureToggles);
    }
  }, [featureToggles]);

  const handleToggle = async (field: keyof FeatureToggles) => {
    const newValue = !formData[field];
    setFormData(prev => ({ ...prev, [field]: newValue }));
    
    // We update immediately in Firestore for global feature flags
    await updateFeatureToggles({ [field]: newValue });
  };

  const features = [
    { id: 'enableReviews', name: 'Product Reviews', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', desc: 'Allow customers to leave ratings and comments on products.' },
    { id: 'enableCoupons', name: 'Coupon Codes', icon: Ticket, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Enable coupon field in checkout for discounts.' },
    { id: 'enableWishlist', name: 'Wishlist System', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Allow users to save products for later.' },
    { id: 'enablePickupStation', name: 'Pickup Stations', icon: Store, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Enable "Collect from Store" option during checkout.' },
    { id: 'enableGuestCheckout', name: 'Guest Checkout', icon: UserCircle, color: 'text-zinc-500', bg: 'bg-zinc-50', desc: 'Allow orders without mandatory user account.' },
    { id: 'maintenanceMode', name: 'Maintenance Mode', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-100', desc: 'Lock the store with a message "We will be back shortly".' },
  ] as const;

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Feature Controls</h1>
          <p className="text-sm text-zinc-500">Enable or disable entire platform features instantly.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
          <ToggleRight className="w-4 h-4" />
          Real-time Updates
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map(feature => (
          <button
            key={feature.id}
            onClick={() => handleToggle(feature.id as keyof FeatureToggles)}
            className={`flex items-start gap-4 p-6 rounded-3xl border transition-all text-left group ${formData[feature.id as keyof FeatureToggles] ? 'bg-white border-emerald-200 shadow-md shadow-emerald-50' : 'bg-zinc-50/50 border-zinc-100 opacity-70 hover:opacity-100'}`}
          >
            <div className={`p-4 rounded-2xl ${feature.bg} ${feature.color} shrink-0`}>
              <feature.icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold text-zinc-900 truncate">{feature.name}</h3>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${formData[feature.id as keyof FeatureToggles] ? 'bg-emerald-500' : 'bg-zinc-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData[feature.id as keyof FeatureToggles] ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-white rounded-2xl text-amber-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900">Important Note</h4>
          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
            Toggling these features will affect all users currently browsing the site. 
            Ensure you understand the implications before disabling core flows like <strong>Guest Checkout</strong> or <strong>Maintenance Mode</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
