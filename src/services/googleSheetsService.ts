import { Product, Order } from '../types';

let cachedToken: string | null = null;

export function setSheetsToken(token: string | null) {
  cachedToken = token;
}

export function getSheetsToken(): string | null {
  return cachedToken;
}

export function hasSheetsToken(): boolean {
  return !!cachedToken;
}

// Create a new spreadsheet with customized default sheets
export async function createSpreadsheet(title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = getSheetsToken();
  if (!token) {
    throw new Error('Google Sheets access token not found. Please authenticate/connect Google Sheets first.');
  }

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title,
      },
      sheets: [
        {
          properties: {
            title: 'Orders_Sync',
          }
        },
        {
          properties: {
            title: 'Products_Sync',
          }
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create spreadsheet');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize sheet headers
  await initializeHeaders(spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

// Function to initialize headers in a Spreadsheet
export async function initializeHeaders(spreadsheetId: string) {
  const token = getSheetsToken();
  if (!token) return;

  const ordersHeaders = [
    [
      'Order ID', 
      'Date', 
      'Customer Name', 
      'Email', 
      'Phone', 
      'Location', 
      'City', 
      'Items', 
      'Total Price (KES)', 
      'Payment Method', 
      'Payment Status', 
      'Delivery Status'
    ]
  ];

  const productsHeaders = [
    [
      'ID', 
      'Name', 
      'Brand', 
      'Category', 
      'Gender', 
      'Price (KES)', 
      'Original Price (KES)', 
      'Stock', 
      'In Stock (TRUE/FALSE)', 
      'Image URL', 
      'Description'
    ]
  ];

  try {
    // Write headers to Orders_Sync
    await updateSheetValues(spreadsheetId, 'Orders_Sync!A1:L1', ordersHeaders);

    // Write headers to Products_Sync
    await updateSheetValues(spreadsheetId, 'Products_Sync!A1:K1', productsHeaders);
  } catch (error) {
    console.error('Error initializing headers:', error);
  }
}

// Helper to update specific sheet ranges
export async function updateSheetValues(spreadsheetId: string, range: string, values: any[][]) {
  const token = getSheetsToken();
  if (!token) throw new Error('Google Sheets access token not found');

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values,
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update sheet values');
  }

  return response.json();
}

// Fetch range values
export async function readSheetValues(spreadsheetId: string, range: string): Promise<any[][]> {
  const token = getSheetsToken();
  if (!token) throw new Error('Google Sheets access token not found');

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to read sheet values');
  }

  const data = await response.json();
  return data.values || [];
}

// Batch Sync entire orders to Sheet
export async function syncOrdersToSheet(spreadsheetId: string, orders: Order[]): Promise<any> {
  const rows = orders.map(order => [
    order.id,
    order.date,
    `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim(),
    order.customerInfo?.email || '',
    order.customerInfo?.phone || '',
    order.customerInfo?.location || '',
    order.customerInfo?.city || '',
    order.items.map(item => `${item.name} (${item.selectedSize}) x${item.quantity}`).join(', '),
    order.total,
    order.paymentMethod || 'M-Pesa',
    order.paymentStatus || 'Pending',
    order.status || 'Pending'
  ]);

  // Read current sheet to overwrite and avoid duplicates
  // Let's replace everything below header (from row 2 onwards)
  // Let's assume a max of 5000 orders can be cleared/written
  const maxRange = `Orders_Sync!A2:L5000`;
  
  // Clear existing content is tricky in sheets REST api without BatchUpdate, but we can write empty strings or just update directly with the values and Pad the rest with empty rows or truncate. 
  // Let's initialize a matrix with height max(current rows, new rows) to fully overwrite.
  let paddedRows = [...rows];
  try {
    const existing = await readSheetValues(spreadsheetId, 'Orders_Sync!A2:L1000');
    if (existing && existing.length > rows.length) {
      const extraCount = existing.length - rows.length;
      const blankRow = Array(12).fill('');
      for (let i = 0; i < extraCount; i++) {
        paddedRows.push(blankRow);
      }
    }
  } catch (e) {
    // fallback if tab doesn't exist
  }

  return updateSheetValues(spreadsheetId, `Orders_Sync!A2:L${1 + paddedRows.length}`, paddedRows);
}

// Convert Sheet Product rows to Store Product Models
export function mapSheetRowsToProducts(rows: any[][]): Omit<Product, 'id'>[] {
  if (!rows || rows.length <= 1) return [];

  // Skip header row
  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const name = String(row[1] || '').trim();
    const brand = String(row[2] || '').trim();
    const category = String(row[3] || '').trim();
    const genderVal = String(row[4] || 'Unisex').trim();
    const price = parseFloat(row[5]) || 0;
    const originalPrice = row[6] ? parseFloat(row[6]) : undefined;
    const stock = parseInt(row[7]) || 0;
    const inStock = String(row[8]).toUpperCase() === 'TRUE' || stock > 0;
    const image = String(row[9] || '').trim();
    const description = String(row[10] || '').trim();

    const genderOption = ['Men', 'Women', 'Kids', 'Unisex'].includes(genderVal) 
      ? genderVal as 'Men' | 'Women' | 'Kids' | 'Unisex' 
      : 'Unisex';

    return {
      name,
      brand,
      category,
      gender: genderOption,
      price,
      originalPrice,
      stock,
      inStock,
      image,
      description,
      images: [image],
      colors: [],
      color: 'Default'
    };
  }).filter(p => p.name.length > 0 && p.price > 0);
}

// Populate sample products into Sheet for seamless testing/demonstration
export async function populateSampleProducts(spreadsheetId: string): Promise<any> {
  const samples = [
    [
      'prod-sample-1', 
      'Nike Air Jordan 1 Retro High', 
      'Nike', 
      'Air Jordan', 
      'Men', 
      '18500', 
      '22000', 
      '12', 
      'TRUE', 
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=800', 
      'The iconic Air Jordan 1 Retro High pairs signature hoops style with ultra-premium comfort in a legendary silhouette.'
    ],
    [
      'prod-sample-2', 
      'Adidas Ultraboost Light', 
      'Adidas', 
      'Running', 
      'Unisex', 
      '15000', 
      '17500', 
      '24', 
      'TRUE', 
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800', 
      'Experience epic energy return with the Adidas Ultraboost Light. Packed with innovative cushioning for all-day performance.'
    ],
    [
      'prod-sample-3', 
      'Nike Air Force 1 "Triple White"', 
      'Nike', 
      'Lifestyle', 
      'Women', 
      '11000', 
      '13000', 
      '8', 
      'TRUE', 
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=800', 
      'The radiance lives on in the Nike Air Force 1, the b-ball icon that puts a fresh spin on what you know best.'
    ]
  ];

  return updateSheetValues(spreadsheetId, 'Products_Sync!A2:K4', samples);
}
