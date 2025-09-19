import React, { useRef, useState, useEffect } from 'react';

interface CarouselProps {
  children: React.ReactNode[] | React.ReactNode;
  className?: string;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  autoPlay?: boolean;
  intervalMs?: number; // default 2000
  holdIntervalMs?: number; // default 5000
}

export const Carousel: React.FC<CarouselProps> = ({
  children,
  className = '',
  initialIndex = 0,
  onIndexChange,
  autoPlay = false,
  intervalMs = 2000,
  holdIntervalMs = 5000
}) => {
  const slides = Array.isArray(children) ? children : [children];
  const [current, setCurrent] = useState(Math.min(Math.max(initialIndex, 0), slides.length - 1));
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<number>(0);

  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    onIndexChange?.(current);
  }, [current, onIndexChange]);

  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

  const goTo = (index: number) => {
    setCurrent(clamp(index, 0, slides.length - 1));
  };

  // Autoplay
  // Autoplay with optional pause window
  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    if (isDragging) return;

    const now = Date.now();
    const delay = Math.max(1000, pauseUntil > now ? (pauseUntil - now) : intervalMs);
    const id = window.setTimeout(() => {
      setCurrent(prev => (prev + 1) % slides.length);
      // Clear pause window after advance
      setPauseUntil(0);
    }, delay);

    return () => window.clearTimeout(id);
  }, [autoPlay, intervalMs, slides.length, isDragging, current, pauseUntil]);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (startXRef.current == null) return;
    const delta = e.touches[0].clientX - startXRef.current;
    setDragX(delta);
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (startXRef.current == null) return;
    const threshold = 40; // px
    if (dragX > threshold) {
      goTo(current - 1);
    } else if (dragX < -threshold) {
      goTo(current + 1);
    }
    setDragX(0);
    setIsDragging(false);
    startXRef.current = null;
  };

  const translate = `translateX(calc(${(-current * 100)}% + ${dragX}px))`;

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full overflow-hidden rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`flex w-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ transform: translate }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full">
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {slides.map((_, i) => {
          const active = i === current;
          return (
            <button
              key={i}
              onClick={() => {
                goTo(i);
                // Extend/push the autoplay window by holdIntervalMs from now
                setPauseUntil(prev => {
                  const nowTs = Date.now();
                  const target = nowTs + holdIntervalMs;
                  return prev > nowTs ? Math.max(prev, target) : target;
                });
              }}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-3 rounded-full transition-all ${active ? 'w-20 bg-tertiary/60' : 'w-3 bg-tertiary/30 hover:bg-tertiary/50'}`}
            />
          );
        })}
      </div>
    </div>
  );
};


