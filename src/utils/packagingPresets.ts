import { SiteSettings, ThemeSettings } from '../services/types';

export type PackagingCategory = 'uhuru' | 'gift' | 'box' | 'mailer';

export type PackagingSizeId =
  | 'uhuru-sm'
  | 'uhuru-md'
  | 'uhuru-lg'
  | 'gift-sm'
  | 'gift-md'
  | 'gift-lg'
  | 'box-single'
  | 'box-double'
  | 'box-drawer'
  | 'poly-mailer'
  | 'dust-bag';

export type PackagingLayoutId =
  | 'signature'
  | 'editorial'
  | 'boutique'
  | 'street-grid'
  | 'diagonal-wrap'
  | 'monogram-box';

export type PackagingHandleStyle =
  | 'die-cut'
  | 'loop'
  | 'rope'
  | 'ribbon'
  | 'flip-lid'
  | 'drawer'
  | 'mailer-flap'
  | 'drawstring';

export type PrintSide = 'front' | 'back' | 'gusset' | 'lid';
export type QrPlacement = 'back' | 'front-corner' | 'lid' | 'gusset' | 'front-and-back';
export type LogoMode = 'vector-sneaker' | 'store-logo' | 'dual';

export interface PackagingSizePreset {
  id: PackagingSizeId;
  category: PackagingCategory;
  name: string;
  shortLabel: string;
  sizeBadge: string;
  widthCm: number;
  heightCm: number;
  gussetCm: number;
  viewW: number;
  viewH: number;
  gussetW: number;
  handleStyle: PackagingHandleStyle;
  handleLabel: string;
  defaultMaterial: string;
  isBox: boolean;
  note: string;
}

export interface PackagingTheme {
  id: string;
  name: string;
  badge?: string;
  isDerivedFromSite?: boolean;
  material: string;
  bagHex: string;
  primaryInk: string;
  accentInk: string;
  mutedInk: string;
  stripeColor: string;
  handleColor: string;
  isDarkBag: boolean;
}

export interface PackagingDesignConfig {
  themeId: string;
  customBgHex: string | null;
  customPrimaryInk: string | null;
  customAccentInk: string | null;
  layoutId: PackagingLayoutId;
  sizeId: PackagingSizeId;
  logoMode: LogoMode;
  customLogoUrl: string;
  brandTitle: string;
  subBrand: string;
  tagline: string;
  editionStamp: string;
  backHeadline: string;
  backBody: string;
  socialHandle: string;
  phoneText: string;
  locationText: string;
  qrTargetUrl: string;
  qrPlacement: QrPlacement;
  qrErrorLevel: 'M' | 'Q' | 'H';
  qrAccentFrame: boolean;
  showTreadPattern: boolean;
  showBorderFrame: boolean;
}

export const PACKAGING_CATEGORIES: { id: PackagingCategory; label: string; subtitle: string }[] = [
  { id: 'uhuru', label: 'Uhuru Bags', subtitle: 'Heavy-duty retail carriers' },
  { id: 'gift', label: 'Gift Bags', subtitle: 'Rope & ribbon boutique bags' },
  { id: 'box', label: 'Sneaker Boxes', subtitle: 'Single, double & drawer' },
  { id: 'mailer', label: 'Mailers & Dust', subtitle: 'Courier & protection pouches' }
];

