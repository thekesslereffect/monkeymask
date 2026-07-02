import React from 'react';
import { Icon } from '@iconify/react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  className?: string;
}

/** Centered icon + title + optional description used for empty/error screens. */
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, className = '' }) => (
  <div className={`flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3 ${className}`}>
    <Icon icon={icon} className="text-5xl text-tertiary/50" />
    <div className="text-lg text-tertiary">{title}</div>
    {description && <div className="text-sm text-tertiary/70 max-w-xs">{description}</div>}
  </div>
);
