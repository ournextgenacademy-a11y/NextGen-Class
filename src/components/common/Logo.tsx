import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  textVariant?: 'dark' | 'light' | 'white';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  textVariant = 'light',
  className = '',
}) => {
  const sizeMap: Record<string, number> = {
    sm: 28,
    md: 38,
    lg: 48,
    xl: 60,
    '2xl': 76,
  };

  const pixelSize = typeof size === 'number' ? size : (sizeMap[size] || 38);

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Concentric 3D Orb Logo */}
      <div 
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }} 
        className="relative shrink-0 flex items-center justify-center rounded-full shadow-lg shadow-orange-500/25 transition-transform hover:scale-105"
      >
        <svg 
          viewBox="0 0 512 512" 
          width="100%" 
          height="100%" 
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <radialGradient id="logo-core" cx="38%" cy="36%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#ffaa44" />
              <stop offset="55%" stopColor="#ff5500" />
              <stop offset="85%" stopColor="#cf3000" />
              <stop offset="100%" stopColor="#480f00" />
            </radialGradient>
            <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff7700" />
              <stop offset="50%" stopColor="#f54700" />
              <stop offset="100%" stopColor="#991f00" />
            </radialGradient>
            <filter id="logo-shadow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#ff5500" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Deep Black Outer Shell */}
          <circle cx="256" cy="256" r="248" fill="#09090b" />
          
          {/* Subtle Outer Orange Rim */}
          <circle cx="256" cy="256" r="244" fill="none" stroke="#ff5500" strokeWidth="2.5" strokeOpacity="0.3" />

          {/* Stepped Concentric Grooves */}
          <g filter="url(#logo-shadow-filter)">
            <circle cx="256" cy="256" r="226" fill="none" stroke="#ff5500" strokeWidth="4" strokeOpacity="0.4" />
            <circle cx="256" cy="256" r="206" fill="#140702" stroke="#ff6200" strokeWidth="5" strokeOpacity="0.75" />
            <circle cx="256" cy="256" r="184" fill="#240c04" stroke="#ff6a05" strokeWidth="6" strokeOpacity="0.85" />
            <circle cx="256" cy="256" r="160" fill="#3b1306" stroke="#ff7914" strokeWidth="7" />
            <circle cx="256" cy="256" r="134" fill="#591c07" stroke="#ff8c26" strokeWidth="8" />
            <circle cx="256" cy="256" r="108" fill="#802606" stroke="#ffa33e" strokeWidth="9" />
            <circle cx="256" cy="256" r="80" fill="#b03405" stroke="#ffbd5c" strokeWidth="10" />

            {/* Glowing Core Sphere */}
            <circle cx="256" cy="256" r="56" fill="url(#logo-glow)" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
            <circle cx="256" cy="256" r="44" fill="url(#logo-core)" />
            
            {/* Highlight */}
            <ellipse cx="242" cy="242" rx="12" ry="7" fill="#ffffff" fillOpacity="0.8" transform="rotate(-30 242 242)" />
          </g>

          {/* Radial division lines */}
          <g stroke="#09090b" strokeWidth="1.5" strokeOpacity="0.25">
            <line x1="256" y1="28" x2="256" y2="484" />
            <line x1="28" y1="256" x2="484" y2="256" />
            <line x1="95" y1="95" x2="417" y2="417" />
            <line x1="95" y1="417" x2="417" y2="95" />
          </g>
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5 leading-none">
            <span 
              className={`font-black tracking-tight text-base sm:text-lg uppercase ${
                textVariant === 'dark' || textVariant === 'white' 
                  ? 'text-white' 
                  : 'text-zinc-900'
              }`}
              style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}
            >
              NextGen
            </span>
            <span 
              className="font-black tracking-tight text-base sm:text-lg uppercase text-orange-500"
              style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.02em' }}
            >
              Academy
            </span>
          </div>
          <span 
            className={`text-[9px] uppercase tracking-[0.2em] font-semibold mt-0.5 ${
              textVariant === 'dark' || textVariant === 'white' 
                ? 'text-zinc-400' 
                : 'text-zinc-500'
            }`}
          >
            Excellence & Innovation
          </span>
        </div>
      )}
    </div>
  );
};
