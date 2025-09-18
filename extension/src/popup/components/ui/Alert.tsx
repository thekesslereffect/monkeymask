import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const baseClasses = 'p-3 rounded-lg border text-sm';
  
  const variantClasses = {
    default: 'bg-card text-card-foreground border-border',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};
