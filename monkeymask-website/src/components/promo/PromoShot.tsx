'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { copyImageToClipboard } from './copyImageToClipboard';

type ShotState = 'idle' | 'working' | 'copied' | 'shared' | 'downloaded' | 'error';

const EXPORT_SCALE = 2;

/**
 * A fixed-size promotional "shot" that renders at exact export dimensions and
 * scales down responsively to fit the page. Provides Download PNG + Copy image
 * so the images can be dropped straight into an X or Reddit post.
 */
export function PromoShot({
  width,
  height,
  label,
  filename,
  children,
  className = '',
}: {
  width: number;
  height: number;
  label: string;
  filename: string;
  children: React.ReactNode;
  className?: string;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [state, setState] = useState<ShotState>('idle');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const render = useCallback(async (): Promise<Blob | null> => {
    const node = exportRef.current;
    if (!node) return null;

    const { toBlob } = await import('html-to-image');
    // Capture the off-screen node at full design size — never inside a scaled
    // or overflow-hidden preview tree, so shadows and rotations export correctly.
    return toBlob(node, {
      pixelRatio: 1,
      width,
      height,
      canvasWidth: width * EXPORT_SCALE,
      canvasHeight: height * EXPORT_SCALE,
      cacheBust: true,
      backgroundColor: undefined,
    });
  }, [width, height]);

  const download = useCallback(async () => {
    try {
      setState('working');
      const blob = await render();
      if (!blob) throw new Error('no blob');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
      setState('downloaded');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2000);
  }, [render, filename]);

  const copy = useCallback(() => {
    setState('working');
    const blobPromise = render();

    copyImageToClipboard(blobPromise, filename)
      .then((result) => setState(result))
      .catch(() => setState('error'))
      .finally(() => {
        setTimeout(() => setState('idle'), 2000);
      });
  }, [render, filename]);

  const copyLabel =
    state === 'copied' ? 'Copied' : state === 'shared' ? 'Shared' : 'Copy';

  return (
    <div className={`min-w-0 max-w-full ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
          <span>{label}</span>
          <span className="text-xs text-muted">
            {width}×{height}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Icon
              icon={
                state === 'copied' || state === 'shared'
                  ? 'lucide:check'
                  : 'lucide:clipboard'
              }
              className="size-4"
            />
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Icon
              icon={
                state === 'working'
                  ? 'lucide:loader-2'
                  : state === 'downloaded'
                    ? 'lucide:check'
                    : 'lucide:download'
              }
              className={`size-4 ${state === 'working' ? 'animate-spin' : ''}`}
            />
            {state === 'error' ? 'Failed' : 'PNG'}
          </button>
        </div>
      </div>

      {/* On-screen preview — scaled to fit */}
      <div ref={wrapRef} className="w-full max-w-full overflow-hidden rounded-2xl">
        <div
          className="overflow-hidden"
          style={{ width: width * scale, height: height * scale, maxWidth: '100%' }}
        >
          <div
            style={{
              width,
              height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div style={{ width, height }}>{children}</div>
          </div>
        </div>
      </div>

      {/* Off-screen export target — full size, no transform, overflow visible */}
      <div
        aria-hidden
        className="pointer-events-none fixed overflow-visible"
        style={{ left: -(width + 200), top: 0, width, height, zIndex: -1 }}
      >
        <div ref={exportRef} style={{ width, height, overflow: 'visible' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default PromoShot;
