import React from 'react';
import { Icon } from '@iconify/react';
import { MonkeyLogo } from '@/components/MonkeyLogo';

/**
 * A stylized desktop-browser window used as a backdrop for extension mockups.
 * Light-themed to match the marketing site.
 */
export function BrowserFrame({
  url = 'monkeymask.cc',
  children,
  className = '',
  showExtensionPin = true,
}: {
  url?: string;
  children?: React.ReactNode;
  className?: string;
  showExtensionPin?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] ${className}`}
      style={{ border: '1px solid rgba(0,0,0,0.08)' }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-black/5 bg-[#f4f4f5] px-4 py-3">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm text-muted-foreground shadow-inner">
          <Icon icon="lucide:lock" width={14} />
          <span className="truncate font-medium">{url}</span>
        </div>
        {showExtensionPin && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
            <MonkeyLogo className="size-5" faceFill="#fff" />
          </div>
        )}
      </div>
      {/* Viewport */}
      <div className="relative">{children}</div>
    </div>
  );
}

export default BrowserFrame;
