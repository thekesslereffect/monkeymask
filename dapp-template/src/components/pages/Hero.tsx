'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Icon } from "@iconify/react";
import { TryMe } from './TryMe';
import FunctionalitySection from './FunctionalitySection';
import ExploreSection from './ExploreSection';

export function Hero() {
  return (
    <section className="bg-white">
      <TryMe className="fixed top-24 right-30" />
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
              <Button variant="outline" size="md">
                <Icon icon="cuida:unfold-horizontal-outline" className="size-6" /> <span>Developers</span></Button>
            </a>
          </div>
        </div>
      </div>
        <div className="mt-10 md:mt-14 rounded-xl overflow-hidden shadow-2xl shadow-secondary/80 border border-border p-2">
          <div className="aspect-[16/9] w-full bg-white">
          {/* bento grid layout */}
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="bg-gradient-to-b from-secondary to-transparent flex flex-col h-full rounded-lg border border-border p-2 row-span-2">
              <div className="flex flex-col h-full bg-white rounded-md ">
              <div className="flex flex-col justify-end h-full gap-2 font-semibold max-w-md p-6">
                <div className="text-4xl font-bold">
                  Connect Seamlessly
                </div>
                <div className="text-md text-muted">
                  One click to log in with your Banano wallet. The easiest way to access dApps and games
                </div>
              </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border p-8 col-span-1">
              <div className="flex flex-col justify-end h-full gap-2 font-semibold max-w-md">
                <div className="text-4xl font-bold">
                  Safe & Secure
                </div>
                <div className="text-md text-muted">
                  Your keys never leave the extension. Review and approve every transaction before it goes live                
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-border p-8 col-span-1">
              <div className="flex flex-col justify-end h-full gap-2 font-semibold max-w-md">
                <div className="text-4xl font-bold">
                  Powered by the Community
                </div>
                <div className="text-md text-muted">
                  Open-source, transparent, and built by Banano believers for Banano users            
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <ExploreSection />

        <FunctionalitySection />
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


