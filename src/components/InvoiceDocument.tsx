import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register a font for professional look if needed, but defaults are fine for now
// Standard fonts: Helvetica, Times-Roman, Courier

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#18181b', // zinc-900
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: 1,
    borderBottomColor: '#f4f4f5', // zinc-100
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'black',
    color: '#f97316', // orange-500
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 8,
    color: '#71717a', // zinc-500
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceDetail: {
    fontSize: 9,
    color: '#71717a',
    marginBottom: 2,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#71717a',
    marginBottom: 8,
    borderBottom: 1,
    borderBottomColor: '#f4f4f5',
    paddingBottom: 4,
  },
  billingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressBlock: {
    width: '45%',
  },
  addressLabel: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addressText: {
    color: '#3f3f46',
    marginBottom: 1,
  },
  table: {
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderBottom: 1,
    borderBottomColor: '#f4f4f5',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f4f4f5',
    padding: 8,
  },
  colDescription: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  headerText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#71717a',
    textTransform: 'uppercase',
  },
  itemText: {
    fontSize: 9,
  },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: 2,
    borderTopColor: '#18181b',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f97316',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#a1a1aa',
    marginBottom: 4,
  },
});

interface InvoiceProps {
  order: any;
}

const InvoiceDocument: React.FC<InvoiceProps> = ({ order }) => {
  const formatPrice = (amount: number) => `KES ${amount.toLocaleString()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.logo}>SOLEMATE</Text>
            <Text style={styles.companyInfo}>Premium Footwear & Sneakers</Text>
            <Text style={styles.companyInfo}>Nairobi, Kenya</Text>
            <Text style={styles.companyInfo}>contact@solemate.co.ke</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDetail}>INV-{order.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.invoiceDetail}>Date: {order.date}</Text>
            <Text style={styles.invoiceDetail}>Status: {order.paymentStatus || 'Pending'}</Text>
          </View>
        </View>

        {/* Customer & Shipping */}
        <View style={styles.section}>
          <View style={styles.billingInfo}>
            <View style={styles.addressBlock}>
              <Text style={styles.sectionTitle}>Bill To</Text>
              <Text style={styles.addressLabel}>{order.customerInfo.firstName} {order.customerInfo.lastName}</Text>
              <Text style={styles.addressText}>{order.customerInfo.email}</Text>
              <Text style={styles.addressText}>{order.customerInfo.phone}</Text>
            </View>
            <View style={styles.addressBlock}>
              <Text style={styles.sectionTitle}>Shipping Detail</Text>
              <Text style={styles.addressText}>{order.customerInfo.location}</Text>
              <Text style={styles.addressText}>{order.customerInfo.city}</Text>
              <Text style={styles.addressText}>Method: {order.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDescription}><Text style={styles.headerText}>Description</Text></View>
            <View style={styles.colQty}><Text style={styles.headerText}>Qty</Text></View>
            <View style={styles.colPrice}><Text style={styles.headerText}>Price</Text></View>
            <View style={styles.colTotal}><Text style={styles.headerText}>Total</Text></View>
          </View>

          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text style={styles.itemText}>{item.name}</Text>
                {item.brand && <Text style={[styles.companyInfo, { marginTop: 2 }]}>{item.brand}</Text>}
              </View>
              <View style={styles.colQty}><Text style={styles.itemText}>{item.quantity}</Text></View>
              <View style={styles.colPrice}><Text style={styles.itemText}>{formatPrice(item.price)}</Text></View>
              <View style={styles.colTotal}><Text style={styles.itemText}>{formatPrice(item.price * item.quantity)}</Text></View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.invoiceDetail}>Subtotal</Text>
              <Text style={styles.invoiceDetail}>{formatPrice(order.total - (order.deliveryFee || 0))}</Text>
            </View>
            {order.deliveryFee > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.invoiceDetail}>Delivery Fee</Text>
                <Text style={styles.invoiceDetail}>{formatPrice(order.deliveryFee)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for shopping at Solemate.co.ke</Text>
          <Text style={styles.footerText}>This is a computer generated invoice. No signature required.</Text>
          <Text style={styles.footerText}>For any issues, please contact our support team at contact@solemate.co.ke</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceDocument;
