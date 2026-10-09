import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export const VeilGuardLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '',
  showSubtitle = true 
}) => {
  const iconDimensions = {
    sm: 'w-8 h-9',
    md: 'w-10 h-11',
    lg: 'w-16 h-18'
  };

  const titleSizes = {
    sm: 'text-lg tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-3xl tracking-tight'
  };

  const subtitleSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SVG Shield Icon with Lavender Accents */}
      <div className={`flex-shrink-0 ${iconDimensions[size]} transition-transform group-hover:scale-105`}>
        <svg 
          viewBox="0 0 100 110" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Shield Outline */}
          <path 
            d="M 50 2 L 10 12 L 10 65 Q 10 90 50 108 Q 90 90 90 65 L 90 12 Z" 
            fill="none" 
            stroke="#4c229e" 
            className="stroke-[#4c229e] dark:stroke-[#d6c8fd]"
            strokeWidth="7" 
            strokeLinejoin="round"
          />
          
          {/* Top Lavender Waves */}
          <path d="M 5 35 Q 40 5 95 20" fill="none" stroke="#8655f4" strokeWidth="2.5" />
          <path d="M 2 45 Q 45 15 90 30" fill="none" stroke="#8655f4" strokeWidth="1.5" />
          <path d="M 12 50 Q 50 25 85 35" fill="none" stroke="#8655f4" strokeWidth="1" />
          
          {/* Center Concentric Circles */}
          <circle cx="50" cy="58" r="16" fill="none" stroke="#8655f4" strokeWidth="2.5" />
          <circle cx="50" cy="58" r="21" fill="none" stroke="#8655f4" strokeWidth="1.5" strokeDasharray="2 1" />
          <circle cx="50" cy="58" r="26" fill="none" stroke="#8655f4" strokeWidth="1" />
          <circle cx="50" cy="58" r="10" fill="none" stroke="#8655f4" strokeWidth="1" />

          {/* Center Lock Icon */}
          <rect x="46" y="55" width="8" height="7" rx="1.5" fill="#8655f4" />
          <path d="M 47.5 55 V 52.5 A 2.5 2.5 0 0 1 52.5 52.5 V 55" fill="none" stroke="#8655f4" strokeWidth="1.5" />

          {/* Stylized Grid/Circuit Accents */}
          <path d="M 20 60 H 15 V 70 H 22 V 75" fill="none" stroke="#8655f4" strokeWidth="1" />
          <path d="M 80 50 V 45 H 75" fill="none" stroke="#8655f4" strokeWidth="1" />
          <path d="M 75 75 H 80 V 70" fill="none" stroke="#8655f4" strokeWidth="1" />
          <circle cx="15" cy="60" r="1.5" fill="#8655f4" />
          <circle cx="22" cy="75" r="1.5" fill="#8655f4" />
        </svg>
      </div>

      {/* Typography: VeilGuard / SentinelDICOM */}
      <div className="flex flex-col justify-center leading-none">
        <h1 className={`font-black text-[#2e1065] dark:text-[#f3effe] ${titleSizes[size]} m-0 leading-tight`}>
          VeilGuard
        </h1>
        {showSubtitle && (
          <h2 className={`font-bold text-[#8655f4] dark:text-[#c4b5fd] ${subtitleSizes[size]} mt-0.5 tracking-tight`}>
            SentinelDICOM
          </h2>
        )}
      </div>
    </div>
  );
};

export default VeilGuardLogo;
