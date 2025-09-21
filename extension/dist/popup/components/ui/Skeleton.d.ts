import React from 'react';
interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}
export declare const Skeleton: React.FC<SkeletonProps>;
export declare const AccountSkeleton: React.FC<{
    className?: string;
}>;
export declare const TransactionSkeleton: React.FC<{
    className?: string;
}>;
export declare const BalanceSkeleton: React.FC<{
    className?: string;
}>;
export {};
