import React from 'react';

interface LogoProps {
  /** 'icon' shows just the sneaker mark, 'full' shows icon + 'SOLE MATE KE' stacked, 'horizontal' shows icon + text side-by-side */
  variant?: 'icon' | 'full' | 'horizontal';
  className?: string;
  size?: number | string;
  /** Primary brand color override, default is #F36F21 / #EA580C */
  color?: string;
  /** Optional click handler or alt text */
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'icon',
  className = '',
  size = 36,
  color = '#F36F21',
}) => {
  // Shoe Icon Only
  if (variant === 'icon') {
    return (
      <svg
        viewBox="0 0 500 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
        className={`inline-block shrink-0 ${className}`}
        aria-label="Solemate Logo"
      >
        {/* Shoe Upper */}
        <path
          d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z"
          fill={color}
        />
        {/* Three White Accent Stripes */}
        <line x1="225" y1="75" x2="250" y2="160" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
        <line x1="270" y1="95" x2="295" y2="170" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
        <line x1="315" y1="125" x2="340" y2="185" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />

        {/* Sole */}
        <path
          d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z"
          fill={color}
        />
      </svg>
    );
  }

  // Horizontal variant (e.g. for navbar or header)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <svg
          viewBox="0 0 500 350"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size, height: size }}
          className="shrink-0"
        >
          {/* Shoe Upper */}
          <path
            d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z"
            fill={color}
          />
          {/* Stripes */}
          <line x1="225" y1="75" x2="250" y2="160" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
          <line x1="270" y1="95" x2="295" y2="170" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
          <line x1="315" y1="125" x2="340" y2="185" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />

          {/* Sole */}
          <path
            d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z"
            fill={color}
          />
        </svg>
        <div className="flex flex-col leading-none">
          <span className="font-black text-lg sm:text-xl tracking-tight text-zinc-900">
            Solemate<span style={{ color }}>.co.ke</span>
          </span>
          <span className="text-[9px] font-bold tracking-[0.25em] text-zinc-400 uppercase -mt-0.5">
            SOLE MATE KE
          </span>
        </div>
      </div>
    );
  }

  // Full stacked badge (Matches user's exact uploaded image)
  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      <svg
        viewBox="0 0 500 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: typeof size === 'number' ? size * 0.75 : size }}
        className="shrink-0"
      >
        {/* Shoe Upper */}
        <path
          d="M 100 130 C 115 50 170 20 220 25 C 275 30 330 90 405 130 C 470 165 520 215 470 235 C 410 260 300 270 200 220 C 150 195 90 170 100 130 Z"
          fill={color}
        />
        {/* Stripes */}
        <line x1="225" y1="75" x2="250" y2="160" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
        <line x1="270" y1="95" x2="295" y2="170" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />
        <line x1="315" y1="125" x2="340" y2="185" stroke="#FFFFFF" strokeWidth="18" strokeLinecap="round" />

        {/* Sole */}
        <path
          d="M 75 200 C 105 195 200 245 300 250 C 400 255 460 230 470 260 C 475 295 350 315 235 305 C 135 295 70 225 75 200 Z"
          fill={color}
        />
      </svg>
      <span
        style={{ color }}
        className="font-black text-sm sm:text-base tracking-[0.22em] uppercase mt-2 font-sans"
      >
        SOLE MATE KE
      </span>
    </div>
  );
};

export default Logo;
