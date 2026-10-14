import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Order, SiteSettings } from '../services/types';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#18181b', // zinc-900
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    borderBottom: 2,
    borderBottomColor: '#f97316', // orange-500
    paddingBottom: 16,
  },
  logoSection: {
    flexDirection: 'column',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoMain: {
    fontSize: 22,
    fontWeight: 'black',
    color: '#18181b',
  },
  logoHighlight: {
    fontSize: 22,
    fontWeight: 'black',
    color: '#f97316',
  },
  tagline: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 8,
    color: '#52525b',
    marginBottom: 1,
  },
  invoiceMeta: {
    textAlign: 'right',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceBadge: {
    backgroundColor: '#fff7ed',
    border: 1,
    borderColor: '#ffedd5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  invoiceBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#c2410c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 4,
  },
  metaRow: {
    fontSize: 8,
    color: '#71717a',
    marginBottom: 2,
  },
  metaValue: {
    fontWeight: 'bold',
    color: '#27272a',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 8,
    border: 1,
    borderColor: '#f4f4f5',
    marginBottom: 22,
  },
  infoCol: {
    width: '48%',
  },
  infoColTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#71717a',
    marginBottom: 6,
    borderBottom: 1,
    borderBottomColor: '#e4e4e7',
    paddingBottom: 2,
  },
  infoName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 8.5,
    color: '#3f3f46',
    marginBottom: 2,
  },
  table: {
    width: 'auto',
    marginBottom: 20,
    border: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderBottom: 1,
    borderBottomColor: '#e4e4e7',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f4f4f5',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  colNum: { width: '8%', textAlign: 'center' },
  colDesc: { width: '48%' },
  colQty: { width: '12%', textAlign: 'center' },
  colPrice: { width: '16%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right' },
  thText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#18181b',
  },
  itemSub: {
    fontSize: 7.5,
    color: '#ea580c',
    marginTop: 1,
  },
  tdText: {
    fontSize: 8.5,
    color: '#27272a',
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  paymentSummary: {
    width: '50%',
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 6,
    border: 1,
    borderColor: '#f4f4f5',
  },
  paymentSummaryTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#71717a',
    marginBottom: 6,
  },
  paymentRow: {
    fontSize: 8,
    color: '#52525b',
    marginBottom: 2,
  },
  totalsBox: {
    width: '45%',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  calcLabel: {
    fontSize: 8.5,
    color: '#71717a',
  },
  calcVal: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#27272a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTop: 2,
    borderTopColor: '#f97316',
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#18181b',
  },
  grandTotalVal: {
    fontSize: 12,
    fontWeight: 'black',
    color: '#ea580c',
  },
  footer: {
    borderTop: 1,
    borderTopColor: '#e4e4e7',
    paddingTop: 14,
    textAlign: 'center',
    position: 'absolute',
    bottom: 28,
    left: 36,
    right: 36,
  },
  footerHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#27272a',
    marginBottom: 3,
  },
  footerSub: {
    fontSize: 7,
    color: '#71717a',
    lineHeight: 1.3,
  },
});

interface InvoiceProps {
  order: Order;
  siteSettings?: Partial<SiteSettings>;
}

