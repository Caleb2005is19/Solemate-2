import React from 'react';
import { Document, Page, Text, View, StyleSheet, Svg, Path, Line } from '@react-pdf/renderer';
import { Order, Seller, SiteSettings } from '../../services/types';
import { ReportFilterOptions, ReportSummaryMetrics } from '../../utils/reportCsvExporter';

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181b',
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandContainer: {
    flex: 1,
    paddingRight: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandMain: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  brandAccent: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#f97316',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#71717a',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  brandDomainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 4,
  },
  brandDomainText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
  },
  storeContact: {
    fontSize: 7.5,
    color: '#52525b',
    lineHeight: 1.35,
  },
  metaRight: {
    alignItems: 'flex-end',
    width: '38%',
  },
  badge: {
    backgroundColor: '#18181b',
    color: '#ffffff',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  metaText: {
    fontSize: 7.5,
    color: '#71717a',
    marginBottom: 2,
    textAlign: 'right',
  },
  metaValue: {
    color: '#18181b',
    fontFamily: 'Helvetica-Bold',
  },
  // Top Notice Banner
  brandBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  brandBannerText: {
    fontSize: 7.5,
    color: '#52525b',
  },
  brandBannerBold: {
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
  },
  // KPI Section
  kpiContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
    padding: 10,
  },
  kpiBox: {
    flex: 1,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#e4e4e7',
  },
  kpiBoxLast: {
    flex: 1,
    paddingHorizontal: 8,
  },
  kpiLabel: {
    fontSize: 7,
    color: '#71717a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 12.5,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
  },
  kpiSub: {
    fontSize: 7,
    color: '#a1a1aa',
    marginTop: 2,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    marginBottom: 6,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 3,
  },
  // Tables
  table: {
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableHeaderCol: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#52525b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableCol: {
    fontSize: 7.5,
    color: '#27272a',
  },
  textRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  fontBold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Two column breakout
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  halfCol: {
    width: '48.5%',
  },
  // Status pill
  statusPaid: {
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
  statusPending: {
    color: '#d97706',
    fontFamily: 'Helvetica-Bold',
  },
  statusCancelled: {
    color: '#dc2626',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 8,
    fontSize: 7,
    color: '#a1a1aa',
  },
  footerBrand: {
    fontFamily: 'Helvetica-Bold',
    color: '#ea580c',
  },
});

