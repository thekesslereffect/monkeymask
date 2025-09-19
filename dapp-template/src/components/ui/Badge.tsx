'use client';

import React from 'react';
import { cn } from '@/components/ui/utils';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'accent';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-black text-white',
  secondary: 'bg-[var(--elevated)] text-[var(--text)]',
  outline: 'border border-[var(--border)] text-[var(--text)]',
  accent: 'bg-[var(--accent)] text-black',
};

export function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center h-6 px-2 rounded-full text-xs font-medium', variants[variant], className)}
      {...props}
    />
  );
}

export default Badge;


