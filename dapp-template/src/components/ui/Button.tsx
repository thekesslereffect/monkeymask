'use client';

import React, { forwardRef } from 'react';

import { cn } from '@/components/ui/utils';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassNames: Record<ButtonVariant, string> = {
  default:
    'border border-[var(--border)] bg-gray-100 hover:bg-[var(--elevated)] text-[var(--text)]',
  primary:
    'bg-black text-white border border-black shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:opacity-90',
  outline:
    'border border-[var(--border)] bg-transparent hover:bg-[var(--elevated)] text-[var(--text)]',
  ghost:
    'border border-transparent bg-transparent hover:bg-[var(--elevated)] text-[var(--text)]',
  link: 'border-0 bg-transparent text-black underline-offset-4 hover:underline p-0 h-auto',
  destructive:
    'bg-red-600 text-white border border-red-600 hover:bg-red-700',
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-11 px-3 text-sm rounded-xl',
  lg: 'h-13 px-4 text-base rounded-xl',
  icon: 'h-10 w-10 p-0 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
          variantClassNames[variant],
          sizeClassNames[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;


