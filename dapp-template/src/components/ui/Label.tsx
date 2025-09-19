'use client';

import React from 'react';
import { cn } from '@/components/ui/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn('text-sm font-medium text-[var(--heading)]', className)}
      {...props}
    />
  );
}

export default Label;


