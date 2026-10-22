import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Building,
  Eye,
  RefreshCw,
  Share2,
  PhoneCall,
  Check
} from 'lucide-react';
import type { SiteSettings } from '../../services/types';
import { normalizeWhatsAppNumber, formatDisplayPhone, getWhatsAppChatUrl } from '../../utils/contactHelpers';
import { useNotifications } from '../../context/NotificationContext';

export function ContactSettingsTab() {
  const { siteSettings, updateSiteSettings } = useStore();
  const { notify } = useNotifications();

  const [primaryPhone, setPrimaryPhone] = useState('+254 700 000 000');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+254 700 000 000');
  const [contactEmail, setContactEmail] = useState('support@solemate.co.ke');
  const [location, setLocation] = useState('Nairobi CBD, Kenya');
  const [openingHours, setOpeningHours] = useState('Mon - Sat: 8:00 AM - 8:00 PM, Sun: Closed');
  const [businessName, setBusinessName] = useState('Solemate.co.ke');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when siteSettings loads or updates
  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.phoneNumbers && siteSettings.phoneNumbers.length > 0) {
        setPrimaryPhone(siteSettings.phoneNumbers[0] || '+254 700 000 000');
        if (siteSettings.phoneNumbers.length > 1) {
          setAlternatePhone(siteSettings.phoneNumbers[1]);
        }
      }
      if (siteSettings.alternatePhone) {
        setAlternatePhone(siteSettings.alternatePhone);
      }
      if (siteSettings.whatsappNumber) setWhatsappNumber(siteSettings.whatsappNumber);
      if (siteSettings.contactEmail) setContactEmail(siteSettings.contactEmail);
      if (siteSettings.location) setLocation(siteSettings.location);
      if (siteSettings.openingHours) setOpeningHours(siteSettings.openingHours);
      if (siteSettings.businessName) setBusinessName(siteSettings.businessName);
      if (siteSettings.socialMedia) {
        setInstagram(siteSettings.socialMedia.instagram || '');
        setFacebook(siteSettings.socialMedia.facebook || '');
        setTwitter(siteSettings.socialMedia.twitter || '');
        setTiktok(siteSettings.socialMedia.tiktok || '');
      }
    }
  }, [siteSettings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const phoneList: string[] = [primaryPhone.trim()];
      if (alternatePhone.trim()) {
        phoneList.push(alternatePhone.trim());
      }

      const updates: Partial<SiteSettings> = {
        phoneNumbers: phoneList,
        alternatePhone: alternatePhone.trim() || undefined,
        whatsappNumber: whatsappNumber.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        location: location.trim(),
        openingHours: openingHours.trim(),
        businessName: businessName.trim() || 'Solemate.co.ke',
        socialMedia: {
          ...(siteSettings?.socialMedia || {}),
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          twitter: twitter.trim(),
          tiktok: tiktok.trim(),
        },
      };

      await updateSiteSettings(updates);
      setSaveSuccess(true);
      notify({
        title: 'Contact Details Updated',
        message: 'Store phone numbers, WhatsApp line, and support email were saved and updated live.',
        type: 'settings',
        recipient: 'all',
        link: '/admin'
      });
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update contact settings:', err);
      setError(err?.message || 'Failed to save contact settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (siteSettings) {
      setPrimaryPhone(siteSettings.phoneNumbers?.[0] || '+254 700 000 000');
      setAlternatePhone(siteSettings.alternatePhone || siteSettings.phoneNumbers?.[1] || '');
      setWhatsappNumber(siteSettings.whatsappNumber || '+254 700 000 000');
      setContactEmail(siteSettings.contactEmail || 'support@solemate.co.ke');
      setLocation(siteSettings.location || 'Nairobi CBD, Kenya');
      setOpeningHours(siteSettings.openingHours || 'Mon - Sat: 8:00 AM - 8:00 PM, Sun: Closed');
      setBusinessName(siteSettings.businessName || 'Solemate.co.ke');
      setInstagram(siteSettings.socialMedia?.instagram || '');
      setFacebook(siteSettings.socialMedia?.facebook || '');
      setTwitter(siteSettings.socialMedia?.twitter || '');
      setTiktok(siteSettings.socialMedia?.tiktok || '');
      setError(null);
    }
  };

  const whatsappUrl = getWhatsAppChatUrl(
    whatsappNumber,
    `Hello ${businessName}, I would like to inquire about an order on your website.`
  );

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Banner & Save Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-600" />
              Non-Technical Staff Friendly
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Website Contact Details</h1>
          <p className="text-sm text-zinc-500 max-w-xl">
            Update your phone numbers, WhatsApp line, customer care email, and physical store address.
            Changes apply instantly across the whole store, navbar, footer, cart, and all invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl font-bold text-xs text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
            title="Discard unsaved changes and reset from database"
          >
            <RefreshCw className="w-4 h-4 text-zinc-500" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl font-black text-sm bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-white" />
                <span>Save Contact Details</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Contact details updated successfully!</p>
            <p className="text-xs text-emerald-700">
              Your new numbers, email, WhatsApp, and location are now live on the website, checkout, cart, and PDF receipts.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Phone Lines */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Direct Calling & Support Phone Lines</h2>
                <p className="text-xs text-zinc-500">Displayed on the top header, website footer, and order receipts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Primary Phone Line <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    placeholder="e.g. +254 700 000 000 or 0712 345 678"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Main phone number customers call for inquiries.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Alternate / Secondary Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="e.g. +254 711 222 333"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-sm font-medium transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Backup number for delivery dispatch or office.</p>
              </div>
            </div>
          </div>

          {/* Card 2: WhatsApp Number */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">WhatsApp Business Number</h2>
                <p className="text-xs text-zinc-500">Powers all "Order via WhatsApp" buttons on shoe pages and in the cart.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                WhatsApp Phone Number <span className="text-emerald-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <MessageSquare className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +254 700 000 000 or 0700000000"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-medium transition"
                  />
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition border border-emerald-200 shrink-0"
                  title="Test sending a test message via your WhatsApp number"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test WhatsApp Link</span>
                </a>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1.5">
                Cleaned for WhatsApp: <strong className="text-zinc-700">+{normalizeWhatsAppNumber(whatsappNumber)}</strong> (automatically works whether you type +254 or 07...)
              </p>
            </div>
          </div>

          {/* Card 3: Support Email & Physical Address */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Email, Store Address & Working Hours</h2>
                <p className="text-xs text-zinc-500">General business presence and physical pickup information.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Customer Support Email <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@solemate.co.ke"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Operating & Opening Hours
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="Mon - Sat: 8:00 AM - 8:00 PM"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Physical Store / Pickup Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Tom Mboya Street, Nairobi CBD, Kenya"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none text-sm font-medium transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">Appears in footer and customer order invoices.</p>
              </div>
            </div>
          </div>

          {/* Card 4: Social Media Accounts */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Social Media Profiles</h2>
                <p className="text-xs text-zinc-500">Connected to icons in the website footer.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Instagram (@handle or link)</label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="e.g. @solemateke or instagram.com/solemateke"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Facebook (Page or link)</label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="e.g. facebook.com/solemateke"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">Twitter / X (@handle)</label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="e.g. @solemateke"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 mb-1">TikTok (@handle)</label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="e.g. @solematekenya"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Customer Preview Column */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-xl space-y-6 sticky top-28">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-800">
              <Eye className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="font-bold text-sm">Customer View Preview</h3>
                <p className="text-[11px] text-zinc-400">Live preview of how customers see your info</p>
              </div>
            </div>

            {/* Preview 1: Header Top Bar */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Header Top Bar</span>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
                <span>🚚 Free Delivery in CBD</span>
                <span className="flex items-center gap-1 text-orange-400 font-bold">
                  <Phone className="w-3 h-3" /> {formatDisplayPhone(primaryPhone)}
                </span>
              </div>
            </div>

            {/* Preview 2: WhatsApp Ordering Button */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">WhatsApp Order Button</span>
              <div className="bg-emerald-600 text-white p-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-md shadow-emerald-950">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Order via WhatsApp
                </span>
                <span className="text-[10px] opacity-80">+{normalizeWhatsAppNumber(whatsappNumber)}</span>
              </div>
            </div>

            {/* Preview 3: Footer Contact Block */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Website Footer Block</span>
              <div className="bg-zinc-800/80 p-3.5 rounded-2xl border border-zinc-700/60 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-200">{location || 'Nairobi CBD, Kenya'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="text-zinc-200">{primaryPhone || '+254 700 000 000'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="text-zinc-200">{contactEmail || 'support@solemate.co.ke'}</span>
                </div>
                {openingHours && (
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-700/40">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>{openingHours}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview 4: Invoice / Receipt Header */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">PDF Receipt Header</span>
              <div className="bg-white text-zinc-900 p-3.5 rounded-2xl border border-zinc-200 text-[11px] space-y-1">
                <div className="flex items-center justify-between font-black text-xs">
                  <span>{businessName}</span>
                  <span className="text-orange-600">INVOICE</span>
                </div>
                <p className="text-[10px] text-zinc-500">{contactEmail} • {primaryPhone}</p>
                <p className="text-[10px] text-zinc-500">{location}</p>
              </div>
            </div>

            {/* Quick Action */}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Apply Changes Live</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ContactSettingsTab;
