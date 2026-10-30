import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Save, Globe, Mail, Phone, MapPin, MessageSquare, Share2, Search, Type, Clock, TrendingUp, AlertCircle, Loader2, Cloud, CheckCircle2, MessageCircle, ExternalLink, Sparkles, Key, Eye, EyeOff } from 'lucide-react';
import { SiteSettings } from '../../types';
import { uploadToCloudinary, testCloudinaryConnection, saveCloudinaryConfig } from '../../services/cloudinaryService';
import { useNotifications } from '../../context/NotificationContext';
import { createWhatsAppUrl } from '../../services/whatsappService';

export function SiteSettingsTab() {
  const { siteSettings, updateSiteSettings } = useStore();
  const { notify } = useNotifications();
  const [formData, setFormData] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloudinary testing state
  const [testingCloudinary, setTestingCloudinary] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // WhatsApp testing state
  const [testWhatsAppSent, setTestWhatsAppSent] = useState(false);

  // Gemini AI testing state
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const handleTestGemini = async () => {
    const key = formData.geminiApiKey?.trim() || '';
    setTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/catalog/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: key })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gemini API test failed');
      }
      setGeminiStatus({ success: true, message: data.message || 'Gemini AI is connected and working!' });
    } catch (err: any) {
      setGeminiStatus({ success: false, message: err.message || 'Failed to verify key' });
    } finally {
      setTestingGemini(false);
    }
  };

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
      if (formData.cloudinaryCloudName && formData.cloudinaryUploadPreset) {
        saveCloudinaryConfig(formData.cloudinaryCloudName, formData.cloudinaryUploadPreset);
      }
      await updateSiteSettings(formData);
      setSuccess(true);
      notify({
        recipient: 'admin',
        title: 'Site Settings Saved',
        message: 'Global business and store configuration updated.',
        type: 'settings',
        link: '/admin'
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestCloudinary = async () => {
    const cloudName = formData.cloudinaryCloudName?.trim() || '';
    const preset = formData.cloudinaryUploadPreset?.trim() || '';
    if (!cloudName || !preset) {
      setCloudinaryStatus({ success: false, message: 'Please enter both Cloud Name and Upload Preset above first.' });
      return;
    }
    setTestingCloudinary(true);
    setCloudinaryStatus(null);
    try {
      const res = await testCloudinaryConnection(cloudName, preset);
      setCloudinaryStatus(res);
      if (res.success) {
        saveCloudinaryConfig(cloudName, preset);
      }
    } catch (err: any) {
      setCloudinaryStatus({ success: false, message: err.message || 'Test failed' });
    } finally {
      setTestingCloudinary(false);
    }
  };

  const handleTestWhatsApp = () => {
    const targetPhone = formData.adminWhatsAppNumber || formData.whatsappNumber || '';
    if (!targetPhone) {
      setError('Please provide an Admin WhatsApp Phone Number first.');
      return;
    }
    const sampleMsg = `👋 *TEST ALERT — SOLEMATE.CO.KE*\n\nYour WhatsApp alert pipeline is working properly! You will receive instant notifications for paid orders and inventory updates here.`;
    const url = createWhatsAppUrl(targetPhone, sampleMsg);
    window.open(url, '_blank');
    setTestWhatsAppSent(true);
    setTimeout(() => setTestWhatsAppSent(false), 4000);
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
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Calling Phone Line</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500" />
                <input
                  type="text"
                  value={formData.phoneNumbers?.[0] || ''}
                  onChange={e => {
                    const currentPhones = [...(formData.phoneNumbers || [])];
                    currentPhones[0] = e.target.value;
                    handleInputChange('phoneNumbers', currentPhones);
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

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

        {/* Cloudinary Image CDN Section */}
        <section className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Cloudinary Media Credentials</h2>
                <p className="text-xs text-zinc-500">
                  Direct credentials override. Fixes "check credentials error" for all product & banner photo uploads.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestCloudinary}
              disabled={testingCloudinary}
              className="flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100 active:bg-sky-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {testingCloudinary ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {testingCloudinary ? 'Testing Connection...' : 'Test Cloudinary Connection'}
            </button>
          </div>

          {cloudinaryStatus && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
              cloudinaryStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {cloudinaryStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <div>
                <p className="font-black text-sm">{cloudinaryStatus.success ? 'Credentials Active' : 'Configuration Issue'}</p>
                <p className="font-normal mt-0.5">{cloudinaryStatus.message}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-600 uppercase ml-1">Cloud Name</label>
              <input
                type="text"
                value={formData.cloudinaryCloudName || ''}
                onChange={e => handleInputChange('cloudinaryCloudName', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium"
                placeholder="e.g. dxyz12345"
              />
              <p className="text-[11px] text-zinc-400 mt-1 pl-1">Found in your Cloudinary Dashboard under "Cloud name"</p>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 uppercase ml-1">Upload Preset (Must be Unsigned)</label>
              <input
                type="text"
                value={formData.cloudinaryUploadPreset || ''}
                onChange={e => handleInputChange('cloudinaryUploadPreset', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium"
                placeholder="e.g. solemate_unsigned"
              />
              <p className="text-[11px] text-zinc-400 mt-1 pl-1">In Cloudinary: Settings → Upload → Upload Presets → Mode: Unsigned</p>
            </div>
          </div>
        </section>

        {/* Google Gemini AI Configuration Section */}
        <section className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Google Gemini AI Credentials</h2>
                <p className="text-xs text-zinc-500">
                  Powers 100% Grounded Sneaker Verification & Photo Auto-Cataloging on live domains like solemate.co.ke.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestGemini}
              disabled={testingGemini}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {testingGemini ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {testingGemini ? 'Testing Gemini Key...' : 'Test AI Key Connection'}
            </button>
          </div>

          {geminiStatus && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 ${
              geminiStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {geminiStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
              <div>
                <p className="font-black text-sm">{geminiStatus.success ? 'Gemini AI Operational' : 'Connection Notice'}</p>
                <p className="font-normal mt-0.5">{geminiStatus.message}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-600 uppercase ml-1">Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
              >
                <span>Get a free Gemini API key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={formData.geminiApiKey || ''}
                onChange={e => handleInputChange('geminiApiKey', e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                placeholder="AIzaSy..."
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 pl-1">
              Once saved, this key is securely used by your store backend on solemate.co.ke. Alternatively, configure <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono">GEMINI_API_KEY</code> in your Vercel Project Environment Variables.
            </p>
          </div>
        </section>

        {/* WhatsApp Notification Automation Section */}
        <section className="md:col-span-2 bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">WhatsApp Notification Automation</h2>
                <p className="text-xs text-zinc-500">
                  Instant text alerts for paid orders, inventory changes, and newly listed products.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestWhatsApp}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              {testWhatsAppSent ? 'Alert Opened!' : 'Send Test WhatsApp Alert'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-600 uppercase ml-1">Admin WhatsApp Number</label>
              <input
                type="tel"
                value={formData.adminWhatsAppNumber || formData.whatsappNumber || ''}
                onChange={e => {
                  handleInputChange('adminWhatsAppNumber', e.target.value);
                  handleInputChange('whatsappNumber', e.target.value);
                }}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                placeholder="e.g. 0712 345 678 or +254 712 345 678"
              />
              <p className="text-[11px] text-zinc-400 mt-1 pl-1">Primary WhatsApp line for order fulfillment and admin alerts</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Automated Notification Rules</p>
              
              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={formData.whatsappOrderAlerts ?? true}
                  onChange={e => handleInputChange('whatsappOrderAlerts', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Alert Admin & Assigned Seller when an order is Paid</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={formData.whatsappStockAlerts ?? true}
                  onChange={e => handleInputChange('whatsappStockAlerts', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Alert Admin on stock changes & low inventory (≤ 3 pairs)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-zinc-700">
                <input
                  type="checkbox"
                  checked={formData.whatsappNewProductAlerts ?? true}
                  onChange={e => handleInputChange('whatsappNewProductAlerts', e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Alert Admin whenever a new product is added to the site</span>
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
