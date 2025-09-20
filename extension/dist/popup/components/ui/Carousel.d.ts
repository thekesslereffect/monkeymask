import React from 'react';
interface CarouselProps {
    children: React.ReactNode[] | React.ReactNode;
    className?: string;
    initialIndex?: number;
    onIndexChange?: (index: number) => void;
    autoPlay?: boolean;
    intervalMs?: number;
    holdIntervalMs?: number;
}
export declare const Carousel: React.FC<CarouselProps>;
export {};
