'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/components/ui/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none placeholder:muted',
          'focus:ring-2 focus:ring-black/10 focus:border-black',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;