export const InvoiceDocument: React.FC<InvoiceProps> = ({ order, siteSettings }) => {
  const formatPrice = (val: number) => `KES ${Math.round(val || 0).toLocaleString()}`;

  const customerInfo = order?.customerInfo || {
    firstName: 'Customer',
    lastName: '',
    email: 'N/A',
    phone: 'N/A',
    location: 'N/A',
    city: 'N/A',
  };

  const orderId = (order?.id || 'ORDER').slice(-8).toUpperCase();
  const fullOrderId = order?.id || 'N/A';
  const orderDate = order?.date 
    ? new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString();

  const businessName = siteSettings?.businessName || 'Solemate.co.ke';
  const phone = siteSettings?.phoneNumbers?.[0] || '+254 700 000 000';
  const email = siteSettings?.contactEmail || 'contact@solemate.co.ke';

  const items = order?.items || [];
  const deliveryFee = Number(order?.deliveryFee) || 0;
  const total = Number(order?.total) || 0;
  const discount = Number(order?.discount) || 0;
  const subtotal = Number(order?.subtotal) || (total - deliveryFee + discount);

  return (
    <Document title={`Invoice-${orderId}`} author={businessName}>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoRow}>
              <Text style={styles.logoMain}>Solemate</Text>
              <Text style={styles.logoHighlight}>.co.ke</Text>
            </View>
            <Text style={styles.tagline}>Authentic Footwear & Sneakers • Kenya</Text>
            <Text style={styles.companyDetail}>{businessName}</Text>
            <Text style={styles.companyDetail}>{email} • {phone}</Text>
          </View>

          <View style={styles.invoiceMeta}>
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceBadgeText}>Official Invoice / Receipt</Text>
            </View>
            <Text style={styles.invoiceNumber}>INV-{orderId}</Text>
            <Text style={styles.metaRow}>
              Date: <Text style={styles.metaValue}>{orderDate}</Text>
            </Text>
            <Text style={styles.metaRow}>
              Payment: <Text style={styles.metaValue}>{order.paymentStatus || 'Pending'}</Text>
            </Text>
            {order.mpesaReceipt && (
              <Text style={styles.metaRow}>
                Receipt: <Text style={styles.metaValue}>{order.mpesaReceipt}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Customer & Delivery Section */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoColTitle}>Customer (Billed To)</Text>
            <Text style={styles.infoName}>
              {(customerInfo.firstName || 'Valued')} {(customerInfo.lastName || 'Customer')}
            </Text>
            <Text style={styles.infoText}>Email: {customerInfo.email || 'N/A'}</Text>
            <Text style={styles.infoText}>Phone: {customerInfo.phone || 'N/A'}</Text>
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.infoColTitle}>Delivery Destination</Text>
            <Text style={styles.infoName}>{customerInfo.location || 'Local Delivery'}</Text>
            <Text style={styles.infoText}>Town / City: {customerInfo.city || 'Nairobi, Kenya'}</Text>
            <Text style={styles.infoText}>
              Delivery Method: {deliveryFee === 0 ? 'Free Standard Delivery' : 'Express Delivery'}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colNum}><Text style={styles.thText}>#</Text></View>
            <View style={styles.colDesc}><Text style={styles.thText}>Item & Options</Text></View>
            <View style={styles.colQty}><Text style={styles.thText}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={styles.thText}>Price</Text></View>
            <View style={styles.colTotal}><Text style={styles.thText}>Total</Text></View>
          </View>

          {items.map((item, index) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.price) || 0;
            const lineTotal = qty * price;
            return (
              <View key={index} style={styles.tableRow}>
                <View style={styles.colNum}>
                  <Text style={styles.tdText}>{index + 1}</Text>
                </View>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{item.name || 'Footwear'}</Text>
                  <Text style={styles.itemSub}>
                    Size: EU {item.selectedSize || 'Standard'}
                    {item.selectedColor ? ` • Color: ${item.selectedColor}` : ''}
                    {item.brand ? ` • ${item.brand}` : ''}
                  </Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.tdText}>{qty}</Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={styles.tdText}>{formatPrice(price)}</Text>
                </View>
                <View style={styles.colTotal}>
                  <Text style={[styles.tdText, { fontWeight: 'bold' }]}>{formatPrice(lineTotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary & Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.paymentSummary}>
            <Text style={styles.paymentSummaryTitle}>Payment Information</Text>
            <Text style={styles.paymentRow}>
              Method: <Text style={{ fontWeight: 'bold' }}>{order.paymentMethod || 'M-Pesa / Card'}</Text>
            </Text>
            <Text style={styles.paymentRow}>
              Status: <Text style={{ fontWeight: 'bold', color: order.paymentStatus === 'Paid' ? '#15803d' : '#b45309' }}>
                {order.paymentStatus || 'Pending'}
              </Text>
            </Text>
            {order.mpesaReceipt && (
              <Text style={styles.paymentRow}>
                M-Pesa Ref: <Text style={{ fontWeight: 'bold' }}>{order.mpesaReceipt}</Text>
              </Text>
            )}
            <Text style={[styles.paymentRow, { marginTop: 4, fontSize: 7, color: '#a1a1aa' }]}>
              Order ID: {fullOrderId}
            </Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>{formatPrice(subtotal)}</Text>
            </View>

            {discount > 0 && (
              <View style={styles.calcRow}>
                <Text style={[styles.calcLabel, { color: '#ea580c' }]}>
                  Discount {order.couponCode ? `(${order.couponCode})` : ''}
                </Text>
                <Text style={[styles.calcVal, { color: '#ea580c' }]}>-{formatPrice(discount)}</Text>
              </View>
            )}

            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Delivery Fee</Text>
              <Text style={styles.calcVal}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid</Text>
              <Text style={styles.grandTotalVal}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer Guarantee */}
        <View style={styles.footer}>
          <Text style={styles.footerHeading}>Authenticity Guaranteed • Hand-Inspected Quality Footwear</Text>
          <Text style={styles.footerSub}>
            Thank you for shopping with Solemate Kenya! This document serves as your official purchase receipt.
          </Text>
          <Text style={styles.footerSub}>
            For size exchanges or support within 48 hours of delivery, contact us at {phone} or {email}.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;
