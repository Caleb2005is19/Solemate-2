import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import {
  PackagingDesignConfig,
  PackagingSizePreset,
  PrintSide
} from '../../utils/packagingPresets';

export interface QrMatrixResult {
  totalModules: number;
  dataModules: number;
  quietModules: number;
  pathData: string;
  version: number;
}

/**
 * Generates an ISO-compliant QR matrix with an exact 4-module white quiet zone
 * and integer-aligned path cells for razor-sharp camera scanning.
 */
export function buildQrMatrix(
  targetUrl: string,
  errorCorrectionLevel: 'M' | 'Q' | 'H' = 'Q'
): QrMatrixResult | null {
  try {
    const cleanUrl = (targetUrl || '').trim() || 'https://solemate.co.ke/shop';
    const qr = QRCode.create(cleanUrl, { errorCorrectionLevel });
    const size = qr.modules.size;
    const quiet = 4;
    const totalModules = size + quiet * 2;
    let d = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          d += `M${c + quiet},${r + quiet}h1v1h-1z`;
        }
      }
    }

    return {
      totalModules,
      dataModules: size,
      quietModules: quiet,
      pathData: d,
      version: qr.version
    };
  } catch {
    return null;
  }
}

interface PackagingSvgRendererProps {
  side: PrintSide;
  size: PackagingSizePreset;
  config: PackagingDesignConfig;
  resolvedBgHex: string;
  resolvedPrimaryInk: string;
  resolvedAccentInk: string;
  resolvedMutedInk: string;
  resolvedStripeColor: string;
  isDarkBag: boolean;
  qrMatrix: QrMatrixResult | null;
  showPrintGuides: boolean;
  transparentExport: boolean;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  className?: string;
}

export function getPanelDimensions(size: PackagingSizePreset, side: PrintSide) {
  if (size.isBox) {
    if (side === 'lid') {
      return {
        canvasW: size.viewW,
        canvasH: size.viewH,
        physW: size.widthCm,
        physH: size.heightCm
      };
    }
    if (side === 'gusset') {
      // Side end cap of box: heightCm (depth) × gussetCm (wall height)
      const scale = size.viewH / Math.max(size.heightCm, 1);
      return {
        canvasW: Math.round(size.heightCm * scale),
        canvasH: size.gussetW,
        physW: size.heightCm,
        physH: size.gussetCm
      };
    }
    // Box front / back wall: widthCm × gussetCm
    return {
      canvasW: size.viewW,
      canvasH: size.gussetW,
      physW: size.widthCm,
      physH: size.gussetCm
    };
  }

  // Carrier bags, gift bags, mailers, dust bags
  if (side === 'gusset') {
    return {
      canvasW: size.gussetW,
      canvasH: size.viewH,
      physW: size.gussetCm || 4,
      physH: size.heightCm
    };
  }
  return {
    canvasW: size.viewW,
    canvasH: size.viewH,
    physW: size.widthCm,
    physH: size.heightCm
  };
}

