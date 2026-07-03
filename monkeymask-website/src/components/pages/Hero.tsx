'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
// import { Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { Icon } from "@iconify/react";
import { TryMe } from './TryMe';
import { SpotlightLayout } from './layouts/SpotlightLayout';
import ExploreSection from './ExploreSection';
import { MonkeyLogo } from '@/components/MonkeyLogo';

export function Hero() {
  return (
    <section className="bg-white">
      <TryMe className="fixed top-24 right-30 hidden md:flex" />
      <div className="mx-auto max-w-[1500px] px-4 py-12 md:py-20 space-y-60">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="md:text-8xl text-5xl font-bold tracking-tight w-full text-center md:text-left">
              A Banano wallet for the modern Web
            </h1>
            {/* <Alert className="mt-6" variant="warning">
              <AlertTitle>Announcement</AlertTitle>
              <AlertDescription className="text-accent-foreground">
                {`If you have v0.1.1 or earlier, please transfer funds to Kalium or TheBananoStand until v0.1.2 is released. We've fixed an issue with mnemonic generation and added some new features.`}
              </AlertDescription>
            </Alert> */}
            <div className="mt-8 flex flex-col md:flex-row gap-6 md:gap-3 items-center">

              <Button variant="default" size="lg" asChild>
                <Link href={`https://chromewebstore.google.com/detail/monkeymask-banano-wallet/chnnondadbnicokkohghndeabhjendci`} target='blank'>
                  <MonkeyLogo className="size-6" />
                  <span>Get MonKeyMask</span>
                </Link>
              </Button>

              
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
          
        <SpotlightLayout />

        <ExploreSection />

        

        {/* Call to Action */}
        <div className="mt-16 text-center bg-[url('/assets/backgrounds/bg-footer.svg')] bg-cover rounded-2xl p-12 text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build the Future of Banano?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {`Join the growing ecosystem of developers building amazing dApps with MonkeyMask's 
            enterprise-grade wallet integration.`}
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


