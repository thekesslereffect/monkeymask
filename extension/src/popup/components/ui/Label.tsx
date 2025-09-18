import React, { useState, useRef, useEffect } from 'react';

interface LabelProps {
  children: React.ReactNode;
  hintText?: string;
  hintTooltip?: string;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  hintText,
  hintTooltip,
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
      <div className="text-xl text-tertiary">
        {children}
      </div>
      {hintText && hintTooltip && (
        <div className="relative">
          <span
            ref={hintRef}
            className="text-xs text-tertiary cursor-help hover:text-foreground transition-colors duration-200"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
          >
            {hintText}
          </span>
          
          {showTooltip && (
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
