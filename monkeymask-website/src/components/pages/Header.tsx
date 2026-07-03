'use client';

import React from 'react';
import Link from 'next/link';
import { ConnectButton } from '@/components/ConnectButton';
import { Icon } from "@iconify/react";
import { Button } from '../ui/Button';
import { MonkeyLogo } from '@/components/MonkeyLogo';

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl">
      <div className="w-full py-4">
        <div className="mx-auto px-10 flex items-end justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-black text-white flex items-center justify-center">
              <MonkeyLogo className="size-7" />
            </div>
            <div className="text-2xl font-bold">MonKeyMask</div>
          </Link>
          <nav className="flex items-center gap-8 hidden md:flex">
            <Link href="/docs" className="font-bold text-lg">Docs</Link>
            <Button variant="outline" size="sm" asChild>
              <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                <Icon icon="mdi:github" className="size-5" /> Github
              </Link>
            </Button>
            <ConnectButton />
          </nav>
        </div>
      </div>
    </header>
  );
}


