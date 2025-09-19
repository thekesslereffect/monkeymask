'use client';

import React from 'react';
import { cn } from '@/components/ui/utils';

export type AlertVariant = 'default' | 'success' | 'warning' | 'destructive';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variants: Record<AlertVariant, string> = {
  default: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  destructive: 'bg-red-50 border-red-200 text-red-900',
};

export function Alert({ className, variant = 'default', ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn('rounded-lg border px-4 py-3 text-sm', variants[variant], className)}
      {...props}
    />
  );
}

export default Alert;


