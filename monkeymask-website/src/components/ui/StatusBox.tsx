import React from 'react';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'error' | 'info';

const VARIANT_CLASSES: Record<StatusVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-700',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

interface StatusBoxProps {
  variant: StatusVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  /** Render children in a monospace, break-all block (hashes/addresses). */
  mono?: boolean;
}

/** Compact colored result box shared across the interactive demos. */
export function StatusBox({ variant, title, children, className = '', mono = false }: StatusBoxProps) {
  return (
    <div className={cn('p-2 rounded border text-xs', VARIANT_CLASSES[variant], className)}>
      {title && <div className="font-medium mb-1">{title}</div>}
      {children && <div className={mono ? 'font-mono break-all' : ''}>{children}</div>}
    </div>
  );
}

export default StatusBox;
