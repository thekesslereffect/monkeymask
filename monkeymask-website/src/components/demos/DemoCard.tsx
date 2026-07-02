'use client';

import React from 'react';
import { Icon } from '@iconify/react';

/**
 * Shared card chrome used by every demo across the different home-page layout
 * experiments. Kept intentionally simple so layouts can control spacing/spans
 * from the outside while the header + body styling stays consistent.
 */
export const DemoCard = ({
  title,
  icon,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <div
    className={`bg-white rounded-md p-2 h-full transition-all duration-200 ${className}`}
  >
  <div className="border border-[var(--border)] rounded-md p-4 h-full">
    <div className="flex items-center gap-3 mb-4">
      <Icon icon={icon} className="size-6 text-foreground" />
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <div className={bodyClassName}>{children}</div>
    </div>
  </div>
);

export default DemoCard;
