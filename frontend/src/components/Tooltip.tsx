import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  term: string;
  explanation: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ term, explanation, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1 group">
      {children || <span className="font-medium text-slate-800 dark:text-slate-200">{term}</span>}
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        aria-label={`What is ${term}?`}
        className="text-lavender-500 hover:text-lavender-700 dark:hover:text-lavender-400 focus:outline-none transition-colors"
      >
        <HelpCircle className="w-3.5 h-3.5 inline" />
      </button>

      {isVisible && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 text-xs bg-[#120b24] text-white rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 border border-lavender-800 leading-relaxed font-normal"
        >
          <strong className="block text-lavender-300 font-semibold mb-1">{term}</strong>
          {explanation}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#120b24]" />
        </span>
      )}
    </span>
  );
};
