import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Layers, 
  Check, 
  Trash2, 
  TrendingUp, 
  Loader2, 
  DollarSign, 
  Tag, 
  Store, 
  Image as ImageIcon, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  RotateCcw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Product, Seller } from '../../types';
import { useStore } from '../../context/StoreContext';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { logSystemError } from '../../services/loggingService';
import { sendWhatsAppNotification, formatNewProductWhatsAppMessage } from '../../services/whatsappService';
import imageCompression from 'browser-image-compression';

interface MassProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellers: Seller[];
  onSuccess: (count: number) => void;
}

interface SelectedFileItem {
  id: string;
  file: File;
  previewUrl: string;
  base64?: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'ready' | 'error';
  errorMessage?: string;
}

export function MassProductImportModal({
  isOpen,
  onClose,
  sellers,
  onSuccess
}: MassProductImportModalProps) {
  const { addProductsBatch, siteSettings } = useStore();
  
  // Stages: 'upload' -> 'analyzing' -> 'review' -> 'saving'
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'review' | 'saving'>('upload');
  const [files, setFiles] = useState<SelectedFileItem[]>([]);
  const [defaultSellerId, setDefaultSellerId] = useState<string>(sellers[0]?.id || 'seller-official');
  const [isDragging, setIsDragging] = useState(false);
  
  // Progress & Analysis
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedProducts, setGeneratedProducts] = useState<Product[]>([]);
  const [analysisMethod, setAnalysisMethod] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle file addition
  const handleFilesAdded = async (newFileList: FileList | File[]) => {
    setError(null);
    const validFiles = Array.from(newFileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    const items: SelectedFileItem[] = validFiles.map(file => ({
      id: `file_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...items]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setGeneratedProducts([]);
    setStage('upload');
    setError(null);
  };

  // Convert compressed file to clean base64 string for Gemini vision
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64Data = res.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Start Mass Analysis Pipeline
  const startMassCatalogCreation = async () => {
    if (files.length === 0) {
      setError('Please select at least 1 shoe photo to continue.');
      return;
    }

    setStage('analyzing');
    setError(null);
    setStatusMessage('Compressing and preparing images for visual recognition...');

    try {
      const preparedItems: { id: string; url: string; base64?: string; mimeType: string; fileName: string }[] = [];

      // Step 1: Compress & upload to Cloudinary (or fallback to compressed data URL)
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setStatusMessage(`Processing photo ${i + 1} of ${files.length}...`);
        setUploadProgress(Math.round(((i + 1) / files.length) * 45));

        // Quick compression for lightweight transmission
        const compressed = await imageCompression(item.file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1200,
          useWebWorker: true
        });

        const base64Data = await fileToBase64(compressed);
        let finalImageUrl = item.previewUrl;

        // Try upload to Cloudinary if credentials configured
        try {
          const cloudRes = await uploadToCloudinary(compressed);
          if (cloudRes?.secure_url) {
            finalImageUrl = cloudRes.secure_url;
          }
        } catch (uploadErr) {
          // If Cloudinary fails or is not setup, use base64 data URL fallback so the process NEVER fails
          finalImageUrl = `data:${item.file.type || 'image/jpeg'};base64,${base64Data}`;
        }

        preparedItems.push({
          id: item.id,
          url: finalImageUrl,
          base64: base64Data,
          mimeType: item.file.type || 'image/jpeg',
          fileName: item.file.name
        });
      }

      setUploadProgress(60);
      setStatusMessage('Analyzing shoe models, grouping multi-angle shots & calculating trend prices...');

      // Step 2: Call server AI batch analyzer
      const response = await fetch('/api/catalog/ai-batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: preparedItems,
          defaultSellerId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.products) || data.products.length === 0) {
        throw new Error(data.error || 'Failed to auto-generate catalog products from photos.');
      }

      setUploadProgress(100);
      setAnalysisMethod(data.method || 'gemini-3.8-flash');
      setGeneratedProducts(data.products);
      setStage('review');
    } catch (err: any) {
      console.error('Error during AI mass catalog generation:', err);
      logSystemError('ui', `AI mass catalog creation error: ${err.message}`, { filesCount: files.length }, 'error');
      setError(err.message || 'Error processing photos. Please try again.');
      setStage('upload');
    }
  };

  // Update a single generated product in review stage
  const updateGeneratedProduct = (index: number, updates: Partial<Product>) => {
    setGeneratedProducts(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeGeneratedProduct = (index: number) => {
    setGeneratedProducts(prev => prev.filter((_, i) => i !== index));
  };

  // Save all generated products to Firestore
  const handleSaveAllToCatalog = async () => {
    if (generatedProducts.length === 0) return;
    setStage('saving');
    setError(null);

    try {
      // 1. Commit all products to Firestore database using batch write
      await addProductsBatch(generatedProducts);

      // 2. Dispatch WhatsApp summary notification to Admin
      if (siteSettings?.whatsappNewProductAlerts !== false) {
        const adminPhone = siteSettings?.adminWhatsAppNumber || siteSettings?.whatsappNumber || '';
        const summaryMsg = `✨ *MASS AI CATALOG IMPORT COMPLETE*\n\n` +
          `• *Total Products Created:* ${generatedProducts.length}\n` +
          `• *Photos Grouped & Processed:* ${files.length}\n` +
          `• *Assigned Shop:* ${sellers.find(s => s.id === defaultSellerId)?.name || 'Solemate Official'}\n\n` +
          `*Newly Added Shoes:*\n` +
          generatedProducts.map((p, i) => `${i + 1}. ${p.name} — KES ${p.price.toLocaleString()}`).join('\n') +
          `\n\n👉 View live storefront: ${window.location.origin}/shop`;

        sendWhatsAppNotification({
          type: 'new_product',
          recipientRole: 'admin',
          targetPhone: adminPhone,
          message: summaryMsg,
          metadata: { count: generatedProducts.length }
        }).catch(() => {});
      }

      // 3. Log success
      logSystemError('firebase', `Mass photo auto-catalog saved: ${generatedProducts.length} products created.`, {
        productsCount: generatedProducts.length,
        method: analysisMethod
      }, 'info');

      onSuccess(generatedProducts.length);
      clearAllFiles();
      onClose();
    } catch (err: any) {
      console.error('Failed to commit mass products batch to Firestore:', err);
      setError(err.message || 'Failed to save products to database.');
      setStage('review');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-zinc-900">
                  AI Mass Photo Auto-Catalog
                </h2>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Vision + Trend Engine
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Bulk upload shoe photos · AI automatically groups angles, assigns realistic Kenyan market prices & builds your catalogue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <p className="flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STAGE 1: UPLOAD PHOTOS */}
          {stage === 'upload' && (
            <div className="space-y-6">
              
              {/* Target Shop / Seller Selector */}
              <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Store className="w-5 h-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-orange-950">Assign Products To Seller / Shop</p>
                    <p className="text-[11px] text-zinc-500">Every shoe imported from this batch will be attributed to this merchant storefront.</p>
                  </div>
                </div>
                <select
                  value={defaultSellerId}
                  onChange={e => setDefaultSellerId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-orange-300 bg-white font-bold text-xs text-zinc-800 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                >
                  <option value="seller-official">Solemate Official (Main Brand Store)</option>
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      🏪 {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                  isDragging 
                    ? 'border-orange-500 bg-orange-50/70 scale-[0.99]' 
                    : 'border-zinc-200 bg-zinc-50/60 hover:border-orange-400 hover:bg-orange-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
                  className="hidden"
                />

                <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-zinc-100 flex items-center justify-center text-orange-500">
                  <Upload className="w-10 h-10 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <p className="text-base sm:text-lg font-black text-zinc-900">
                    Drop your shoe photos here or <span className="text-orange-600 underline">Browse Files</span>
                  </p>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Select multiple shoe photos at once (side views, soles, boxes, angles). The AI will identify the model, group angle shots together, and assign Kenyan trending prices.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <span className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-600">
                    JPG, PNG, WEBP, AVIF
                  </span>
                  <span className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-600">
                    Multi-photo selection
                  </span>
                  <span className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-emerald-600">
                    Auto Angle Grouping
                  </span>
                </div>
              </div>

              {/* Selected Files Preview Grid */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                      Selected Photos ({files.length})
                    </p>
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-60 overflow-y-auto p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
                    {files.map((item, idx) => (
                      <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-xs">
                        <img src={item.previewUrl} alt={`Selected ${idx}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-orange-500 hover:bg-orange-50/50 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-orange-600 transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] font-bold">Add More</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STAGE 2: ANALYZING ANIMATION */}
          {stage === 'analyzing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin flex items-center justify-center">
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-orange-500">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-zinc-900">
                  Analyzing Shoes & Building Catalogue
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {statusMessage}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Processing {files.length} photos</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-[11px] text-zinc-500 text-left space-y-1.5 w-full">
                <p className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  What AI is doing right now:
                </p>
                <p>• Grouping multi-angle shots (side, sole, box) into single shoes</p>
                <p>• Identifying authentic models (Jordan 4, Dunk, Timberland, Samba...)</p>
                <p>• Pricing according to Kenyan retail trends (KES 4,500 - 8,500)</p>
              </div>
            </div>
          )}

          {/* STAGE 3: REVIEW & EDIT BEFORE SAVING */}
          {stage === 'review' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      Successfully Grouped {files.length} Photos into {generatedProducts.length} Complete Shoes!
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Review, adjust prices or names below, then click "Save All to Store" to publish immediately.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStage('upload')}
                  className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-upload Photos
                </button>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedProducts.map((p, idx) => (
                  <div key={p.id} className="bg-white border-2 border-zinc-200/80 hover:border-orange-400 rounded-3xl p-5 shadow-sm transition-all space-y-4 relative group">
                    
                    <button
                      type="button"
                      onClick={() => removeGeneratedProduct(idx)}
                      className="absolute top-4 right-4 p-2 bg-zinc-100 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="Exclude this product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-start gap-4">
                      {/* Thumbnail & Gallery Badges */}
                      <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        {p.images && p.images.length > 0 && (
                          <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5" /> +{p.images.length}
                          </span>
                        )}
                      </div>

                      {/* Main Info Inputs */}
                      <div className="flex-1 space-y-2 min-w-0 pr-8">
                        <div>
                          <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Shoe Model Name</label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateGeneratedProduct(idx, { name: e.target.value })}
                            className="w-full text-xs font-bold px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Brand</label>
                            <input
                              type="text"
                              value={p.brand}
                              onChange={(e) => updateGeneratedProduct(idx, { brand: e.target.value })}
                              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Category</label>
                            <select
                              value={p.category}
                              onChange={(e) => updateGeneratedProduct(idx, { category: e.target.value })}
                              className="w-full text-xs font-semibold px-2 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-none"
                            >
                              <option>Sneakers</option>
                              <option>Lifestyle</option>
                              <option>Running</option>
                              <option>Skate</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Stock Row */}
                    <div className="grid grid-cols-3 gap-2 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Sale Price (KES)</label>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => updateGeneratedProduct(idx, { price: Number(e.target.value) })}
                          className="w-full font-black text-orange-600 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Was Price (KES)</label>
                        <input
                          type="number"
                          value={p.originalPrice || 0}
                          onChange={(e) => updateGeneratedProduct(idx, { originalPrice: Number(e.target.value) })}
                          className="w-full font-bold text-zinc-500 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Stock Count</label>
                        <input
                          type="number"
                          min="0"
                          value={p.stock || 12}
                          onChange={(e) => updateGeneratedProduct(idx, { stock: Number(e.target.value) })}
                          className="w-full font-bold text-zinc-900 bg-white px-2.5 py-1.5 rounded-lg border border-zinc-200 outline-none"
                        />
                      </div>
                    </div>

                    {/* Secondary Gallery Angles Preview */}
                    {p.images && p.images.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Grouped Gallery Angles ({p.images.length})
                        </span>
                        <div className="flex gap-2 overflow-x-auto py-1">
                          {p.images.map((imgUrl, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={imgUrl}
                              alt="Angle"
                              className="w-12 h-12 object-cover rounded-lg border border-zinc-200 shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* STAGE 4: SAVING */}
          {stage === 'saving' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <h3 className="text-xl font-black text-zinc-900">
                Saving {generatedProducts.length} Products to Your Store...
              </h3>
              <p className="text-xs text-zinc-500">
                Writing product records to Firestore database & triggering WhatsApp inventory notifications...
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div>
            {stage === 'upload' && files.length > 0 && (
              <p className="text-xs font-bold text-zinc-600">
                {files.length} photo{files.length > 1 ? 's' : ''} ready to analyze
              </p>
            )}
            {stage === 'review' && (
              <p className="text-xs font-bold text-zinc-600">
                Ready to publish <span className="text-orange-600 font-black">{generatedProducts.length} new shoes</span> to the catalog
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={stage === 'analyzing' || stage === 'saving'}
              className="flex-1 sm:flex-none px-6 py-3 rounded-2xl font-bold text-xs text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {stage === 'upload' && (
              <button
                type="button"
                onClick={startMassCatalogCreation}
                disabled={files.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Auto-Group & Generate Products ({files.length})
              </button>
            )}

            {stage === 'review' && (
              <button
                type="button"
                onClick={handleSaveAllToCatalog}
                disabled={generatedProducts.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Publish All {generatedProducts.length} Products to Store
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
