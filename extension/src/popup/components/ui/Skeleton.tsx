import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number; // For text variant with multiple lines
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-tertiary/20';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
      default:
        return 'rounded';
    }
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={index === 0 ? style : {}}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={style}
    />
  );
};

// Specific skeleton components for common use cases
export const AccountSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg p-3 bg-muted/30 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="80%" height={12} />
      </div>
      <div className="text-right">
        <Skeleton variant="text" width="80px" className="mb-1" />
        <Skeleton variant="text" width="50px" height={10} />
      </div>
    </div>
  </div>
);

export const TransactionSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-lg p-3 bg-muted/30 ${className}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width="100px" />
      </div>
      <Skeleton variant="text" width="80px" />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width="120px" height={12} />
      <Skeleton variant="text" width="60px" height={12} />
    </div>
  </div>
);

export const BalanceSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`text-center ${className}`}>
    <Skeleton variant="text" width="150px" height={32} className="mx-auto mb-2" />
    <Skeleton variant="text" width="100px" height={16} className="mx-auto" />
  </div>
);