export const PACKAGING_SIZES: Record<PackagingSizeId, PackagingSizePreset> = {
  'uhuru-sm': {
    id: 'uhuru-sm',
    category: 'uhuru',
    name: 'Uhuru Bag — Small',
    shortLabel: 'Uhuru Small',
    sizeBadge: 'S',
    widthCm: 30,
    heightCm: 38,
    gussetCm: 10,
    viewW: 600,
    viewH: 760,
    gussetW: 200,
    handleStyle: 'die-cut',
    handleLabel: 'Reinforced Kidney Die-Cut Handle',
    defaultMaterial: '90gsm Heavy-Duty Non-Woven / Matt Poly',
    isBox: false,
    note: 'Compact Nairobi retail carrier for slides, caps, or single slim boxes.'
  },
  'uhuru-md': {
    id: 'uhuru-md',
    category: 'uhuru',
    name: 'Uhuru Bag — Medium',
    shortLabel: 'Uhuru Medium',
    sizeBadge: 'M',
    widthCm: 38,
    heightCm: 45,
    gussetCm: 12,
    viewW: 760,
    viewH: 900,
    gussetW: 240,
    handleStyle: 'loop',
    handleLabel: '30mm Cross-Stitched Webbing Loop',
    defaultMaterial: '100gsm Laminated Non-Woven / Heavy Kraft',
    isBox: false,
    note: 'Signature Nairobi shopper sized for 1 full sneaker box with room to spare.'
  },
  'uhuru-lg': {
    id: 'uhuru-lg',
    category: 'uhuru',
    name: 'Uhuru Bag — Large',
    shortLabel: 'Uhuru Large',
    sizeBadge: 'L',
    widthCm: 45,
    heightCm: 52,
    gussetCm: 15,
    viewW: 900,
    viewH: 1040,
    gussetW: 300,
    handleStyle: 'loop',
    handleLabel: '35mm Heavy-Load Stitched Loop',
    defaultMaterial: '120gsm Laminated Non-Woven Carrier',
    isBox: false,
    note: 'Jumbo Uhuru haul bag built for 2–3 sneaker boxes or apparel bundles.'
  },
  'gift-sm': {
    id: 'gift-sm',
    category: 'gift',
    name: 'Boutique Gift Bag — Small',
    shortLabel: 'Gift Small',
    sizeBadge: 'S',
    widthCm: 24,
    heightCm: 32,
    gussetCm: 10,
    viewW: 540,
    viewH: 720,
    gussetW: 225,
    handleStyle: 'rope',
    handleLabel: '5mm Twisted Cotton Cord + Eyelets',
    defaultMaterial: '230gsm Matte Laminated Ivory Board',
    isBox: false,
    note: 'Vertical gift presentation bag for accessories, socks, or kids footwear.'
  },
  'gift-md': {
    id: 'gift-md',
    category: 'gift',
    name: 'Boutique Gift Bag — Medium',
    shortLabel: 'Gift Medium',
    sizeBadge: 'M',
    widthCm: 34,
    heightCm: 42,
    gussetCm: 14,
    viewW: 680,
    viewH: 840,
    gussetW: 280,
    handleStyle: 'ribbon',
    handleLabel: '22mm Satin Grosgrain Ribbon Handle',
    defaultMaterial: '250gsm Matte Laminated Art Card',
    isBox: false,
    note: 'Signature luxury boutique gift bag fitted cleanly to 1 standard sneaker box.'
  },
  'gift-lg': {
    id: 'gift-lg',
    category: 'gift',
    name: 'Boutique Gift Bag — Wide Large',
    shortLabel: 'Gift Large',
    sizeBadge: 'L',
    widthCm: 42,
    heightCm: 35,
    gussetCm: 16,
    viewW: 840,
    viewH: 700,
    gussetW: 320,
    handleStyle: 'ribbon',
    handleLabel: '25mm Satin Ribbon + Cardboard Base Insert',
    defaultMaterial: '270gsm Heavy Matte Coated Card',
    isBox: false,
    note: 'Wide landscape gift bag holding oversized Jordan/boot boxes flat inside.'
  },
  'box-single': {
    id: 'box-single',
    category: 'box',
    name: 'Sneaker Box — Single Flip-Top',
    shortLabel: 'Single Box',
    sizeBadge: '1×',
    widthCm: 34,
    heightCm: 22,
    gussetCm: 13,
    viewW: 850,
    viewH: 550,
    gussetW: 325,
    handleStyle: 'flip-lid',
    handleLabel: 'Hinged Tuck-Tab Corrugated Lid',
    defaultMaterial: 'E-Flute Corrugated Board + Matte Litho Wrap',
    isBox: true,
    note: 'Standard US 5–13 sneaker shipper & display box with printable Lid, Front & End cap.'
  },
  'box-double': {
    id: 'box-double',
    category: 'box',
    name: 'Sneaker Box — Double / Collector',
    shortLabel: 'Double Box',
    sizeBadge: '2×',
    widthCm: 38,
    heightCm: 34,
    gussetCm: 15,
    viewW: 860,
    viewH: 770,
    gussetW: 340,
    handleStyle: 'flip-lid',
    handleLabel: 'Reinforced Double-Wall Tuck Lid',
    defaultMaterial: 'B/E Double-Flute Corrugated + Matte Seal',
    isBox: true,
    note: 'High-volume collector edition box for high-tops, Timberlands, or two pairs.'
  },
  'box-drawer': {
    id: 'box-drawer',
    category: 'box',
    name: 'Sneaker Box — Slide Drawer',
    shortLabel: 'Drawer Box',
    sizeBadge: 'SLIDE',
    widthCm: 35,
    heightCm: 24,
    gussetCm: 13,
    viewW: 850,
    viewH: 580,
    gussetW: 315,
    handleStyle: 'drawer',
    handleLabel: 'Rigid Sleeve + Satin Ribbon Pull Tab',
    defaultMaterial: '1200gsm Rigid Greyboard Wrapped 157gsm Art',
    isBox: true,
    note: 'Luxury pull-out drawer presentation box engineered for flagship drops.'
  },
  'poly-mailer': {
    id: 'poly-mailer',
    category: 'mailer',
    name: 'Courier Poly Mailer',
    shortLabel: 'Poly Mailer',
    sizeBadge: 'SHIP',
    widthCm: 38,
    heightCm: 50,
    gussetCm: 4,
    viewW: 760,
    viewH: 1000,
    gussetW: 160,
    handleStyle: 'mailer-flap',
    handleLabel: 'Double Peel-and-Seal Tamper Strip',
    defaultMaterial: '70-Micron Co-Extruded Waterproof LDPE',
    isBox: false,
    note: 'Weatherproof boda & upcountry courier pouch with bold brand billboard.'
  },
  'dust-bag': {
    id: 'dust-bag',
    category: 'mailer',
    name: 'Drawstring Dust Bag',
    shortLabel: 'Dust Bag',
    sizeBadge: 'POUCH',
    widthCm: 34,
    heightCm: 44,
    gussetCm: 4,
    viewW: 680,
    viewH: 880,
    gussetW: 160,
    handleStyle: 'drawstring',
    handleLabel: 'Dual Braided Cotton Drawstring Channel',
    defaultMaterial: '220gsm Brushed Cotton / 80g Non-Woven',
    isBox: false,
    note: 'Reusable travel & storage pouch packed inside box deliveries.'
  }
};

