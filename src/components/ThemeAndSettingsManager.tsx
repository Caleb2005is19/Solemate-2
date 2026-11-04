import React, { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

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
  const { themeSettings, siteSettings } = useStore();

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

  // Render app content with dynamic configurations
  return <>{children}</>;
}
