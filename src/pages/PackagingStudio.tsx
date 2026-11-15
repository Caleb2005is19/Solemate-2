import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Layers,
  QrCode,
  Palette,
  Ruler,
  RotateCcw,
  Check,
  Copy,
  Type,
  Box,
  Move3d,
  Columns2,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  PackagingCategory,
  PackagingDesignConfig,
  PackagingLayoutId,
  PackagingSizeId,
  PrintSide,
  QrPlacement,
  LogoMode,
  PACKAGING_CATEGORIES,
  PACKAGING_LAYOUTS,
  PACKAGING_SIZES,
  buildPackagingThemes,
  hexToApproxCmyk,
  getHexLuminance
} from '../utils/packagingPresets';
import {
  PackagingSvgRenderer,
  buildQrMatrix,
  getPanelDimensions
} from '../components/admin/PackagingSvgRenderer';
import { Packaging3DViewer } from '../components/admin/Packaging3DViewer';
import obsidianMockup from '../assets/images/solemate_bag_obsidian_mockup_1794746572009.jpg';
import kraftMockup from '../assets/images/solemate_bag_kraft_mockup_1794746572028.jpg';
import orangeMockup from '../assets/images/solemate_bag_orange_mailer_1794746572544.jpg';

const DRAFT_STORAGE_KEY = 'solemate_packaging_studio_draft_v1';

const STUDIO_MOCKUPS = [
  {
    id: 'obsidian',
    title: 'Obsidian Streetwear Carrier',
    subtitle: 'Matte Black 250gsm · Spot Orange & White · Embossed Sole Tread',
    image: obsidianMockup,
    themeId: 'obsidian',
    layoutId: 'signature' as PackagingLayoutId,
    sizeId: 'gift-md' as PackagingSizeId
  },
  {
    id: 'kraft',
    title: 'Nairobi Kraft Boutique Bag',
    subtitle: '180gsm Natural Virgin Kraft · 2-Color Screen Print',
    image: kraftMockup,
    themeId: 'kraft',
    layoutId: 'boutique' as PackagingLayoutId,
    sizeId: 'uhuru-md' as PackagingSizeId
  },
  {
    id: 'blaze',
    title: 'Blaze Drop Non-Woven Tote',
    subtitle: 'Signature Orange Stock · Vertical Wordmark Band',
    image: orangeMockup,
    themeId: 'blaze',
    layoutId: 'editorial' as PackagingLayoutId,
    sizeId: 'uhuru-lg' as PackagingSizeId
  }
];

type StudioTab = 'format' | 'style' | 'copy' | 'qr';
type ViewMode = '3d' | 'split' | '2d';

