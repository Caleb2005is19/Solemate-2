import React, { useState, useRef } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Move3d, Pause, Play, RefreshCw } from 'lucide-react';
import {
  PackagingDesignConfig,
  PackagingSizePreset
} from '../../utils/packagingPresets';
import { PackagingSvgRenderer, QrMatrixResult } from './PackagingSvgRenderer';

interface Packaging3DViewerProps {
  size: PackagingSizePreset;
  config: PackagingDesignConfig;
  resolvedBgHex: string;
  resolvedPrimaryInk: string;
  resolvedAccentInk: string;
  resolvedMutedInk: string;
  resolvedStripeColor: string;
  resolvedHandleColor: string;
  isDarkBag: boolean;
  qrMatrix: QrMatrixResult | null;
}

type CameraPresetId = 'iso' | 'front' | 'back' | 'side' | 'top';

const CAMERA_PRESETS: Record<CameraPresetId, { label: string; rx: number; ry: number }> = {
  iso: { label: 'Isometric', rx: -14, ry: -28 },
  front: { label: 'Front', rx: -4, ry: 0 },
  side: { label: 'Side', rx: -6, ry: -86 },
  back: { label: 'Back', rx: -4, ry: 180 },
  top: { label: 'Top / Lid', rx: -58, ry: -18 }
};

