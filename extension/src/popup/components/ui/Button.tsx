import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    ghost: 'bg-transparent text-text-primary hover:bg-muted focus:ring-muted'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };
  
  // Check if className contains padding overrides
  const hasPaddingOverride = className.includes('p-') || className.includes('px-') || className.includes('py-');
  
  // If custom padding is provided, exclude size padding
  const finalSizeClasses = hasPaddingOverride ? sizeClasses[size].replace(/px-\d+|py-\d+/g, '').trim() : sizeClasses[size];
  
  // Combine classes with proper precedence: base -> variant -> size -> custom className
  const classes = [
    baseClasses,
    variantClasses[variant],
    finalSizeClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