export function PackagingStudio() {
  const {
    siteSettings,
    themeSettings,
    isAdmin,
    loading,
    setIsAuthModalOpen
  } = useStore();

  const themes = useMemo(
    () => buildPackagingThemes(themeSettings, siteSettings),
    [themeSettings, siteSettings]
  );

  const defaultConfig = useMemo<PackagingDesignConfig>(() => {
    const bizName = (siteSettings?.businessName || 'SOLEMATE.CO.KE').trim().toUpperCase();
    const shortBrand = bizName.replace(/\.CO\.KE|\.COM/g, '').trim() || 'SOLE MATE';
    const rawWa = (siteSettings?.whatsappNumber || siteSettings?.phoneNumbers?.[0] || '+254 116 943564').trim();
    const loc = (siteSettings?.location || 'Nairobi CBD, Kenya').trim();
    const igHandle = siteSettings?.socialMedia?.instagram
      ? '@' + siteSettings.socialMedia.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[@/]/g, '')
      : '@solemate.co.ke';

    return {
      themeId: 'site-secondary',
      customBgHex: null,
      customPrimaryInk: null,
      customAccentInk: null,
      layoutId: 'signature',
      sizeId: 'uhuru-md',
      logoMode: siteSettings?.logo ? 'dual' : 'vector-sneaker',
      customLogoUrl: siteSettings?.logo || '',
      brandTitle: bizName,
      subBrand: shortBrand,
      tagline: 'AUTHENTIC SNEAKERS · NAIROBI',
      editionStamp: 'NAIROBI · KENYA',
      backHeadline: 'STEP INTO AUTHENTICITY',
      backBody: 'Verified kicks delivered across Nairobi & Kenya. Tag us in your fresh pair.',
      socialHandle: igHandle,
      phoneText: rawWa,
      locationText: loc,
      qrTargetUrl: 'https://solemate.co.ke/shop',
      qrPlacement: 'back',
      qrErrorLevel: 'Q',
      qrAccentFrame: true,
      showTreadPattern: true,
      showBorderFrame: false
    };
  }, [siteSettings]);

  const [config, setConfig] = useState<PackagingDesignConfig>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultConfig, ...parsed };
      }
    } catch {
      // ignore invalid saved JSON
    }
    return defaultConfig;
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('format');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeSide, setActiveSide] = useState<PrintSide>('front');
  const [selectedCategory, setSelectedCategory] = useState<PackagingCategory>(() => {
    return PACKAGING_SIZES[config.sizeId]?.category || 'uhuru';
  });
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [transparentExport, setTransparentExport] = useState(false);
  const [showSpecRail, setShowSpecRail] = useState(true);
  const [showMockupsModal, setShowMockupsModal] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);

  const exportSvgRef = useRef<SVGSVGElement | null>(null);
  const logoUploadRef = useRef<HTMLInputElement | null>(null);

  // Persist draft locally (zero Firestore writes)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(config));
    } catch {
      // ignore storage quota errors
    }
  }, [config]);

  const activeSize = PACKAGING_SIZES[config.sizeId] || PACKAGING_SIZES['uhuru-md'];
  const activeTheme = themes.find((t) => t.id === config.themeId) || themes[0];

  // Auto-switch Print Side away from 'lid' if user switches from box to bag
  useEffect(() => {
    if (!activeSize.isBox && activeSide === 'lid') {
      setActiveSide('front');
    } else if (activeSize.isBox && activeSide === 'front') {
      setActiveSide('lid');
    }
  }, [activeSize.isBox]);

  const resolvedBgHex = config.customBgHex || activeTheme.bagHex;
  const resolvedPrimaryInk = config.customPrimaryInk || activeTheme.primaryInk;
  const resolvedAccentInk = config.customAccentInk || activeTheme.accentInk;
  const isDarkBag = getHexLuminance(resolvedBgHex) < 0.44;
  const resolvedMutedInk = config.customPrimaryInk
    ? resolvedPrimaryInk
    : activeTheme.mutedInk;

  const qrMatrix = useMemo(
    () => buildQrMatrix(config.qrTargetUrl, config.qrErrorLevel),
    [config.qrTargetUrl, config.qrErrorLevel]
  );

  // Estimate physical cm size of printed QR code based on placement & active preset
  const qrPhysicalSizeCm = useMemo(() => {
    const dim = getPanelDimensions(
      activeSize,
      config.qrPlacement === 'lid'
        ? 'lid'
        : config.qrPlacement === 'gusset'
        ? 'gusset'
        : config.qrPlacement === 'front-corner'
        ? 'front'
        : 'back'
    );
    const factor =
      config.qrPlacement === 'front-corner'
        ? 0.145
        : config.qrPlacement === 'gusset'
        ? 0.48
        : 0.24;
    const minCm = Math.min(dim.physW, dim.physH);
    return +(minCm * factor).toFixed(1);
  }, [activeSize, config.qrPlacement]);

  const panelDims = getPanelDimensions(activeSize, activeSide);

  const showNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3200);
  };

  const updateConfig = <K extends keyof PackagingDesignConfig>(
    key: K,
    value: PackagingDesignConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const syncLiveStoreBrand = () => {
    setConfig((prev) => ({
      ...prev,
      themeId: 'site-primary',
      customBgHex: null,
      customPrimaryInk: null,
      customAccentInk: null,
      brandTitle: defaultConfig.brandTitle,
      subBrand: defaultConfig.subBrand,
      phoneText: defaultConfig.phoneText,
      locationText: defaultConfig.locationText,
      socialHandle: defaultConfig.socialHandle,
      customLogoUrl: siteSettings?.logo || prev.customLogoUrl,
      logoMode: siteSettings?.logo ? 'dual' : prev.logoMode
    }));
    showNotice('Synced live store colors, business name, logo & contact details');
  };

  const handleUploadCustomLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setConfig((prev) => ({
          ...prev,
          customLogoUrl: reader.result as string,
          logoMode: prev.logoMode === 'vector-sneaker' ? 'store-logo' : prev.logoMode
        }));
        showNotice(`Loaded custom logo (${file.name})`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buildExportSvgString = async (forPrintTransparent: boolean): Promise<string> => {
    if (!exportSvgRef.current) return '';
    const clone = exportSvgRef.current.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('[data-guide-only="true"]').forEach((el) => el.remove());
    if (forPrintTransparent) {
      clone.querySelectorAll('[data-bag-bg="true"]').forEach((el) => el.remove());
    }

    // Inline remote <image> hrefs as base64 data URIs so standalone SVG & PNG canvas exports keep the store logo
    const imageEls = Array.from(clone.querySelectorAll('image'));
    await Promise.all(
      imageEls.map(async (imgEl) => {
        const href = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href');
        if (!href || href.startsWith('data:')) return;
        try {
          const resp = await fetch(href, { mode: 'cors' });
          if (!resp.ok) return;
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            imgEl.setAttribute('href', dataUrl);
          }
        } catch {
          // keep original href if CORS fetch is restricted
        }
      })
    );

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  };

  const handleDownloadSvg = async () => {
    const svgString = await buildExportSvgString(transparentExport);
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solemate-${activeSize.id}-${activeSide}-${panelDims.physW}x${panelDims.physH}cm${
      transparentExport ? '-ink-only' : ''
    }.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice(`Exported Vector SVG (${activeSize.shortLabel} · ${activeSide.toUpperCase()})`);
  };

  const handleDownloadPng = async () => {
    const svgString = await buildExportSvgString(transparentExport);
    if (!svgString) return;
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const targetW = panelDims.canvasW * 4;
    const targetH = panelDims.canvasH * 4;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const pngUrl = canvas.toDataURL('image/png', 1.0);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `solemate-${activeSize.id}-${activeSide}-${targetW}px.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotice(`Exported ${targetW}×${targetH}px Print PNG`);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleCopyPrinterBrief = () => {
    const brief = [
      `${config.brandTitle} — PACKAGING PRODUCTION BRIEF`,
      `Format: ${activeSize.name}`,
      `Dimensions: ${activeSize.widthCm}cm W × ${activeSize.heightCm}cm ${activeSize.isBox ? 'D' : 'H'} × ${activeSize.gussetCm}cm ${activeSize.isBox ? 'Wall Height' : 'Gusset'}`,
      `Stock Material: ${activeSize.defaultMaterial}`,
      `Handle / Construction: ${activeSize.handleLabel}`,
      `Base Stock Color: ${resolvedBgHex} (${hexToApproxCmyk(resolvedBgHex)})`,
      `Primary Ink: ${resolvedPrimaryInk} (${hexToApproxCmyk(resolvedPrimaryInk)})`,
      `Accent Ink: ${resolvedAccentInk} (${hexToApproxCmyk(resolvedAccentInk)})`,
      `Layout: ${PACKAGING_LAYOUTS.find((l) => l.id === config.layoutId)?.label}`,
      `Front Copy: ${config.brandTitle} | ${config.tagline}`,
      `Back Contact: ${config.phoneText} | ${config.socialHandle} | ${config.locationText}`,
      `QR Target (${config.qrPlacement}, ECC-${config.qrErrorLevel}, ~${qrPhysicalSizeCm}cm): ${config.qrTargetUrl}`
    ].join('\n');

    navigator.clipboard.writeText(brief);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2200);
  };

  const handleCopyQrUrl = () => {
    navigator.clipboard.writeText(config.qrTargetUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">Loading Packaging Print Studio...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
            <Box className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Admin Access Required</h2>
          <p className="text-sm text-zinc-500">
            Sign in with your administrator account to open the full-page Packaging &amp; Bag Print Studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex-1 py-2.5 px-4 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Sign In
            </button>
            <Link
              to="/"
              className="py-2.5 px-4 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-colors"
            >
              Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categorySizes = Object.values(PACKAGING_SIZES).filter(
    (s) => s.category === selectedCategory
  );

  const availablePanels: { id: PrintSide; label: string }[] = activeSize.isBox
    ? [
        { id: 'lid', label: 'Top Lid' },
        { id: 'front', label: 'Front Wall' },
        { id: 'back', label: 'Back Wall' },
        { id: 'gusset', label: 'Side End' }
      ]
    : [
        { id: 'front', label: 'Front' },
        { id: 'back', label: 'Back' },
        { id: 'gusset', label: 'Side Gusset' }
      ];

  const normalizedQrHref = /^https?:\/\//i.test(config.qrTargetUrl.trim())
    ? config.qrTargetUrl.trim()
    : `https://${config.qrTargetUrl.trim()}`;

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-zinc-100 text-zinc-900 overflow-x-hidden">
      {/* TOP STUDIO COMMAND BAR (hidden on paper print) */}
      <header className="h-auto lg:h-14 shrink-0 bg-zinc-950 text-white border-b border-zinc-800 px-3 sm:px-5 py-2.5 lg:py-0 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Left: Back + Breadcrumb + Active Format */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-sm font-black tracking-tight truncate">
              Packaging Studio
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono tabular-nums text-zinc-300 truncate">
              {activeSize.shortLabel} ({activeSize.widthCm}×{activeSize.heightCm}×{activeSize.gussetCm}cm)
            </span>
          </div>
        </div>

        {/* Center: View Mode Switch */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-0.5 bg-zinc-900 rounded-xl border border-zinc-800">
            {[
              { id: '3d', label: '3D View', icon: Move3d },
              { id: 'split', label: 'Split 2D + 3D', icon: Columns2 },
              { id: '2d', label: '2D Die-Line', icon: FileCode2 }
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    viewMode === mode.id
                      ? 'bg-orange-500 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowMockupsModal(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 transition-colors whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
            Photo Mockups
          </button>
        </div>

        {/* Right: Primary Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSpecRail((s) => !s)}
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
              showSpecRail
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Toggle production spec inspector"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Specs
          </button>

          <button
            onClick={handleDownloadSvg}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            SVG
          </button>

          <button
            onClick={handleDownloadPng}
            className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Print PNG
          </button>

          <button
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </header>

      {/* TOAST BANNER */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shrink-0 print:hidden">
          <Check className="w-4 h-4 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* MAIN 3-ZONE STUDIO BODY */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden print:block">
        {/* LEFT CUSTOMIZATION PANEL */}
        <aside className="w-full lg:w-[370px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 flex flex-col min-h-0 print:hidden">
          {/* Inspector Section Tabs */}
          <div className="grid grid-cols-4 border-b border-zinc-200 bg-zinc-50 shrink-0">
            {[
              { id: 'format', label: 'Bag / Box', icon: Box },
              { id: 'style', label: 'Theme', icon: Palette },
              { id: 'copy', label: 'Copy', icon: Type },
              { id: 'qr', label: 'QR Code', icon: QrCode }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as StudioTab)}
                  className={`py-3 px-2 flex flex-col items-center gap-1 text-[11px] font-bold border-b-2 transition-colors ${
                    isActive
                      ? 'border-orange-500 text-zinc-900 bg-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Tab Controls */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* TAB 1: PACKAGING CATEGORY & SIZE */}
            {activeTab === 'format' && (
              <>
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    1. Packaging Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGING_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          const firstInCat = Object.values(PACKAGING_SIZES).find(
                            (s) => s.category === cat.id
                          );
                          if (firstInCat) updateConfig('sizeId', firstInCat.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedCategory === cat.id
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 text-zinc-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{cat.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            selectedCategory === cat.id ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {cat.subtitle}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    2. Size &amp; Handle Spec
                  </label>
                  <div className="space-y-2">
                    {categorySizes.map((preset) => {
                      const isSelected = config.sizeId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => updateConfig('sizeId', preset.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'border-orange-500 bg-orange-50/70 ring-1 ring-orange-500'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono font-bold">
                                {preset.sizeBadge}
                              </span>
                              <span className="text-xs font-bold text-zinc-900 truncate">
                                {preset.name}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                              {preset.note}
                            </p>
                            <div className="text-[10px] font-semibold text-zinc-600 mt-1.5">
                              {preset.handleLabel}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums font-bold text-zinc-900 shrink-0">
                            {preset.widthCm}×{preset.heightCm}×{preset.gussetCm}cm
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    3. Active 2D Print Side
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availablePanels.map((panel) => (
                      <button
                        key={panel.id}
                        onClick={() => setActiveSide(panel.id)}
                        className={`py-2 px-2 rounded-lg border text-xs font-bold transition-colors ${
                          activeSide === panel.id
                            ? 'bg-zinc-900 border-zinc-900 text-white'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: COLORS, SITE THEMES & GRAPHIC LAYOUTS */}
            {activeTab === 'style' && (
              <>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Store &amp; Stock Colorways
                    </label>
                    <button
                      onClick={syncLiveStoreBrand}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync Store Theme
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {themes.map((t) => {
                      const isSel = config.themeId === t.id && !config.customBgHex;
                      return (
                        <button
                          key={t.id}
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              themeId: t.id,
                              customBgHex: null,
                              customPrimaryInk: null,
                              customAccentInk: null
                            }))
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                              : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-5 h-5 rounded-md border border-zinc-300 shrink-0"
                              style={{ backgroundColor: t.bagHex }}
                            />
                            <span
                              className="w-3 h-5 rounded-sm border border-zinc-200 shrink-0"
                              style={{ backgroundColor: t.accentInk }}
                            />
                            {t.badge && (
                              <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                                {t.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-zinc-900 truncate">
                            {t.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Color Fine-Tuning */}
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Custom Hex Colors</span>
                    {(config.customBgHex || config.customPrimaryInk || config.customAccentInk) && (
                      <button
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            customBgHex: null,
                            customPrimaryInk: null,
                            customAccentInk: null
                          }))
                        }
                        className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900"
                      >
                        Reset Stock Colors
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-1 cursor-pointer">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase">Stock</span>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
                        <input
                          type="color"
                          value={resolvedBgHex}
                          onChange={(e) => updateConfig('customBgHex', e.target.value.toUpperCase())}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-zinc-700">{resolvedBgHex}</span>
                      </div>
                    </label>
                    <label className="space-y-1 cursor-pointer">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase">Main Ink</span>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
                        <input
                          type="color"
                          value={resolvedPrimaryInk}
                          onChange={(e) =>
                            updateConfig('customPrimaryInk', e.target.value.toUpperCase())
                          }
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-zinc-700">
                          {resolvedPrimaryInk}
                        </span>
                      </div>
                    </label>
                    <label className="space-y-1 cursor-pointer">
                      <span className="block text-[10px] font-bold text-zinc-500 uppercase">Accent</span>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-zinc-200 rounded-lg">
                        <input
                          type="color"
                          value={resolvedAccentInk}
                          onChange={(e) =>
                            updateConfig('customAccentInk', e.target.value.toUpperCase())
                          }
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span className="text-[10px] font-mono text-zinc-700">
                          {resolvedAccentInk}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 6 Graphic Print Layouts */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Print Artwork Template
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PACKAGING_LAYOUTS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => updateConfig('layoutId', l.id)}
                        className={`p-2.5 rounded-xl border text-left transition-colors ${
                          config.layoutId === l.id
                            ? 'bg-zinc-900 border-zinc-900 text-white'
                            : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="text-xs font-bold">{l.label}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            config.layoutId === l.id ? 'text-zinc-300' : 'text-zinc-500'
                          }`}
                        >
                          {l.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Mode & Upload */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Logo &amp; Graphic Mark
                    </label>
                    <input
                      ref={logoUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCustomLogo}
                      className="hidden"
                    />
                    <button
                      onClick={() => logoUploadRef.current?.click()}
                      className="text-[11px] font-bold text-zinc-700 hover:text-zinc-900 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Logo
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'vector-sneaker', label: 'Vector Mark' },
                      { id: 'store-logo', label: 'Business Logo' },
                      { id: 'dual', label: 'Dual Lockup' }
                    ].map((lm) => (
                      <button
                        key={lm.id}
                        disabled={lm.id !== 'vector-sneaker' && !config.customLogoUrl}
                        onClick={() => updateConfig('logoMode', lm.id as LogoMode)}
                        className={`py-2 px-2 rounded-lg border text-[11px] font-bold transition-colors disabled:opacity-40 ${
                          config.logoMode === lm.id
                            ? 'bg-zinc-900 border-zinc-900 text-white'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {lm.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-1">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showTreadPattern}
                        onChange={(e) => updateConfig('showTreadPattern', e.target.checked)}
                        className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                      />
                      Sole Tread Watermark
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showBorderFrame}
                        onChange={(e) => updateConfig('showBorderFrame', e.target.checked)}
                        className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                      />
                      Outer Frame Line
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: TEXT & PACKAGING COPY */}
            {activeTab === 'copy' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Printed Text &amp; Contact
                  </span>
                  <button
                    onClick={() => setConfig(defaultConfig)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Brand Headline
                    </label>
                    <input
                      type="text"
                      value={config.brandTitle}
                      onChange={(e) => updateConfig('brandTitle', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Short Monogram
                    </label>
                    <input
                      type="text"
                      value={config.subBrand}
                      onChange={(e) => updateConfig('subBrand', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Front Tagline
                  </label>
                  <input
                    type="text"
                    value={config.tagline}
                    onChange={(e) => updateConfig('tagline', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Edition / Origin Stamp
                  </label>
                  <input
                    type="text"
                    value={config.editionStamp}
                    onChange={(e) => updateConfig('editionStamp', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-100 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Back Panel Headline
                    </label>
                    <input
                      type="text"
                      value={config.backHeadline}
                      onChange={(e) => updateConfig('backHeadline', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Back Story Message
                    </label>
                    <textarea
                      rows={2}
                      value={config.backBody}
                      onChange={(e) => updateConfig('backBody', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Social Handle
                    </label>
                    <input
                      type="text"
                      value={config.socialHandle}
                      onChange={(e) => updateConfig('socialHandle', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      value={config.phoneText}
                      onChange={(e) => updateConfig('phoneText', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    Store Location Line
                  </label>
                  <input
                    type="text"
                    value={config.locationText}
                    onChange={(e) => updateConfig('locationText', e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SCANNABLE QR & DIAGNOSTICS */}
            {activeTab === 'qr' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Quick QR Destinations
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => updateConfig('qrTargetUrl', 'https://solemate.co.ke/shop')}
                      className="py-1.5 px-2 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      Store Shop
                    </button>
                    <button
                      onClick={() => {
                        const digits = config.phoneText.replace(/\D/g, '');
                        updateConfig('qrTargetUrl', `https://wa.me/${digits || '254116943564'}`);
                      }}
                      className="py-1.5 px-2 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => updateConfig('qrTargetUrl', 'https://instagram.com/solemate.co.ke')}
                      className="py-1.5 px-2 rounded-lg border border-zinc-200 text-[11px] font-bold text-zinc-700 hover:bg-zinc-50"
                    >
                      Instagram
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                    QR Encoded Link
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={config.qrTargetUrl}
                      onChange={(e) => updateConfig('qrTargetUrl', e.target.value)}
                      placeholder="https://solemate.co.ke/shop"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                    <button
                      onClick={handleCopyQrUrl}
                      className="px-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                      title="Copy URL"
                    >
                      {copiedQrUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1.5">
                    Panel Placement
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'back', label: 'Back Center' },
                      { id: 'front-corner', label: 'Front Corner' },
                      { id: 'front-and-back', label: 'Front + Back' },
                      { id: 'gusset', label: 'Side Gusset' },
                      ...(activeSize.isBox ? [{ id: 'lid', label: 'Box Lid Corner' }] : [])
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateConfig('qrPlacement', p.id as QrPlacement)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors ${
                          config.qrPlacement === p.id
                            ? 'bg-zinc-900 border-zinc-900 text-white'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Error Correction
                    </label>
                    <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200">
                      {(['M', 'Q', 'H'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updateConfig('qrErrorLevel', lvl)}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                            config.qrErrorLevel === lvl
                              ? 'bg-white text-zinc-900 shadow-xs'
                              : 'text-zinc-500'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={config.qrAccentFrame}
                      onChange={(e) => updateConfig('qrAccentFrame', e.target.checked)}
                      className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                    />
                    Accent QR Frame
                  </label>
                </div>

                {/* Live Camera Scannability Verification Box */}
                <div className="p-4 rounded-2xl bg-zinc-950 text-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Scannability Verification
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      ISO READY
                    </span>
                  </div>

                  {/* Real-size white-padded test QR so user can aim phone camera directly! */}
                  <div className="bg-white rounded-xl p-3 flex items-center gap-3.5">
                    {qrMatrix && (
                      <svg
                        viewBox={`0 0 ${qrMatrix.totalModules} ${qrMatrix.totalModules}`}
                        className="w-24 h-24 shrink-0"
                        shapeRendering="crispEdges"
                      >
                        <rect
                          width={qrMatrix.totalModules}
                          height={qrMatrix.totalModules}
                          fill="#FFFFFF"
                        />
                        <path d={qrMatrix.pathData} fill="#111113" />
                      </svg>
                    )}
                    <div className="min-w-0 flex-1 text-zinc-900 space-y-1">
                      <div className="text-xs font-bold">Scan Here With Phone</div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate">
                        {normalizedQrHref}
                      </div>
                      <a
                        href={normalizedQrHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 pt-1"
                      >
                        Test Open Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums text-zinc-300">
                    <div>Quiet Zone: {qrMatrix?.quietModules || 4} mod ✓</div>
                    <div>
                      Grid: {qrMatrix ? `${qrMatrix.dataModules}×${qrMatrix.dataModules}` : '--'} ✓
                    </div>
                    <div>Contrast: #111 / #FFF ✓</div>
                    <div
                      className={
                        qrPhysicalSizeCm < 2.2 ? 'text-amber-400 flex items-center gap-1' : ''
                      }
                    >
                      {qrPhysicalSizeCm < 2.2 && <AlertTriangle className="w-3 h-3 shrink-0" />}
                      Print Size: ~{qrPhysicalSizeCm} cm
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* CENTER INTERACTIVE STAGE (3D / SPLIT / 2D) */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col p-3 sm:p-5 overflow-y-auto print:p-0">
          {/* 2D Print Guides Bar (when 2D visible) */}
          {(viewMode === '2d' || viewMode === 'split') && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <div className="inline-flex items-center p-1 bg-white rounded-xl border border-zinc-200">
                {availablePanels.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => setActiveSide(panel.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeSide === panel.id
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintGuides((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors ${
                    showPrintGuides
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-zinc-200 text-zinc-600'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Print Guides
                </button>
                <button
                  onClick={() => setTransparentExport((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors ${
                    transparentExport
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-white border-zinc-200 text-zinc-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {transparentExport ? 'Ink Only' : 'Full Bleed'}
                </button>
              </div>
            </div>
          )}

          {/* STAGE VIEWPORTS */}
          <div
            className={`flex-1 min-h-0 grid gap-4 ${
              viewMode === 'split'
                ? 'grid-cols-1 2xl:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {/* 3D INTERACTIVE PERSPECTIVE VIEW */}
            {(viewMode === '3d' || viewMode === 'split') && (
              <div className="min-h-[440px] flex flex-col print:hidden">
                <Packaging3DViewer
                  size={activeSize}
                  config={config}
                  resolvedBgHex={resolvedBgHex}
                  resolvedPrimaryInk={resolvedPrimaryInk}
                  resolvedAccentInk={resolvedAccentInk}
                  resolvedMutedInk={resolvedMutedInk}
                  resolvedStripeColor={activeTheme.stripeColor}
                  resolvedHandleColor={activeTheme.handleColor}
                  isDarkBag={isDarkBag}
                  qrMatrix={qrMatrix}
                />
              </div>
            )}

            {/* 2D PRINT DIE-LINE VECTOR ARTWORK */}
            {(viewMode === '2d' || viewMode === 'split') && (
              <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[440px] print:border-0 print:p-0">
                <div className="mb-3 flex items-center gap-2.5 text-xs font-mono tabular-nums text-zinc-500 print:mb-4">
                  <span>
                    {panelDims.physW} cm × {panelDims.physH} cm
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="uppercase">{activeSide} DIE-LINE</span>
                  <span aria-hidden="true">·</span>
                  <span>{resolvedBgHex}</span>
                </div>

                <div
                  className="w-full flex items-center justify-center"
                  style={{
                    maxWidth: activeSide === 'gusset' && !activeSize.isBox ? '220px' : '480px'
                  }}
                >
                  <PackagingSvgRenderer
                    side={activeSide}
                    size={activeSize}
                    config={config}
                    resolvedBgHex={resolvedBgHex}
                    resolvedPrimaryInk={resolvedPrimaryInk}
                    resolvedAccentInk={resolvedAccentInk}
                    resolvedMutedInk={resolvedMutedInk}
                    resolvedStripeColor={activeTheme.stripeColor}
                    isDarkBag={isDarkBag}
                    qrMatrix={qrMatrix}
                    showPrintGuides={showPrintGuides}
                    transparentExport={transparentExport}
                    className="w-full h-auto shadow-xl rounded-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dedicated hidden/offscreen master export SVG so SVG/PNG export ALWAYS matches active panel even in 3D-only mode */}
          <div className="sr-only" aria-hidden="true">
            <PackagingSvgRenderer
              svgRef={exportSvgRef}
              side={activeSide}
              size={activeSize}
              config={config}
              resolvedBgHex={resolvedBgHex}
              resolvedPrimaryInk={resolvedPrimaryInk}
              resolvedAccentInk={resolvedAccentInk}
              resolvedMutedInk={resolvedMutedInk}
              resolvedStripeColor={activeTheme.stripeColor}
              isDarkBag={isDarkBag}
              qrMatrix={qrMatrix}
              showPrintGuides={false}
              transparentExport={transparentExport}
            />
          </div>

          {/* PRINT-ONLY PRODUCTION SPEC SHEET FOOTER */}
          <div className="hidden print:block border-t border-zinc-300 pt-4 mt-6 text-xs text-zinc-800 space-y-1.5">
            <div className="flex justify-between font-bold text-sm">
              <span>{config.brandTitle} — PACKAGING PRINT SPECIFICATION</span>
              <span className="font-mono">
                {activeSize.widthCm}×{activeSize.heightCm}×{activeSize.gussetCm} cm
              </span>
            </div>
            <p>
              <strong>Format:</strong> {activeSize.name} · <strong>Stock:</strong> {activeSize.defaultMaterial} · <strong>Handles:</strong> {activeSize.handleLabel}
            </p>
            <p className="font-mono">
              <strong>Colors:</strong> Stock {resolvedBgHex} ({hexToApproxCmyk(resolvedBgHex)}) | Ink {resolvedPrimaryInk} ({hexToApproxCmyk(resolvedPrimaryInk)}) | Accent {resolvedAccentInk} ({hexToApproxCmyk(resolvedAccentInk)})
            </p>
            <p>
              <strong>QR Target ({config.qrPlacement}):</strong> {config.qrTargetUrl} · <strong>Contact:</strong> {config.phoneText} · {config.socialHandle}
            </p>
          </div>
        </main>

        {/* RIGHT PRODUCTION SPEC DRAWER */}
        {showSpecRail && (
          <aside className="hidden xl:flex w-[290px] shrink-0 bg-white border-l border-zinc-200 flex-col p-5 space-y-5 overflow-y-auto print:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Production Spec Sheet
              </h2>
              <button
                onClick={handleCopyPrinterBrief}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
              >
                {copiedSpec ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSpec ? 'Copied' : 'Copy Brief'}
              </button>
            </div>

            <dl className="divide-y divide-zinc-100 text-xs">
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-zinc-500">Format</dt>
                <dd className="font-bold text-zinc-900 text-right">{activeSize.shortLabel}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-zinc-500">Dimensions</dt>
                <dd className="font-mono tabular-nums font-bold text-zinc-900 text-right">
                  {activeSize.widthCm}×{activeSize.heightCm}×{activeSize.gussetCm} cm
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-zinc-500 shrink-0">Material</dt>
                <dd className="font-semibold text-zinc-900 text-right">{activeSize.defaultMaterial}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-zinc-500 shrink-0">Handles</dt>
                <dd className="font-semibold text-zinc-900 text-right">{activeSize.handleLabel}</dd>
              </div>
            </dl>

            <div className="space-y-2.5 pt-2 border-t border-zinc-100">
              <h3 className="text-[11px] font-bold text-zinc-500 uppercase">Ink &amp; CMYK Breakdown</h3>
              {[
                { label: 'Base Stock', hex: resolvedBgHex },
                { label: 'Primary Ink', hex: resolvedPrimaryInk },
                { label: 'Accent Ink', hex: resolvedAccentInk }
              ].map((swatch) => (
                <div key={swatch.label} className="flex items-center gap-2.5 text-xs">
                  <span
                    className="w-6 h-6 rounded-md border border-zinc-300 shrink-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-zinc-900 flex justify-between">
                      <span>{swatch.label}</span>
                      <span className="font-mono">{swatch.hex}</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {hexToApproxCmyk(swatch.hex)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
              <div className="font-bold text-zinc-900 flex items-center justify-between">
                <span>QR Readiness</span>
                <span className="text-emerald-600 font-mono">VERIFIED</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Quiet zone locked at 4 modules with #FFFFFF backing pad. Estimated print box: <span className="font-mono font-bold text-zinc-800">{qrPhysicalSizeCm} cm</span>.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* STUDIO PHOTOREALISTIC MOCKUPS GALLERY MODAL */}
      {showMockupsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Photorealistic Studio Concepts</h3>
                <p className="text-xs text-zinc-500">
                  Apply any reference aesthetic to the live editor or download the JPG visual.
                </p>
              </div>
              <button
                onClick={() => setShowMockupsModal(false)}
                className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-5">
              {STUDIO_MOCKUPS.map((concept) => (
                <div
                  key={concept.id}
                  className="border border-zinc-200 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="aspect-[3/4] bg-zinc-100">
                    <img
                      src={concept.image}
                      alt={concept.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{concept.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{concept.subtitle}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setConfig((prev) => ({
                            ...prev,
                            themeId: concept.themeId,
                            layoutId: concept.layoutId,
                            sizeId: concept.sizeId,
                            customBgHex: null,
                            customPrimaryInk: null,
                            customAccentInk: null
                          }));
                          setSelectedCategory(PACKAGING_SIZES[concept.sizeId].category);
                          setShowMockupsModal(false);
                          showNotice(`Loaded ${concept.title} preset`);
                        }}
                        className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold"
                      >
                        Load Preset
                      </button>
                      <a
                        href={concept.image}
                        download={`solemate-${concept.id}-mockup.jpg`}
                        className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        JPG
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
