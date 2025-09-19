'use client';

import React from 'react';
import { cn } from '@/components/ui/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <div
      className={cn('h-px w-full bg-[var(--border)]', className)}
      {...props}
    />
  );
}

export default Separator;


