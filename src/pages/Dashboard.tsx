import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LayoutDashboard, Package, ShoppingCart, Plus, Edit, Trash, Check, X, Users, Link as LinkIcon, LogOut, Upload, TrendingUp } from 'lucide-react';
import { Product, OrderStatus, Order, Seller } from '../types';
import { formatPrice } from '../utils';
import { loginWithGoogle, logout, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function Dashboard({ role }: { role: 'admin' | 'seller' }) {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { products: allProducts, orders: allOrders, sellers, addProduct, updateProduct, deleteProduct, updateOrderStatus, addSeller, updateSeller, deleteSeller, currentUser, isAdmin } = useStore();
  
  const currentSellerId = role === 'seller' ? sellerId : null;
  const currentSeller = currentSellerId ? sellers.find(s => s.id === currentSellerId) : null;

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'sellers'>('overview');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [isAddingSeller, setIsAddingSeller] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [sellerFormData, setSellerFormData] = useState<Partial<Seller>>({
    name: '', email: '', status: 'Active'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', brand: '', price: 0, image: '', category: 'Sneakers', gender: 'Unisex', color: '', description: '', inStock: true
  });

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

  if (role === 'seller' && (!currentSellerId || !currentSeller)) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Link</h2>
          <p className="text-zinc-500">This seller link is invalid or has expired. Please contact the administrator for a new link.</p>
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      const imageRef = ref(storage, `products/${Date.now()}_${compressedFile.name}`);
      await uploadBytes(imageRef, compressedFile);
      const downloadURL = await getDownloadURL(imageRef);
      setFormData({ ...formData, image: downloadURL });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      alert("Please upload an image for the product.");
      return;
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        isNew: true,
        sellerId: role === 'seller' ? currentSellerId : undefined,
      } as Product);
    }
    setIsAddingProduct(false);
    setEditingProduct(null);
    setFormData({ name: '', brand: '', price: 0, image: '', category: 'Sneakers', gender: 'Unisex', color: '', description: '', inStock: true });
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
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
          >
            <ShoppingCart className="w-5 h-5" /> Orders
            {pendingOrders > 0 && (
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
                onClick={() => { setEditingProduct(null); setFormData({ name: '', brand: '', price: 0, image: '', category: 'Sneakers', gender: 'Unisex', color: '', description: '', inStock: true }); setIsAddingProduct(true); }}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>

            {isAddingProduct ? (
              <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                  <button onClick={() => setIsAddingProduct(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Brand</label>
                      <input type="text" required value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Price (KES)</label>
                      <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Product Image</label>
                      <div className="flex items-center gap-4">
                        {formData.image && (
                          <img src={formData.image} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200" />
                        )}
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-zinc-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer">
                          <Upload className="w-4 h-4 text-zinc-500" />
                          <span className="text-sm font-medium text-zinc-600">
                            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                          </span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={isUploadingImage}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none">
                        <option>Sneakers</option><option>Lifestyle</option><option>Running</option><option>Skate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Gender</label>
                      <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none">
                        <option>Men</option><option>Women</option><option>Unisex</option><option>Kids</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Color</label>
                      <input type="text" required value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Black, White, Red" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                    <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="inStock" checked={formData.inStock} onChange={e => setFormData({...formData, inStock: e.target.checked})} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                    <label htmlFor="inStock" className="text-sm font-medium text-zinc-700">In Stock</label>
                  </div>
                  <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
                    {editingProduct ? 'Update Product' : 'Save Product'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="p-4 font-bold text-zinc-600 text-sm">Product</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Price</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Category</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm">Status</th>
                        <th className="p-4 font-bold text-zinc-600 text-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="p-4 flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-zinc-900 text-sm">{p.name}</p>
                              <p className="text-xs text-zinc-500">{p.brand}</p>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-zinc-900">{formatPrice(p.price)}</td>
                          <td className="p-4 text-sm text-zinc-600">{p.category}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => openEdit(p)} className="p-2 text-zinc-400 hover:text-orange-500 transition-colors"><Edit className="w-4 h-4"/></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4"/></button>
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
            <h1 className="text-3xl font-bold text-zinc-900">Orders</h1>
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
                          <button onClick={() => setViewingOrder(o)} className="text-orange-500 font-medium hover:underline">View Details</button>
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
                    <h2 className="text-xl font-bold text-zinc-900">Order #{viewingOrder.id}</h2>
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

                    <div className="border-t border-zinc-100 pt-4 flex justify-between items-center">
                      <span className="font-bold text-zinc-900">Total Amount</span>
                      <span className="text-xl font-black text-orange-500">{formatPrice(viewingOrder.total)}</span>
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
