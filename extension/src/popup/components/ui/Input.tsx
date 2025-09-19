import React from 'react';
import { Label } from './Label';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hintText?: string;
  hintTooltip?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  label,
  hintText,
  hintTooltip,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {

  const baseClasses = 'w-full rounded-xl transition-colors text-center duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    default: 'bg-background text-foreground border border-border focus:border-transparent placeholder:text-tertiary',
    secondary: 'bg-secondary text-secondary-foreground border border-border focus:border-transparent placeholder:text-tertiary'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };
  
  const errorClasses = error ? 'border-destructive' : '';
  
  const inputClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${errorClasses} ${className}`;
  
  return (
    <div className="w-full">
      {label && (
        <Label hintText={hintText} hintTooltip={hintTooltip}>
          {label}
        </Label>
      )}
      
      <input
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-tertiary">{helperText}</p>
      )}
    </div>
  );
};
