import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Trash2, 
  Camera, 
  Upload, 
  Save, 
  AlertTriangle, 
  SlidersHorizontal, 
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface QuickCatalogAlignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: (msg: string) => void;
}

interface EditableProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  images: string[];
  inStock: boolean;
  isModified: boolean;
}

const PRESET_MODELS = [
  { label: 'Air Jordan 4', name: 'Air Jordan 4 Retro', brand: 'Nike', category: 'Sneakers', price: 7800, originalPrice: 9500 },
  { label: 'Dunk Panda', name: 'Nike Dunk Low Retro "Panda"', brand: 'Nike', category: 'Sneakers', price: 5800, originalPrice: 7200 },
  { label: 'Timberland 6"', name: 'Timberland 6-Inch Premium Boot', brand: 'Timberland', category: 'Lifestyle', price: 9800, originalPrice: 12500 },
  { label: 'Samba OG', name: 'Adidas Originals Samba OG', brand: 'Adidas', category: 'Lifestyle', price: 5200, originalPrice: 6500 },
  { label: 'Air Force 1', name: 'Nike Air Force 1 \'07', brand: 'Nike', category: 'Sneakers', price: 5500, originalPrice: 6800 },
  { label: 'NB 550', name: 'New Balance 550 Vintage White', brand: 'New Balance', category: 'Sneakers', price: 6500, originalPrice: 8000 },
  { label: 'Jordan 1 High', name: 'Air Jordan 1 High OG', brand: 'Nike', category: 'Sneakers', price: 8500, originalPrice: 11000 },
  { label: 'Gazelle', name: 'Adidas Gazelle Indoor', brand: 'Adidas', category: 'Lifestyle', price: 5400, originalPrice: 6800 },
  { label: 'Vans Old Skool', name: 'Vans Old Skool Classic Skate', brand: 'Vans', category: 'Skate', price: 4200, originalPrice: 5200 },
  { label: 'Converse 70', name: 'Chuck Taylor All Star 70 Canvas', brand: 'Converse', category: 'Sneakers', price: 4200, originalPrice: 5200 },
  { label: 'Puma Suede', name: 'Puma Suede Classic XXI', brand: 'Puma', category: 'Lifestyle', price: 4800, originalPrice: 5800 },
  { label: 'Salomon XT-6', name: 'Salomon XT-6 Advanced Trail', brand: 'Salomon', category: 'Running', price: 8900, originalPrice: 11500 },
];