export const PackagingSvgRenderer: React.FC<PackagingSvgRendererProps> = ({
  side,
  size,
  config,
  resolvedBgHex,
  resolvedPrimaryInk,
  resolvedAccentInk,
  resolvedMutedInk,
  resolvedStripeColor,
  isDarkBag,
  qrMatrix,
  showPrintGuides,
  transparentExport,
  svgRef,
  className = 'w-full h-auto'
}) => {
  const { canvasW, canvasH } = getPanelDimensions(size, side);
  const isShortBoxWall = size.isBox && (side === 'front' || side === 'back' || side === 'gusset');
  const isNarrowGusset = !size.isBox && side === 'gusset';

  const hasPunchHandle = !size.isBox && side !== 'gusset' && (size.handleStyle === 'rope' || size.handleStyle === 'ribbon' || size.handleStyle === 'die-cut');
  const safeTop = isShortBoxWall ? 26 : size.handleStyle === 'die-cut' ? 140 : hasPunchHandle ? 118 : 64;
  const safeSide = isNarrowGusset ? 22 : isShortBoxWall ? 36 : 52;
  const safeBottom = isShortBoxWall ? 26 : 52;

  const activeLogoUrl = config.customLogoUrl.trim();
  const hasStoreLogo = Boolean(activeLogoUrl);
  const effectiveLogoMode =
    config.logoMode === 'vector-sneaker' || !hasStoreLogo ? 'vector-sneaker' : config.logoMode;

  const shouldShowQrOnFront =
    config.qrPlacement === 'front-corner' || config.qrPlacement === 'front-and-back';
  const shouldShowQrOnBack =
    config.qrPlacement === 'back' || config.qrPlacement === 'front-and-back';
  const shouldShowQrOnLid =
    config.qrPlacement === 'lid' || config.qrPlacement === 'back' || config.qrPlacement === 'front-and-back';
  const shouldShowQrOnGusset = config.qrPlacement === 'gusset';

  const renderShoeMark = (
    cx: number,
    cy: number,
    scale: number,
    shoeColor: string,
    stripeFill: string
  ) => {
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

  const renderBrandEmblem = (cx: number, cy: number, maxBoxSize: number) => {
    if (effectiveLogoMode === 'store-logo' && hasStoreLogo) {
      return (
        <g>
          <rect
            x={cx - maxBoxSize * 0.62}
            y={cy - maxBoxSize * 0.42}
            width={maxBoxSize * 1.24}
            height={maxBoxSize * 0.84}
            rx="18"
            fill={isDarkBag ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)'}
          />
          <image
            href={activeLogoUrl}
            x={cx - maxBoxSize * 0.54}
            y={cy - maxBoxSize * 0.36}
            width={maxBoxSize * 1.08}
            height={maxBoxSize * 0.72}
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      );
    }

    if (effectiveLogoMode === 'dual' && hasStoreLogo) {
      return (
        <g>
          <image
            href={activeLogoUrl}
            x={cx - maxBoxSize * 0.62}
            y={cy - maxBoxSize * 0.34}
            width={maxBoxSize * 0.56}
            height={maxBoxSize * 0.56}
            preserveAspectRatio="xMidYMid meet"
          />
          <line
            x1={cx - 4}
            y1={cy - maxBoxSize * 0.28}
            x2={cx - 4}
            y2={cy + maxBoxSize * 0.22}
            stroke={resolvedMutedInk}
            strokeWidth="2.5"
            opacity="0.5"
          />
          {renderShoeMark(
            cx + maxBoxSize * 0.36,
            cy - maxBoxSize * 0.04,
            maxBoxSize / 500,
            resolvedAccentInk,
            resolvedStripeColor
          )}
        </g>
      );
    }

    const scale = maxBoxSize / 340;
    return renderShoeMark(cx, cy, scale, resolvedAccentInk, resolvedStripeColor);
  };

  /**
   * Renders a guaranteed scannable vector QR badge centered at top-left (x, y)
   * with total pixel size `boxSize`. Always uses a bright #FFFFFF quiet zone pad
   * and #111113 high-contrast modules so phone cameras detect edges cleanly.
   */
  const renderQrCard = (x: number, y: number, boxSize: number, caption?: string) => {
    if (!qrMatrix) return null;
    const scale = boxSize / qrMatrix.totalModules;
    return (
      <g transform={`translate(${x}, ${y})`}>
        {config.qrAccentFrame && (
          <rect
            x="-6"
            y="-6"
            width={boxSize + 12}
            height={boxSize + (caption ? 34 : 12)}
            rx="14"
            fill="#FFFFFF"
            stroke={resolvedAccentInk}
            strokeWidth="3.5"
          />
        )}
        <rect x="0" y="0" width={boxSize} height={boxSize} rx="8" fill="#FFFFFF" />
        <g transform={`scale(${scale})`}>
          <path d={qrMatrix.pathData} fill="#111113" shapeRendering="crispEdges" />
        </g>
        {caption && (
          <text
            x={boxSize / 2}
            y={boxSize + 19}
            textAnchor="middle"
            fill="#111113"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="800"
            fontSize={Math.max(10, boxSize * 0.088)}
            letterSpacing="1.2"
          >
            {caption}
          </text>
        )}
      </g>
    );
  };

  const renderTreadGraphic = useMemo(() => {
    if (!config.showTreadPattern || isShortBoxWall) return null;
    const treadOpacity = isDarkBag ? 0.14 : 0.09;
    return (
      <g opacity={treadOpacity} fill="none" stroke={resolvedPrimaryInk} strokeWidth="3">
        <path
          d={`M ${canvasW * 0.1} ${canvasH - 12} C ${canvasW * 0.18} ${canvasH - 135}, ${canvasW * 0.42} ${canvasH - 110}, ${canvasW * 0.56} ${canvasH - 125} C ${canvasW * 0.72} ${canvasH - 142}, ${canvasW * 0.88} ${canvasH - 115}, ${canvasW * 0.92} ${canvasH - 12} Z`}
          strokeWidth="4"
        />
        {[0.19, 0.26, 0.33, 0.4, 0.47, 0.57, 0.64, 0.71, 0.78].map((ratio, i) => (
          <line
            key={i}
            x1={canvasW * ratio}
            y1={canvasH - 108 + (i % 2 === 0 ? 12 : 4)}
            x2={canvasW * (ratio + 0.03)}
            y2={canvasH - 20}
            strokeWidth={i % 3 === 0 ? '6' : '3'}
            strokeLinecap="round"
          />
        ))}
        <circle cx={canvasW * 0.24} cy={canvasH - 56} r="18" strokeWidth="3" />
      </g>
    );
  }, [config.showTreadPattern, isShortBoxWall, isDarkBag, resolvedPrimaryInk, canvasW, canvasH]);

  const titleScale = Math.min(canvasW, isShortBoxWall ? canvasW * 0.72 : canvasH);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${canvasW} ${canvasH}`}
      className={className}
      style={{
        backgroundImage: transparentExport
          ? 'repeating-conic-gradient(#e4e4e7 0% 25%, #ffffff 0% 50%)'
          : undefined,
        backgroundSize: transparentExport ? '16px 16px' : undefined
      }}
    >
      {/* Bag / Box Stock Base Background */}
      {!transparentExport && (
        <rect
          data-bag-bg="true"
          x="0"
          y="0"
          width={canvasW}
          height={canvasH}
          fill={resolvedBgHex}
        />
      )}

      {/* Subtle Kraft Paper Fiber Tone */}
      {!transparentExport && config.themeId === 'kraft' && !config.customBgHex && (
        <rect
          data-bag-bg="true"
          x="0"
          y="0"
          width={canvasW}
          height={canvasH}
          fill="#7C5836"
          opacity="0.065"
        />
      )}

      {/* Subtle Monogram Repeat Texture (when monogram layout selected) */}
      {config.layoutId === 'monogram-box' && (side === 'front' || side === 'lid') && (
        <g opacity={isDarkBag ? 0.07 : 0.055}>
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 4 }).map((__, c) => (
              <text
                key={`${r}-${c}`}
                x={c * (canvasW / 3.2) + (r % 2 === 0 ? 20 : 90)}
                y={r * (canvasH / 4.2) + 80}
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="900"
                fontSize={Math.max(18, canvasW * 0.04)}
                letterSpacing="3"
                transform={`rotate(-22 ${c * (canvasW / 3.2) + 60} ${r * (canvasH / 4.2) + 80})`}
              >
                {config.subBrand}
              </text>
            ))
          )}
        </g>
      )}

      {/* Handle Die-Cut / Rope Eyelet Guides */}
      {hasPunchHandle && (
        <g data-guide-only="true">
          <line
            x1="0"
            y1="96"
            x2={canvasW}
            y2="96"
            stroke={resolvedPrimaryInk}
            strokeWidth="1"
            strokeDasharray="6 6"
            opacity="0.22"
          />
          {size.handleStyle === 'die-cut' ? (
            <rect
              x={canvasW * 0.34}
              y="38"
              width={canvasW * 0.32}
              height="34"
              rx="17"
              fill={isDarkBag ? '#27272A' : '#E4E4E7'}
              stroke={isDarkBag ? '#52525B' : '#A1A1AA'}
              strokeWidth="3"
            />
          ) : (
            <>
              <circle
                cx={canvasW * 0.34}
                cy="58"
                r="11"
                fill={isDarkBag ? '#27272A' : '#E4E4E7'}
                stroke={isDarkBag ? '#52525B' : '#A1A1AA'}
                strokeWidth="3"
              />
              <circle
                cx={canvasW * 0.66}
                cy="58"
                r="11"
                fill={isDarkBag ? '#27272A' : '#E4E4E7'}
                stroke={isDarkBag ? '#52525B' : '#A1A1AA'}
                strokeWidth="3"
              />
            </>
          )}
        </g>
      )}

      {/* Courier Peel-and-Seal Header Guide */}
      {size.handleStyle === 'mailer-flap' && side !== 'gusset' && (
        <g data-guide-only="true">
          <rect x="0" y="0" width={canvasW} height="64" fill={resolvedPrimaryInk} opacity="0.06" />
          <line
            x1="0"
            y1="64"
            x2={canvasW}
            y2="64"
            stroke={resolvedAccentInk}
            strokeWidth="2"
            strokeDasharray="8 6"
          />
          <text
            x={canvasW / 2}
            y="38"
            textAnchor="middle"
            fill={resolvedMutedInk}
            fontFamily="'JetBrains Mono', monospace"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2"
          >
            PEEL & SEAL FLAP FOLD LINE
          </text>
        </g>
      )}

      {/* Drawstring Top Stitch Channel Guide */}
      {size.handleStyle === 'drawstring' && side !== 'gusset' && (
        <g data-guide-only="true">
          <line
            x1="0"
            y1="56"
            x2={canvasW}
            y2="56"
            stroke={resolvedPrimaryInk}
            strokeWidth="2"
            strokeDasharray="10 6"
            opacity="0.35"
          />
        </g>
      )}

      {/* ============== BOX FRONT / BACK HORIZONTAL WALL ARTWORK ============== */}
      {isShortBoxWall && side !== 'gusset' && (
        <g>
          {config.showBorderFrame && (
            <rect
              x="24"
              y="22"
              width={canvasW - 48}
              height={canvasH - 44}
              rx="14"
              fill="none"
              stroke={resolvedPrimaryInk}
              strokeWidth="2.5"
              opacity="0.22"
            />
          )}

          {side === 'front' ? (
            <>
              {renderBrandEmblem(canvasW * 0.22, canvasH * 0.5, canvasH * 0.55)}
              <text
                x={canvasW * 0.39}
                y={canvasH * 0.48}
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={canvasH * 0.19}
                letterSpacing="2"
              >
                {config.brandTitle}
              </text>
              <text
                x={canvasW * 0.39}
                y={canvasH * 0.65}
                fill={resolvedMutedInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="700"
                fontSize={canvasH * 0.072}
                letterSpacing="3.5"
              >
                {config.tagline}
              </text>
              {shouldShowQrOnFront &&
                renderQrCard(canvasW - canvasH * 0.72 - 36, canvasH * 0.14, canvasH * 0.64)}
            </>
          ) : (
            <>
              <text
                x="48"
                y={canvasH * 0.4}
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="900"
                fontSize={canvasH * 0.14}
                letterSpacing="1.5"
              >
                {config.backHeadline}
              </text>
              <text
                x="48"
                y={canvasH * 0.57}
                fill={resolvedMutedInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="600"
                fontSize={canvasH * 0.068}
              >
                {config.backBody.slice(0, 56)}
              </text>
              <text
                x="48"
                y={canvasH * 0.75}
                fill={resolvedAccentInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={canvasH * 0.062}
              >
                {config.socialHandle} · {config.phoneText}
              </text>
              {shouldShowQrOnBack &&
                renderQrCard(canvasW - canvasH * 0.78 - 38, canvasH * 0.11, canvasH * 0.68)}
            </>
          )}
        </g>
      )}

      {/* ============== PRIMARY FRONT OR BOX LID PANEL ============== */}
      {((!isShortBoxWall && side === 'front') || (size.isBox && side === 'lid')) && (
        <g>
          {renderTreadGraphic}

          {/* Optional Outer Boutique Frame */}
          {config.showBorderFrame && (
            <rect
              x={safeSide}
              y={safeTop + 8}
              width={canvasW - safeSide * 2}
              height={canvasH - safeTop - safeBottom - 16}
              rx="22"
              fill="none"
              stroke={resolvedPrimaryInk}
              strokeWidth="2.8"
              opacity="0.22"
            />
          )}

          {/* LAYOUT 1: SIGNATURE CENTER EMBLEM */}
          {config.layoutId === 'signature' && (
            <>
              {renderBrandEmblem(
                canvasW / 2,
                canvasH * 0.39,
                Math.min(canvasW, canvasH) * 0.36
              )}
              <text
                x={canvasW / 2}
                y={canvasH * 0.585}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.088}
                letterSpacing="2.5"
              >
                {config.brandTitle}
              </text>
              <text
                x={canvasW / 2}
                y={canvasH * 0.642}
                textAnchor="middle"
                fill={resolvedMutedInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="700"
                fontSize={titleScale * 0.028}
                letterSpacing="5"
              >
                {config.tagline}
              </text>
              <rect
                x={canvasW / 2 - 48}
                y={canvasH * 0.68}
                width="96"
                height="4.5"
                rx="2"
                fill={resolvedAccentInk}
              />
            </>
          )}

          {/* LAYOUT 2: EDITORIAL VERTICAL STRIPE */}
          {config.layoutId === 'editorial' && (
            <>
              <rect
                x={canvasW * 0.72}
                y="0"
                width={canvasW * 0.16}
                height={canvasH}
                fill={resolvedAccentInk}
              />
              <text
                x={canvasW * 0.8}
                y={canvasH * 0.52}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.068}
                letterSpacing="4"
                transform={`rotate(-90 ${canvasW * 0.8} ${canvasH * 0.52})`}
              >
                {config.brandTitle}
              </text>
              <text
                x={safeSide + 14}
                y={safeTop + 44}
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.056}
                letterSpacing="2"
              >
                {config.subBrand}
              </text>
              <text
                x={safeSide + 14}
                y={safeTop + 76}
                fill={resolvedMutedInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={titleScale * 0.024}
                letterSpacing="3"
              >
                {config.editionStamp}
              </text>
              {renderBrandEmblem(
                canvasW * 0.36,
                canvasH * 0.52,
                Math.min(canvasW, canvasH) * 0.33
              )}
              <text
                x={safeSide + 14}
                y={canvasH - safeBottom - 14}
                fill={resolvedPrimaryInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="700"
                fontSize={titleScale * 0.025}
                letterSpacing="3"
              >
                {config.tagline}
              </text>
            </>
          )}

          {/* LAYOUT 3: BOUTIQUE STAMP LOCKUP */}
          {config.layoutId === 'boutique' && (
            <>
              {renderBrandEmblem(
                canvasW / 2,
                canvasH * 0.37,
                Math.min(canvasW, canvasH) * 0.36
              )}
              <text
                x={canvasW / 2}
                y={canvasH * 0.56}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.088}
                letterSpacing="4"
              >
                {config.subBrand}
              </text>
              <rect
                x={canvasW * 0.16}
                y={canvasH * 0.61}
                width={canvasW * 0.68}
                height="50"
                rx="12"
                fill="none"
                stroke={resolvedAccentInk}
                strokeWidth="3.5"
              />
              <text
                x={canvasW / 2}
                y={canvasH * 0.61 + 33}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="800"
                fontSize={titleScale * 0.028}
                letterSpacing="3"
              >
                {config.tagline}
              </text>
              <text
                x={canvasW / 2}
                y={canvasH - safeBottom - 26}
                textAnchor="middle"
                fill={resolvedMutedInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={titleScale * 0.026}
                letterSpacing="2.5"
              >
                {config.brandTitle}
              </text>
            </>
          )}

          {/* LAYOUT 4: NAIROBI STREETWEAR GRID */}
          {config.layoutId === 'street-grid' && (
            <>
              {/* Top utility rule */}
              <text
                x={safeSide}
                y={safeTop + 26}
                fill={resolvedMutedInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={titleScale * 0.022}
                letterSpacing="2"
              >
                {config.editionStamp}
              </text>
              <text
                x={canvasW - safeSide}
                y={safeTop + 26}
                textAnchor="end"
                fill={resolvedAccentInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="800"
                fontSize={titleScale * 0.022}
                letterSpacing="2"
              >
                01°17&apos;S 36°49&apos;E
              </text>
              <line
                x1={safeSide}
                y1={safeTop + 42}
                x2={canvasW - safeSide}
                y2={safeTop + 42}
                stroke={resolvedPrimaryInk}
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Giant Stacked Street Typography */}
              <text
                x={safeSide}
                y={canvasH * 0.34}
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.115}
                letterSpacing="-1"
              >
                {config.subBrand}
              </text>
              <text
                x={safeSide}
                y={canvasH * 0.42}
                fill={resolvedAccentInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.072}
                letterSpacing="2"
              >
                {config.brandTitle}
              </text>

              {/* Center Grid Emblem */}
              <rect
                x={safeSide}
                y={canvasH * 0.47}
                width={canvasW - safeSide * 2}
                height={canvasH * 0.28}
                rx="16"
                fill="none"
                stroke={resolvedPrimaryInk}
                strokeWidth="2"
                opacity="0.24"
              />
              {renderBrandEmblem(
                canvasW / 2,
                canvasH * 0.61,
                Math.min(canvasW, canvasH) * 0.28
              )}

              {/* Bottom Street Strip */}
              <line
                x1={safeSide}
                y1={canvasH - safeBottom - 44}
                x2={canvasW - safeSide}
                y2={canvasH - safeBottom - 44}
                stroke={resolvedPrimaryInk}
                strokeWidth="2"
                opacity="0.3"
              />
              <text
                x={safeSide}
                y={canvasH - safeBottom - 16}
                fill={resolvedPrimaryInk}
                fontFamily="'Inter', sans-serif"
                fontWeight="800"
                fontSize={titleScale * 0.025}
                letterSpacing="2.5"
              >
                {config.tagline}
              </text>
            </>
          )}

          {/* LAYOUT 5: DIAGONAL RACING SASH */}
          {config.layoutId === 'diagonal-wrap' && (
            <>
              <polygon
                points={`0,${canvasH * 0.72} ${canvasW},${canvasH * 0.38} ${canvasW},${canvasH * 0.56} 0,${canvasH * 0.90}`}
                fill={resolvedAccentInk}
              />
              <text
                x={canvasW / 2}
                y={canvasH * 0.64}
                textAnchor="middle"
                fill="#FFFFFF"
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.068}
                letterSpacing="3"
                transform={`rotate(-22 ${canvasW / 2} ${canvasH * 0.64})`}
              >
                {config.brandTitle}
              </text>
              {renderBrandEmblem(
                canvasW / 2,
                canvasH * 0.32,
                Math.min(canvasW, canvasH) * 0.32
              )}
              <text
                x={safeSide}
                y={canvasH - safeBottom - 10}
                fill={resolvedPrimaryInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={titleScale * 0.024}
                letterSpacing="2"
              >
                {config.tagline}
              </text>
            </>
          )}

          {/* LAYOUT 6: MONOGRAM SEAL */}
          {config.layoutId === 'monogram-box' && (
            <>
              <rect
                x={canvasW * 0.15}
                y={canvasH * 0.25}
                width={canvasW * 0.7}
                height={canvasH * 0.48}
                rx="28"
                fill={resolvedBgHex}
                stroke={resolvedAccentInk}
                strokeWidth="5"
              />
              {renderBrandEmblem(
                canvasW / 2,
                canvasH * 0.42,
                Math.min(canvasW, canvasH) * 0.3
              )}
              <text
                x={canvasW / 2}
                y={canvasH * 0.59}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={titleScale * 0.072}
                letterSpacing="3"
              >
                {config.subBrand}
              </text>
              <text
                x={canvasW / 2}
                y={canvasH * 0.66}
                textAnchor="middle"
                fill={resolvedAccentInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="800"
                fontSize={titleScale * 0.025}
                letterSpacing="2.5"
              >
                {config.brandTitle}
              </text>
            </>
          )}

          {/* Optional Scannable QR Placement on Front or Box Lid */}
          {((side === 'front' && shouldShowQrOnFront) || (side === 'lid' && shouldShowQrOnLid)) &&
            renderQrCard(
              canvasW - safeSide - Math.min(canvasW, canvasH) * 0.165,
              canvasH - safeBottom - Math.min(canvasW, canvasH) * 0.19,
              Math.min(canvasW, canvasH) * 0.145,
              'SCAN DROP'
            )}
        </g>
      )}

      {/* ============== BACK PANEL ARTWORK (BAGS / MAILERS) ============== */}
      {!isShortBoxWall && side === 'back' && (
        <g>
          {renderTreadGraphic}
          {config.showBorderFrame && (
            <rect
              x={safeSide}
              y={safeTop + 8}
              width={canvasW - safeSide * 2}
              height={canvasH - safeTop - safeBottom - 16}
              rx="22"
              fill="none"
              stroke={resolvedPrimaryInk}
              strokeWidth="2.5"
              opacity="0.2"
            />
          )}

          {renderBrandEmblem(
            canvasW / 2,
            safeTop + 72,
            Math.min(canvasW, canvasH) * 0.16
          )}

          <text
            x={canvasW / 2}
            y={canvasH * 0.32}
            textAnchor="middle"
            fill={resolvedPrimaryInk}
            fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize={titleScale * 0.056}
            letterSpacing="2"
          >
            {config.backHeadline}
          </text>

          <rect
            x={canvasW / 2 - 48}
            y={canvasH * 0.355}
            width="96"
            height="4"
            rx="2"
            fill={resolvedAccentInk}
          />

          <text
            x={canvasW / 2}
            y={canvasH * 0.41}
            textAnchor="middle"
            fill={resolvedMutedInk}
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            fontSize={titleScale * 0.027}
          >
            <tspan x={canvasW / 2} dy="0">
              {config.backBody.slice(0, 44)}
            </tspan>
            {config.backBody.length > 44 && (
              <tspan x={canvasW / 2} dy="28">
                {config.backBody.slice(44, 96)}
              </tspan>
            )}
          </text>

          {/* Guaranteed Scannable Back QR */}
          {shouldShowQrOnBack &&
            renderQrCard(
              canvasW / 2 - (Math.min(canvasW, canvasH) * 0.24) / 2,
              canvasH * 0.50,
              Math.min(canvasW, canvasH) * 0.24,
              'SCAN TO SHOP'
            )}

          <line
            x1={safeSide + 20}
            y1={canvasH - 122}
            x2={canvasW - safeSide - 20}
            y2={canvasH - 122}
            stroke={resolvedPrimaryInk}
            strokeWidth="1.5"
            opacity="0.2"
          />
          <text
            x={canvasW / 2}
            y={canvasH - 88}
            textAnchor="middle"
            fill={resolvedPrimaryInk}
            fontFamily="'Inter', sans-serif"
            fontWeight="800"
            fontSize={titleScale * 0.027}
            letterSpacing="1"
          >
            {config.socialHandle} · {config.phoneText}
          </text>
          <text
            x={canvasW / 2}
            y={canvasH - 58}
            textAnchor="middle"
            fill={resolvedMutedInk}
            fontFamily="'Inter', sans-serif"
            fontWeight="600"
            fontSize={titleScale * 0.023}
            letterSpacing="2"
          >
            {config.locationText.toUpperCase()}
          </text>
        </g>
      )}

      {/* ============== SIDE GUSSET / BOX END PANEL ============== */}
      {side === 'gusset' && (
        <g>
          {!size.isBox && (
            <line
              data-guide-only="true"
              x1={canvasW / 2}
              y1="0"
              x2={canvasW / 2}
              y2={canvasH}
              stroke={resolvedPrimaryInk}
              strokeWidth="1.5"
              strokeDasharray="8 8"
              opacity="0.25"
            />
          )}

          {size.isBox ? (
            <>
              {renderBrandEmblem(canvasW * 0.5, canvasH * 0.34, canvasH * 0.36)}
              <text
                x={canvasW / 2}
                y={canvasH * 0.65}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', sans-serif"
                fontWeight="900"
                fontSize={canvasH * 0.11}
                letterSpacing="2"
              >
                {config.subBrand}
              </text>
              <text
                x={canvasW / 2}
                y={canvasH * 0.8}
                textAnchor="middle"
                fill={resolvedMutedInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize={canvasH * 0.065}
                letterSpacing="2"
              >
                {config.editionStamp}
              </text>
              {shouldShowQrOnGusset &&
                renderQrCard(canvasW - canvasH * 0.52 - 18, canvasH * 0.14, canvasH * 0.48)}
            </>
          ) : (
            <>
              <text
                x={canvasW / 2}
                y={canvasH * 0.44}
                textAnchor="middle"
                fill={resolvedPrimaryInk}
                fontFamily="'Space Grotesk', 'Arial Black', sans-serif"
                fontWeight="900"
                fontSize={Math.max(24, canvasW * 0.18)}
                letterSpacing="5"
                transform={`rotate(-90 ${canvasW / 2} ${canvasH * 0.44})`}
              >
                {config.brandTitle}
              </text>
              {shouldShowQrOnGusset ? (
                renderQrCard(canvasW / 2 - (canvasW * 0.56) / 2, canvasH - canvasW * 0.72 - 55, canvasW * 0.56)
              ) : (
                renderBrandEmblem(canvasW / 2, canvasH - 145, canvasW * 0.52)
              )}
              <text
                x={canvasW / 2}
                y={canvasH - 42}
                textAnchor="middle"
                fill={resolvedMutedInk}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="700"
                fontSize="13"
                letterSpacing="2"
              >
                {config.socialHandle}
              </text>
            </>
          )}
        </g>
      )}

      {/* Print Safe Area Border */}
      {showPrintGuides && (
        <g data-guide-only="true">
          <rect
            x={isNarrowGusset ? 18 : safeSide}
            y={safeTop}
            width={canvasW - (isNarrowGusset ? 36 : safeSide * 2)}
            height={canvasH - safeTop - safeBottom}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            opacity="0.85"
          />
          <text
            x={(isNarrowGusset ? 18 : safeSide) + 6}
            y={safeTop - 6}
            fill="#38BDF8"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="11"
            fontWeight="700"
          >
            SAFE PRINT AREA
          </text>
        </g>
      )}
    </svg>
  );
};
