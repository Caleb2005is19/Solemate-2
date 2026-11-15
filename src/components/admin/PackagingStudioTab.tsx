import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  ShoppingBag,
  Download,
  Printer,
  Eye,
  Layers,
  QrCode,
  Sparkles,
  Check,
  Ruler,
  Palette,
  RotateCcw,
  Image as ImageIcon,
  FileCode2,
  Copy
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import obsidianMockup from '../../assets/images/solemate_bag_obsidian_mockup_1794746572009.jpg';
import kraftMockup from '../../assets/images/solemate_bag_kraft_mockup_1794746572028.jpg';
import orangeMockup from '../../assets/images/solemate_bag_orange_mailer_1794746572544.jpg';

type BagThemeId = 'obsidian' | 'kraft' | 'blaze' | 'chalk';
type BagLayoutId = 'signature' | 'editorial' | 'boutique';
type BagSizeId = 'standard-box' | 'xl-box' | 'poly-mailer' | 'dust-bag';
type PrintSide = 'front' | 'back' | 'gusset';

interface BagTheme {
  id: BagThemeId;
  name: string;
  material: string;
  handleSpec: string;
  bagHex: string;
  bagCmyk: string;
  primaryInk: string;
  primaryInkName: string;
  primaryInkCmyk: string;
  accentInk: string;
  accentInkName: string;
  accentInkCmyk: string;
  mutedInk: string;
  stripeColor: string;
  isDarkBag: boolean;
}

interface BagSizePreset {
  id: BagSizeId;
  name: string;
  widthCm: number;
  heightCm: number;
  gussetCm: number;
  viewW: number;
  viewH: number;
  gussetW: number;
  hasRopeHoles: boolean;
  note: string;
}

const BAG_THEMES: Record<BagThemeId, BagTheme> = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Matte Black',
    material: '250gsm Matte Laminated Art Card',
    handleSpec: '5mm Woven Black PP Rope + Metal Eyelets',
    bagHex: '#141416',
    bagCmyk: 'C75 M68 Y67 K90',
    primaryInk: '#FFFFFF',
    primaryInkName: 'Opaque White Ink',
    primaryInkCmyk: 'C0 M0 Y0 K0 (Spot White)',
    accentInk: '#F36F21',
    accentInkName: 'Solemate Blaze Orange',
    accentInkCmyk: 'C0 M71 Y96 K0',
    mutedInk: '#A1A1AA',
    stripeColor: '#FFFFFF',
    isDarkBag: true
  },
  kraft: {
    id: 'kraft',
    name: 'Nairobi Natural Kraft',
    material: '180gsm Unbleached Virgin Kraft Paper',
    handleSpec: 'Twisted Brown Kraft Paper Handles',
    bagHex: '#C9A47B',
    bagCmyk: 'C18 M34 Y54 K6 (Stock)',
    primaryInk: '#18181B',
    primaryInkName: 'Matte Jet Black',
    primaryInkCmyk: 'C40 M30 Y30 K100',
    accentInk: '#F36F21',
    accentInkName: 'Solemate Blaze Orange',
    accentInkCmyk: 'C0 M71 Y96 K0',
    mutedInk: '#3F3F46',
    stripeColor: '#FFFFFF',
    isDarkBag: false
  },
  blaze: {
    id: 'blaze',
    name: 'Blaze Drop Orange',
    material: '230gsm Coated Card / 80g Non-Woven Tote',
    handleSpec: '25mm Black Cotton Webbing Ribbon',
    bagHex: '#F36F21',
    bagCmyk: 'C0 M71 Y96 K0',
    primaryInk: '#FFFFFF',
    primaryInkName: 'Crisp White Ink',
    primaryInkCmyk: 'C0 M0 Y0 K0',
    accentInk: '#111113',
    accentInkName: 'Rich Street Black',
    accentInkCmyk: 'C75 M68 Y67 K90',
    mutedInk: '#18181B',
    stripeColor: '#111113',
    isDarkBag: true
  },
  chalk: {
    id: 'chalk',
    name: 'Chalk Boutique White',
    material: '250gsm Uncoated Cotton Card',
    handleSpec: '20mm Black Grosgrain Ribbon',
    bagHex: '#F8F7F4',
    bagCmyk: 'C2 M2 Y4 K0 (Stock)',
    primaryInk: '#141416',
    primaryInkName: 'Rich Black Ink',
    primaryInkCmyk: 'C60 M40 Y40 K100',
    accentInk: '#F36F21',
    accentInkName: 'Solemate Blaze Orange',
    accentInkCmyk: 'C0 M71 Y96 K0',
    mutedInk: '#52525B',
    stripeColor: '#FFFFFF',
    isDarkBag: false
  }
};

