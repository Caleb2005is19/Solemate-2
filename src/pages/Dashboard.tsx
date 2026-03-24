import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LayoutDashboard, Package, ShoppingCart, Plus, Edit, Trash, Check, X, Users, Link as LinkIcon, LogOut, Upload, TrendingUp, Image as ImageIcon, DollarSign, Tag, Info, Box, Printer } from 'lucide-react';
import { Product, OrderStatus, Order, Seller } from '../types';
import { formatPrice } from '../utils';
import { loginWithGoogle, logout } from '../firebase';
import { uploadToCloudinary } from '../services/cloudinaryService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function Dashboard({ role }: { role: 'admin' | 'seller' }) {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { products: allProducts, orders: allOrders, sellers, addProduct, updateProduct, deleteProduct, updateOrderStatus, addSeller, updateSeller, deleteSeller, currentUser, isAdmin, currentSellerId: authorizedSellerId, unreadOrdersCount, markOrdersAsRead, loading } = useStore();
  
  const currentSellerId = role === 'seller' ? sellerId : null;
  const currentSeller = currentSellerId ? sellers.find(s => s.id === currentSellerId) : null;

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'sellers'>('overview');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({
    name: '', email: '', status: 'Active'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', brand: '', price: 0, originalPrice: 0, image: '', images: [], category: 'Sneakers', gender: 'Unisex', color: '', colors: [], description: '', inStock: true, sellerId: ''
  });

  const [newColor, setNewColor] = useState({ name: '', hex: '#000000' });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (role === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Admin Access Required</h2>
          <p className="text-zinc-500 mb-6">Please sign in with an authorized administrator account to access this portal.</p>
          <button 
            onClick={loginWithGoogle}
            className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (role === 'seller' && (!currentSellerId || !currentSeller || currentSellerId !== authorizedSellerId)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Seller Link</h2>
          <p className="text-zinc-500 mb-6">
            This seller link is invalid, has expired, or belongs to a different account. 
            Please ensure you are logged in with the correct email address.
          </p>
          <a 
            href="/"
            className="inline-block w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  const products = role === 'admin' 
    ? allProducts 
    : allProducts.filter(p => p.sellerId === currentSellerId);

  const orders = role === 'admin'
    ? allOrders
    : allOrders.filter(o => o.items.some(item => item.sellerId === currentSellerId));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    setError(null);
    try {
      if (isGallery) {
        const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        const newImages = results.map(r => r.secure_url);
        setFormData({ ...formData, images: [...(formData.images || []), ...newImages] });
      } else {
        const result = await uploadToCloudinary(files[0]);
        setFormData({ ...formData, image: result.secure_url });
      }
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.message || "Failed to upload image. Please check your Cloudinary credentials.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const addColorVariant = () => {
    if (!newColor.name) return;
    const variant = { ...newColor, images: [] };
    setFormData({ ...formData, colors: [...(formData.colors || []), variant] });
    setNewColor({ name: '', hex: '#000000' });
  };

  const removeColorVariant = (index: number) => {
    const newColors = [...(formData.colors || [])];
    newColors.splice(index, 1);
    setFormData({ ...formData, colors: newColors });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.image) {
      setError("Please upload an image for the product.");
      return;
    }
    try {
      const productData: any = {
        ...formData,
        id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
        isNew: !editingProduct,
      };

      if (role === 'seller' && currentSellerId) {
        productData.sellerId = currentSellerId;
      } else if (role === 'admin' && formData.sellerId) {
        productData.sellerId = formData.sellerId;
      } else if (role === 'admin' && !formData.sellerId) {
        setError("Please select a shop (seller) for this product.");
        return;
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setSuccess("Product updated successfully!");
      } else {
        await addProduct(productData as Product);
        setSuccess("Product created successfully!");
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setFormData({ name: '', brand: '', price: 0, originalPrice: 0, image: '', images: [], category: 'Sneakers', gender: 'Unisex', color: '', colors: [], description: '', inStock: true, sellerId: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving product:", err);
      setError(err.message || "Failed to save product.");
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete);
      setSuccess("Product deleted successfully!");
      setProductToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting product:", err);
      setError("Failed to delete product.");
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
    setIsAddingProduct(true);
  };

  const handleSaveSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeller) {
      updateSeller(editingSeller.id, sellerFormData);
    } else {
      addSeller({
        ...sellerFormData,
        id: `seller-${Math.random().toString(36).substr(2, 9)}`,
        joinedDate: new Date().toISOString().split('T')[0],
      } as Seller);
    }
    setIsAddingSeller(false);
    setEditingSeller(null);
    setSellerFormData({ name: '', email: '', status: 'Active' });
  };

  const openEditSeller = (s: Seller) => {
    setEditingSeller(s);
    setSellerFormData(s);
    setIsAddingSeller(true);
  };

  const copySellerLink = (id: string) => {
    const url = `${window.location.origin}/seller/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <div style="font-weight: bold;">${item.name}</div>
          <div style="font-size: 12px; color: #666;">Size: ${item.selectedSize}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: sans-serif; color: #333; line-height: 1.5; padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-info { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #999; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 1px solid #eee; font-size: 12px; text-transform: uppercase; color: #666; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.grand { border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #f97316; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Solemate.co.ke</div>
            <div class="invoice-info">
              <div style="font-weight: bold; font-size: 20px;">INVOICE</div>
              <div>Order ID: #${order.id}</div>
              <div>Date: ${new Date(order.date).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="section-title">Bill To</div>
              <div style="font-weight: bold;">${order.customerInfo.firstName} ${order.customerInfo.lastName}</div>
              <div>${order.customerInfo.email}</div>
              <div>${order.customerInfo.phone}</div>
            </div>
            <div>
              <div class="section-title">Shipping Address</div>
              <div>${order.customerInfo.location}</div>
              <div>${order.customerInfo.city}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatPrice(order.total - (order.deliveryFee || 0))}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee</span>
              <span>${order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee || 0)}</span>
            </div>
            <div class="total-row grand">
              <span>Total Amount</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with Solemate.co.ke!</p>
            <p>For any inquiries, please contact us at +254 700 000 000</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllInvoices = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const allInvoicesHtml = orders.map(order => {
      const itemsHtml = order.items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <div style="font-weight: bold;">${item.name}</div>
            <div style="font-size: 12px; color: #666;">Size: ${item.selectedSize}</div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `).join('');

      return `
        <div class="invoice-page">
          <div class="header">
            <div class="logo">Solemate.co.ke</div>
            <div class="invoice-info">
              <div style="font-weight: bold; font-size: 20px;">INVOICE</div>
              <div>Order ID: #${order.id}</div>
              <div>Date: ${new Date(order.date).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="section-title">Bill To</div>
              <div style="font-weight: bold;">${order.customerInfo.firstName} ${order.customerInfo.lastName}</div>
              <div>${order.customerInfo.email}</div>
              <div>${order.customerInfo.phone}</div>
            </div>
            <div>
              <div class="section-title">Shipping Address</div>
              <div>${order.customerInfo.location}</div>
              <div>${order.customerInfo.city}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${formatPrice(order.total - (order.deliveryFee || 0))}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fee</span>
              <span>${order.deliveryFee === 0 ? 'Free' : formatPrice(order.deliveryFee || 0)}</span>
            </div>
            <div class="total-row grand">
              <span>Total Amount</span>
              <span>${formatPrice(order.total)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with Solemate.co.ke!</p>
            <p>For any inquiries, please contact us at +254 700 000 000</p>
          </div>
        </div>
      `;
    }).join('<div style="page-break-after: always;"></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bulk Invoices</title>
          <style>
            body { font-family: sans-serif; color: #333; line-height: 1.5; padding: 0; margin: 0; }
            .invoice-page { padding: 40px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #f97316; }
            .invoice-info { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #999; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 1px solid #eee; font-size: 12px; text-transform: uppercase; color: #666; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.grand { border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #f97316; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print {
              .invoice-page { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${allInvoicesHtml}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayRevenue = orders
      .filter(o => o.status !== 'Cancelled' && new Date(o.date).toDateString() === date.toDateString())
      .reduce((acc, o) => acc + o.total, 0);
    return { name: dateStr, revenue: dayRevenue };
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {role === 'admin' ? 'Admin Portal' : 'Seller Portal'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Manage your store</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <Package className="w-5 h-5" /> Products
          </button>
          <button
            onClick={() => {
              setActiveTab('orders');
              if (role === 'seller') markOrdersAsRead();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <ShoppingCart className="w-5 h-5" /> Orders
            {role === 'seller' && unreadOrdersCount > 0 && activeTab !== 'orders' && (
              <span className="ml-auto bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-full animate-bounce shadow-lg shadow-orange-600/20">
                {unreadOrdersCount} NEW
              </span>
            )}
            {role === 'admin' && pendingOrders > 0 && (
              <span className="ml-auto bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingOrders}</span>
            )}
          </button>
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('sellers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'sellers' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
            >
              <Users className="w-5 h-5" /> Sellers
            </button>
          )}
          
          {role === 'admin' && (
            <div className="mt-auto pt-8">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {success && (
          <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right duration-300">
            <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Check className="w-5 h-5" />
              <p className="font-bold">{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-2 hover:bg-white/20 rounded-lg p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {productToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 text-center mb-2">Delete Product?</h2>
              <p className="text-zinc-500 text-center mb-8">This action cannot be undone. Are you sure you want to remove this product from your store?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-zinc-900">Dashboard Overview</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 font-medium">Total Revenue</p>
                    <p className="text-2xl font-black text-zinc-900">{formatPrice(totalRevenue)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 font-medium">Total Orders</p>
                    <p className="text-2xl font-black text-zinc-900">{orders.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500 font-medium">Active Products</p>
                    <p className="text-2xl font-black text-zinc-900">{products.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Revenue Overview</h3>
                  <p className="text-sm text-zinc-500">Performance over the last 7 days</p>
                </div>
                <div className="px-4 py-2 bg-zinc-50 rounded-xl text-sm font-bold text-zinc-600">
                  Last 7 Days
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(value) => `KSh ${value / 1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        borderRadius: '16px', 
                        border: '1px solid #f4f4f5',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value: number) => [formatPrice(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900">Products</h1>
              <button
                onClick={() => { setEditingProduct(null); setFormData({ name: '', brand: '', price: 0, originalPrice: 0, image: '', category: 'Sneakers', gender: 'Unisex', color: '', description: '', inStock: true, sellerId: '' }); setIsAddingProduct(true); }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 active:scale-95"
              >
                <Plus className="w-5 h-5" /> 
                <span className="font-bold">Add Product</span>
              </button>
            </div>

            {isAddingProduct && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 md:p-8 border-b border-zinc-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                        {editingProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-zinc-900">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                        <p className="text-sm text-zinc-500">Fill in the details below to {editingProduct ? 'update' : 'create'} your product</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsAddingProduct(false)} 
                      className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors text-zinc-400 hover:text-zinc-900"
                    >
                      <X className="w-6 h-6"/>
                    </button>
                  </div>

                  <form id="product-form" onSubmit={handleSaveProduct} className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {error && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
                        <X className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Image Upload */}
                      <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-zinc-900 uppercase tracking-wider">Main Image</label>
                          <div className="relative group">
                            <div className={`aspect-square rounded-[2rem] overflow-hidden border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 ${formData.image ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-300 bg-zinc-50 hover:border-orange-500 hover:bg-orange-50'}`}>
                              {formData.image ? (
                                <>
                                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                      type="button"
                                      onClick={() => setFormData({...formData, image: ''})}
                                      className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors shadow-lg"
                                    >
                                      <Trash className="w-5 h-5" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-6">
                                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-zinc-400 group-hover:text-orange-500 transition-colors">
                                    <ImageIcon className="w-8 h-8" />
                                  </div>
                                  <p className="text-sm font-bold text-zinc-900 mb-1 text-center">Upload Photo</p>
                                </div>
                              )}
                              
                              {isUploadingImage && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                  <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                              )}
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleImageUpload(e)} 
                              disabled={isUploadingImage}
                              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-sm font-bold text-zinc-900 uppercase tracking-wider">Gallery Images</label>
                          <div className="grid grid-cols-3 gap-2">
                            {formData.images?.map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                                <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => removeGalleryImage(idx)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors">
                              <Plus className="w-6 h-6 text-zinc-400" />
                              <input 
                                type="file" 
                                multiple 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, true)} 
                                className="hidden" 
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Form Fields */}
                      <div className="lg:col-span-8 space-y-8">
                        {/* Basic Info Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Product Name</label>
                            <input 
                              type="text" 
                              required 
                              value={formData.name} 
                              onChange={e => setFormData({...formData, name: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" 
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Brand</label>
                            <input 
                              type="text" 
                              required 
                              value={formData.brand} 
                              onChange={e => setFormData({...formData, brand: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" 
                            />
                          </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Sale Price (KES)</label>
                              <input 
                                type="number" 
                                required 
                                value={formData.price} 
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Original Price (Optional)</label>
                              <input 
                                type="number" 
                                value={formData.originalPrice || 0} 
                                onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} 
                                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" 
                              />
                            </div>
                          </div>
                          {formData.originalPrice && formData.originalPrice > (formData.price || 0) && (
                            <p className="mt-3 text-sm font-bold text-emerald-600 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Save {Math.round(((formData.originalPrice - (formData.price || 0)) / formData.originalPrice) * 100)}% off
                            </p>
                          )}
                        </div>

                        {/* Color Variants Manager */}
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Color Variants</label>
                          <div className="flex flex-wrap gap-3 mb-4">
                            {formData.colors?.map((c, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm group">
                                <div className="w-4 h-4 rounded-full border border-zinc-100" style={{ backgroundColor: c.hex }}></div>
                                <span className="text-sm font-bold">{c.name}</span>
                                <button type="button" onClick={() => removeColorVariant(idx)} className="text-zinc-400 hover:text-red-500">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Color name (e.g. Black)"
                              value={newColor.name}
                              onChange={e => setNewColor({...newColor, name: e.target.value})}
                              className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                            <input 
                              type="color" 
                              value={newColor.hex}
                              onChange={e => setNewColor({...newColor, hex: e.target.value})}
                              className="w-14 h-12 p-1 rounded-2xl border border-zinc-200 cursor-pointer"
                            />
                            <button 
                              type="button"
                              onClick={addColorVariant}
                              className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Category</label>
                            <select 
                              value={formData.category} 
                              onChange={e => setFormData({...formData, category: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none bg-white font-medium"
                            >
                              <option>Sneakers</option>
                              <option>Lifestyle</option>
                              <option>Running</option>
                              <option>Skate</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Gender</label>
                            <select 
                              value={formData.gender} 
                              onChange={e => setFormData({...formData, gender: e.target.value as any})} 
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none bg-white font-medium"
                            >
                              <option>Men</option>
                              <option>Women</option>
                              <option>Unisex</option>
                              <option>Kids</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Primary Color</label>
                            <input 
                              type="text" 
                              required 
                              value={formData.color} 
                              onChange={e => setFormData({...formData, color: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Description</label>
                          <textarea 
                            required 
                            rows={4} 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            className="w-full px-4 py-3 rounded-2xl border border-zinc-200 outline-none resize-none"
                          ></textarea>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              id="inStock" 
                              checked={formData.inStock} 
                              onChange={e => setFormData({...formData, inStock: e.target.checked})} 
                              className="w-6 h-6 text-orange-500 rounded-lg border-zinc-300 cursor-pointer" 
                            />
                            <label htmlFor="inStock" className="font-bold text-zinc-900 cursor-pointer">Available in Stock</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>

                  <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row gap-4 justify-end">
                    <button 
                      type="button"
                      onClick={() => setIsAddingProduct(false)} 
                      className="px-8 py-3 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      form="product-form"
                      disabled={isUploadingImage}
                      className="px-12 py-3 bg-orange-500 text-white rounded-2xl font-black hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isAddingProduct && (
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50/50 border-b border-zinc-100">
                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Product</th>
                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Price</th>
                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Category</th>
                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider">Status</th>
                        <th className="p-6 font-bold text-zinc-500 text-xs uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-300">
                                <Package className="w-10 h-10" />
                              </div>
                              <div>
                                <p className="text-zinc-900 font-bold">No products found</p>
                                <p className="text-zinc-500 text-sm">Start by adding your first product to the store.</p>
                              </div>
                              <button
                                onClick={() => setIsAddingProduct(true)}
                                className="mt-2 text-orange-500 font-bold hover:underline"
                              >
                                Add your first product
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : products.map(p => (
                        <tr key={p.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                          <td className="p-6 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 flex-shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div>
                              <p className="font-black text-zinc-900">{p.name}</p>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-tight">{p.brand}</p>
                            </div>
                          </td>
                          <td className="p-6">
                            <p className="font-black text-zinc-900">{formatPrice(p.price)}</p>
                          </td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${p.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openEdit(p)} 
                                className="p-3 text-zinc-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                                title="Edit Product"
                              >
                                <Edit className="w-5 h-5"/>
                              </button>
                              <button 
                                onClick={() => setProductToDelete(p.id)} 
                                className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete Product"
                              >
                                <Trash className="w-5 h-5"/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900">Orders</h1>
              {orders.length > 0 && (
                <button
                  onClick={handlePrintAllInvoices}
                  className="flex items-center gap-2 bg-white text-zinc-900 border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-50 transition-colors font-bold shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print All Invoices
                </button>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="p-4 font-bold text-zinc-600 text-sm">Order ID</th>
                      <th className="p-4 font-bold text-zinc-600 text-sm">Customer</th>
                      <th className="p-4 font-bold text-zinc-600 text-sm">Date</th>
                      <th className="p-4 font-bold text-zinc-600 text-sm">Total</th>
                      <th className="p-4 font-bold text-zinc-600 text-sm">Status</th>
                      <th className="p-4 font-bold text-zinc-600 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No orders yet.</td></tr>
                    ) : orders.map(o => (
                      <tr key={o.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="p-4 text-sm font-mono text-zinc-600">#{o.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-zinc-900 text-sm">{o.customerInfo.firstName} {o.customerInfo.lastName}</p>
                          <p className="text-xs text-zinc-500">{o.customerInfo.city}</p>
                        </td>
                        <td className="p-4 text-sm text-zinc-600">{new Date(o.date).toLocaleDateString()}</td>
                        <td className="p-4 text-sm font-bold text-zinc-900">{formatPrice(o.total)}</td>
                        <td className="p-4">
                          <select
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                            className={`px-3 py-1 rounded-full text-xs font-bold outline-none border-none cursor-pointer ${
                              o.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                              o.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                              o.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                              o.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-sm">
                          <div className="flex items-center gap-3">
                            <button onClick={() => setViewingOrder(o)} className="text-orange-500 font-medium hover:underline">View Details</button>
                            <button 
                              onClick={() => handlePrintInvoice(o)}
                              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                              title="Print Invoice"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Details Modal */}
            {viewingOrder && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-zinc-900">Order #{viewingOrder.id}</h2>
                      <button 
                        onClick={() => handlePrintInvoice(viewingOrder)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                      </button>
                    </div>
                    <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Customer Details</h3>
                        <div className="space-y-1 text-sm text-zinc-600">
                          <p><span className="font-medium text-zinc-900">Name:</span> {viewingOrder.customerInfo.firstName} {viewingOrder.customerInfo.lastName}</p>
                          <p><span className="font-medium text-zinc-900">Email:</span> {viewingOrder.customerInfo.email}</p>
                          <p><span className="font-medium text-zinc-900">Phone:</span> {viewingOrder.customerInfo.phone}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Delivery Address</h3>
                        <div className="space-y-1 text-sm text-zinc-600">
                          <p>{viewingOrder.customerInfo.location}</p>
                          <p>{viewingOrder.customerInfo.city}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Order Items</h3>
                      <div className="space-y-4">
                        {viewingOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                            <div className="flex-1">
                              <h4 className="font-bold text-zinc-900">{item.name}</h4>
                              <p className="text-sm text-zinc-500">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-zinc-900">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-4 space-y-2">
                      <div className="flex justify-between items-center text-sm text-zinc-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(viewingOrder.total - (viewingOrder.deliveryFee || 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-zinc-500">
                        <span>Delivery Fee</span>
                        <span>{viewingOrder.deliveryFee === 0 ? 'Free' : formatPrice(viewingOrder.deliveryFee || 0)}</span>
                      </div>
                      <div className="border-t border-zinc-100 pt-2 flex justify-between items-center">
                        <span className="font-bold text-zinc-900">Total Amount</span>
                        <span className="text-xl font-black text-orange-500">{formatPrice(viewingOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sellers' && role === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900">Sellers</h1>
              <button
                onClick={() => { setEditingSeller(null); setSellerFormData({ name: '', email: '', status: 'Active' }); setIsAddingSeller(true); }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Seller
              </button>
            </div>

            {isAddingSeller ? (
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">{editingSeller ? 'Edit Seller' : 'Add New Seller'}</h2>
                  <button onClick={() => setIsAddingSeller(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSaveSeller} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                      <input type="text" required value={sellerFormData.name} onChange={e => setSellerFormData({...sellerFormData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                      <input type="email" required value={sellerFormData.email} onChange={e => setSellerFormData({...sellerFormData, email: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                      <select value={sellerFormData.status} onChange={e => setSellerFormData({...sellerFormData, status: e.target.value as any})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none">
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
                    {editingSeller ? 'Update Seller' : 'Save Seller'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="p-4 font-bold text-zinc-600 text-sm">Seller Name</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Email</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Joined Date</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Status</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellers.map(s => (
                        <tr key={s.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="p-4 font-bold text-zinc-900 text-sm">{s.name}</td>
                          <td className="p-4 text-zinc-600 text-sm">{s.email}</td>
                          <td className="p-4 text-zinc-600 text-sm">{s.joinedDate}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => copySellerLink(s.id)} title="Copy Secure Link" className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
                                {copiedId === s.id ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                              </button>
                              <button onClick={() => openEditSeller(s)} title="Edit Seller" className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteSeller(s.id)} title="Delete Seller" className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
