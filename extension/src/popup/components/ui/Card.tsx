import React from 'react';
import { Label } from './Label';

interface CardProps {
  children: React.ReactNode;
  label?: string;
  hintText?: string;
  hintTooltip?: string;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  hintOnClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  label,
  hintText,
  hintTooltip,
  className = '',
  hover = false,
  onClick,
  hintOnClick
}) => {
  const baseClasses = 'bg-card p-3 rounded-2xl text-foreground';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const isFlexGrow = className.includes('flex-1');
  const minHeightClass = className.match(/\bmin-h-[^\s]+/)?.[0] ?? '';
  const outerClasses = `w-full flex flex-col ${
    isFlexGrow ? `flex-1 ${minHeightClass || 'min-h-0'}` : minHeightClass
  }`;
  const innerClasses = `${baseClasses} ${hoverClasses} ${clickableClasses} ${
    isFlexGrow ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : ''
  } ${className}`;

  return (
    <div className={outerClasses}>
    <div className={innerClasses} onClick={onClick}>
        {/* Label lives inside the card surface (matches the promo layout). */}
        {(label || hintText) && (
          <Label label={label} hintText={hintText} hintTooltip={hintTooltip} hintOnClick={hintOnClick}/>
        )}
        {children}
    </div>
    </div>
  );
};
