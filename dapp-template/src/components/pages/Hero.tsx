'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Icon } from "@iconify/react";

export function Hero() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl">
          <h1 className="text-8xl  font-bold tracking-tight">
            A Banano wallet for the modern Web
          </h1>
          <div className="mt-8 flex items-center gap-3">
            <a href="#download" className="inline-flex">
              <Button variant="default" size="lg"><Icon icon="noto:monkey-face" className="size-8" /> <span>Get MonKeyMask</span></Button>
            </a>
            <a href="https://www.producthunt.com/" target="_blank" className="inline-flex">
              <Button variant="outline" size="lg">
                <Icon icon="cuida:unfold-horizontal-outline" className="size-6" /> <span>Developers</span></Button>
            </a>
          </div>
        </div>
      </div>
        <div className="mt-10 md:mt-14 rounded-[1.75rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[var(--border)]">
          <div className="aspect-[16/9] w-full bg-gradient-surface"></div>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center justify-center">
          <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <Icon icon="noto:monkey-face" className="size-8" />
            <div className="mt-2 font-semibold">Detect installed wallets and connected accounts securely</div>
          </div>
          <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <Icon icon="noto:monkey-face" className="size-8" />
            <div className="mt-2 font-semibold">Fetch balances and account info to personalize UX</div>
          </div>
          <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <Icon icon="noto:monkey-face" className="size-8" />
            <div className="mt-2 font-semibold">Open the extension for approvals with clear CTAs</div>
          </div>
          <div className="flex flex-col items-center gap-2 max-w-[300px] mx-auto">
            <Icon icon="noto:monkey-face" className="size-8" />
            <div className="mt-2 font-semibold">Send transactions and sign messages with built-in flows</div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <a href="#download"><Button variant="default" size="lg">
            <Icon icon="cuida:edit-outline" className="size-6" />
            <span>Create an App</span>
          </Button></a>
        </div>
      </div>
    </section>
  );
}


