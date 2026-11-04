import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Generates an ultra-lightweight low-resolution placeholder (LQIP) URL
 * for Cloudinary, Unsplash, or returns null for default shimmer placeholder.
 */
export function getLowResPlaceholder(src?: string): string | null {
  if (!src || typeof src !== 'string') return null;

  // Cloudinary: generate an ultra-low quality (q_10) 50px blurred micro-thumbnail
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    if (src.includes('e_blur:') || src.includes('w_50') || src.includes('w_60')) return src;
    return src.replace('/upload/', '/upload/c_scale,w_50,q_10,e_blur:200,f_auto/');
  }

  // Unsplash: generate a 50px micro-thumbnail with blur and low quality
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', '50');
      url.searchParams.set('q', '20');
      url.searchParams.set('blur', '50');
      url.searchParams.set('auto', 'format');
      return url.toString();
    } catch {
      return src
        .replace(/w=\d+/, 'w=50')
        .replace(/q=\d+/, 'q=20') + '&blur=50';
    }
  }

  return null;
}

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  placeholderSrc?: string;
  showSpinner?: boolean;
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "", 
  loading = "lazy",
  fetchPriority = "auto",
  placeholderSrc,
  showSpinner = false,
  decoding = "async",
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // If image is already cached by browser, mark loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  let optimizedSrc = src;
  if (src && src.includes('images.unsplash.com')) {
    optimizedSrc = src
      .replace(/q=\d+/, 'q=75')
      .replace(/w=\d+/, (match) => {
        const width = parseInt(match.replace('w=', ''), 10);
        if (loading === 'lazy' && width > 600) {
          return 'w=600';
        } else if (width > 1200) {
          return 'w=1000';
        }
        return match;
      });
  }

  const lowRes = placeholderSrc || getLowResPlaceholder(src);

  return (
    <div className={`relative overflow-hidden bg-zinc-100 ${containerClassName}`}>
      {/* 1. Shimmer base placeholder to reserve layout dimensions and prevent CLS */}
      <div 
        aria-hidden="true" 
        className={`absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-200/50 to-zinc-100 transition-opacity duration-500 ease-out ${
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-pulse'
        }`}
      />

      {/* 2. Low-Resolution Placeholder (Blurred LQIP image) */}
      {lowRes && !hasError && (
        <img
          src={lowRes}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover filter blur-md scale-110 pointer-events-none transition-opacity duration-700 ease-out select-none ${
            isLoaded ? 'opacity-0' : 'opacity-90'
          }`}
          decoding="async"
        />
      )}

      {/* Optional minimal spinner if specifically requested */}
      <AnimatePresence>
        {showSpinner && !isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-7 h-7 border-2 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback state for broken image links */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-zinc-100 text-zinc-400 select-none">
          <svg className="w-8 h-8 mb-1.5 stroke-current opacity-30" viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Photo Unavailable</span>
        </div>
      ) : (
        /* 3. Main Image with native loading="lazy", async decoding, and smooth cross-fade */
        <img
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          loading={loading}
          decoding={decoding}
          // @ts-ignore
          fetchPriority={fetchPriority}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
}