export function QuickCatalogAlignerModal({
  isOpen,
  onClose,
  products,
  onSuccess
}: QuickCatalogAlignerModalProps) {
  const { updateProductsBatch, deleteProductsBatch } = useStore();

  // Local editable buffer
  const [rows, setRows] = useState<EditableProductRow[]>(() => {
    return products.map(p => ({
      id: p.id,
      name: p.name || '',
      brand: p.brand || '',
      category: p.category || 'Sneakers',
      price: Number(p.price) || 0,
      originalPrice: Number(p.originalPrice) || 0,
      stock: Number(p.stock) || 0,
      image: p.image || '',
      images: Array.isArray(p.images) ? p.images : [],
      inStock: p.inStock !== false,
      isModified: false
    }));
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false);
  const [activePhotoUploadId, setActivePhotoUploadId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchesSearch = searchQuery === '' || 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = brandFilter === 'all' || r.brand.toLowerCase() === brandFilter.toLowerCase();
      return matchesSearch && matchesBrand;
    });
  }, [rows, searchQuery, brandFilter]);

  // Unique brands for filter
  const uniqueBrands = useMemo(() => {
    const set = new Set(rows.map(r => r.brand).filter(Boolean));
    return Array.from(set).sort();
  }, [rows]);

  const modifiedCount = useMemo(() => {
    return rows.filter(r => r.isModified).length;
  }, [rows]);

  // Handle cell edits
  const handleUpdateField = (id: string, field: keyof EditableProductRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          [field]: value,
          isModified: true
        };
      }
      return row;
    }));
  };

  // Apply quick-fill preset model
  const applyPreset = (id: string, preset: typeof PRESET_MODELS[0]) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          name: preset.name,
          brand: preset.brand,
          category: preset.category,
          price: preset.price,
          originalPrice: preset.originalPrice,
          isModified: true
        };
      }
      return row;
    }));
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)));
    }
  };

  // Quick photo upload / swap
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePhotoUploadId) return;

    try {
      let finalUrl = '';
      try {
        const cloudRes = await uploadToCloudinary(file);
        if (cloudRes?.secure_url) finalUrl = cloudRes.secure_url;
      } catch {
        // fallback
      }

      if (!finalUrl) {
        // Fast canvas reader
        finalUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      handleUpdateField(activePhotoUploadId, 'image', finalUrl);
    } catch (err: any) {
      console.error('Photo swap failed:', err);
    } finally {
      setActivePhotoUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save all modified rows
  const handleSaveAll = async () => {
    const modifiedRows = rows.filter(r => r.isModified);
    if (modifiedRows.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const updates = modifiedRows.map(r => ({
        id: r.id,
        changes: {
          name: r.name,
          brand: r.brand,
          category: r.category,
          price: Number(r.price) || 0,
          originalPrice: Number(r.originalPrice) || 0,
          stock: Number(r.stock) || 0,
          image: r.image,
          inStock: r.inStock
        }
      }));

      await updateProductsBatch(updates);
      onSuccess(`Successfully updated ${updates.length} products with correct photos and names!`);
      onClose();
    } catch (err: any) {
      console.error('Batch save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Batch delete selected items
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      await deleteProductsBatch(idsToDelete);

      // Remove from local rows
      setRows(prev => prev.filter(r => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setConfirmDeleteBatch(false);
      onSuccess(`Removed ${idsToDelete.length} products from the catalogue.`);
    } catch (err: any) {
      console.error('Batch delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Hidden File Input for quick photo swapping */}
        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoFileChange}
        />

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">Quick Visual Catalog Aligner</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Rapidly rename shoes, swap photo angles, or delete unwanted imported items in 1 click.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {modifiedCount > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                {modifiedCount} pending change{modifiedCount > 1 ? 's' : ''}
              </span>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : `Save Changes (${modifiedCount})`}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="px-5 py-3 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-3 bg-white text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Filter by name, brand, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-zinc-900"
              />
            </div>

            {/* Brand Filter */}
            {uniqueBrands.length > 0 && (
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-none focus:border-zinc-900"
              >
                <option value="all">All Brands ({rows.length})</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
          </div>

          {/* Batch Selection Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-2 border border-zinc-200 text-zinc-700 font-bold rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {selectedIds.size === filteredRows.length && filteredRows.length > 0 ? 'Deselect All' : `Select All (${filteredRows.length})`}
            </button>

            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmDeleteBatch(true)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Preset Chips Quick-Fill Bar */}
        <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
          <span className="font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-500" />
            Quick Models:
          </span>
          {PRESET_MODELS.map(preset => (
            <button
              key={preset.label}
              onClick={() => {
                if (selectedIds.size > 0) {
                  // Apply to all selected rows
                  setRows(prev => prev.map(row => {
                    if (selectedIds.has(row.id)) {
                      return {
                        ...row,
                        name: preset.name,
                        brand: preset.brand,
                        category: preset.category,
                        price: preset.price,
                        originalPrice: preset.originalPrice,
                        isModified: true
                      };
                    }
                    return row;
                  }));
                }
              }}
              title={`Click to fill: ${preset.name} (KES ${preset.price.toLocaleString()}) to selected shoes`}
              className="px-2.5 py-1 bg-white border border-zinc-200 hover:border-orange-500 hover:text-orange-600 text-zinc-700 rounded-lg font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              {preset.label}
            </button>
          ))}
          {selectedIds.size > 0 && (
            <span className="text-orange-600 font-bold ml-1">
              (Will apply to {selectedIds.size} selected items)
            </span>
          )}
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto">
          {filteredRows.length === 0 ? (
            <div className="text-center py-16 text-zinc-400">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-bold text-sm text-zinc-600">No matching products found</p>
              <p className="text-xs text-zinc-400 mt-1">Try clearing your search query or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredRows.map((row, index) => {
                const isSelected = selectedIds.has(row.id);
                return (
                  <div 
                    key={row.id}
                    className={`p-3 md:px-5 flex flex-col md:flex-row items-start md:items-center gap-3 transition-colors ${
                      isSelected ? 'bg-orange-50/40' : row.isModified ? 'bg-amber-50/20' : 'hover:bg-zinc-50/60'
                    }`}
                  >
                    {/* Checkbox & Index */}
                    <div className="flex items-center gap-3 shrink-0">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(row.id)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-zinc-300 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-zinc-400 w-6 text-right tabular-nums">
                        {index + 1}
                      </span>
                    </div>

                    {/* Thumbnail + Photo Swap Trigger */}
                    <div className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
                      {row.image ? (
                        <img 
                          src={row.image} 
                          alt={row.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}

                      {/* Photo Swap Button Overlay */}
                      <button
                        type="button"
                        onClick={() => {
                          setActivePhotoUploadId(row.id);
                          fileInputRef.current?.click();
                        }}
                        title="Click to replace photo from your device"
                        className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span className="text-[9px] font-bold">Swap</span>
                      </button>

                      {row.images && row.images.length > 0 && (
                        <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-white text-[9px] px-1 rounded font-bold">
                          +{row.images.length}
                        </span>
                      )}
                    </div>

                    {/* Shoe Name & Quick Fill Shortcuts */}
                    <div className="flex-1 min-w-[220px] w-full space-y-1.5">
                      <input 
                        type="text"
                        value={row.name}
                        onChange={e => handleUpdateField(row.id, 'name', e.target.value)}
                        placeholder="e.g. Nike Dunk Low Panda"
                        className="w-full font-bold text-xs text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-orange-500 py-1 focus:outline-none transition-colors"
                      />
                      
                      {/* Row-Level Quick Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[10px]">
                        {PRESET_MODELS.slice(0, 5).map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(row.id, p)}
                            className="px-1.5 py-0.5 bg-zinc-100 hover:bg-orange-100 hover:text-orange-700 text-zinc-600 rounded text-[10px] font-medium transition-colors cursor-pointer shrink-0"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Brand */}
                    <div className="w-full md:w-32 shrink-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase md:hidden block mb-0.5">Brand</label>
                      <input 
                        type="text"
                        value={row.brand}
                        onChange={e => handleUpdateField(row.id, 'brand', e.target.value)}
                        placeholder="Brand"
                        className="w-full text-xs text-zinc-800 bg-zinc-50 md:bg-transparent border border-zinc-200 md:border-b md:border-t-0 md:border-x-0 rounded md:rounded-none px-2 py-1 focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="w-full md:w-28 shrink-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase md:hidden block mb-0.5">Category</label>
                      <select
                        value={row.category}
                        onChange={e => handleUpdateField(row.id, 'category', e.target.value)}
                        className="w-full text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="Sneakers">Sneakers</option>
                        <option value="Lifestyle">Lifestyle</option>
                        <option value="Running">Running</option>
                        <option value="Skate">Skate</option>
                      </select>
                    </div>

                    {/* Selling Price */}
                    <div className="w-full md:w-28 shrink-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase md:hidden block mb-0.5">Price (KES)</label>
                      <div className="relative">
                        <span className="text-[11px] text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 font-mono">KES</span>
                        <input 
                          type="number"
                          value={row.price}
                          onChange={e => handleUpdateField(row.id, 'price', Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-2 py-1 text-right focus:outline-none focus:border-orange-500 tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Was Price */}
                    <div className="w-full md:w-28 shrink-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase md:hidden block mb-0.5">Was Price</label>
                      <div className="relative">
                        <span className="text-[11px] text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 font-mono">KES</span>
                        <input 
                          type="number"
                          value={row.originalPrice}
                          onChange={e => handleUpdateField(row.id, 'originalPrice', Number(e.target.value))}
                          className="w-full text-xs font-mono text-zinc-500 line-through bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-2 py-1 text-right focus:outline-none focus:border-orange-500 tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="w-full md:w-16 shrink-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase md:hidden block mb-0.5">Stock</label>
                      <input 
                        type="number"
                        value={row.stock}
                        onChange={e => handleUpdateField(row.id, 'stock', Number(e.target.value))}
                        className="w-full text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-orange-500 tabular-nums"
                      />
                    </div>

                    {/* Status Badge / Trash */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                      {row.isModified && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="Modified" />
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete "${row.name || 'this product'}" from catalogue?`)) {
                            await deleteProductsBatch([row.id]);
                            setRows(prev => prev.filter(r => r.id !== row.id));
                            onSuccess(`Deleted "${row.name}"`);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-zinc-500 font-medium">
            Showing <strong className="text-zinc-900">{filteredRows.length}</strong> shoes &middot; <strong className="text-zinc-900">{modifiedCount}</strong> modified
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-600 font-bold hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : `Save All Changes (${modifiedCount})`}</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal for Batch Delete */}
        {confirmDeleteBatch && (
          <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 mb-1">
                Delete {selectedIds.size} Selected Products?
              </h3>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                This will permanently delete these {selectedIds.size} shoes from the database. This action is atomic and cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteBatch(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : `Yes, Delete ${selectedIds.size} Shoes`}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
