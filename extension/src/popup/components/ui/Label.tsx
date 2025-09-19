import React, { useState, useRef, useEffect } from 'react';

interface LabelProps {
  label?: string;
  hintText?: string;
  hintTooltip?: string;
  className?: string;
  hintOnClick?: () => void;
}

export const Label: React.FC<LabelProps> = ({
  label,
  hintText,
  hintTooltip,
  hintOnClick,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        hintRef.current &&
        !hintRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className={`flex justify-between items-center mb-1 relative px-2 ${className}`}>
      {label ? (
        <div className="text-xl text-tertiary">
          {label}
        </div>
      ) : (
        <div className="w-5" />
      )}
      {hintText && (
        <div className="relative">
          <span
            ref={hintRef}
            className="text-xs text-tertiary cursor-help hover:text-foreground transition-colors duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => {hintOnClick?.()}}
          >
            {hintText}
          </span>
          
          {showTooltip && hintTooltip && (
            <div
              ref={tooltipRef}
              className="absolute right-0 top-6 z-50 w-64 p-3 bg-background border border-border rounded-lg shadow-lg text-sm text-foreground"
              style={{ transform: 'translateX(0)' }}
            >
              <div className="relative">
                {hintTooltip}
                {/* Arrow pointing up */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-background border-l border-t border-border transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
