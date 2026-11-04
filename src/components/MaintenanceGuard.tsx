import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { 
  Wrench, 
  ShieldAlert, 
  KeyRound, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  Bell, 
  Check, 
  ExternalLink, 
  ArrowRight,
  Eye,
  EyeOff,
  Radio,
  Power
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { 
    featureToggles, 
    updateFeatureToggles, 
    siteSettings, 
    isAdmin, 
    currentUser, 
    setIsAuthModalOpen 
  } = useStore();

  const [previewAsCustomer, setPreviewAsCustomer] = useState(false);
  const [notifyInput, setNotifyInput] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);

  const isMaintenanceActive = featureToggles?.maintenanceMode === true;
  const isAuthorizedAdmin = isAdmin || currentUser?.email === 'carlisat19@gmail.com';

  // Backoffice routes (Admin Dashboard & Seller Portal) are ALWAYS accessible so upgrades can be performed
  const isBackofficeRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');

  // Handle "Notify Me When Back Online"
  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyInput.trim()) return;

    setIsSubmittingNotify(true);
    try {
      // Save locally so customer sees confirmation
      const existing = JSON.parse(localStorage.getItem('solemate_maintenance_notify') || '[]');
      existing.push({ contact: notifyInput, date: new Date().toISOString() });
      localStorage.setItem('solemate_maintenance_notify', JSON.stringify(existing));

      // Attempt to save to Firestore leads collection if accessible
      try {
        await addDoc(collection(db, 'maintenance_leads'), {
          contact: notifyInput,
          createdAt: new Date().toISOString(),
          source: 'maintenance_screen'
        });
      } catch (err) {
        console.warn('Silent fallback for maintenance lead submission:', err);
      }

      setNotifySuccess(true);
      setNotifyInput('');
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await updateFeatureToggles({ maintenanceMode: false });
    } catch (err) {
      console.error('Failed to disable maintenance mode:', err);
    }
  };

  // If maintenance mode is active:
  if (isMaintenanceActive) {
    // 1. If currently on Admin or Seller dashboard route, allow access so upgrades can proceed
    if (isBackofficeRoute) {
      return (
        <>
          {/* Admin top banner inside backoffice */}
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span>MAINTENANCE MODE IS LIVE: The storefront is locked to all customers while you perform upgrades.</span>
            </div>
            <button
              onClick={handleDeactivate}
              className="bg-white text-rose-600 hover:bg-rose-50 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ml-4 shrink-0"
            >
              Turn Off / Go Live
            </button>
          </div>
          {children}
        </>
      );
    }

    // 2. If logged in as admin browsing the storefront, allow bypass with admin bar (unless previewing as customer)
    if (isAuthorizedAdmin && !previewAsCustomer) {
      return (
        <>
          {/* Sticky Admin Storefront Upgrade Bar */}
          <div className="bg-zinc-950 border-b border-rose-500/30 text-white px-4 py-2.5 text-xs sticky top-0 z-50 shadow-xl backdrop-blur-md bg-opacity-95 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-500 text-white rounded-lg animate-pulse">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-zinc-200">
                <strong className="text-rose-400 font-bold uppercase tracking-wider">Maintenance Mode Active:</strong> You are viewing the store with Administrator Bypass enabled. Public visitors see the upgrade notice.
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setPreviewAsCustomer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                title="Preview what customers see"
              >
                <Eye className="w-3.5 h-3.5" />
                Customer View
              </button>

              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
              >
                Admin Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handleDeactivate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                Deactivate
              </button>
            </div>
          </div>
          {children}
        </>
      );
    }

    // 3. For public visitors (or admin previewing customer view), render Customer Maintenance & Upgrade Screen
    const whatsappNum = siteSettings?.whatsappNumber || siteSettings?.phoneNumbers?.[0] || '254700000000';
    const cleanWhatsapp = whatsappNum.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
      `Hello ${siteSettings?.businessName || 'Solemate'}, I saw your website is undergoing maintenance. I have an inquiry:`
    )}`;

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden selection:bg-orange-500/30">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none -z-0" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none -z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 -z-0" />

        {/* Exit Preview Mode Button for Admin */}
        {previewAsCustomer && isAuthorizedAdmin && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setPreviewAsCustomer(false)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-2xl transition-all"
            >
              <EyeOff className="w-4 h-4" />
              Exit Customer Preview
            </button>
          </div>
        )}

        {/* Header */}
        <header className="relative z-10 flex justify-between items-center max-w-6xl w-full mx-auto py-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/25">
              S
            </div>
            <div>
              <span className="font-black text-white tracking-tight text-xl block leading-none">
                {siteSettings?.businessName || 'Solemate.co.ke'}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest block mt-0.5">
                Nairobi, Kenya
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 px-4 py-2.5 rounded-2xl border border-zinc-800 shadow-sm transition-all active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              Staff / Admin Portal
            </button>
          </div>
        </header>

        {/* Center Main Card */}
        <main className="relative z-10 max-w-2xl w-full mx-auto my-auto py-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-widest">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Scheduled Platform Upgrade
          </div>

          {/* Heading & Notice */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {featureToggles.maintenanceTitle || "Upgrades in Progress"}
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto font-normal leading-relaxed">
              {featureToggles.maintenanceMessage || 
                "We are polishing our shelves and upgrading our catalog system to bring you faster drops and seamless shopping. We will be back online shortly!"
              }
            </p>
          </div>

          {/* Estimated Finish Time Banner (if provided) */}
          {featureToggles.maintenanceEstimatedEnd && (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-medium shadow-inner">
              <Clock className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>
                Estimated Return: <strong className="text-white font-bold">{featureToggles.maintenanceEstimatedEnd}</strong>
              </span>
            </div>
          )}

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto pt-2">
            {/* WhatsApp Contact */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-emerald-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Need Help Right Now?</h2>
                <p className="text-xs text-zinc-400 mt-1">Chat directly with our team on WhatsApp for orders or questions.</p>
              </div>
            </a>

            {/* Email Support */}
            <a
              href={`mailto:${siteSettings?.contactEmail || 'hello@solemate.co.ke'}`}
              className="p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-orange-500/40 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Email Customer Desk</h2>
                <p className="text-xs text-zinc-400 mt-1">{siteSettings?.contactEmail || 'hello@solemate.co.ke'}</p>
              </div>
            </a>
          </div>

          {/* Notify Me Form */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 max-w-xl mx-auto text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-zinc-300 font-semibold text-sm">
              <Bell className="w-4 h-4 text-orange-400" />
              <span>Get notified the minute we are back live</span>
            </div>

            {notifySuccess ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                You're on the priority notification list! We will ping you instantly.
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter phone (e.g. 0712...) or email"
                  value={notifyInput}
                  onChange={(e) => setNotifyInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingNotify}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shrink-0 disabled:opacity-50"
                >
                  {isSubmittingNotify ? 'Saving...' : 'Notify Me'}
                </button>
              </form>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center w-full max-w-6xl mx-auto py-4 text-xs text-zinc-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-zinc-900">
          <div>
            &copy; {new Date().getFullYear()} {siteSettings?.businessName || 'Solemate Kenya'}. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Verified Sneakers Nairobi CBD</span>
            <span>&bull;</span>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-white transition-colors underline"
            >
              Admin Sign In
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // Normal mode: render store content
  return <>{children}</>;
}
