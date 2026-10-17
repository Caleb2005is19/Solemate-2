import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Order, Seller, SiteSettings } from '../../services/types';
import { ReportFilterOptions, ReportSummaryMetrics } from '../../utils/reportCsvExporter';

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#18181b',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f97316',
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    letterSpacing: -0.5,
  },
  reportSubtitle: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 3,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  storeContact: {
    fontSize: 8,
    color: '#52525b',
    marginTop: 4,
    lineHeight: 1.4,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    color: '#ea580c',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 8,
    color: '#71717a',
    marginBottom: 2,
  },
  metaValue: {
    color: '#18181b',
    fontFamily: 'Helvetica-Bold',
  },
  // KPI Section
  kpiContainer: {
    flexDirection: 'row',
    marginBottom: 18,
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
    fontSize: 7.5,
    color: '#71717a',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 13,
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
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#09090b',
    marginBottom: 8,
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 4,
  },
  // Tables
  table: {
    width: '100%',
    marginBottom: 14,
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
    paddingVertical: 6,
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableCol: {
    fontSize: 8,
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
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 8,
    fontSize: 7.5,
    color: '#a1a1aa',
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
  const businessName = siteSettings?.businessName || 'KicksKE';
  const contactEmail = siteSettings?.contactEmail || 'sales@kickske.com';
  const phone = siteSettings?.phoneNumbers?.[0] || '+254 700 000 000';
  const location = siteSettings?.location || 'Nairobi, Kenya';

  const formatKes = (amount: number) => `KES ${Math.round(amount).toLocaleString()}`;

  // Limit recent orders to 30 rows on PDF
  const previewOrders = orders.slice(0, 30);

  return (
    <Document title={`${businessName} Sales Report - ${filterOptions.datePresetLabel}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>{businessName}</Text>
            <Text style={styles.reportSubtitle}>Official Sales & Revenue Performance Report</Text>
            <Text style={styles.storeContact}>
              {location} · {phone} · {contactEmail}
            </Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.badge}>{filterOptions.datePresetLabel}</Text>
            <Text style={styles.metaText}>
              Generated: <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
            </Text>
            {filterOptions.sellerName && (
              <Text style={styles.metaText}>
                Seller Scope: <Text style={styles.metaValue}>{filterOptions.sellerName}</Text>
              </Text>
            )}
            {filterOptions.category && filterOptions.category !== 'all' && (
              <Text style={styles.metaText}>
                Category Scope: <Text style={styles.metaValue}>{filterOptions.category}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Executive KPI Summary */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Gross Sales</Text>
            <Text style={styles.kpiValue}>{formatKes(summary.totalRevenue)}</Text>
            <Text style={styles.kpiSub}>{summary.totalOrders} total orders</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Net Paid Revenue</Text>
            <Text style={[styles.kpiValue, { color: '#16a34a' }]}>{formatKes(summary.paidRevenue)}</Text>
            <Text style={styles.kpiSub}>{summary.paidOrdersCount} completed orders</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pending / Unsettled</Text>
            <Text style={[styles.kpiValue, { color: '#d97706' }]}>{formatKes(summary.pendingRevenue)}</Text>
            <Text style={styles.kpiSub}>Awaiting payment</Text>
          </View>
          <View style={styles.kpiBoxLast}>
            <Text style={styles.kpiLabel}>Avg. Order Value</Text>
            <Text style={styles.kpiValue}>{formatKes(summary.avgOrderValue)}</Text>
            <Text style={styles.kpiSub}>Per customer cart</Text>
          </View>
        </View>

        {/* Category Breakdown & Top Products Split */}
        <View style={styles.twoColRow}>
          {/* Categories */}
          <View style={styles.halfCol}>
            <Text style={styles.sectionTitle}>Sales by Category</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '50%' }]}>Category</Text>
                <Text style={[styles.tableHeaderCol, styles.textCenter, { width: '20%' }]}>Units</Text>
                <Text style={[styles.tableHeaderCol, styles.textRight, { width: '30%' }]}>Revenue</Text>
              </View>
              {categoryBreakdown.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: '100%' }]}>No category data recorded</Text>
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
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCol, { width: '55%' }]}>Product</Text>
                <Text style={[styles.tableHeaderCol, styles.textCenter, { width: '15%' }]}>Qty</Text>
                <Text style={[styles.tableHeaderCol, styles.textRight, { width: '30%' }]}>Sales</Text>
              </View>
              {topProducts.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCol, { width: '100%' }]}>No product sales recorded</Text>
                </View>
              ) : (
                topProducts.slice(0, 5).map((prod, idx) => (
                  <View key={prod.name} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
                    <Text style={[styles.tableCol, styles.fontBold, { width: '55%' }]}>
                      {prod.name.length > 25 ? `${prod.name.slice(0, 24)}...` : prod.name}
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
        <Text style={styles.sectionTitle}>Recent Transactions ({orders.length} total orders)</Text>
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
              <Text style={[styles.tableCol, { width: '100%' }]}>No orders match the selected filters.</Text>
            </View>
          ) : (
            previewOrders.map((ord, idx) => {
              const cust = ord.customerInfo || { firstName: '', lastName: '' };
              const custName = `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Guest';
              const isPaid = ord.paymentStatus === 'Paid' || ord.status === 'Delivered';
              const isCancelled = ord.status === 'Cancelled' || ord.paymentStatus === 'Failed';

              return (
                <View key={ord.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}>
                  <Text style={[styles.tableCol, styles.fontBold, { width: '20%' }]}>{ord.id.slice(0, 12)}</Text>
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
          <Text style={{ fontSize: 7, color: '#71717a', fontStyle: 'italic', marginBottom: 10 }}>
            * Showing 30 of {orders.length} orders. For full transaction details, export the complete CSV spreadsheet.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{businessName} Confidential Management Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
