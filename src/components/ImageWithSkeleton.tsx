import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className, 
  containerClassName = "", 
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-100 animate-pulse flex items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}
