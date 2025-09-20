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
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:py-20 space-y-60">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-8xl  font-bold tracking-tight">
              A Banano wallet for the modern Web
            </h1>
            <div className="mt-8 flex items-center gap-3">
              <a href="#download" className="inline-flex">
                <Button variant="default" size="lg">
                <svg xmlns="http://www.w3.org/2000/svg" className='size-6' width="128" height="128" viewBox="0 0 128 128"><path fill="#f9fafb" d="M120.74 54.67c-2.23-1.23-5.19-1.94-7.73-1.68c-2.76-10.67-8.59-20.73-16.54-27.63C87.9 17.91 75.83 14.11 64 14.14c-11.82-.03-23.9 3.77-32.47 11.22c-7.96 6.9-13.79 16.96-16.54 27.63c-2.53-.26-5.49.45-7.73 1.68C.99 58.13-.45 66.45 1.03 73.42c1.18 5.55 4.39 9.72 11.01 11.38c1.28.32 2.44.35 3.45.26c1.85 5.83 4.94 11.18 9.83 15.6c5.81 5.26 13.05 8.82 20.5 10.76c2.84.74 10.16 2.45 17.83 2.45c7.68 0 15.71-1.71 18.54-2.45c7.46-1.94 14.69-5.5 20.5-10.76c4.89-4.43 7.98-9.77 9.83-15.6c1.01.09 2.17.06 3.44-.26c6.62-1.66 9.84-5.83 11.02-11.38c1.47-6.97.04-15.28-6.24-18.75"/><path fill="" d="M6.51 69.82c-.71-7.44 4.04-9.24 7.17-9.62c-.15 1.18-.32 2.36-.38 3.54c-.28 4.96-.14 9.94.63 14.73c-4.25.57-6.89-3.08-7.42-8.65M85.76 100c-6.46 3.3-14.38 4.56-21.76 4.41c-7.38.15-15.3-1.11-21.76-4.41c-6.54-3.34-13.07-9.29-12.59-18.11c.17-3.23 1.74-6.23 2.14-9.44c.42-3.38.38-7.79-.51-11.08c-1.14-4.23-1.69-8.46-.12-12.64c1.67-4.48 4.63-8.32 8.86-9.85c1.5-.54 3.16-.5 4.71-.62c6.7-.54 12.61 6.7 19.29 6.48c6.67.22 12.58-7.02 19.28-6.48c1.55.13 3.21.08 4.71.62c4.22 1.53 7.19 5.37 8.87 9.85c1.55 4.18 1.01 8.42-.12 12.64c-.9 3.29-.94 7.69-.52 11.08c.4 3.22 1.97 6.22 2.14 9.44c.45 8.83-6.08 14.78-12.62 18.11m35.74-30.18c-.54 5.57-3.18 9.23-7.43 8.65c.78-4.78.92-9.76.64-14.73c-.07-1.18-.24-2.36-.38-3.54c3.13.39 7.88 2.18 7.17 9.62"/><path fill="" d="M82.52 80.68c-6.28-2.16-19.73-2.3-28.56-1.27c-21.27 2.48-14.15 11.86-1.36 15.43c3.88 1.08 8.92 1.75 14.59 1.38c9.28-.59 12.57-2.38 15.84-4.56c5.24-3.5 7.12-8.36-.51-10.98"/><path fill="" d="M48.32 68.35c3.4 0 6.16-3.33 6.16-7.42c0-4.11-2.76-7.43-6.16-7.43c-3.39 0-6.15 3.32-6.15 7.43c0 4.1 2.76 7.42 6.15 7.42m31.36 0c3.39 0 6.15-3.33 6.15-7.42c0-4.11-2.76-7.43-6.15-7.43c-3.41 0-6.15 3.32-6.15 7.43c0 4.1 2.75 7.42 6.15 7.42m-18.17 6.4c.85.41 1.95.65 3.2.51c2.03-.22 2.75-.88 3.46-1.69c1.14-1.3 1.56-3.1-.11-4.08c-1.38-.8-4.33-.85-6.25-.46c-4.66.92-3.1 4.4-.3 5.72"/></svg>
                <span>Get MonKeyMask</span>
                </Button>
              </a>
              
              <Button variant="outline" size="md" asChild>
                <Link href="/docs">
                  <Icon icon="mdi:code-braces" className="size-6" /> 
                  <span>Developer Docs</span>
                </Link>
              </Button>

              <Button variant="ghost" size="md" asChild>
                <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                  <Icon icon="mdi:github" className="size-6" /> 
                  <span>GitHub</span>
                </Link>
              </Button>
              
            </div>
          </div>
        </div>

        {/* <div className="mt-10 md:mt-14 rounded-[2rem] overflow-hidden">
            <div className="aspect-[16/9] w-full bg-[url('/assets/backgrounds/bg-footer.svg')] bg-cover scale-120 bg-center">
            
            </div>
          </div> */}
          
        <FunctionalitySection />
          

        <ExploreSection />

        

        {/* Call to Action */}
        <div className="mt-16 text-center bg-[url('/assets/backgrounds/bg-footer.svg')] bg-cover rounded-2xl p-12 text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build the Future of Banano?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join the growing ecosystem of developers building amazing dApps with MonkeyMask's 
            enterprise-grade wallet integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="default" size="lg" asChild className="text-lg px-8 py-4">
              <Link href="/docs">
                <Icon icon="mdi:rocket-launch" className="size-6 mr-2" />
                <span>Start Building</span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4">
              <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                <Icon icon="mdi:github" className="size-6 mr-2" />
                <span>View Source</span>
              </Link>
            </Button>
          </div>
          
          {/* Developer Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">🔒</div>
              <div className="text-sm font-medium mt-1">Enterprise Security</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">⚡</div>
              <div className="text-sm font-medium mt-1">Production Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">🍌</div>
              <div className="text-sm font-medium mt-1">Banano Optimized</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