export const Packaging3DViewer: React.FC<Packaging3DViewerProps> = ({
  size,
  config,
  resolvedBgHex,
  resolvedPrimaryInk,
  resolvedAccentInk,
  resolvedMutedInk,
  resolvedStripeColor,
  resolvedHandleColor,
  isDarkBag,
  qrMatrix
}) => {
  const [rotX, setRotX] = useState<number>(-14);
  const [rotY, setRotY] = useState<number>(-28);
  const [zoom, setZoom] = useState<number>(1);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [boxOpenAmount, setBoxOpenAmount] = useState<number>(0);

  const draggingRef = useRef<{ startX: number; startY: number; baseRx: number; baseRy: number } | null>(null);

  // Smooth auto turntable animation
  React.useEffect(() => {
    if (!autoSpin) return;
    let rafId: number;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotY((prev) => prev + dt * 28);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoSpin]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setAutoSpin(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseRx: rotX,
      baseRy: rotY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - draggingRef.current.startX;
    const dy = e.clientY - draggingRef.current.startY;
    setRotY(draggingRef.current.baseRy + dx * 0.55);
    setRotX(Math.max(-80, Math.min(45, draggingRef.current.baseRx - dy * 0.45)));
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const applyPreset = (id: CameraPresetId) => {
    setAutoSpin(false);
    setRotX(CAMERA_PRESETS[id].rx);
    setRotY(CAMERA_PRESETS[id].ry);
  };

  // Compute physical-proportion pixel box sizes for CSS 3D prism
  const maxDim = Math.max(size.widthCm, size.heightCm, size.gussetCm || 12);
  const scaleFactor = (size.isBox ? 290 : 300) / maxDim;

  const pxW = Math.round(size.widthCm * scaleFactor);
  // For boxes: heightCm = depth of box (lid top/bottom), gussetCm = vertical wall height!
  const pxH = size.isBox
    ? Math.round(size.gussetCm * scaleFactor)
    : Math.round(size.heightCm * scaleFactor);
  const pxD = size.isBox
    ? Math.round(size.heightCm * scaleFactor)
    : Math.max(26, Math.round((size.gussetCm || 4) * scaleFactor));

  const interiorShade = isDarkBag ? '#09090B' : '#D4D4D8';
  const bottomShade = isDarkBag ? '#0E0E11' : '#A1A1AA';

  const sharedFaceProps = {
    size,
    config,
    resolvedBgHex,
    resolvedPrimaryInk,
    resolvedAccentInk,
    resolvedMutedInk,
    resolvedStripeColor,
    isDarkBag,
    qrMatrix,
    showPrintGuides: false,
    transparentExport: false,
    className: 'w-full h-full block'
  };

  // Realistic 3D Handle SVG (rendered cleanly above front & back rims for bags)
  const renderBagHandle = () => {
    if (size.isBox || size.handleStyle === 'die-cut' || size.handleStyle === 'mailer-flap') {
      return null;
    }
    if (size.handleStyle === 'drawstring') {
      return (
        <svg viewBox="0 0 200 50" className="w-28 h-7 mx-auto -mb-1 pointer-events-none">
          <path
            d="M 55 48 C 55 12, 145 12, 145 48"
            fill="none"
            stroke={resolvedHandleColor}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    const isRibbon = size.handleStyle === 'ribbon' || size.handleStyle === 'loop';
    return (
      <svg viewBox="0 0 240 90" className="w-36 h-14 mx-auto -mb-2 pointer-events-none drop-shadow-sm">
        <path
          d="M 65 86 C 65 18, 175 18, 175 86"
          fill="none"
          stroke={resolvedHandleColor}
          strokeWidth={isRibbon ? '13' : '7'}
          strokeLinecap="round"
        />
        {isRibbon && (
          <path
            d="M 65 86 C 65 18, 175 18, 175 86"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="flex flex-col h-full bg-zinc-100/90 border border-zinc-200 rounded-2xl overflow-hidden select-none">
      {/* Top 3D Control Strip */}
      <div className="px-4 py-2.5 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700">
          <Move3d className="w-4 h-4 text-orange-500" />
          <span>Interactive 3D Mockup</span>
          <span className="text-zinc-400 font-normal hidden sm:inline">· Drag to rotate</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => (
            <button
              key={presetKey}
              type="button"
              onClick={() => applyPreset(presetKey)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              {CAMERA_PRESETS[presetKey].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoSpin((s) => !s)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
              autoSpin ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
            title="Toggle turntable spin"
          >
            {autoSpin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            Spin
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)))}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              applyPreset('iso');
              setZoom(1);
              setBoxOpenAmount(0);
            }}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
            title="Reset 3D camera"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Perspective Viewport */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex-1 min-h-[420px] flex items-center justify-center relative cursor-grab active:cursor-grabbing overflow-hidden"
        style={{
          perspective: '1300px',
          backgroundImage:
            'radial-gradient(circle at 50% 42%, #ffffff 0%, #f4f4f5 62%, #e4e4e7 100%)'
        }}
      >
        {/* Subtle CAD Blueprint Grid Floor */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(to right, #d4d4d8 1px, transparent 1px), linear-gradient(to bottom, #d4d4d8 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        {/* 3D Object Pivot */}
        <div
          className="relative"
          style={{
            width: `${pxW}px`,
            height: `${pxH}px`,
            transformStyle: 'preserve-3d',
            transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: draggingRef.current || autoSpin ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        >
          {/* Ambient Cast Floor Shadow */}
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              width: `${pxW * 1.08}px`,
              height: `${Math.max(70, pxD * 1.12)}px`,
              left: `${-pxW * 0.04}px`,
              top: `${pxH - pxD * 0.45 + 16}px`,
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 70%)',
              transform: 'rotateX(90deg)',
              transformStyle: 'preserve-3d'
            }}
          />

          {/* FRONT PANEL */}
          <div
            style={{
              position: 'absolute',
              width: `${pxW}px`,
              height: `${pxH}px`,
              transform: `translateZ(${pxD / 2}px)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible'
            }}
          >
            {!size.isBox && (
              <div style={{ position: 'absolute', top: '-46px', left: 0, right: 0 }}>
                {renderBagHandle()}
              </div>
            )}
            <div className="w-full h-full overflow-hidden shadow-inner ring-1 ring-black/10">
              <PackagingSvgRenderer {...sharedFaceProps} side="front" />
            </div>
          </div>

          {/* BACK PANEL */}
          <div
            style={{
              position: 'absolute',
              width: `${pxW}px`,
              height: `${pxH}px`,
              transform: `rotateY(180deg) translateZ(${pxD / 2}px)`,
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible'
            }}
          >
            {!size.isBox && (
              <div style={{ position: 'absolute', top: '-46px', left: 0, right: 0 }}>
                {renderBagHandle()}
              </div>
            )}
            <div className="w-full h-full overflow-hidden shadow-inner ring-1 ring-black/10">
              <PackagingSvgRenderer {...sharedFaceProps} side="back" />
            </div>
          </div>

          {/* RIGHT SIDE GUSSET / END PANEL */}
          <div
            style={{
              position: 'absolute',
              width: `${pxD}px`,
              height: `${pxH}px`,
              left: `${(pxW - pxD) / 2}px`,
              transform: `rotateY(90deg) translateZ(${pxW / 2}px)`,
              filter: 'brightness(0.95)',
              backfaceVisibility: 'visible'
            }}
          >
            <div className="w-full h-full overflow-hidden ring-1 ring-black/10 relative">
              <PackagingSvgRenderer {...sharedFaceProps} side="gusset" />
              {!size.isBox && size.gussetCm >= 8 && (
                <div
                  className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.16)' }}
                />
              )}
            </div>
          </div>

          {/* LEFT SIDE GUSSET / END PANEL */}
          <div
            style={{
              position: 'absolute',
              width: `${pxD}px`,
              height: `${pxH}px`,
              left: `${(pxW - pxD) / 2}px`,
              transform: `rotateY(-90deg) translateZ(${pxW / 2}px)`,
              filter: 'brightness(0.92)',
              backfaceVisibility: 'visible'
            }}
          >
            <div className="w-full h-full overflow-hidden ring-1 ring-black/10 relative">
              <PackagingSvgRenderer {...sharedFaceProps} side="gusset" />
              {!size.isBox && size.gussetCm >= 8 && (
                <div
                  className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.16)' }}
                />
              )}
            </div>
          </div>

          {/* BOTTOM BASE */}
          <div
            style={{
              position: 'absolute',
              width: `${pxW}px`,
              height: `${pxD}px`,
              top: `${(pxH - pxD) / 2}px`,
              transform: `rotateX(-90deg) translateZ(${pxH / 2}px)`,
              backgroundColor: bottomShade,
              backfaceVisibility: 'visible'
            }}
          />

          {/* TOP FACE: Box Lid OR Bag Open Interior */}
          {size.isBox ? (
            <>
              {/* Dark interior cavity visible when box lid opens */}
              <div
                style={{
                  position: 'absolute',
                  width: `${pxW - 6}px`,
                  height: `${pxD - 6}px`,
                  left: '3px',
                  top: `${(pxH - pxD) / 2 + 3}px`,
                  transform: `rotateX(90deg) translateZ(${pxH / 2 - 2}px)`,
                  background: '#18181B',
                  boxShadow: 'inset 0 0 24px rgba(0,0,0,0.85)'
                }}
              />
              {/* Hinged Top Box Lid */}
              <div
                style={{
                  position: 'absolute',
                  width: `${pxW}px`,
                  height: `${pxD}px`,
                  top: `${(pxH - pxD) / 2}px`,
                  transformOrigin: size.handleStyle === 'drawer' ? 'center center' : 'center top',
                  transform:
                    size.handleStyle === 'drawer'
                      ? `rotateX(90deg) translateZ(${pxH / 2 + 1}px)`
                      : `rotateX(${90 + boxOpenAmount * 0.55}deg) translateZ(${pxH / 2 + 1}px)`,
                  transition: 'transform 180ms ease-out',
                  backfaceVisibility: 'visible'
                }}
              >
                <div className="w-full h-full overflow-hidden ring-1 ring-black/15 shadow-md">
                  <PackagingSvgRenderer {...sharedFaceProps} side="lid" />
                </div>
              </div>
              {/* Slide-Out Inner Drawer Tray */}
              {size.handleStyle === 'drawer' && (
                <div
                  style={{
                    position: 'absolute',
                    width: `${pxW - 10}px`,
                    height: `${pxH - 8}px`,
                    left: '5px',
                    top: '4px',
                    backgroundColor: resolvedAccentInk,
                    transform: `translateZ(${pxD / 2 + boxOpenAmount * 1.4}px)`,
                    transition: 'transform 180ms ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="ring-1 ring-black/20 shadow-lg"
                >
                  {/* Satin Pull Ribbon Tab */}
                  <div
                    className="w-8 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: resolvedPrimaryInk }}
                  />
                </div>
              )}
            </>
          ) : (
            /* Bag Top Cavity Shadow + Folded Top Lip */
            <div
              style={{
                position: 'absolute',
                width: `${pxW - 4}px`,
                height: `${pxD - 4}px`,
                left: '2px',
                top: `${(pxH - pxD) / 2 + 2}px`,
                transform: `rotateX(90deg) translateZ(${pxH / 2 - 4}px)`,
                background: `linear-gradient(180deg, ${interiorShade} 0%, #09090B 100%)`,
                border: `4px solid ${resolvedBgHex}`,
                boxShadow: 'inset 0 0 28px rgba(0,0,0,0.45)'
              }}
            />
          )}
        </div>

        {/* Live Telemetry Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="px-2.5 py-1 bg-white/90 backdrop-blur border border-zinc-200 rounded-lg text-[11px] font-mono tabular-nums text-zinc-700 pointer-events-auto">
            {size.name} · {size.widthCm}×{size.heightCm}×{size.gussetCm} cm
          </div>

          {size.isBox && (
            <div className="px-3 py-1 bg-white/95 backdrop-blur border border-zinc-200 rounded-lg flex items-center gap-2 text-[11px] font-bold text-zinc-700 pointer-events-auto">
              <RotateCw className="w-3 h-3 text-orange-500" />
              <span>{size.handleStyle === 'drawer' ? 'Slide Drawer' : 'Peek Lid'}</span>
              <input
                type="range"
                min={0}
                max={85}
                value={boxOpenAmount}
                onChange={(e) => setBoxOpenAmount(Number(e.target.value))}
                className="w-20 accent-orange-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
