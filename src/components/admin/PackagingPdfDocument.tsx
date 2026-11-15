import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet
} from '@react-pdf/renderer';
import {
  PackagingDesignConfig,
  PackagingSizePreset,
  PrintSide,
  PACKAGING_LAYOUTS,
  hexToApproxCmyk,
  getHexLuminance
} from '../../utils/packagingPresets';

export interface RenderedPdfPanel {
  id: PrintSide;
  label: string;
  physW: number;
  physH: number;
  viewW: number;
  viewH: number;
  pngDataUrl: string;
}

export interface PackagingPdfDocumentProps {
  panels: RenderedPdfPanel[];
  qrDataUrl: string | null;
  config: PackagingDesignConfig;
  size: PackagingSizePreset;
  themeName: string;
  resolvedBgHex: string;
  resolvedPrimaryInk: string;
  resolvedAccentInk: string;
  qrPhysicalSizeCm: number;
  transparentExport: boolean;
  includeOverviewPage: boolean;
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: '#18181B',
    fontSize: 9
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#F97316',
    paddingBottom: 12,
    marginBottom: 16
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#111113',
    letterSpacing: 0.6
  },
  subHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#71717A',
    marginTop: 3,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  metaRight: {
    alignItems: 'flex-end'
  },
  badge: {
    backgroundColor: '#111113',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8
  },
  metaDate: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#52525B'
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  proofGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  proofCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#FAFAFA',
    alignItems: 'center'
  },
  proofCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  proofPanelName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#18181B',
    textTransform: 'uppercase'
  },
  proofPanelDims: {
    fontSize: 7.5,
    fontFamily: 'Courier',
    color: '#71717A'
  },
  proofImgBox: {
    width: '100%',
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 4,
    padding: 4
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14
  },
  specBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    padding: 10
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    gap: 8
  },
  specKey: {
    fontSize: 8,
    color: '#71717A'
  },
  specVal: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#18181B',
    textAlign: 'right',
    maxWidth: '62%'
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5'
  },
  swatchSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D4D4D8'
  },
  qrVerifyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#FAFAFA'
  },
  footerStrip: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 7.5,
    fontFamily: 'Courier',
    color: '#71717A'
  },
  // High-resolution individual plate pages
  platePage: {
    padding: 28,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: '#18181B',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  plateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    paddingBottom: 8
  },
  plateTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111113',
    textTransform: 'uppercase'
  },
  plateMeta: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: '#52525B'
  },
  plateStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14
  },
  plateFrame: {
    borderWidth: 0.75,
    borderColor: '#A1A1AA',
    borderStyle: 'dashed',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  plateFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

export const PackagingPdfDocument: React.FC<PackagingPdfDocumentProps> = ({
  panels,
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
}) => {
  const layoutLabel = PACKAGING_LAYOUTS.find((l) => l.id === config.layoutId)?.label || config.layoutId;
  const generatedDate = new Date().toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
  const needsDarkProofBackdrop = transparentExport && getHexLuminance(resolvedPrimaryInk) > 0.65;

  return (
    <Document
      title={`${config.brandTitle} Packaging Print Pack - ${size.name}`}
      author={config.brandTitle}
      subject="High-Resolution Print Production Artwork & Specifications"
      creator="Solemate Packaging Print Studio"
    >
      {/* PAGE 1: PRODUCTION PROOF SHEET & PRINTER BRIEF */}
      {includeOverviewPage && (
        <Page size="A4" orientation="portrait" style={styles.page}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.brandTitle}>{config.brandTitle}</Text>
              <Text style={styles.subHeader}>
                Packaging Production Specification &amp; Press Proof
              </Text>
            </View>
            <View style={styles.metaRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{size.shortLabel.toUpperCase()}</Text>
              </View>
              <Text style={styles.metaDate}>
                {size.widthCm}×{size.heightCm}×{size.gussetCm} CM · {generatedDate}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>
            1. Multi-Panel Print Proof ({transparentExport ? 'Ink-Only Plate' : 'Full Bleed Stock'})
          </Text>
          <View style={styles.proofGrid}>
            {panels.map((panel) => (
              <View key={panel.id} style={styles.proofCard}>
                <View style={styles.proofCardHeader}>
                  <Text style={styles.proofPanelName}>{panel.label}</Text>
                  <Text style={styles.proofPanelDims}>
                    {panel.physW}×{panel.physH} cm
                  </Text>
                </View>
                <View
                  style={[
                    styles.proofImgBox,
                    needsDarkProofBackdrop ? { backgroundColor: '#18181B' } : {}
                  ]}
                >
                  <Image
                    src={panel.pngDataUrl}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 135,
                      objectFit: 'contain'
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.twoCol}>
            {/* Physical Specifications */}
            <View style={styles.specBox}>
              <Text style={styles.sectionLabel}>2. Stock &amp; Construction</Text>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Format</Text>
                <Text style={styles.specVal}>{size.name}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Dimensions</Text>
                <Text style={[styles.specVal, { fontFamily: 'Courier' }]}>
                  {size.widthCm}×{size.heightCm}×{size.gussetCm} cm
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Stock</Text>
                <Text style={styles.specVal}>{size.defaultMaterial}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specKey}>Handles</Text>
                <Text style={styles.specVal}>{size.handleLabel}</Text>
              </View>
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specKey}>Template</Text>
                <Text style={styles.specVal}>
                  {themeName} · {layoutLabel}
                </Text>
              </View>
            </View>

            {/* Ink & CMYK Table */}
            <View style={styles.specBox}>
              <Text style={styles.sectionLabel}>3. Ink &amp; CMYK Formulas</Text>
              {[
                { label: 'Base Stock', hex: resolvedBgHex },
                { label: 'Primary Ink', hex: resolvedPrimaryInk },
                { label: 'Accent Ink', hex: resolvedAccentInk }
              ].map((sw) => (
                <View key={sw.label} style={styles.swatchRow}>
                  <View style={[styles.swatchSquare, { backgroundColor: sw.hex }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                      {sw.label} ({sw.hex})
                    </Text>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Courier', color: '#52525B' }}>
                      {hexToApproxCmyk(sw.hex)}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontSize: 7.5, color: '#52525B' }}>
                  Copy: {config.tagline} · {config.socialHandle} · {config.phoneText}
                </Text>
              </View>
            </View>
          </View>

          {/* Scannable QR Verification Card */}
          <Text style={styles.sectionLabel}>4. Scannable QR Code Sign-Off</Text>
          <View style={styles.qrVerifyBox}>
            {qrDataUrl && (
              <Image
                src={qrDataUrl}
                style={{ width: 62, height: 62, objectFit: 'contain' }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 3 }}>
                Encoded Destination: {config.qrTargetUrl}
              </Text>
              <Text style={{ fontSize: 7.5, fontFamily: 'Courier', color: '#52525B', marginBottom: 2 }}>
                Placement: {config.qrPlacement.toUpperCase()} · Error Correction: ECC-{config.qrErrorLevel} · Quiet Zone: 4 Modules
              </Text>
              <Text style={{ fontSize: 7.5, fontFamily: 'Courier', color: '#16A34A' }}>
                Est. Printed Size: ~{qrPhysicalSizeCm} cm · High-Contrast #111113 on #FFFFFF Pad (Scan Verified)
              </Text>
            </View>
          </View>

          <View style={styles.footerStrip}>
            <Text style={styles.footerText}>
              {config.brandTitle} · {config.locationText}
            </Text>
            <Text style={styles.footerText}>
              Page 1 of {panels.length + 1} · Full-Scale Plates Follow
            </Text>
          </View>
        </Page>
      )}

      {/* HIGH-RESOLUTION PRINTABLE PLATES FOR EACH PANEL */}
      {panels.map((panel, idx) => {
        const isLandscape = panel.viewW > panel.viewH;
        const maxDrawWidth = isLandscape ? 740 : 510;
        const maxDrawHeight = isLandscape ? 460 : 690;
        const aspect = panel.viewW / Math.max(panel.viewH, 1);

        let drawW = maxDrawWidth;
        let drawH = drawW / aspect;
        if (drawH > maxDrawHeight) {
          drawH = maxDrawHeight;
          drawW = drawH * aspect;
        }

        const pageNumber = includeOverviewPage ? idx + 2 : idx + 1;
        const totalPages = includeOverviewPage ? panels.length + 1 : panels.length;

        return (
          <Page
            key={panel.id}
            size="A4"
            orientation={isLandscape ? 'landscape' : 'portrait'}
            style={styles.platePage}
          >
            <View style={styles.plateHeader}>
              <Text style={styles.plateTitle}>
                {config.brandTitle} — {size.shortLabel} ({panel.label})
              </Text>
              <Text style={styles.plateMeta}>
                REAL SIZE: {panel.physW} × {panel.physH} CM · {transparentExport ? 'INK-ONLY SEPARATION' : 'FULL BLEED'} · HIGH-RES 300+ DPI PLATE
              </Text>
            </View>

            <View style={styles.plateStage}>
              <View
                style={[
                  styles.plateFrame,
                  needsDarkProofBackdrop ? { backgroundColor: '#18181B' } : {}
                ]}
              >
                <Image
                  src={panel.pngDataUrl}
                  style={{
                    width: Math.round(drawW),
                    height: Math.round(drawH),
                    objectFit: 'contain'
                  }}
                />
              </View>
            </View>

            <View style={styles.plateFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={styles.plateMeta}>STOCK: {resolvedBgHex}</Text>
                <Text style={styles.plateMeta}>INK: {resolvedPrimaryInk}</Text>
                <Text style={styles.plateMeta}>ACCENT: {resolvedAccentInk}</Text>
              </View>
              <Text style={styles.plateMeta}>
                Sheet {pageNumber} / {totalPages} · Keep dashed trim line outside artwork
              </Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default PackagingPdfDocument;
