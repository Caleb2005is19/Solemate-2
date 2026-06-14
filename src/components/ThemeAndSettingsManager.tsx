import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { loginWithGoogle, logout } from '../firebase';
import { Wrench, ShieldAlert, KeyRound, ArrowRight, LogIn, LogOut } from 'lucide-react';

// Helper to darken a hex color by a percentage
function darkenHex(hex: string, percent: number): string {
  let num = hex.replace('#', '');
  if (num.length === 3) {
    num = num[0] + num[0] + num[1] + num[1] + num[2] + num[2];
  }
  let r = parseInt(num.substring(0, 2), 16);
  let g = parseInt(num.substring(2, 4), 16);
  let b = parseInt(num.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, Math.round(r * (1 - percent / 100))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 - percent / 100))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 - percent / 100))));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Convert hex to rgb format (for alpha channel values in CSS)
function hexToRgb(hex: string): string {
  let num = hex.replace('#', '');
  if (num.length === 3) {
    num = num[0] + num[0] + num[1] + num[1] + num[2] + num[2];
  }
  const r = parseInt(num.substring(0, 2), 16);
  const g = parseInt(num.substring(2, 4), 16);
  const b = parseInt(num.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function ThemeAndSettingsManager({ children }: { children: React.ReactNode }) {
  const { themeSettings, siteSettings, featureToggles, currentUser, isAdmin, setIsAuthModalOpen } = useStore();

  // 1. Dynamic Meta Title, SEO, Favicon updating
  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.seo?.title) {
        document.title = siteSettings.seo.title;
      } else if (siteSettings.businessName) {
        document.title = `${siteSettings.businessName} | Premium Sneakers & Footwear`;
      }

      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && siteSettings.seo?.description) {
        metaDesc.setAttribute('content', siteSettings.seo.description);
      }

      // Update favicon
      if (siteSettings.favicon) {
        const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (link) {
          link.href = siteSettings.favicon;
        }
        const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
        if (appleLink) {
          appleLink.href = siteSettings.favicon;
        }
      }
    }
  }, [siteSettings]);

  // 2. Injecting CSS Variables and Styles overrides of Theme Customization Editor
  useEffect(() => {
    const primary = themeSettings?.primaryColor || '#f97316';
    const primaryHover = darkenHex(primary, 15);
    const primaryRGB = hexToRgb(primary);
    const secondary = themeSettings?.secondaryColor || '#18181b';
    const radius = themeSettings?.borderRadius || '1rem';
    
    let fontStack = '"Inter", ui-sans-serif, system-ui, sans-serif';
    if (themeSettings?.fontFamily === 'Space Grotesk') {
      fontStack = '"Space Grotesk", "Inter", sans-serif';
    } else if (themeSettings?.fontFamily === 'Playfair Display') {
      fontStack = '"Playfair Display", Georgia, serif';
    } else if (themeSettings?.fontFamily === 'JetBrains Mono') {
      fontStack = '"JetBrains Mono", monospace';
    }

    // Dynamic style definitions targeting tailwind standard classes
    let styleText = `
      :root {
        --theme-primary: ${primary};
        --theme-primary-hover: ${primaryHover};
        --theme-primary-rgb: ${primaryRGB};
        --theme-secondary: ${secondary};
        --theme-radius: ${radius};
        --theme-font: ${fontStack};
      }

      body, html, input, button, select, textarea, .font-sans {
        font-family: var(--theme-font) !important;
      }

      /* Core utility replacements */
      .bg-orange-500 {
        background-color: var(--theme-primary) !important;
      }
      .hover\\:bg-orange-600:hover {
        background-color: var(--theme-primary-hover) !important;
      }
      .active\\:bg-orange-700:active {
        background-color: ${darkenHex(primary, 25)} !important;
      }
      .bg-orange-50 {
        background-color: rgba(var(--theme-primary-rgb), 0.08) !important;
      }
      .bg-orange-500\\/10 {
        background-color: rgba(var(--theme-primary-rgb), 0.1) !important;
      }
      .bg-orange-500\\/20 {
        background-color: rgba(var(--theme-primary-rgb), 0.2) !important;
      }
      .bg-orange-500\\/30 {
        background-color: rgba(var(--theme-primary-rgb), 0.3) !important;
      }
      .bg-orange-500\\/25 {
        background-color: rgba(var(--theme-primary-rgb), 0.25) !important;
      }
      
      .text-orange-500 {
        color: var(--theme-primary) !important;
      }
      .text-orange-600 {
        color: var(--theme-primary-hover) !important;
      }
      .hover\\:text-orange-500:hover {
        color: var(--theme-primary) !important;
      }
      .hover\\:text-orange-600:hover {
        color: var(--theme-primary-hover) !important;
      }
      .group-hover\\:text-orange-500:hover, .group:hover .group-hover\\:text-orange-500 {
        color: var(--theme-primary) !important;
      }

      .border-orange-500 {
        border-color: var(--theme-primary) !important;
      }
      .border-t-orange-500 {
        border-top-color: var(--theme-primary) !important;
      }
      .hover\\:border-orange-500:hover {
        border-color: var(--theme-primary) !important;
      }

      .focus\\:ring-orange-500:focus, .focus-visible\\:ring-orange-500:focus-visible {
        --tw-ring-color: var(--theme-primary) !important;
        border-color: var(--theme-primary) !important;
      }
      .focus\\:border-orange-500:focus {
        border-color: var(--theme-primary) !important;
      }

      .selection\\:bg-orange-500\\/30::selection {
        background-color: rgba(var(--theme-primary-rgb), 0.3) !important;
      }

      /* Curvature adaptations */
      .rounded-3xl, .rounded-\\[2.5rem\\], .rounded-\\[2rem\\] {
        border-radius: var(--theme-radius) !important;
      }
      .rounded-2xl {
        border-radius: calc(var(--theme-radius) * 0.75) !important;
      }
      .rounded-xl {
        border-radius: calc(var(--theme-radius) * 0.5) !important;
      }
      .rounded-lg {
        border-radius: calc(var(--theme-radius) * 0.375) !important;
      }
      .rounded-md {
        border-radius: calc(var(--theme-radius) * 0.25) !important;
      }
    `;

    // Button style alterations
    if (themeSettings?.buttonStyle === 'pill') {
      styleText += `
        button, .btn, a[role="button"], input[type="submit"] {
          border-radius: 9999px !important;
        }
      `;
    } else if (themeSettings?.buttonStyle === 'sharp') {
      styleText += `
        button, .btn, a[role="button"], input[type="submit"], .rounded-xl, .rounded-2xl, .rounded-3xl, .rounded-lg, .rounded-md {
          border-radius: 0px !important;
        }
      `;
    }

    let styleElement = document.getElementById('dynamic-theme-style') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'dynamic-theme-style';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = styleText;

    return () => {
      // Keep style on clean-up to prevent screen flicker during re-renders
    };
  }, [themeSettings]);

  // Handle Maintenance Mode
  const isMaintenanceActive = featureToggles?.maintenanceMode === true;
  // Let admins bypass maintenance mode so they can still operate and toggle it off
  const isBypassed = isAdmin || currentUser?.email === 'carlisat19@gmail.com';
  
  if (isMaintenanceActive && !isBypassed) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between p-6 md:p-8 font-sans selection:bg-orange-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] opacity-40 -z-10" />
        
        {/* Top Header */}
        <div className="flex justify-between items-center max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-100">
              S
            </div>
            <span className="font-black text-zinc-900 tracking-tight text-lg">
              {siteSettings?.businessName || 'Solemate.co.ke'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 bg-white px-4 py-2.5 rounded-2xl border border-zinc-100 shadow-sm transition-all active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
            Admin Login
          </button>
        </div>

        {/* Center Card */}
        <div className="max-w-xl w-full mx-auto bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50 text-center space-y-8 my-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-lg shadow-orange-50">
            <Wrench className="w-10 h-10 animate-pulse" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight leading-none">
              Polishing Our Shelves
            </h1>
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-widest">
              Undergoing Scheduled Maintenance
            </p>
          </div>

          <p className="text-zinc-500 text-sm md:text-base leading-relaxed">
            Our virtual showroom is getting a fresh shine! We are fine-tuning the platform to offer you an even smoother shopping experience. We will be back on track shortly so you can step into your favorite pairs.
          </p>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-left flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-zinc-700">Need immediate help with an order?</p>
              <p className="text-xs text-zinc-500 mt-1">
                Reach out to us directly via email at <strong className="text-zinc-700">{siteSettings?.contactEmail || 'hello@solemate.co.ke'}</strong>
                {siteSettings?.whatsappNumber && (
                  <> or WhatsApp at <strong className="text-zinc-700">{siteSettings.whatsappNumber}</strong></>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center w-full max-w-7xl mx-auto text-xs text-zinc-400 font-medium">
          &copy; {new Date().getFullYear()} {siteSettings?.businessName || 'Solemate.co.ke'}. All rights reserved. Nairobi, Kenya.
        </div>
      </div>
    );
  }

  // Under normal flow, render app content with dynamic configurations
  return <>{children}</>;
}
