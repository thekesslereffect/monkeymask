'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/components/ui/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none placeholder:muted',
          'focus:ring-2 focus:ring-black/10 focus:border-black',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;


