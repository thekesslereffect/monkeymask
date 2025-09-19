'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '../ConnectButton';

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-20 border-b border-[var(--border)]/60">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">🐒</div>
            <div className="text-sm font-semibold">MonkeyMask</div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/docs" className="text-sm muted hover:text-black px-3 py-2 rounded-md">Docs</Link>
            <ConnectButton />
          </nav>
        </div>
      </div>
    </header>
  );
}


