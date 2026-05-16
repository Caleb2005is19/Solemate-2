import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Globe, Mail, Phone, MapPin, MessageSquare, Share2, Search, Type, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { SiteSettings } from '../../types';
import { uploadToCloudinary } from '../../services/cloudinaryService';

export function SiteSettingsTab() {
  const { siteSettings, updateSiteSettings } = useStore();
  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (siteSettings) {
      setFormData(siteSettings);
    }
  }, [siteSettings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...((prev.socialMedia as any) || {}),
        [platform]: value
      }
    }));
  };

  const handleSeoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...((prev.seo as any) || {}),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSiteSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await uploadToCloudinary(file);
      handleInputChange(field, result.secure_url);
    } catch (err) {
      setError(`Failed to upload ${field}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Site Settings</h1>
          <p className="text-sm text-zinc-500">Manage your global business data across the entire platform.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 text-white px-8 py-3 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <TrendingUp className="w-5 h-5" />
          <p className="font-bold">Settings updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Brand Section */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Branding</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={e => handleInputChange('businessName', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g. Solemate.co.ke"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Logo</label>
                <div className="relative group aspect-video bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <Type className="w-8 h-8 text-zinc-300" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'logo')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Favicon</label>
                <div className="relative group aspect-square bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex items-center justify-center overflow-hidden w-24 mx-auto">
                  {formData.favicon ? (
                    <img src={formData.favicon} alt="Favicon" className="w-12 h-12 object-contain" />
                  ) : (
                    <Globe className="w-6 h-6 text-zinc-300" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'favicon')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Contact Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Support Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={e => handleInputChange('contactEmail', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="hello@solemate.co.ke"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">WhatsApp Number</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  type="text"
                  value={formData.whatsappNumber || ''}
                  onChange={e => handleInputChange('whatsappNumber', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Location / Store Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500" />
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={e => handleInputChange('location', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Street, City, Kenya"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Business Settings */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Operations</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currency || 'KSh'}
                onChange={e => handleInputChange('currency', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Delivery Fee</label>
              <input
                type="number"
                value={formData.deliveryFee || 0}
                onChange={e => handleInputChange('deliveryFee', Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Opening Hours</label>
              <input
                type="text"
                value={formData.openingHours || ''}
                onChange={e => handleInputChange('openingHours', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Mon-Sat: 8am - 8pm, Sun: Closed"
              />
            </div>
          </div>
        </section>

        {/* SEO Section */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Search Engine Optimization</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Meta Title</label>
              <input
                type="text"
                value={formData.seo?.title || ''}
                onChange={e => handleSeoChange('title', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Site Title for Google"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Meta Description</label>
              <textarea
                rows={3}
                value={formData.seo?.description || ''}
                onChange={e => handleSeoChange('description', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder="Site description for Google search results..."
              />
            </div>
          </div>
        </section>

        {/* Social Media Section */}
        <section className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-zinc-900">Social Presence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Instagram</label>
              <input
                type="text"
                value={formData.socialMedia?.instagram || ''}
                onChange={e => handleSocialChange('instagram', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Facebook</label>
              <input
                type="text"
                value={formData.socialMedia?.facebook || ''}
                onChange={e => handleSocialChange('facebook', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                placeholder="facebook.com/page"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Twitter (X)</label>
              <input
                type="text"
                value={formData.socialMedia?.twitter || ''}
                onChange={e => handleSocialChange('twitter', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">LinkedIn</label>
              <input
                type="text"
                value={formData.socialMedia?.linkedin || ''}
                onChange={e => handleSocialChange('linkedin', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                placeholder="linkedin.com/company"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