const BAG_SIZES: Record<BagSizeId, BagSizePreset> = {
  'standard-box': {
    id: 'standard-box',
    name: 'Single Shoe Box Carrier',
    widthCm: 35,
    heightCm: 42,
    gussetCm: 14,
    viewW: 700,
    viewH: 840,
    gussetW: 280,
    hasRopeHoles: true,
    note: 'Fits 1 standard Nike/Jordan/Adidas shoebox upright or flat.'
  },
  'xl-box': {
    id: 'xl-box',
    name: 'Wide Streetwear Carrier',
    widthCm: 42,
    heightCm: 36,
    gussetCm: 16,
    viewW: 840,
    viewH: 720,
    gussetW: 320,
    hasRopeHoles: true,
    note: 'Wide landscape profile for oversized sneaker boxes or 2 pairs.'
  },
  'poly-mailer': {
    id: 'poly-mailer',
    name: 'Courier Poly Mailer',
    widthCm: 38,
    heightCm: 50,
    gussetCm: 0,
    viewW: 760,
    viewH: 1000,
    gussetW: 240,
    hasRopeHoles: false,
    note: 'Waterproof Fargo / boda courier shipping pouch with peel-and-seal flap.'
  },
  'dust-bag': {
    id: 'dust-bag',
    name: 'Drawstring Dust Bag',
    widthCm: 34,
    heightCm: 44,
    gussetCm: 0,
    viewW: 680,
    viewH: 880,
    gussetW: 240,
    hasRopeHoles: false,
    note: 'Reusable non-woven or canvas shoe protection bag inside boxes.'
  }
};

const MOCKUP_CONCEPTS = [
  {
    id: 'obsidian',
    title: 'Obsidian Streetwear Carrier',
    subtitle: 'Matte Black 250gsm · Spot Orange & White · Embossed Sole Tread',
    image: obsidianMockup,
    themeId: 'obsidian' as BagThemeId,
    layoutId: 'signature' as BagLayoutId,
    sizeId: 'standard-box' as BagSizeId
  },
  {
    id: 'kraft',
    title: 'Nairobi Kraft Boutique Bag',
    subtitle: '180gsm Natural Virgin Kraft · 2-Color Black & Blaze Screen Print',
    image: kraftMockup,
    themeId: 'kraft' as BagThemeId,
    layoutId: 'boutique' as BagLayoutId,
    sizeId: 'standard-box' as BagSizeId
  },
  {
    id: 'blaze',
    title: 'Blaze Drop Non-Woven Tote',
    subtitle: 'Signature Orange Stock · Vertical Wordmark Band · High-Visibility Street Carry',
    image: orangeMockup,
    themeId: 'blaze' as BagThemeId,
    layoutId: 'editorial' as BagLayoutId,
    sizeId: 'xl-box' as BagSizeId
  }
];

