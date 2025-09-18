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
  const baseClasses = 'bg-card p-2 rounded-xl';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`;
  
  return (
    <div className="w-full flex flex-col">
    {label && (
        <Label hintText={hintText} hintTooltip={hintTooltip} hintOnClick={hintOnClick}>
          {label}
        </Label>
      )}
    <div className={classes} onClick={onClick}>
        {children}
    </div>
    </div>
  );
};