interface SalesReportPdfProps {
  orders: Order[];
  summary: ReportSummaryMetrics;
  filterOptions: ReportFilterOptions;
  siteSettings?: SiteSettings;
  sellers?: Seller[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  topProducts: { name: string; category: string; units: number; revenue: number }[];
}

export function SalesReportPdfDocument({
  orders,
  summary,
  filterOptions,
  siteSettings,
  sellers = [],
  categoryBreakdown,
  topProducts,
}: SalesReportPdfProps) {
  const businessName = siteSettings?.businessName || 'Solemate.co.ke';
  const contactEmail = siteSettings?.contactEmail || 'support@solemate.co.ke';
  const phone = siteSettings?.phoneNumbers?.[0] || '+254 700 000 000';
  const location = siteSettings?.location || 'Nairobi, Kenya';
  const website = 'https://solemate.co.ke';

  const formatKes = (amount: number) => `KES ${Math.round(amount).toLocaleString()}`;

  // Limit recent transactions to 30 rows on PDF
  const previewOrders = orders.slice(0, 30);

  // Deterministic report reference ID
  const reportRef = `SM-REP-${Date.now().toString(36).toUpperCase()}`;

  return (
    <Document 
      title={`Solemate (${businessName}) Sales Report - ${filterOptions.datePresetLabel}`}
      author="solemate.co.ke"
      subject="Financial Sales & Revenue Performance Report"
      creator="Solemate.co.ke Portal"
    >
      <Page size="A4" style={styles.page}>
        {/* Header with Full solemate.co.ke Branding */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            {/* Logo and Name */}
            <View style={styles.logoRow}>
              {/* Sneaker Vector Emblem */}
              <View style={{ marginRight: 8 }}>
                <Svg width="36" height="25" viewBox="0 0 500 350">
                  <Path
                    d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z"
                    fill="#f97316"
                  />
                  <Line x1="225" y1="75" x2="250" y2="160" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <Line x1="270" y1="95" x2="295" y2="170" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <Line x1="315" y1="125" x2="340" y2="185" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
                  <Path
                    d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z"
                    fill="#ea580c"
                  />
                </Svg>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.brandMain}>Solemate</Text>
                <Text style={styles.brandAccent}>.co.ke</Text>
              </View>
            </View>

            <Text style={styles.brandTagline}>Authentic Footwear & Sneakers • Kenya</Text>

            {/* Domain Verification Badge */}
            <View style={styles.brandDomainBadge}>
              <Text style={styles.brandDomainText}>🌐 Official Website: solemate.co.ke</Text>
            </View>

            <Text style={styles.storeContact}>
              {businessName} • {location} • {phone} • {contactEmail}
            </Text>
          </View>

          {/* Right Meta Column */}
          <View style={styles.metaRight}>
            <Text style={styles.badge}>{filterOptions.datePresetLabel}</Text>
            <Text style={styles.metaText}>
              Audit Ref: <Text style={styles.metaValue}>{reportRef}</Text>
            </Text>
            <Text style={styles.metaText}>
              Generated: <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </Text>
            {filterOptions.sellerName && (
              <Text style={styles.metaText}>
                Seller Scope: <Text style={styles.metaValue}>{filterOptions.sellerName}</Text>
              </Text>
            )}
            {filterOptions.category && filterOptions.category !== 'all' && (
              <Text style={styles.metaText}>
                Category: <Text style={styles.metaValue}>{filterOptions.category}</Text>
              </Text>
            )}
            {filterOptions.status && filterOptions.status !== 'all' && (
              <Text style={styles.metaText}>
                Payment Filter: <Text style={styles.metaValue}>{filterOptions.status}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Security & Authenticity Banner */}
        <View style={styles.brandBanner}>
          <Text style={styles.brandBannerText}>
            Official Certified Financial Performance Report for <Text style={styles.brandBannerBold}>solemate.co.ke</Text>
          </Text>
          <Text style={[styles.brandBannerText, { color: '#ea580c', fontFamily: 'Helvetica-Bold' }]}>
            Confidential Store Audit
          </Text>
        </View>

        {/* Executive KPI Summary */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Gross Sales</Text>
            <Text style={styles.kpiValue}>{formatKes(summary.totalRevenue)}</Text>
            <Text style={styles.kpiSub}>{summary.totalOrders} total orders recorded</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net Paid Revenue</Text>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{formatKes(summary.paidRevenue)}</Text>
            <Text style={styles.kpiSub}>{summary.paidOrdersCount} completed payments</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pending / Unsettled</Text>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>{formatKes(summary.pendingRevenue)}</Text>
            <Text style={styles.kpiSub}>Awaiting M-Pesa / Card clearing</Text>
          </View>
          <View style={styles.kpiBoxLast}>
            <Text style={styles.kpiLabel}>Avg. Order Value</Text>
            <Text style={styles.kpiValue}>{formatKes(summary.avgOrderValue)}</Text>
            <Text style={styles.kpiSub}>Per customer checkout</Text>
          </View>
        </View>

        {/* Category Breakdown & Top Products Split */}
        <View style={styles.twoColRow}>
          {/* Categories */}
          <View style={styles.halfCol}>
            <Text style={styles.sectionTitle}>Sales by Footwear Category</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '50%' }]}>Category</Text>
                <Text style={[styles.tableHeaderCol, styles.textCenter, { width: '20%' }]}>Units</Text>
                <Text style={[styles.tableHeaderCol, styles.textRight, { width: '30%' }]}>Revenue</Text>
              </View>
              {categoryBreakdown.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: '100%' }]}>No category sales in period</Text>
                </View>
              ) : (
                categoryBreakdown.slice(0, 5).map((cat, idx) => (
                  <View key={cat.category} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
                    <Text style={[styles.tableCol, styles.fontBold, { width: '50%' }]}>{cat.category}</Text>
                    <Text style={[styles.tableCol, styles.textCenter, { width: '20%' }]}>{cat.count}</Text>
                    <Text style={[styles.tableCol, styles.textRight, { width: '30%' }]}>{formatKes(cat.revenue)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Top Selling Products */}
          <View style={styles.halfCol}>
            <Text style={styles.sectionTitle}>Top Footwear Models</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '55%' }]}>Product Model</Text>
                <Text style={[styles.tableHeaderCol, styles.textCenter, { width: '15%' }]}>Qty</Text>
                <Text style={[styles.tableHeaderCol, styles.textRight, { width: '30%' }]}>Sales</Text>
              </View>
              {topProducts.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: '100%' }]}>No product sales in period</Text>
                </View>
              ) : (
                topProducts.slice(0, 5).map((prod, idx) => (
                  <View key={prod.name} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
                    <Text style={[styles.tableCol, styles.fontBold, { width: '55%' }]}>
                      {prod.name.length > 24 ? `${prod.name.slice(0, 23)}...` : prod.name}
                    </Text>
                    <Text style={[styles.tableCol, styles.textCenter, { width: '15%' }]}>{prod.units}</Text>
                    <Text style={[styles.tableCol, styles.textRight, { width: '30%' }]}>{formatKes(prod.revenue)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Transactions Table */}
        <Text style={styles.sectionTitle}>Recent Transactions Journal ({orders.length} total orders)</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, { width: '20%' }]}>Order ID</Text>
            <Text style={[styles.tableHeaderCol, { width: '16%' }]}>Date</Text>
            <Text style={[styles.tableHeaderCol, { width: '24%' }]}>Customer</Text>
            <Text style={[styles.tableHeaderCol, styles.textCenter, { width: '14%' }]}>Status</Text>
            <Text style={[styles.tableHeaderCol, styles.textRight, { width: '26%' }]}>Total (KES)</Text>
          </View>
          {previewOrders.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, { width: '100%' }]}>No transactions match the selected filter criteria.</Text>
            </View>
          ) : (
            previewOrders.map((ord, idx) => {
              const cust = ord.customerInfo || { firstName: '', lastName: '' };
              const custName = `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Guest Customer';
              const isPaid = ord.paymentStatus === 'Paid' || ord.status === 'Delivered';
              const isCancelled = ord.status === 'Cancelled' || ord.paymentStatus === 'Failed';

              return (
                <View key={ord.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
                  <Text style={[styles.tableCol, styles.fontBold, { width: '20%' }]}>
                    {ord.id.length > 12 ? ord.id.slice(-10).toUpperCase() : ord.id}
                  </Text>
                  <Text style={[styles.tableCol, { width: '16%' }]}>{ord.date?.split('T')[0] || ord.date || 'N/A'}</Text>
                  <Text style={[styles.tableCol, { width: '24%' }]}>
                    {custName.length > 18 ? `${custName.slice(0, 17)}...` : custName}
                  </Text>
                  <Text style={[
                    styles.tableCol,
                    styles.textCenter,
                    { width: '14%' },
                    isPaid ? styles.statusPaid : isCancelled ? styles.statusCancelled : styles.statusPending
                  ]}>
                    {ord.paymentStatus || ord.status}
                  </Text>
                  <Text style={[styles.tableCol, styles.textRight, styles.fontBold, { width: '26%' }]}>
                    {formatKes(ord.total || 0)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {orders.length > 30 && (
          <Text style={{ fontSize: 7, color: '#71717a', fontStyle: 'italic', marginBottom: 8 }}>
            * Showing latest 30 transactions of {orders.length} total. For complete records, download the full CSV export.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            <Text style={styles.footerBrand}>solemate.co.ke</Text> • Confidential Management & Financial Audit Report
          </Text>
          <Text>Visit: {website} • {contactEmail}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
