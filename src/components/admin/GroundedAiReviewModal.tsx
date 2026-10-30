import React from 'react';
import { X, Check, ShieldCheck, AlertCircle, Sparkles, Tag, ArrowRight } from 'lucide-react';

export interface GroundedAiDetectionResult {
  name: string;
  brand: string;
  category: string;
  gender: string;
  color: string;
  price: number;
  originalPrice: number;
  confidence: 'High' | 'Medium' | 'Uncertain';
  visualEvidence: string[];
  description: string;
}

interface GroundedAiReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  currentProduct: {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
  };
  detected: GroundedAiDetectionResult;
  onAccept: (detected: GroundedAiDetectionResult) => void;
}

export function GroundedAiReviewModal({
  isOpen,
  onClose,
  image,
  currentProduct,
  detected,
  onAccept
}: GroundedAiReviewModalProps) {
  if (!isOpen) return null;

  const isHighConfidence = detected.confidence === 'High';
  const isMedium = detected.confidence === 'Medium';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-2">
                Grounded Footwear Verification
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                  isHighConfidence 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : isMedium 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}>
                  {detected.confidence} Confidence
                </span>
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Inspected logos, shoebox branding, and silhouette cues directly from photo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Main Visual Side-by-Side Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            {/* Shoe Photo Thumbnail */}
            <div className="sm:col-span-4 aspect-square rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-xs relative">
              <img 
                src={image} 
                alt="Footwear Inspection" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Side-by-Side Diff Cards */}
            <div className="sm:col-span-8 grid grid-cols-2 gap-3 text-xs">
              
              {/* CURRENT */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Current Listing
                </p>
                <div>
                  <p className="font-bold text-zinc-800 line-clamp-2">{currentProduct.name || 'Unnamed Shoe'}</p>
                  <p className="text-[11px] text-zinc-500">{currentProduct.brand || 'No brand'}</p>
                </div>
                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">{currentProduct.category}</span>
                  <span className="font-mono font-bold text-zinc-700">KES {Number(currentProduct.price || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* AI DETECTED */}
              <div className="bg-emerald-50/60 border-2 border-emerald-500/30 rounded-2xl p-3.5 space-y-2">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Verified from Photo
                </p>
                <div>
                  <p className="font-black text-emerald-950 line-clamp-2">{detected.name}</p>
                  <p className="text-[11px] font-bold text-emerald-700">{detected.brand}</p>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-medium">{detected.category}</span>
                  <span className="font-mono font-black text-emerald-900">KES {Number(detected.price).toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Visual Evidence Grounding Box */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-2 text-xs">
            <p className="text-[11px] font-black uppercase text-zinc-600 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Visual Evidence Detected in Image:
            </p>
            <ul className="space-y-1 text-zinc-600">
              {detected.visualEvidence.map((ev, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Generated Authentic Description */}
          {detected.description && (
            <div className="text-[11px] text-zinc-500 bg-white p-3 rounded-xl border border-zinc-100">
              <span className="font-bold text-zinc-700">Catalog Description: </span>
              {detected.description}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 font-bold text-zinc-600 hover:bg-zinc-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Keep Current
          </button>
          
          <button
            type="button"
            onClick={() => {
              onAccept(detected);
              onClose();
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Accept Verified Match</span>
          </button>
        </div>

      </div>
    </div>
  );
}
