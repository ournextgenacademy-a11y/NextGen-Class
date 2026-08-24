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
      {/* Concentric 3D Orb Logo matching exact JPEG */}
      <div 
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }} 
        className="relative shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-red-500/20 transition-transform hover:scale-105 bg-black"
      >
        <svg 
          viewBox="0 0 512 512" 
          width="100%" 
          height="100%" 
          className="w-full h-full"
        >
          <defs>
            {/* Peach Textured Rim Gradient */}
            <radialGradient id="ng-rim-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#dc4e36" />
              <stop offset="35%" stopColor="#e06c54" />
              <stop offset="60%" stopColor="#e89e8f" />
              <stop offset="78%" stopColor="#f2c4ba" />
              <stop offset="92%" stopColor="#f7ded7" />
              <stop offset="100%" stopColor="#ecd0c8" />
            </radialGradient>

            {/* Core Red Glow */}
            <radialGradient id="ng-core-red" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e82b0b" />
              <stop offset="60%" stopColor="#db1f04" />
              <stop offset="90%" stopColor="#c91700" />
              <stop offset="100%" stopColor="#aa1100" />
            </radialGradient>

            <filter id="ng-rim-noise" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.25" numOctaves="3" result="noise" />
              <feColorMatrix type="matrix" values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.7 0" in="noise" result="coloredNoise" />
              <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="textured" />
              <feBlend mode="multiply" in="SourceGraphic" in2="textured" />
            </filter>
          </defs>

          {/* Solid Black Canvas */}
          <rect width="512" height="512" fill="#000000" />

          {/* 1. TEXTURED PALE PEACH / BLUSH RIM */}
          {/* Peripheral Micro Teeth & Granules */}
          <circle cx="256" cy="256" r="198" fill="none" stroke="#f4d1c9" strokeWidth="2.5" strokeOpacity="0.6" strokeDasharray="2,3" />
          <circle cx="256" cy="256" r="196" fill="none" stroke="#ebd0c8" strokeWidth="2" strokeOpacity="0.8" strokeDasharray="3,2" />

          {/* Peach Body */}
          <circle cx="256" cy="256" r="194" fill="url(#ng-rim-grad)" />
          <circle cx="256" cy="256" r="194" fill="#f8e2dc" filter="url(#ng-rim-noise)" opacity="0.35" />

          {/* Dense Micro-grooves on peach rim */}
          <g fill="none" strokeOpacity="0.4">
            <circle cx="256" cy="256" r="192" stroke="#ebd0c8" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="190" stroke="#f6ddd6" strokeWidth="1" strokeDasharray="2,1.5" />
            <circle cx="256" cy="256" r="188" stroke="#ebd0c8" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="186" stroke="#eed5cf" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="256" cy="256" r="184" stroke="#ebd0c8" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="182" stroke="#f2d7d0" strokeWidth="1" strokeDasharray="2,1" />
            <circle cx="256" cy="256" r="180" stroke="#e8c4bb" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="178" stroke="#eed3cc" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="256" cy="256" r="176" stroke="#e5b8ad" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="174" stroke="#ebc8bf" strokeWidth="1" strokeDasharray="2,1.5" />
            <circle cx="256" cy="256" r="172" stroke="#e2aea1" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="170" stroke="#e8baaE" strokeWidth="1.1" strokeDasharray="2,2" />
            <circle cx="256" cy="256" r="168" stroke="#dfa394" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="166" stroke="#e4ad9f" strokeWidth="1.1" strokeDasharray="2,1.5" />
            <circle cx="256" cy="256" r="164" stroke="#dc9786" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="162" stroke="#df9f8f" strokeWidth="1.1" strokeDasharray="2,2" />
            <circle cx="256" cy="256" r="160" stroke="#d78a77" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="158" stroke="#da917f" strokeWidth="1.1" strokeDasharray="2,1.5" />
            <circle cx="256" cy="256" r="156" stroke="#d27d68" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="154" stroke="#d4836f" strokeWidth="1.1" strokeDasharray="2,2" />
            <circle cx="256" cy="256" r="152" stroke="#cd6f58" strokeWidth="1.2" strokeDasharray="1.5,1.5" />
            <circle cx="256" cy="256" r="150" stroke="#cf745e" strokeWidth="1.1" />
            <circle cx="256" cy="256" r="148" stroke="#c86149" strokeWidth="1.2" />
            <circle cx="256" cy="256" r="146" stroke="#ca664e" strokeWidth="1.1" />
          </g>

          {/* 2. HIGH DENSITY STEPPED CONCENTRIC RINGS (Coral to Red) */}
          <g fill="none">
            <circle cx="256" cy="256" r="144" stroke="#cf573d" strokeWidth="1.6" />
            <circle cx="256" cy="256" r="142" stroke="#8c2b18" strokeWidth="0.8" />
            <circle cx="256" cy="256" r="141" stroke="#d54e32" strokeWidth="1.6" />
            <circle cx="256" cy="256" r="139" stroke="#8a2714" strokeWidth="0.8" />
            <circle cx="256" cy="256" r="138" stroke="#da4527" strokeWidth="1.6" />
            <circle cx="256" cy="256" r="136" stroke="#872210" strokeWidth="0.8" />
            <circle cx="256" cy="256" r="135" stroke="#df3d1c" strokeWidth="1.6" />
            <circle cx="256" cy="256" r="133" stroke="#851e0d" strokeWidth="0.8" />
            <circle cx="256" cy="256" r="132" stroke="#e33512" strokeWidth="1.6" />
            <circle cx="256" cy="256" r="130" stroke="#82190a" strokeWidth="0.8" />

            <circle cx="256" cy="256" r="128" stroke="#e72f0c" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="126" stroke="#7e1507" strokeWidth="0.9" />
            <circle cx="256" cy="256" r="125" stroke="#eb2a06" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="123" stroke="#7a1205" strokeWidth="0.9" />
            <circle cx="256" cy="256" r="122" stroke="#ee2704" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="120" stroke="#751004" strokeWidth="0.9" />
            <circle cx="256" cy="256" r="118" stroke="#f12402" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="116" stroke="#700e03" strokeWidth="0.9" />
            <circle cx="256" cy="256" r="115" stroke="#f32201" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="113" stroke="#6b0c03" strokeWidth="0.9" />
            <circle cx="256" cy="256" r="111" stroke="#f42100" strokeWidth="1.8" />
            <circle cx="256" cy="256" r="109" stroke="#660a02" strokeWidth="0.9" />

            <circle cx="256" cy="256" r="107" stroke="#f21f00" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="104" stroke="#600802" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="103" stroke="#ef1d00" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="100" stroke="#5a0701" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="99" stroke="#eb1b00" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="96" stroke="#550601" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="95" stroke="#e81a00" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="92" stroke="#4f0501" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="91" stroke="#e51800" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="88" stroke="#4a0401" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="86" stroke="#e11700" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="83" stroke="#450301" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="82" stroke="#de1500" strokeWidth="2.0" />
            <circle cx="256" cy="256" r="79" stroke="#400300" strokeWidth="1.0" />

            <circle cx="256" cy="256" r="77" stroke="#da1400" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="74" stroke="#3a0200" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="72" stroke="#d71300" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="69" stroke="#350200" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="67" stroke="#d31200" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="64" stroke="#300100" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="62" stroke="#cf1100" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="59" stroke="#2b0100" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="57" stroke="#cb1000" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="54" stroke="#260100" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="52" stroke="#c80f00" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="49" stroke="#220000" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="47" stroke="#c40e00" strokeWidth="2.2" />
            <circle cx="256" cy="256" r="44" stroke="#1e0000" strokeWidth="1.0" />
            <circle cx="256" cy="256" r="42" stroke="#bf0d00" strokeWidth="2.2" />
          </g>

          {/* 3. SOLID RADIANT RED CENTER NUCLEUS */}
          <circle cx="256" cy="256" r="38" fill="url(#ng-core-red)" />
          <circle cx="256" cy="256" r="38" fill="none" stroke="#e82b08" strokeWidth="1" strokeOpacity="0.8" />
          <circle cx="256" cy="256" r="28" fill="#d91e02" />
          <circle cx="256" cy="256" r="16" fill="#ce1a00" />
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
