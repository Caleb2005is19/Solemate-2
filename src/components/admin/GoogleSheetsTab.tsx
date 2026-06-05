import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Download, 
  Upload, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Link2, 
  Info, 
  Layers, 
  Plus, 
  ArrowRight,
  Database,
  HelpCircle,
  Copy,
  Trash2
} from 'lucide-react';
import { 
  getSheetsToken, 
  hasSheetsToken, 
  setSheetsToken, 
  createSpreadsheet, 
  syncOrdersToSheet, 
  readSheetValues, 
  mapSheetRowsToProducts,
  updateSheetValues
} from '../../services/googleSheetsService';
import { loginWithGoogle } from '../../firebase';
import { Product } from '../../types';

export function GoogleSheetsTab() {
  const { orders, products, siteSettings, updateSiteSettings, addProduct, currentUser } = useStore();
  const [authorized, setAuthorized] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  
  // Statuses
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');
  const [importStatus, setImportStatus] = useState<'idle' | 'reading' | 'preview' | 'importing' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scanned / Preview Data
  const [previewProducts, setPreviewProducts] = useState<Omit<Product, 'id'>[]>([]);

  useEffect(() => {
    // Check if token exists in-memory
    const isTokenActive = hasSheetsToken();
    setAuthorized(isTokenActive);
    if (isTokenActive && currentUser) {
      setAuthEmail(currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    if (siteSettings?.sheetsSpreadsheetId) {
      setSpreadsheetId(siteSettings.sheetsSpreadsheetId);
    }
    if (siteSettings?.sheetsSpreadsheetUrl) {
      setSpreadsheetUrl(siteSettings.sheetsSpreadsheetUrl);
    }
  }, [siteSettings]);

  const handleConnect = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setAuthorized(hasSheetsToken());
        setAuthEmail(user.email);
      }
    } catch (err: any) {
      console.error('Failed to authorize Google Sheets:', err);
      setErrorMessage(err.message || 'Google Auth authorization failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      setStatusMessage('Creating a new Google Spreadsheet with optimized tabs...');
      const title = `Solemate.co.ke - Store Synchronizer (${new Date().toLocaleDateString()})`;
      const result = await createSpreadsheet(title);
      
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);

      // Save to settings
      await updateSiteSettings({
        sheetsSpreadsheetId: result.spreadsheetId,
        sheetsSpreadsheetUrl: result.spreadsheetUrl
      });

      setStatusMessage('Successfully created Sheet! Saved to settings.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create spreadsheet automatically.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpreadsheetIdOnly = async () => {
    if (!spreadsheetId.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const formattedUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}/edit`;
      setSpreadsheetUrl(formattedUrl);
      
      await updateSiteSettings({
        sheetsSpreadsheetId: spreadsheetId.trim(),
        sheetsSpreadsheetUrl: formattedUrl
      });
      setStatusMessage('Spreadsheet ID saved successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to preserve Spreadsheet ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOrders = async () => {
    if (!spreadsheetId) return;
    setSyncStatus('syncing');
    setErrorMessage(null);
    try {
      setStatusMessage(`Syncing ${orders.length} order entries to tab 'Orders_Sync'...`);
      await syncOrdersToSheet(spreadsheetId, orders);
      setSyncStatus('completed');
      setStatusMessage(`Successfully exported ${orders.length} orders directly to Google Sheets!`);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('failed');
      setErrorMessage(err.message || 'Failed to sync orders. Verify spreadsheet tabs contain "Orders_Sync".');
    }
  };

  const handleScanProductsSheet = async () => {
    if (!spreadsheetId) return;
    setImportStatus('reading');
    setErrorMessage(null);
    setPreviewProducts([]);
    try {
      setStatusMessage('Reading rows from Google Sheet Tab "Products_Sync"...');
      // Read Products_Sync!A1:K500
      const rows = await readSheetValues(spreadsheetId, 'Products_Sync!A1:K500');
      
      if (!rows || rows.length <= 1) {
        throw new Error('Your "Products_Sync" tab is empty or only includes headers. Add rows below row 1 to sync.');
      }

      setStatusMessage('Mapping cells into footwear catalog...');
      const mapped = mapSheetRowsToProducts(rows);
      setPreviewProducts(mapped);
      setImportStatus('preview');
      setStatusMessage(`Successfully scanned ${mapped.length} products. Review before importing below.`);
    } catch (err: any) {
      console.error(err);
      setImportStatus('failed');
      setErrorMessage(err.message || 'Could not scan "Products_Sync". Please confirm you created the sheet and have at least 1 product row.');
    }
  };

  const handleCommitImport = async () => {
    if (previewProducts.length === 0) return;
    
    const confirmImport = window.confirm(
      `Are you sure you want to import ${previewProducts.length} product(s) into your active catalog? This will insert new lines and register them in the digital storefront.`
    );
    if (!confirmImport) return;

    setImportStatus('importing');
    setErrorMessage(null);
    try {
      setStatusMessage(`Importing ${previewProducts.length} items to database catalog...`);
      
      let count = 0;
      for (const item of previewProducts) {
        // Generate nice readable ID
        const customId = `sheet-${Date.now()}-${count++}`;
        const finalProduct: Product = {
          id: customId,
          ...item
        };
        await addProduct(finalProduct);
      }

      setImportStatus('completed');
      setStatusMessage(`Successfully added ${previewProducts.length} products to active database!`);
      setPreviewProducts([]);
    } catch (err: any) {
      console.error(err);
      setImportStatus('failed');
      setErrorMessage(err.message || 'Failed during product inventory insertion.');
    }
  };

  const testTriggerInitHeaders = async () => {
    if (!spreadsheetId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      setStatusMessage('Initializing sheet headers...');
      await updateSheetValues(spreadsheetId, 'Orders_Sync!A1', [['Order ID']]); // simple trigger
      setStatusMessage('Test connection completed successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Permission denied. Make sure this sheet belongs to your authorized Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tab Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
            Google Sheets Synchronizer
          </h1>
          <p className="text-sm text-zinc-500">
            Automatically export checkout orders and bulk sync inventory from standard spreadsheets.
          </p>
        </div>
      </div>

      {/* Global notifications */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="font-bold text-sm">{statusMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-bold text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Step 1: Google Account Integration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Auth status panel */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              1. Authentication
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              We require Google Sheets access permission to write records and scan rows. Access permissions are cached locally in your session memory.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {authorized ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-black text-emerald-800">Connected to Google</p>
                <p className="text-[10px] text-zinc-500 truncate">{authEmail}</p>
                <button 
                  onClick={handleConnect}
                  className="w-full text-[10px] text-zinc-500 hover:text-zinc-900 underline font-semibold mt-2"
                >
                  Switch / Reconnect Account
                </button>
              </div>
            ) : (
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-center space-y-3">
                <p className="text-xs font-bold text-zinc-500">Google Sheets Connection Required</p>
                
                {/* Official standard GSI button format */}
                <button 
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full relative flex items-center justify-center gap-2 px-4 py-2 border border-zinc-300 rounded-xl bg-white hover:bg-zinc-50 font-bold text-xs text-zinc-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{loading ? 'Authorizing...' : 'Authorize Sheets API'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Spreadsheet Settings panel */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-500" />
              2. Target Spreadsheet Config
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Define the target Google Sheet containing the store's sync folders. If you do not have one, let us format a dedicated spreadsheet directly in your Google Drive.
            </p>
          </div>

          <div className="space-y-4">
            {/* Automatic Sheet Creator */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-150 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-black text-zinc-800">Auto-Provision Spreadsheet</p>
                <p className="text-[10px] text-zinc-500 text-pretty">Creates formatted "Orders_Sync" & "Products_Sync" tabs instantly in your Google Drive.</p>
              </div>
              <button
                onClick={handleCreateNewSpreadsheet}
                disabled={!authorized || loading}
                className="flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Export New Sheet
              </button>
            </div>

            {/* Custom Input */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Spreadsheet ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={e => setSpreadsheetId(e.target.value)}
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
                  className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveSpreadsheetIdOnly}
                  className="px-4 py-2 text-xs font-black bg-zinc-150 text-zinc-700 hover:bg-zinc-200 rounded-xl transition-all"
                >
                  Save ID
                </button>
              </div>
            </div>

            {spreadsheetUrl && (
              <a 
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold inline-block"
              >
                <ExternalLink className="w-4 h-4" /> Open active spreadsheet in a new tab
              </a>
            )}
          </div>
        </div>

      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sync Module: Orders */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-500" />
                Export Active Orders
              </h3>
              <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-500">
                {orders.length} Rows
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Export all orders registered inside Solemate database back into the <code className="bg-zinc-100 px-1 py-0.5 rounded text-[10px] text-zinc-700 font-bold">Orders_Sync</code> spreadsheet tab for accounting and processing.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-50">
            <button
              onClick={handleSyncOrders}
              disabled={!spreadsheetId || !authorized || syncStatus === 'syncing'}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Syncing with Sheet...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Sync Orders Now ({orders.length})
                </>
              )}
            </button>
            
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Writes details such as Checkout sums, payment methods, client contact numbers, and dates.
            </p>
          </div>
        </div>

        {/* Sync Module: Products */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                Import Shoe Inventory
              </h3>
              <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 rounded-full text-[10px] font-black text-zinc-500">
                {products.length} Products
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Bulk load sneakers and footwear listings from your <code className="bg-zinc-100 px-1 py-0.5 rounded text-[10px] text-zinc-700 font-bold">Products_Sync</code> spreadsheet tab directly into digital inventory.
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-50 space-y-2">
            <button
              onClick={handleScanProductsSheet}
              disabled={!spreadsheetId || !authorized || importStatus === 'reading'}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-black py-3 px-6 rounded-2xl transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {importStatus === 'reading' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Scanning spreadsheet rows...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" /> Scan Products_Sync Rows
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-400 text-center mt-2">
              Validates column matches (Name, Brand, Category, Swatches, Pricing, Images).
            </p>
          </div>
        </div>

      </div>

      {/* Spreadsheet Instructions Header Map */}
      <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
        <h3 className="text-xs font-black text-zinc-800 uppercase tracking-wide flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-emerald-500" />
          Mandatory Spreadsheet Headers Mapping Guide
        </h3>
        
        <p className="text-xs text-zinc-500 leading-relaxed mb-4">
          To successfully scan sheet records and avoid parsing errors, design your columns in Google Sheets exactly as listed below. Row 1 belongs to the header names.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px]">
          <div className="bg-white p-4 rounded-xl border border-zinc-150 space-y-2">
            <h4 className="font-bold text-zinc-800">Orders Sheet (Orders_Sync)</h4>
            <div className="font-mono text-zinc-500 p-2 bg-zinc-50 rounded whitespace-pre-wrap overflow-x-auto">
              A1: Order ID | B1: Date | C1: Customer Name | D1: Email | E1: Phone | F1: Location | G1: City | H1: Items | I1: Total Price (KES) | J1: Payment Method | K1: Payment Status | L1: Delivery Status
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-150 space-y-2">
            <h4 className="font-bold text-zinc-800">Products Sheet (Products_Sync)</h4>
            <div className="font-mono text-zinc-500 p-2 bg-zinc-50 rounded whitespace-pre-wrap overflow-x-auto">
              A1: ID | B1: Name | C1: Brand | D1: Category | E1: Gender | F1: Price (KES) | G1: Original Price (KES) | H1: Stock | I1: In Stock (TRUE/FALSE) | J1: Image URL | K1: Description
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Preview panel */}
      {previewProducts.length > 0 && importStatus === 'preview' && (
        <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900">
                Scanned Products Preview ({previewProducts.length} items)
              </h3>
              <p className="text-xs text-zinc-500">Confirm details before updating standard e-commerce catalog.</p>
            </div>
            <button
              onClick={handleCommitImport}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-xl text-xs transition-all tracking-wide active:scale-95"
            >
              Commit Catalog Update <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-100">
            <table className="w-full text-left text-xs text-zinc-600 border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Original Price</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {previewProducts.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-2">
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff'} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-lg border border-zinc-100" 
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="px-4 py-2 font-black text-zinc-900 max-w-[200px] truncate">{prod.name}</td>
                    <td className="px-4 py-2 font-bold text-zinc-500">{prod.brand}</td>
                    <td className="px-4 py-2 text-zinc-500">{prod.category}</td>
                    <td className="px-4 py-2 text-center text-[10px] uppercase font-bold bg-zinc-50 text-zinc-600 rounded-full inline-block mt-3">{prod.gender}</td>
                    <td className="px-4 py-2 text-right font-black text-emerald-600">KES {prod.price.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-zinc-400 line-through">
                      {prod.originalPrice ? `KES ${prod.originalPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-zinc-700">{prod.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