export const PACKAGING_LAYOUTS: { id: PackagingLayoutId; label: string; desc: string }[] = [
  { id: 'signature', label: 'Center Emblem', desc: 'Hero mark + bold wordmark' },
  { id: 'editorial', label: 'Vertical Band', desc: 'Side accent stripe lockup' },
  { id: 'boutique', label: 'Framed Stamp', desc: 'Clean atelier border badge' },
  { id: 'street-grid', label: 'Nairobi Street', desc: 'Drop grid + coords stamp' },
  { id: 'diagonal-wrap', label: 'Diagonal Sash', desc: 'Dynamic angled racing bar' },
  { id: 'monogram-box', label: 'Monogram Seal', desc: 'Repeat pattern + seal badge' }
];

// Helper: relative luminance to pick readable ink automatically for dynamic site colors
export function getHexLuminance(hex: string): number {
  let clean = (hex || '#000000').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function normalizeHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  const clean = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const c = clean.slice(1);
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`.toUpperCase();
  }
  return fallback;
}

export function hexToApproxCmyk(hex: string): string {
  const norm = normalizeHex(hex, '#111113').slice(1);
  const r = parseInt(norm.slice(0, 2), 16) / 255;
  const g = parseInt(norm.slice(2, 4), 16) / 255;
  const b = parseInt(norm.slice(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.99) return 'C75 M68 Y67 K90';
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  const kp = Math.round(k * 100);
  return `C${c} M${m} Y${y} K${kp}`;
}

export function buildPackagingThemes(
  themeSettings?: ThemeSettings | null,
  siteSettings?: SiteSettings | null
): PackagingTheme[] {
  const sitePrimary = normalizeHex(themeSettings?.primaryColor, '#F97316');
  const siteSecondary = normalizeHex(themeSettings?.secondaryColor, '#18181B');
  const bizName = siteSettings?.businessName?.trim() || 'Store';

  const primaryLum = getHexLuminance(sitePrimary);
  const secondaryLum = getHexLuminance(siteSecondary);

  const primaryIsDark = primaryLum < 0.42;
  const secondaryIsDark = secondaryLum < 0.45;

  return [
    {
      id: 'site-primary',
      name: `${bizName} Brand Primary`,
      badge: 'SITE THEME',
      isDerivedFromSite: true,
      material: '250gsm Coated Art Stock / Custom Laminated Carrier',
      bagHex: sitePrimary,
      primaryInk: primaryIsDark ? '#FFFFFF' : '#111113',
      accentInk:
        Math.abs(primaryLum - secondaryLum) > 0.25
          ? siteSecondary
          : primaryIsDark
          ? '#FDE047'
          : '#111113',
      mutedInk: primaryIsDark ? '#F4F4F5' : '#27272A',
      stripeColor: primaryIsDark ? '#111113' : '#FFFFFF',
      handleColor: siteSecondary,
      isDarkBag: primaryIsDark
    },
    {
      id: 'site-secondary',
      name: `${bizName} Signature Dark`,
      badge: 'SITE DARK',
      isDerivedFromSite: true,
      material: '250gsm Matte Laminated Stock + Spot Brand Ink',
      bagHex: siteSecondary,
      primaryInk: secondaryIsDark ? '#FFFFFF' : '#111113',
      accentInk: sitePrimary,
      mutedInk: secondaryIsDark ? '#A1A1AA' : '#52525B',
      stripeColor: secondaryIsDark ? '#FFFFFF' : '#111113',
      handleColor: sitePrimary,
      isDarkBag: secondaryIsDark
    },
    {
      id: 'obsidian',
      name: 'Obsidian Matte Black',
      material: '250gsm Matte Laminated Art Card',
      bagHex: '#141416',
      primaryInk: '#FFFFFF',
      accentInk: sitePrimary,
      mutedInk: '#A1A1AA',
      stripeColor: '#FFFFFF',
      handleColor: '#18181B',
      isDarkBag: true
    },
    {
      id: 'kraft',
      name: 'Nairobi Natural Kraft',
      badge: 'ECO KRAFT',
      material: '180gsm Unbleached Virgin Kraft Paper',
      bagHex: '#C9A47B',
      primaryInk: '#18181B',
      accentInk: sitePrimary,
      mutedInk: '#3F3F46',
      stripeColor: '#FFFFFF',
      handleColor: '#9A7750',
      isDarkBag: false
    },
    {
      id: 'chalk',
      name: 'Chalk Boutique White',
      material: '250gsm Uncoated Cotton Card',
      bagHex: '#F8F7F4',
      primaryInk: '#141416',
      accentInk: sitePrimary,
      mutedInk: '#52525B',
      stripeColor: '#FFFFFF',
      handleColor: '#141416',
      isDarkBag: false
    },
    {
      id: 'blaze',
      name: 'Blaze Drop Orange',
      material: '230gsm Coated Card / 100g Non-Woven Tote',
      bagHex: '#F36F21',
      primaryInk: '#FFFFFF',
      accentInk: '#111113',
      mutedInk: '#18181B',
      stripeColor: '#111113',
      handleColor: '#111113',
      isDarkBag: true
    },
    {
      id: 'rift-olive',
      name: 'Nairobi Green Kraft',
      badge: 'UHURU EDITION',
      material: '110gsm Laminated Non-Woven / Recycled Kraft',
      bagHex: '#1D3329',
      primaryInk: '#F6F3EC',
      accentInk: sitePrimary,
      mutedInk: '#CBD5CE',
      stripeColor: '#F6F3EC',
      handleColor: '#0E1C15',
      isDarkBag: true
    },
    {
      id: 'terracotta',
      name: 'Savanna Terracotta',
      material: '220gsm Dyed Textured Kraft Board',
      bagHex: '#9C4221',
      primaryInk: '#FFFBF5',
      accentInk: '#111113',
      mutedInk: '#FED7AA',
      stripeColor: '#111113',
      handleColor: '#431407',
      isDarkBag: true
    }
  ];
}
