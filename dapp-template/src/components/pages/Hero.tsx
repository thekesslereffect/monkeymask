'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export function Hero() {
  const [pm, setPm] = useState<'npm' | 'yarn' | 'pnpm'>('npm');
  const [copied, setCopied] = useState(false);
  const commands: Record<typeof pm, string> = {
    npm: 'npm install monkeymask',
    yarn: 'yarn add monkeymask',
    pnpm: 'pnpm add monkeymask',
  } as const;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands[pm]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <section className="bg-white">
      <div className="container py-12 md:py-20">
        {/* Top section with big headline and primary CTA */}
        <div className="max-w-3xl">
          <h1 className="text-[44px] md:text-[64px] lg:text-[72px] leading-[1.02] font-black tracking-tight text-black">
            A tiny wallet for your next big Banano project
          </h1>
          <div className="mt-6">
            <a href="/docs#install">
              <Button variant="primary" size="lg">Download for Chrome</Button>
            </a>
          </div>
        </div>

        {/* Showcase image frame */}
        <div className="mt-10 md:mt-14 rounded-[1.75rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[var(--border)]">
          <div className="aspect-[16/9] w-full bg-gradient-surface">
            {/* placeholder visual */}
          </div>
        </div>

        {/* Feature icons row */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-2xl">⚡</div>
            <div className="mt-2 font-semibold">Hassle-free time tracking</div>
            <div className="text-sm muted">Simple connect flow</div>
          </div>
          <div>
            <div className="text-2xl">🧑‍💻</div>
            <div className="mt-2 font-semibold">Perfect for freelancers</div>
            <div className="text-sm muted">dApp friendly</div>
          </div>
          <div>
            <div className="text-2xl">📈</div>
            <div className="mt-2 font-semibold">Useful insights</div>
            <div className="text-sm muted">Balances & activity</div>
          </div>
          <div>
            <div className="text-2xl">📤</div>
            <div className="mt-2 font-semibold">Quick export</div>
            <div className="text-sm muted">CSV friendly</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <a href="/docs#install"><Button variant="primary" size="lg">Download for Chrome</Button></a>
        </div>
      </div>
    </section>
  );
}