export function PackagingStudioTab() {
  const { siteSettings } = useStore();

  const [workspaceMode, setWorkspaceMode] = useState<'designer' | 'mockups'>('designer');
  const [themeId, setThemeId] = useState<BagThemeId>('obsidian');
  const [layoutId, setLayoutId] = useState<BagLayoutId>('signature');
  const [sizeId, setSizeId] = useState<BagSizeId>('standard-box');
  const [activeSide, setActiveSide] = useState<PrintSide>('front');
  const [showPrintGuides, setShowPrintGuides] = useState(true);
  const [transparentExport, setTransparentExport] = useState(false);

  // Editable packaging copy (pre-populated from store settings)
  const [brandTitle, setBrandTitle] = useState('SOLEMATE.CO.KE');
  const [subBrand, setSubBrand] = useState('SOLE MATE KE');
  const [tagline, setTagline] = useState('AUTHENTIC SNEAKERS · NAIROBI');
  const [backHeadline, setBackHeadline] = useState('STEP INTO AUTHENTICITY');
  const [backBody, setBackBody] = useState('Verified kicks delivered across Nairobi & Kenya. Tag us in your fresh pair.');
  const [socialHandle, setSocialHandle] = useState('@solemate.co.ke');
  const [phoneText, setPhoneText] = useState(siteSettings?.whatsappNumber || siteSettings?.phoneNumbers?.[0] || '+254 116 943564');
  const [locationText, setLocationText] = useState(siteSettings?.location || 'Nairobi CBD, Kenya');
  const [qrTargetUrl, setQrTargetUrl] = useState('https://solemate.co.ke/shop');
  const [showQrOnFront, setShowQrOnFront] = useState(false);
  const [showTreadPattern, setShowTreadPattern] = useState(true);

  const [qrPaths, setQrPaths] = useState<{ viewBox: string; pathData: string } | null>(null);
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const theme = BAG_THEMES[themeId];
  const size = BAG_SIZES[sizeId];

  // Sync contact info once siteSettings finishes loading if still at defaults
  useEffect(() => {
    if (siteSettings?.whatsappNumber) {
      setPhoneText(siteSettings.whatsappNumber);
    } else if (siteSettings?.phoneNumbers?.[0]) {
      setPhoneText(siteSettings.phoneNumbers[0]);
    }
    if (siteSettings?.location) {
      setLocationText(siteSettings.location);
    }
  }, [siteSettings]);

  // Generate crisp vector QR path
  useEffect(() => {
    let active = true;
    const url = qrTargetUrl.trim() || 'https://solemate.co.ke';
    QRCode.toString(url, {
      type: 'svg',
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff00'
      }
    })
      .then((svgStr) => {
        if (!active) return;
        const vbMatch = svgStr.match(/viewBox="([^"]+)"/);
        const pathMatches = [...svgStr.matchAll(/<path[^>]*d="([^"]+)"/g)];
        // Second path in qrcode svg is usually the dark modules; if 1 path, use it
        const modulePath = pathMatches.length > 1 ? pathMatches[1][1] : pathMatches[0]?.[1] || '';
        if (vbMatch && modulePath) {
          setQrPaths({ viewBox: vbMatch[1], pathData: modulePath });
        }
      })
      .catch(() => {
        if (active) setQrPaths(null);
      });
    return () => {
      active = false;
    };
  }, [qrTargetUrl]);

  const showNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3200);
  };

  // Build standalone clean SVG markup for export (honoring transparentExport toggle & hiding guide lines)
  const buildExportSvgString = (forPrintTransparent: boolean): string => {
    if (!svgRef.current) return '';
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;

    // Remove visual-only print guides & handle shadows from final exported artwork if exporting clean print file
    clone.querySelectorAll('[data-guide-only="true"]').forEach((el) => el.remove());

    if (forPrintTransparent) {
      clone.querySelectorAll('[data-bag-bg="true"]').forEach((el) => el.remove());
    }

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  };

  const handleDownloadSvg = () => {
    const svgString = buildExportSvgString(transparentExport);
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solemate-bag-${themeId}-${activeSide}-${size.widthCm}x${size.heightCm}cm${transparentExport ? '-ink-only' : ''}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice(`Downloaded vector SVG (${activeSide.toUpperCase()})`);
  };

  const handleDownloadPng = async () => {
    const svgString = buildExportSvgString(transparentExport);
    if (!svgString) return;

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    const targetW = activeSide === 'gusset' ? size.gussetW * 4 : size.viewW * 4; // ~2800-3360px high-DPI print resolution
    const targetH = size.viewH * 4;

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
        a.download = `solemate-bag-${themeId}-${activeSide}-${targetW}px.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotice(`Downloaded ${targetW}×${targetH}px Print PNG`);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDownloadMockup = (imageUrl: string, name: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${name}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotice('Downloaded studio mockup image');
  };

  const handleCopyPrinterBrief = () => {
    const brief = [
      `SOLEMATE.CO.KE PACKAGING PRINT BRIEF`,
      `Style: ${theme.name}`,
      `Bag Type: ${size.name} (${size.widthCm}cm W × ${size.heightCm}cm H${size.gussetCm ? ` × ${size.gussetCm}cm Gusset` : ''})`,
      `Material: ${theme.material}`,
      `Handles: ${theme.handleSpec}`,
      `Base Stock Color: ${theme.bagHex} (${theme.bagCmyk})`,
      `Primary Ink: ${theme.primaryInkName} (${theme.primaryInk} / ${theme.primaryInkCmyk})`,
      `Accent Ink: ${theme.accentInkName} (${theme.accentInk} / ${theme.accentInkCmyk})`,
      `Front Copy: ${brandTitle} | ${tagline}`,
      `Contact on Bag: ${phoneText} | ${socialHandle} | ${locationText}`,
      `QR Destination: ${qrTargetUrl}`
    ].join('\n');

    navigator.clipboard.writeText(brief);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2200);
  };

  const handlePrintSpecSheet = () => {
    window.print();
  };

  const canvasW = activeSide === 'gusset' ? size.gussetW : size.viewW;
  const canvasH = size.viewH;

  // Compute safe coordinates dynamically so layout scales neatly across Portrait, Landscape, Mailer & Gusset
  const safeTop = size.hasRopeHoles ? 130 : 75;
  const safeSide = 56;
  const safeBottom = 56;

  // Render Solemate Vector Shoe Icon centered at (cx, cy) with scale
  const renderShoeMark = (
    cx: number,
    cy: number,
    scale: number,
    shoeColor: string,
    stripeFill: string
  ) => {
    // Original Shoe viewBox is 0 0 500 350 -> center around (275, 165)
    const tx = cx - 275 * scale;
    const ty = cy - 165 * scale;
    return (
      <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
        <path
          d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z"
          fill={shoeColor}
        />
        <line x1="225" y1="75" x2="250" y2="160" stroke={stripeFill} strokeWidth="18" strokeLinecap="round" />
        <line x1="270" y1="95" x2="295" y2="170" stroke={stripeFill} strokeWidth="18" strokeLinecap="round" />
        <line x1="315" y1="125" x2="340" y2="185" stroke={stripeFill} strokeWidth="18" strokeLinecap="round" />
        <path
          d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z"
          fill={shoeColor}
        />
      </g>
    );
  };

  // Subtle geometric sneaker outsole tread graphic at bottom edge
  const renderTreadGraphic = useMemo(() => {
    const treadOpacity = theme.isDarkBag ? 0.14 : 0.08;
    const treadColor = theme.id === 'blaze' ? '#111113' : theme.primaryInk;
    return (
      <g opacity={treadOpacity} fill="none" stroke={treadColor} strokeWidth="3">
        {/* Stylized outsole arch */}
        <path
          d={`M ${canvasW * 0.12} ${canvasH - 14} C ${canvasW * 0.18} ${canvasH - 135}, ${canvasW * 0.42} ${canvasH - 110}, ${canvasW * 0.56} ${canvasH - 125} C ${canvasW * 0.72} ${canvasH - 142}, ${canvasW * 0.88} ${canvasH - 115}, ${canvasW * 0.90} ${canvasH - 14} Z`}
          strokeWidth="4"
        />
        {/* Tread ribs */}
        {[0.2, 0.27, 0.34, 0.41, 0.48, 0.58, 0.65, 0.72, 0.79].map((ratio, i) => (
          <line
            key={i}
            x1={canvasW * ratio}
            y1={canvasH - 108 + (i % 2 === 0 ? 12 : 4)}
            x2={canvasW * (ratio + 0.03)}
            y2={canvasH - 22}
            strokeWidth={i % 3 === 0 ? '6' : '3'}
            strokeLinecap="round"
          />
        ))}
        {/* Inner heel circle */}
        <circle cx={canvasW * 0.25} cy={canvasH - 58} r="18" strokeWidth="3" />
      </g>
    );
  }, [canvasW, canvasH, theme]);

  const qrBoxSize = activeSide === 'back' ? 136 : 86;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-200 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Packaging & Bag Print Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Custom carrier bag visuals, studio mockups, and vector print files ready for Nairobi printers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Mode Switch */}
          <div className="inline-flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
            <button
              onClick={() => setWorkspaceMode('designer')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                workspaceMode === 'designer'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-orange-500" />
              Print Artwork Editor
            </button>
            <button
              onClick={() => setWorkspaceMode('mockups')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                workspaceMode === 'mockups'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
              3D Bag Concepts ({MOCKUP_CONCEPTS.length})
            </button>
          </div>

          <button
            onClick={handlePrintSpecSheet}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-900 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4 text-zinc-600" />
            Print Spec Sheet
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 print:hidden">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* VIEW 1: STUDIO 3D MOCKUP CONCEPTS */}
      {workspaceMode === 'mockups' && (
        <div className="space-y-6 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MOCKUP_CONCEPTS.map((concept) => (
              <div
                key={concept.id}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[3/4] bg-zinc-100 relative overflow-hidden">
                  <img
                    src={concept.image}
                    alt={concept.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">{concept.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{concept.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        setThemeId(concept.themeId);
                        setLayoutId(concept.layoutId);
                        setSizeId(concept.sizeId);
                        setActiveSide('front');
                        setWorkspaceMode('designer');
                      }}
                      className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      Open Print Files
                    </button>
                    <button
                      onClick={() => handleDownloadMockup(concept.image, `solemate-${concept.id}-bag-mockup`)}
                      className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      title="Download studio mockup JPG"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JPG
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: PRINT ARTWORK DESIGNER & EXPORTER */}
      {workspaceMode === 'designer' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT: LIVE PRINT CANVAS PREVIEW */}
          <div className="xl:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 space-y-5">
            {/* Canvas Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="inline-flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                {(['front', 'back', 'gusset'] as PrintSide[]).map((side) => (
                  <button
                    key={side}
                    onClick={() => setActiveSide(side)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                      activeSide === side
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {side === 'gusset' ? 'Side Gusset' : `${side} Panel`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintGuides((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                    showPrintGuides
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Print Guides
                </button>
                <button
                  onClick={() => setTransparentExport((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap ${
                    transparentExport
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900'
                  }`}
                  title="Export only the ink graphics with transparent background for pre-colored bags"
                >
                  <Layers className="w-3.5 h-3.5" />
                  {transparentExport ? 'Ink Only (No Bg)' : 'Full Bleed'}
                </button>
              </div>
            </div>

            {/* Artwork Frame */}
            <div className="bg-zinc-100/80 border border-zinc-200 rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center relative min-h-[480px]">
              {/* Dimension Header */}
              <div className="mb-4 flex items-center gap-3 text-xs font-mono tabular-nums text-zinc-500">
                <span>
                  {activeSide === 'gusset' ? size.gussetCm || 14 : size.widthCm} cm (W) × {size.heightCm} cm (H)
                </span>
                <span aria-hidden="true">·</span>
                <span>{theme.name}</span>
              </div>

              {/* MASTER PRINTABLE VECTOR SVG */}
              <div
                className="w-full flex items-center justify-center"
                style={{
                  maxWidth: activeSide === 'gusset' ? '220px' : '440px'
                }}
              >
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${canvasW} ${canvasH}`}
                  className="w-full h-auto shadow-xl rounded-sm"
                  style={{
                    backgroundImage: transparentExport
                      ? 'repeating-conic-gradient(#e4e4e7 0% 25%, #ffffff 0% 50%)'
                      : undefined,
                    backgroundSize: transparentExport ? '16px 16px' : undefined
                  }}
                >
                  {/* Bag Stock Background */}
                  {!transparentExport && (
                    <rect
                      data-bag-bg="true"
                      x="0"
                      y="0"
                      width={canvasW}
                      height={canvasH}
                      fill={theme.bagHex}
                    />
                  )}

                  {/* Subtle Kraft Paper Grain Overlay for Kraft Theme */}
                  {!transparentExport && theme.id === 'kraft' && (
                    <rect
                      data-bag-bg="true"
                      x="0"
                      y="0"
                      width={canvasW}
                      height={canvasH}
                      fill="#7C5836"
                      opacity="0.06"
                    />
                  )}

                  {/* Top Handle Punch Zone & Eyelets */}
                  {size.hasRopeHoles && activeSide !== 'gusset' && (
                    <g data-guide-only="true">
                      <line
                        x1="0"
                        y1="100"
                        x2={canvasW}
                        y2="100"
                        stroke={theme.isDarkBag ? '#FFFFFF' : '#18181B'}
                        strokeWidth="1"
                        strokeDasharray="6 6"
                        opacity="0.22"
                      />
                      <circle
                        cx={canvasW * 0.34}
                        cy="60"
                        r="11"
                        fill={theme.isDarkBag ? '#27272A' : '#E4E4E7'}
                        stroke={theme.isDarkBag ? '#52525B' : '#A1A1AA'}
                        strokeWidth="3"
                      />
                      <circle
                        cx={canvasW * 0.66}
                        cy="60"
                        r="11"
                        fill={theme.isDarkBag ? '#27272A' : '#E4E4E7'}
                        stroke={theme.isDarkBag ? '#52525B' : '#A1A1AA'}
                        strokeWidth="3"
                      />
                    </g>
                  )}

                  {/* ============== FRONT PANEL ARTWORK ============== */}
                  {activeSide === 'front' && (
                    <g>
                      {/* LAYOUT 1: SIGNATURE CENTER EMBLEM */}
                      {layoutId === 'signature' && (
                        <>
                          {showTreadPattern && renderTreadGraphic}

                          {/* Center Sneaker Logo */}
                          {renderShoeMark(
                            canvasW / 2,
                            canvasH * 0.40,
                            canvasW > canvasH ? 0.68 : 0.72,
                            theme.id === 'blaze' ? '#FFFFFF' : theme.accentInk,
                            theme.id === 'blaze' ? '#111113' : theme.stripeColor
                          )}

                          {/* Brand Wordmark */}
                          <text
                            x={canvasW / 2}
                            y={canvasH * 0.575}
                            textAnchor="middle"
                            fill={theme.primaryInk}
                            fontFamily="'Space Grotesk', 'Arial Black', 'Helvetica Neue', sans-serif"
                            fontWeight="900"
                            fontSize={canvasW * 0.088}
                            letterSpacing="2"
                          >
                            {brandTitle}
                          </text>

                          {/* Tagline */}
                          <text
                            x={canvasW / 2}
                            y={canvasH * 0.63}
                            textAnchor="middle"
                            fill={theme.id === 'blaze' ? '#111113' : theme.mutedInk}
                            fontFamily="'Inter', 'Helvetica Neue', sans-serif"
                            fontWeight="700"
                            fontSize={canvasW * 0.028}
                            letterSpacing="6"
                          >
                            {tagline}
                          </text>

                          {/* Subtle Accent Bar */}
                          <rect
                            x={canvasW / 2 - 42}
                            y={canvasH * 0.665}
                            width="84"
                            height="4"
                            rx="2"
                            fill={theme.accentInk}
                          />

                          {/* Optional Mini QR on Front Bottom Right */}
                          {showQrOnFront && qrPaths && (
                            <g transform={`translate(${canvasW - safeSide - 84}, ${canvasH - safeBottom - 84})`}>
                              <rect x="-8" y="-8" width="100" height="100" rx="10" fill="#FFFFFF" />
                              <g transform="scale(2.8)">
                                <path d={qrPaths.pathData} fill="#111113" />
                              </g>
                            </g>
                          )}
                        </>
                      )}

                      {/* LAYOUT 2: EDITORIAL VERTICAL STRIPE */}
                      {layoutId === 'editorial' && (
                        <>
                          {/* Vertical Contrast Band */}
                          <rect
                            x={canvasW * 0.72}
                            y="0"
                            width={canvasW * 0.16}
                            height={canvasH}
                            fill={theme.id === 'blaze' ? '#111113' : theme.accentInk}
                          />

                          {/* Vertical Brand Wordmark inside Band */}
                          <text
                            x={canvasW * 0.80}
                            y={canvasH * 0.54}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                            fontWeight="900"
                            fontSize={canvasW * 0.068}
                            letterSpacing="4"
                            transform={`rotate(-90 ${canvasW * 0.80} ${canvasH * 0.54})`}
                          >
                            {brandTitle}
                          </text>

                          {/* Top Left Minimal Stamp */}
                          <text
                            x={safeSide + 14}
                            y={safeTop + 40}
                            fill={theme.primaryInk}
                            fontFamily="'Space Grotesk', sans-serif"
                            fontWeight="900"
                            fontSize={canvasW * 0.055}
                            letterSpacing="2"
                          >
                            {subBrand}
                          </text>
                          <text
                            x={safeSide + 14}
                            y={safeTop + 72}
                            fill={theme.id === 'blaze' ? '#111113' : theme.mutedInk}
                            fontFamily="'JetBrains Mono', monospace"
                            fontWeight="700"
                            fontSize={canvasW * 0.023}
                            letterSpacing="3"
                          >
                            NAIROBI · KENYA
                          </text>

                          {/* Bold Sneaker Icon Left-Center */}
                          {renderShoeMark(
                            canvasW * 0.37,
                            canvasH * 0.52,
                            0.64,
                            theme.primaryInk,
                            theme.id === 'blaze' ? '#111113' : theme.accentInk
                          )}

                          {/* Bottom Tagline */}
                          <text
                            x={safeSide + 14}
                            y={canvasH - safeBottom - 16}
                            fill={theme.primaryInk}
                            fontFamily="'Inter', sans-serif"
                            fontWeight="700"
                            fontSize={canvasW * 0.025}
                            letterSpacing="3"
                          >
                            {tagline}
                          </text>
                        </>
                      )}

                      {/* LAYOUT 3: BOUTIQUE STAMP LOCKUP */}
                      {layoutId === 'boutique' && (
                        <>
                          {/* Outer Minimalist Frame */}
                          <rect
                            x={safeSide}
                            y={safeTop + 10}
                            width={canvasW - safeSide * 2}
                            height={canvasH - safeTop - safeBottom - 20}
                            rx="24"
                            fill="none"
                            stroke={theme.primaryInk}
                            strokeWidth="3"
                            opacity="0.22"
                          />

                          {/* Sneaker Logo */}
                          {renderShoeMark(
                            canvasW / 2,
                            canvasH * 0.38,
                            0.74,
                            theme.accentInk,
                            theme.stripeColor
                          )}

                          {/* Bold Brand Title */}
                          <text
                            x={canvasW / 2}
                            y={canvasH * 0.56}
                            textAnchor="middle"
                            fill={theme.primaryInk}
                            fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                            fontWeight="900"
                            fontSize={canvasW * 0.088}
                            letterSpacing="4"
                          >
                            {subBrand}
                          </text>

                          {/* Pill-Outline Print Box */}
                          <rect
                            x={canvasW * 0.16}
                            y={canvasH * 0.61}
                            width={canvasW * 0.68}
                            height="54"
                            rx="14"
                            fill="none"
                            stroke={theme.accentInk}
                            strokeWidth="3.5"
                          />
                          <text
                            x={canvasW / 2}
                            y={canvasH * 0.61 + 35}
                            textAnchor="middle"
                            fill={theme.primaryInk}
                            fontFamily="'Inter', sans-serif"
                            fontWeight="800"
                            fontSize={canvasW * 0.03}
                            letterSpacing="3.5"
                          >
                            {tagline}
                          </text>

                          {/* Website Footer */}
                          <text
                            x={canvasW / 2}
                            y={canvasH - safeBottom - 36}
                            textAnchor="middle"
                            fill={theme.mutedInk}
                            fontFamily="'JetBrains Mono', monospace"
                            fontWeight="700"
                            fontSize={canvasW * 0.028}
                            letterSpacing="3"
                          >
                            {brandTitle}
                          </text>
                        </>
                      )}
                    </g>
                  )}

                  {/* ============== BACK PANEL ARTWORK ============== */}
                  {activeSide === 'back' && (
                    <g>
                      {showTreadPattern && renderTreadGraphic}

                      {/* Top Brand Mark */}
                      {renderShoeMark(
                        canvasW / 2,
                        safeTop + 70,
                        0.34,
                        theme.id === 'blaze' ? '#FFFFFF' : theme.accentInk,
                        theme.id === 'blaze' ? '#111113' : theme.stripeColor
                      )}

                      {/* Back Headline */}
                      <text
                        x={canvasW / 2}
                        y={canvasH * 0.34}
                        textAnchor="middle"
                        fill={theme.primaryInk}
                        fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                        fontWeight="900"
                        fontSize={canvasW * 0.058}
                        letterSpacing="2"
                      >
                        {backHeadline}
                      </text>

                      {/* Divider */}
                      <rect
                        x={canvasW / 2 - 48}
                        y={canvasH * 0.375}
                        width="96"
                        height="4"
                        rx="2"
                        fill={theme.accentInk}
                      />

                      {/* Story / Message Copy (wrapped cleanly into two tspans) */}
                      <text
                        x={canvasW / 2}
                        y={canvasH * 0.435}
                        textAnchor="middle"
                        fill={theme.id === 'blaze' ? '#111113' : theme.mutedInk}
                        fontFamily="'Inter', sans-serif"
                        fontWeight="600"
                        fontSize={canvasW * 0.028}
                      >
                        <tspan x={canvasW / 2} dy="0">
                          {backBody.slice(0, 44)}
                        </tspan>
                        {backBody.length > 44 && (
                          <tspan x={canvasW / 2} dy="28">
                            {backBody.slice(44, 96)}
                          </tspan>
                        )}
                      </text>

                      {/* Scannable QR Code Card */}
                      <g transform={`translate(${canvasW / 2 - qrBoxSize / 2 - 18}, ${canvasH * 0.53})`}>
                        <rect
                          x="0"
                          y="0"
                          width={qrBoxSize + 36}
                          height={qrBoxSize + 36}
                          rx="18"
                          fill="#FFFFFF"
                          stroke={theme.accentInk}
                          strokeWidth="3"
                        />
                        {qrPaths && (
                          <g
                            transform={`translate(18, 18) scale(${
                              qrBoxSize / (parseInt(qrPaths.viewBox.split(' ')[2] || '33', 10) || 33)
                            })`}
                          >
                            <path d={qrPaths.pathData} fill="#111113" />
                          </g>
                        )}
                      </g>

                      <text
                        x={canvasW / 2}
                        y={canvasH * 0.53 + qrBoxSize + 68}
                        textAnchor="middle"
                        fill={theme.primaryInk}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="700"
                        fontSize={canvasW * 0.025}
                        letterSpacing="2"
                      >
                        SCAN TO SHOP NEXT DROP
                      </text>

                      {/* Contact & Social Footer Block */}
                      <line
                        x1={safeSide + 20}
                        y1={canvasH - 130}
                        x2={canvasW - safeSide - 20}
                        y2={canvasH - 130}
                        stroke={theme.primaryInk}
                        strokeWidth="1.5"
                        opacity="0.2"
                      />

                      <text
                        x={canvasW / 2}
                        y={canvasH - 96}
                        textAnchor="middle"
                        fill={theme.primaryInk}
                        fontFamily="'Inter', sans-serif"
                        fontWeight="800"
                        fontSize={canvasW * 0.028}
                        letterSpacing="1"
                      >
                        {socialHandle}  ·  {phoneText}
                      </text>
                      <text
                        x={canvasW / 2}
                        y={canvasH - 64}
                        textAnchor="middle"
                        fill={theme.id === 'blaze' ? '#111113' : theme.mutedInk}
                        fontFamily="'Inter', sans-serif"
                        fontWeight="600"
                        fontSize={canvasW * 0.024}
                        letterSpacing="2"
                      >
                        {locationText.toUpperCase()}
                      </text>
                    </g>
                  )}

                  {/* ============== SIDE GUSSET ARTWORK ============== */}
                  {activeSide === 'gusset' && (
                    <g>
                      {/* Center Fold Score Line */}
                      <line
                        data-guide-only="true"
                        x1={canvasW / 2}
                        y1="0"
                        x2={canvasW / 2}
                        y2={canvasH}
                        stroke={theme.isDarkBag ? '#FFFFFF' : '#18181B'}
                        strokeWidth="1.5"
                        strokeDasharray="8 8"
                        opacity="0.25"
                      />

                      {/* Vertical Wordmark */}
                      <text
                        x={canvasW / 2}
                        y={canvasH * 0.45}
                        textAnchor="middle"
                        fill={theme.primaryInk}
                        fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                        fontWeight="900"
                        fontSize={canvasW * 0.19}
                        letterSpacing="5"
                        transform={`rotate(-90 ${canvasW / 2} ${canvasH * 0.45})`}
                      >
                        {brandTitle}
                      </text>

                      {/* Bottom Gusset Sneaker Icon */}
                      {renderShoeMark(
                        canvasW / 2,
                        canvasH - 140,
                        0.32,
                        theme.id === 'blaze' ? '#FFFFFF' : theme.accentInk,
                        theme.id === 'blaze' ? '#111113' : theme.stripeColor
                      )}

                      <text
                        x={canvasW / 2}
                        y={canvasH - 58}
                        textAnchor="middle"
                        fill={theme.id === 'blaze' ? '#111113' : theme.mutedInk}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="700"
                        fontSize="14"
                        letterSpacing="2.5"
                      >
                        {socialHandle}
                      </text>
                    </g>
                  )}

                  {/* ============== PRINT SAFE AREA & CROP MARKS ============== */}
                  {showPrintGuides && (
                    <g data-guide-only="true">
                      {/* Safe Print Zone Rectangle */}
                      <rect
                        x={activeSide === 'gusset' ? 24 : safeSide}
                        y={safeTop}
                        width={canvasW - (activeSide === 'gusset' ? 48 : safeSide * 2)}
                        height={canvasH - safeTop - safeBottom}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                        opacity="0.8"
                      />
                      <text
                        x={(activeSide === 'gusset' ? 24 : safeSide) + 8}
                        y={safeTop - 8}
                        fill="#38BDF8"
                        fontFamily="'JetBrains Mono', monospace"
                        fontSize="12"
                        fontWeight="700"
                      >
                        SAFE PRINT AREA
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Export Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 print:hidden">
              <div className="text-xs text-zinc-500 font-medium">
                Vector SVG scales infinitely for screen printing, flexo, or offset presses.
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadSvg}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-orange-400" />
                  Download Vector SVG
                </button>
                <button
                  onClick={handleDownloadPng}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Download Print PNG (3000px)
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: PACKAGING CONTROLS & PRINTER SPECS */}
          <div className="xl:col-span-5 space-y-5 print:hidden">
            {/* 1. Material & Colorway Selector */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-orange-500" />
                  Bag Colorway & Stock
                </h2>
                <span className="text-xs text-zinc-500 font-mono">{theme.bagHex}</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {(Object.values(BAG_THEMES) as BagTheme[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      themeId === t.id
                        ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-7 h-7 rounded-lg border border-zinc-300 shrink-0"
                      style={{ backgroundColor: t.bagHex }}
                    />
                    <span className="text-xs font-bold text-zinc-900 leading-tight">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Bag Size & Layout Style */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                Bag Size & Artwork Layout
              </h2>

              <div className="grid grid-cols-2 gap-2">
                {(Object.values(BAG_SIZES) as BagSizePreset[]).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSizeId(s.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      sizeId === s.id
                        ? 'border-orange-500 bg-orange-50/70 text-zinc-900'
                        : 'border-zinc-200 hover:border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{s.name}</div>
                    <div className="text-[11px] font-mono tabular-nums text-zinc-500 mt-0.5">
                      {s.widthCm}×{s.heightCm}{s.gussetCm ? `×${s.gussetCm}` : ''} cm
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="block text-xs font-bold text-zinc-700 mb-2">Front Graphic Layout</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'signature', label: 'Center Emblem' },
                    { id: 'editorial', label: 'Vertical Band' },
                    { id: 'boutique', label: 'Framed Stamp' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLayoutId(l.id as BagLayoutId)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap ${
                        layoutId === l.id
                          ? 'bg-zinc-900 border-zinc-900 text-white'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTreadPattern}
                    onChange={(e) => setShowTreadPattern(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                  />
                  Sole Tread Graphic
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrOnFront}
                    onChange={(e) => setShowQrOnFront(e.target.checked)}
                    className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                  />
                  QR Code on Front
                </label>
              </div>
            </div>

            {/* 3. Custom Copy & QR Target */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-orange-500" />
                  Bag Text & QR Destination
                </h2>
                <button
                  onClick={() => {
                    setBrandTitle('SOLEMATE.CO.KE');
                    setSubBrand('SOLE MATE KE');
                    setTagline('AUTHENTIC SNEAKERS · NAIROBI');
                    setBackHeadline('STEP INTO AUTHENTICITY');
                    setBackBody('Verified kicks delivered across Nairobi & Kenya. Tag us in your fresh pair.');
                    setQrTargetUrl('https://solemate.co.ke/shop');
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Brand Title</label>
                  <input
                    type="text"
                    value={brandTitle}
                    onChange={(e) => setBrandTitle(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Front Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">QR Code Link (Scannable)</label>
                <input
                  type="url"
                  value={qrTargetUrl}
                  onChange={(e) => setQrTargetUrl(e.target.value)}
                  placeholder="https://solemate.co.ke/shop"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Social Handle</label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">WhatsApp / Phone</label>
                  <input
                    type="text"
                    value={phoneText}
                    onChange={(e) => setPhoneText(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {activeSide === 'back' && (
                <div className="space-y-3 pt-2 border-t border-zinc-100">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Back Headline</label>
                    <input
                      type="text"
                      value={backHeadline}
                      onChange={(e) => setBackHeadline(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Back Story Copy</label>
                    <textarea
                      rows={2}
                      value={backBody}
                      onChange={(e) => setBackBody(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Printer Production Specifications */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-zinc-900">Production Specifications</h2>
                <button
                  onClick={handleCopyPrinterBrief}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
                >
                  {copiedSpec ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSpec ? 'Copied Brief' : 'Copy Printer Brief'}
                </button>
              </div>

              <dl className="divide-y divide-zinc-100 text-xs">
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-zinc-500">Dimensions</dt>
                  <dd className="font-mono tabular-nums font-semibold text-zinc-900">
                    {size.widthCm} × {size.heightCm}{size.gussetCm ? ` × ${size.gussetCm}` : ''} cm
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-zinc-500">Recommended Stock</dt>
                  <dd className="font-semibold text-zinc-900 text-right">{theme.material}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4">
                  <dt className="text-zinc-500">Handles</dt>
                  <dd className="font-semibold text-zinc-900 text-right">{theme.handleSpec}</dd>
                </div>
                <div className="py-2 flex justify-between gap-4 items-center">
                  <dt className="text-zinc-500">Primary Ink</dt>
                  <dd className="flex items-center gap-2 font-mono text-zinc-900">
                    <span className="w-3.5 h-3.5 rounded border border-zinc-300" style={{ backgroundColor: theme.primaryInk }} />
                    {theme.primaryInk} · {theme.primaryInkCmyk}
                  </dd>
                </div>
                <div className="py-2 flex justify-between gap-4 items-center">
                  <dt className="text-zinc-500">Accent Ink</dt>
                  <dd className="flex items-center gap-2 font-mono text-zinc-900">
                    <span className="w-3.5 h-3.5 rounded border border-zinc-300" style={{ backgroundColor: theme.accentInk }} />
                    {theme.accentInk} · {theme.accentInkCmyk}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY PRODUCTION SPEC SHEET FOOTER */}
      <div className="hidden print:block border-t border-zinc-300 pt-4 mt-6 text-xs text-zinc-800 space-y-2">
        <div className="flex justify-between font-bold text-sm">
          <span>SOLEMATE.CO.KE — CLIENT PACKAGING PRINT SPECIFICATION</span>
          <span className="font-mono">{size.widthCm}cm × {size.heightCm}cm{size.gussetCm ? ` × ${size.gussetCm}cm` : ''}</span>
        </div>
        <p>
          <strong>Stock:</strong> {theme.material} · <strong>Handles:</strong> {theme.handleSpec}
        </p>
        <p className="font-mono">
          <strong>Colors:</strong> Base {theme.bagHex} ({theme.bagCmyk}) | Primary Ink {theme.primaryInk} ({theme.primaryInkCmyk}) | Accent Ink {theme.accentInk} ({theme.accentInkCmyk})
        </p>
        <p>
          <strong>QR Destination:</strong> {qrTargetUrl} · <strong>Contact:</strong> {phoneText} · {socialHandle} · {locationText}
        </p>
      </div>
    </div>
  );
}
