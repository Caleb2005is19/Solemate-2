import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Tag, 
  DollarSign, 
  Store, 
  Eye, 
  RotateCcw, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Product, Seller } from '../../types';
import { useStore } from '../../context/StoreContext';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface TrayPhoto {
  id: string;
  file?: File;
  url: string;
  fileName: string;
  assignedShoeId: string | null;
  isHero: boolean;
}

interface StagedShoe {
  id: string;
  name: string;
  brand: string;
  category: string;
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  price: number;
  originalPrice: number;
  stock: number;
  heroPhotoId: string | null;
  anglePhotoIds: string[];
}

interface ManualProductAssignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const BRAND_PRESETS = [
  'Nike', 'Jordan', 'Adidas', 'Timberland', 'New Balance', 'Puma', 'Clarks', 'Converse', 'Vans', 'Fashion'
];

const PRICE_PRESETS = [4500, 5500, 6500, 7500, 8500, 10500, 12500];

export function ManualProductAssignerModal({
  isOpen,
  onClose,
  onSuccess
}: ManualProductAssignerModalProps) {
  const { addProduct, sellers, currentSellerId } = useStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [photos, setPhotos] = useState<TrayPhoto[]>([]);
  const [shoes, setShoes] = useState<StagedShoe[]>([]);
  const [activeShoeId, setActiveShoeId] = useState<string | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(
    currentSellerId || (sellers[0]?.id || 'seller-official')
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStatus, setPublishStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local files added
  const handleFilesAdded = (fileList: FileList | File[]) => {
    setError(null);
    const valid = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    const newPhotos: TrayPhoto[] = valid.map((file, idx) => ({
      id: `photo_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      url: URL.createObjectURL(file),
      fileName: file.name,
      assignedShoeId: null,
      isHero: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  // Create an empty shoe card
  const handleCreateShoe = (heroPhoto?: TrayPhoto) => {
    const shoeId = `shoe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Attempt clean name from filename if photo provided
    let initialName = 'New Footwear Item';
    if (heroPhoto) {
      initialName = heroPhoto.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();
      initialName = initialName.charAt(0).toUpperCase() + initialName.slice(1);
    }

    const newShoe: StagedShoe = {
      id: shoeId,
      name: initialName,
      brand: 'Nike',
      category: 'Sneakers',
      gender: 'Unisex',
      price: 5500,
      originalPrice: 6800,
      stock: 12,
      heroPhotoId: heroPhoto ? heroPhoto.id : null,
      anglePhotoIds: []
    };

    if (heroPhoto) {
      setPhotos(prev => prev.map(p => 
        p.id === heroPhoto.id 
          ? { ...p, assignedShoeId: shoeId, isHero: true } 
          : p
      ));
    }

    setShoes(prev => [...prev, newShoe]);
    setActiveShoeId(shoeId);
  };

  // 1-click Auto-create shoe for each unassigned photo
  const handleAutoCreatePerPhoto = () => {
    const unassigned = photos.filter(p => !p.assignedShoeId);
    if (unassigned.length === 0) return;

    const newShoes: StagedShoe[] = [];
    const updatedPhotos = [...photos];

    unassigned.forEach((p, idx) => {
      const shoeId = `shoe_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      const cleanName = p.fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim();

      newShoes.push({
        id: shoeId,
        name: cleanName || `Footwear Item ${shoes.length + idx + 1}`,
        brand: 'Nike',
        category: 'Sneakers',
        gender: 'Unisex',
        price: 5500,
        originalPrice: 6800,
        stock: 12,
        heroPhotoId: p.id,
        anglePhotoIds: []
      });

      const photoIdx = updatedPhotos.findIndex(item => item.id === p.id);
      if (photoIdx !== -1) {
        updatedPhotos[photoIdx] = {
          ...updatedPhotos[photoIdx],
          assignedShoeId: shoeId,
          isHero: true
        };
      }
    });

    setShoes(prev => [...prev, ...newShoes]);
    setPhotos(updatedPhotos);
    if (newShoes.length > 0) {
      setActiveShoeId(newShoes[0].id);
    }
  };

  // Assign photo from tray to active shoe
  const handleAssignPhotoToActiveShoe = (photo: TrayPhoto) => {
    if (!activeShoeId) {
      // If no active shoe, create one with this photo as hero
      handleCreateShoe(photo);
      return;
    }

    const currentShoe = shoes.find(s => s.id === activeShoeId);
    if (!currentShoe) return;

    // If photo is already assigned to this shoe, unassign it
    if (photo.assignedShoeId === activeShoeId) {
      handleDetachPhotoFromShoe(photo.id, activeShoeId);
      return;
    }

    // Unassign from old shoe if it belonged to another
    if (photo.assignedShoeId && photo.assignedShoeId !== activeShoeId) {
      handleDetachPhotoFromShoe(photo.id, photo.assignedShoeId);
    }

    // If current shoe has no hero, make it hero; otherwise add to angle photos
    const makeHero = !currentShoe.heroPhotoId;

    setShoes(prev => prev.map(s => {
      if (s.id !== activeShoeId) return s;
      if (makeHero) {
        return { ...s, heroPhotoId: photo.id };
      } else {
        return { ...s, anglePhotoIds: [...s.anglePhotoIds, photo.id] };
      }
    }));

    setPhotos(prev => prev.map(p => 
      p.id === photo.id 
        ? { ...p, assignedShoeId: activeShoeId, isHero: makeHero } 
        : p
    ));
  };

  // Detach photo from shoe
  const handleDetachPhotoFromShoe = (photoId: string, shoeId: string) => {
    setShoes(prev => prev.map(s => {
      if (s.id !== shoeId) return s;
      if (s.heroPhotoId === photoId) {
        // Promote first angle to hero if exists
        const nextHero = s.anglePhotoIds[0] || null;
        const nextAngles = s.anglePhotoIds.slice(1);
        return { ...s, heroPhotoId: nextHero, anglePhotoIds: nextAngles };
      } else {
        return { ...s, anglePhotoIds: s.anglePhotoIds.filter(id => id !== photoId) };
      }
    }));

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return { ...p, assignedShoeId: null, isHero: false };
      }
      return p;
    }));
  };

  // Promote angle to hero photo
  const handlePromoteToHero = (photoId: string, shoeId: string) => {
    setShoes(prev => prev.map(s => {
      if (s.id !== shoeId) return s;
      const oldHero = s.heroPhotoId;
      const newAngles = s.anglePhotoIds.filter(id => id !== photoId);
      if (oldHero) newAngles.unshift(oldHero);
      return { ...s, heroPhotoId: photoId, anglePhotoIds: newAngles };
    }));

    setPhotos(prev => prev.map(p => {
      if (p.assignedShoeId === shoeId) {
        return { ...p, isHero: p.id === photoId };
      }
      return p;
    }));
  };

  // Delete a shoe card (returns photos to tray)
  const handleDeleteShoe = (shoeId: string) => {
    setPhotos(prev => prev.map(p => 
      p.assignedShoeId === shoeId 
        ? { ...p, assignedShoeId: null, isHero: false } 
        : p
    ));
    setShoes(prev => prev.filter(s => s.id !== shoeId));
    if (activeShoeId === shoeId) {
      const remaining = shoes.filter(s => s.id !== shoeId);
      setActiveShoeId(remaining[0]?.id || null);
    }
  };

  // Delete photo completely from tray
  const handleDeletePhotoFromTray = (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo && photo.assignedShoeId) {
      handleDetachPhotoFromShoe(photoId, photo.assignedShoeId);
    }
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Update shoe field
  const handleUpdateShoe = (shoeId: string, updates: Partial<StagedShoe>) => {
    setShoes(prev => prev.map(s => s.id === shoeId ? { ...s, ...updates } : s));
  };

  // Publish all staged shoes to store
  const handlePublishAll = async () => {
    if (shoes.length === 0) {
      setError('Please stage at least one shoe before publishing.');
      return;
    }

    const unreadyShoes = shoes.filter(s => !s.heroPhotoId);
    if (unreadyShoes.length > 0) {
      setError(`Shoe "${unreadyShoes[0].name}" has no hero photo assigned. Assign a photo or delete the empty card.`);
      setActiveShoeId(unreadyShoes[0].id);
      return;
    }

    setIsPublishing(true);
    setError(null);
    setPublishProgress(0);

    try {
      const totalShoes = shoes.length;
      let completedCount = 0;

      for (let i = 0; i < shoes.length; i++) {
        const shoe = shoes[i];
        setPublishStatus(`Uploading photos for "${shoe.name}" (${i + 1}/${totalShoes})...`);

        // 1. Upload hero photo
        const heroPhotoItem = photos.find(p => p.id === shoe.heroPhotoId);
        let heroUrl = heroPhotoItem?.url || '';
        if (heroPhotoItem?.file) {
          const res = await uploadToCloudinary(heroPhotoItem.file);
          heroUrl = res.secure_url;
        }

        // 2. Upload angle photos
        const angleUrls: string[] = [];
        for (const angleId of shoe.anglePhotoIds) {
          const angleItem = photos.find(p => p.id === angleId);
          if (angleItem) {
            if (angleItem.file) {
              const res = await uploadToCloudinary(angleItem.file);
              angleUrls.push(res.secure_url);
            } else {
              angleUrls.push(angleItem.url);
            }
          }
        }

        // 3. Save Product
        const newProduct: Product = {
          id: `prod_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
          name: shoe.name.trim() || 'Footwear Item',
          brand: shoe.brand || 'Solemate',
          category: shoe.category || 'Sneakers',
          gender: shoe.gender || 'Unisex',
          price: Number(shoe.price) || 5500,
          originalPrice: Number(shoe.originalPrice) || Math.round((Number(shoe.price) || 5500) * 1.2 / 100) * 100,
          image: heroUrl,
          images: angleUrls,
          color: 'Standard Colorway',
          colors: [],
          description: `Authentic ${shoe.brand} ${shoe.name}. Premium comfort with fast delivery across Kenya.`,
          inStock: true,
          stock: shoe.stock || 12,
          sellerId: selectedSellerId,
          isNew: true
        };

        await addProduct(newProduct);
        completedCount++;
        setPublishProgress(Math.round((completedCount / totalShoes) * 100));
      }

      setPublishStatus('All shoes published successfully!');
      setTimeout(() => {
        setIsPublishing(false);
        onSuccess(completedCount);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to publish products to store.');
      setIsPublishing(false);
    }
  };

  const totalPhotosCount = photos.length;
  const unassignedCount = photos.filter(p => !p.assignedShoeId).length;
  const assignedCount = totalPhotosCount - unassignedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 text-white w-full max-w-7xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Fast Manual Photo Assigner
                </h2>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Zero AI Cost • Instant
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Upload photos, assign main and angle views with 1 click, and publish directly to catalog.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Upload Button */}
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-orange-400" />
              <span>Add More Photos</span>
            </button>

            <button
              onClick={onClose}
              disabled={isPublishing}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-2xl flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Split Body: Left = Shoe Cards, Right = Unassigned Photos Tray */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Shoe Listings Workspace */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-zinc-800/80">
            
            {/* Workspace Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Staged Shoe Listings ({shoes.length})
                </span>
                <span className="text-xs text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">
                  Target Store:
                </span>
                <select
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-xs text-white font-bold px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.id}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateShoe()}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-md shadow-orange-500/20 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Shoe Card</span>
                </button>

                {unassignedCount > 0 && (
                  <button
                    onClick={handleAutoCreatePerPhoto}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors active:scale-95"
                    title="Creates a standalone shoe card for every unassigned photo in the tray"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Auto-Create All ({unassignedCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty State */}
            {shoes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-zinc-500 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-200 mb-1">No shoes created yet</h3>
                <p className="text-xs text-zinc-500 max-w-md mb-5">
                  Click any photo in the right tray to start a shoe, or click "Auto-Create All" to turn every uploaded photo into a footwear listing.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCreateShoe()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors"
                  >
                    + Create Empty Shoe Card
                  </button>
                  {photos.length > 0 && (
                    <button
                      onClick={handleAutoCreatePerPhoto}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors"
                    >
                      Auto-Create from {photos.length} Photos
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Shoe Cards Grid */
              <div className="space-y-4">
                {shoes.map((shoe) => {
                  const isActive = shoe.id === activeShoeId;
                  const heroPhoto = photos.find(p => p.id === shoe.heroPhotoId);
                  const anglePhotos = shoe.anglePhotoIds
                    .map(id => photos.find(p => p.id === id))
                    .filter(Boolean) as TrayPhoto[];

                  return (
                    <div 
                      key={shoe.id}
                      onClick={() => setActiveShoeId(shoe.id)}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-zinc-900/90 border-orange-500 ring-1 ring-orange-500/30 shadow-xl' 
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        
                        {/* Shoe Photos Cluster */}
                        <div className="flex items-start gap-2.5 shrink-0">
                          {/* Main Hero Photo Slot */}
                          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center group">
                            {heroPhoto ? (
                              <>
                                <img 
                                  src={heroPhoto.url} 
                                  alt={shoe.name} 
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute top-1 left-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  MAIN
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDetachPhotoFromShoe(heroPhoto.id, shoe.id);
                                  }}
                                  className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Detach photo back to tray"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2 text-zinc-600">
                                <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <span className="text-[10px] font-bold block leading-tight">Click tray photo to assign</span>
                              </div>
                            )}
                          </div>

                          {/* Angle Photos Strip */}
                          <div className="flex flex-wrap md:flex-col gap-1.5">
                            {anglePhotos.map((angle) => (
                              <div 
                                key={angle.id}
                                className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 group"
                              >
                                <img src={angle.url} alt="angle" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePromoteToHero(angle.id, shoe.id);
                                    }}
                                    className="p-1 bg-orange-500 hover:bg-orange-600 rounded text-white"
                                    title="Make this Main Hero"
                                  >
                                    <Sparkles className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDetachPhotoFromShoe(angle.id, shoe.id);
                                    }}
                                    className="p-1 bg-rose-600 hover:bg-rose-700 rounded text-white"
                                    title="Detach back to tray"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Angle count indicator */}
                            {anglePhotos.length > 0 && (
                              <span className="text-[10px] text-zinc-500 font-mono font-bold text-center">
                                +{anglePhotos.length}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Shoe Metadata Fields */}
                        <div className="flex-1 w-full space-y-3">
                          {/* Name Input */}
                          <div>
                            <input 
                              type="text" 
                              value={shoe.name}
                              onChange={(e) => handleUpdateShoe(shoe.id, { name: e.target.value })}
                              placeholder="e.g. Air Jordan 4 Retro 'Military Black'"
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none"
                            />
                          </div>

                          {/* Quick Brand Pills */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 mr-1">Brand:</span>
                            {BRAND_PRESETS.map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateShoe(shoe.id, { brand: b });
                                }}
                                className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                                  shoe.brand === b 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>

                          {/* Price Row & Quick Price Pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-xl border border-zinc-800">
                              <span className="text-[11px] text-zinc-400 font-bold">KES</span>
                              <input 
                                type="number" 
                                value={shoe.price}
                                onChange={(e) => handleUpdateShoe(shoe.id, { 
                                  price: Number(e.target.value),
                                  originalPrice: Math.round(Number(e.target.value) * 1.25 / 100) * 100
                                })}
                                className="w-20 bg-transparent text-sm font-black font-mono text-white focus:outline-none"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-1">
                              {PRICE_PRESETS.map(p => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateShoe(shoe.id, { 
                                      price: p,
                                      originalPrice: Math.round(p * 1.25 / 100) * 100
                                    });
                                  }}
                                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                                    shoe.price === p 
                                      ? 'bg-amber-400 text-zinc-950 font-black' 
                                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                  }`}
                                >
                                  {p.toLocaleString()}
                                </button>
                              ))}
                            </div>

                            {/* Category & Gender */}
                            <select
                              value={shoe.category}
                              onChange={(e) => handleUpdateShoe(shoe.id, { category: e.target.value })}
                              className="bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-orange-500"
                            >
                              <option value="Sneakers">Sneakers</option>
                              <option value="Boots">Boots</option>
                              <option value="Lifestyle">Lifestyle</option>
                              <option value="Running">Running</option>
                              <option value="Slides">Slides</option>
                            </select>

                            <select
                              value={shoe.gender}
                              onChange={(e) => handleUpdateShoe(shoe.id, { gender: e.target.value as Product['gender'] })}
                              className="bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-bold px-2 py-1 rounded-lg focus:outline-none focus:border-orange-500"
                            >
                              <option value="Unisex">Unisex</option>
                              <option value="Men">Men</option>
                              <option value="Women">Women</option>
                              <option value="Kids">Kids</option>
                            </select>

                            {/* Delete Shoe Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteShoe(shoe.id);
                              }}
                              className="ml-auto text-zinc-500 hover:text-rose-400 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Delete shoe (returns photos to tray)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Unassigned Photos Staging Tray */}
          <div className="w-full lg:w-96 p-4 sm:p-5 bg-zinc-950 flex flex-col shrink-0">
            
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Photos Tray ({photos.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {unassignedCount} unassigned • {assignedCount} linked
                </p>
              </div>

              {photos.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear all photos from tray?')) {
                      setPhotos([]);
                      setShoes([]);
                    }
                  }}
                  className="text-[11px] text-zinc-500 hover:text-rose-400 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Photos Grid in Tray */}
            {photos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl text-center hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <span className="text-xs font-bold text-zinc-300 block mb-1">Click to upload photos</span>
                <span className="text-[10px] text-zinc-500">Drop 10-50 photos from phone or computer</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2.5 content-start pr-1">
                {photos.map((photo) => {
                  const isAssigned = !!photo.assignedShoeId;
                  const isHero = photo.isHero;
                  const assignedShoe = shoes.find(s => s.id === photo.assignedShoeId);

                  return (
                    <div 
                      key={photo.id}
                      onClick={() => handleAssignPhotoToActiveShoe(photo)}
                      className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all group ${
                        isAssigned 
                          ? 'border-emerald-500/50 opacity-60 hover:opacity-100 ring-1 ring-emerald-500/20' 
                          : 'border-zinc-800 hover:border-orange-500 hover:scale-105 shadow-md'
                      }`}
                      title={isAssigned ? `Assigned to: ${assignedShoe?.name || 'Shoe'} (Click to detach)` : 'Click to assign to active shoe'}
                    >
                      <img src={photo.url} alt={photo.fileName} className="w-full h-full object-cover" />

                      {/* Status Badges */}
                      {isAssigned && (
                        <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow">
                          {isHero ? 'MAIN' : 'ANGLE'}
                        </div>
                      )}

                      {/* Delete from Tray button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhotoFromTray(photo.id);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo from tray"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <span className="text-[9px] text-zinc-300 font-mono truncate block">
                          {photo.fileName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Instruction Tip */}
            <div className="mt-3 p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 shrink-0">
              <span className="font-bold text-zinc-200">How it works:</span> Click any photo in this tray to assign it to the selected shoe. Click again to detach.
            </div>
          </div>

        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-bold">
              Ready to Publish: <strong className="text-white font-mono">{shoes.length} shoes</strong> ({photos.length} photos)
            </span>
            {isPublishing && (
              <span className="text-xs text-orange-400 font-bold animate-pulse">
                {publishStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isPublishing}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handlePublishAll}
              disabled={isPublishing || shoes.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing {publishProgress}%</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish {shoes.length} Shoes to Store</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
