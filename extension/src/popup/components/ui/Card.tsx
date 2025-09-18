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
}

export const Card: React.FC<CardProps> = ({
  children,
  label,
  hintText,
  hintTooltip,
  className = '',
  hover = false,
  onClick
}) => {
  const baseClasses = 'card rounded-xl';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`;
  
  return (
    <>
    {label && (
        <Label hintText={hintText} hintTooltip={hintTooltip}>
          {label}
        </Label>
      )}
    <div className={classes} onClick={onClick}>
      <div className="px-2">
        {children}
      </div>
    </div>
    </>
  );
};
