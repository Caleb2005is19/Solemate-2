import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className, 
  containerClassName = "", 
  loading = "lazy",
  fetchPriority = "auto",
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  let optimizedSrc = src;
  if (src && src.includes('images.unsplash.com')) {
    optimizedSrc = src
      .replace(/q=\d+/, 'q=70') // Optimize compression quality
      .replace(/w=\d+/, (match) => {
        const width = parseInt(match.replace('w=', ''), 10);
        if (loading === 'lazy' && width > 600) {
          return 'w=600'; // Limit lazy grid images to efficient dimensions
        } else if (width > 1200) {
          return 'w=1000'; // Limit high priority banner items
        }
        return match;
      });
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-100 flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <img
        src={optimizedSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        loading={loading}
        // @ts-ignore
        fetchPriority={fetchPriority}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
