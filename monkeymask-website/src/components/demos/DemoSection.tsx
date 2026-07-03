import React from 'react';

/** Section chrome aligned with the extension wallet Card + Label pattern. */
export function DemoSection({
  label,
  children,
  className = '',
  bodyClassName = '',
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
}) {
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`px-1 font-semibold text-muted-foreground ${compact ? 'mb-0.5 text-xs' : 'mb-1 text-sm'}`}
      >
        {label}
      </div>
      <div
        className={`flex flex-col rounded-xl border border-border bg-secondary/40 ${compact ? 'p-2' : 'p-3'} ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

export default DemoSection;
