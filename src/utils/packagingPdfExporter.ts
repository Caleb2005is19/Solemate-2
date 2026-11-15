import React from 'react';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import {
  PackagingDesignConfig,
  PackagingSizePreset,
  PrintSide
} from './packagingPresets';
import PackagingPdfDocument, {
  RenderedPdfPanel
} from '../components/admin/PackagingPdfDocument';

export interface PanelSvgInput {
  id: PrintSide;
  label: string;
  physW: number;
  physH: number;
  viewW: number;
  viewH: number;
  svgElement: SVGSVGElement | null;
}

async function inlineSvgExternalImages(clone: SVGSVGElement): Promise<void> {
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
        // ignore if CORS fetch fails
      }
    })
  );
}

async function rasterizeSvgPanelToHighResPng(
  panel: PanelSvgInput,
  transparentExport: boolean
): Promise<string | null> {
  if (!panel.svgElement) return null;

  const clone = panel.svgElement.cloneNode(true) as SVGSVGElement;
  clone.querySelectorAll('[data-guide-only="true"]').forEach((el) => el.remove());
  if (transparentExport) {
    clone.querySelectorAll('[data-bag-bg="true"]').forEach((el) => el.remove());
  }

  await inlineSvgExternalImages(clone);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobUrl = URL.createObjectURL(svgBlob);

  // Target ~3200px along the longest edge (~300+ DPI across an A4 sheet)
  const maxEdge = 3200;
  const aspect = panel.viewW / Math.max(panel.viewH, 1);
  const targetW = aspect >= 1 ? maxEdge : Math.max(600, Math.round(maxEdge * aspect));
  const targetH = aspect >= 1 ? Math.max(600, Math.round(maxEdge / aspect)) : maxEdge;

  return new Promise<string | null>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetW, targetH);
          resolve(canvas.toDataURL('image/png', 1.0));
        } else {
          resolve(null);
        }
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(null);
    };
    img.src = blobUrl;
  });
}

export interface ExportPackagingPdfOptions {
  panels: PanelSvgInput[];
  config: PackagingDesignConfig;
  size: PackagingSizePreset;
  themeName: string;
  resolvedBgHex: string;
  resolvedPrimaryInk: string;
  resolvedAccentInk: string;
  qrPhysicalSizeCm: number;
  transparentExport: boolean;
  includeOverviewPage: boolean;
  filename?: string;
}

export async function exportPackagingPdf({
  panels,
  config,
  size,
  themeName,
  resolvedBgHex,
  resolvedPrimaryInk,
  resolvedAccentInk,
  qrPhysicalSizeCm,
  transparentExport,
  includeOverviewPage,
  filename
}: ExportPackagingPdfOptions): Promise<void> {
  const renderedPanels: RenderedPdfPanel[] = [];

  for (const p of panels) {
    const pngDataUrl = await rasterizeSvgPanelToHighResPng(p, transparentExport);
    if (pngDataUrl) {
      renderedPanels.push({
        id: p.id,
        label: p.label,
        physW: p.physW,
        physH: p.physH,
        viewW: p.viewW,
        viewH: p.viewH,
        pngDataUrl
      });
    }
  }

  if (renderedPanels.length === 0) {
    throw new Error('No printable panel artwork was ready to export.');
  }

  let qrDataUrl: string | null = null;
  try {
    const url = (config.qrTargetUrl || '').trim() || 'https://solemate.co.ke/shop';
    qrDataUrl = await QRCode.toDataURL(url, {
      margin: 4,
      width: 520,
      errorCorrectionLevel: config.qrErrorLevel,
      color: { dark: '#111113', light: '#FFFFFF' }
    });
  } catch {
    qrDataUrl = null;
  }

  const docElement = React.createElement(PackagingPdfDocument, {
    panels: renderedPanels,
    qrDataUrl,
    config,
    size,
    themeName,
    resolvedBgHex,
    resolvedPrimaryInk,
    resolvedAccentInk,
    qrPhysicalSizeCm,
    transparentExport,
    includeOverviewPage
  });

  const blob = await pdf(docElement as any).toBlob();
  const downloadName =
    filename ||
    `solemate-${size.id}-${includeOverviewPage ? 'complete-print-pack' : renderedPanels[0].id}-${size.widthCm}x${size.heightCm}cm.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
