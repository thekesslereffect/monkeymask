'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Header } from '@/components/pages/Header';
import { Footer } from '@/components/pages/Footer';
import { PromoShot } from '@/components/promo/PromoShot';
import {
  HeroShot,
  SendSquareShot,
  DeveloperShot,
  NftSquareShot,
  InBrowserShot,
  FeatureTrioShot,
  BentoShot,
  XBannerShot,
  StoryShot,
  StatsShot,
  OpenSourceShot,
  AirdropSquareShot,
  BrandIcon,
  BrandMarkLight,
  BrandMarkDark,
  BrandWordmarkLight,
  BrandWordmarkDark,
  SpendingSessionSquareShot,
  SpendingSessionWideShot,
  NftGatingShot,
  NftGatingSquareShot,
  BnsSquareShot,
} from '@/components/promo/PromoShots';

const SHOTS: Array<{
  id: string;
  label: string;
  filename: string;
  width: number;
  height: number;
  aspect: string;
  render: () => React.ReactNode;
}> = [
  {
    id: 'hero',
    label: 'Launch banner',
    filename: 'monkeymask-hero',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post / link card',
    render: () => <HeroShot />,
  },
  {
    id: 'send',
    label: 'Send — square',
    filename: 'monkeymask-send',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <SendSquareShot />,
  },
  {
    id: 'in-browser',
    label: 'Sign in with Banano',
    filename: 'monkeymask-signin',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <InBrowserShot />,
  },
  {
    id: 'developer',
    label: 'Developer story',
    filename: 'monkeymask-dev',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <DeveloperShot />,
  },
  {
    id: 'nft',
    label: 'NFTs — square',
    filename: 'monkeymask-nft',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <NftSquareShot />,
  },
  {
    id: 'features',
    label: 'Feature line-up',
    filename: 'monkeymask-features',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <FeatureTrioShot />,
  },
  {
    id: 'bento',
    label: 'Feature grid',
    filename: 'monkeymask-bento',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <BentoShot />,
  },
  {
    id: 'open-source',
    label: 'Two npm packages',
    filename: 'monkeymask-opensource',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <OpenSourceShot />,
  },
  {
    id: 'spending-session',
    label: 'Spending Sessions · wide',
    filename: 'monkeymask-spending-session',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <SpendingSessionWideShot />,
  },
  {
    id: 'spending-session-square',
    label: 'Spending Sessions · square',
    filename: 'monkeymask-spending-session-square',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <SpendingSessionSquareShot />,
  },
  {
    id: 'nft-gating',
    label: 'NFT gating · wide',
    filename: 'monkeymask-nft-gating',
    width: 1600,
    height: 900,
    aspect: '16:9 · X post',
    render: () => <NftGatingShot />,
  },
  {
    id: 'nft-gating-square',
    label: 'NFT gating · square',
    filename: 'monkeymask-nft-gating-square',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <NftGatingSquareShot />,
  },
  {
    id: 'bns',
    label: 'BNS send · square',
    filename: 'monkeymask-bns',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <BnsSquareShot />,
  },
  {
    id: 'airdrop',
    label: 'Airdrop — square',
    filename: 'monkeymask-airdrop',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <AirdropSquareShot />,
  },
  {
    id: 'stats',
    label: 'Stats card',
    filename: 'monkeymask-stats',
    width: 1200,
    height: 1200,
    aspect: '1:1 · Reddit / IG',
    render: () => <StatsShot />,
  },
  {
    id: 'x-banner',
    label: 'X / Twitter banner',
    filename: 'monkeymask-x-banner',
    width: 1500,
    height: 500,
    aspect: '3:1 · profile header',
    render: () => <XBannerShot />,
  },
  {
    id: 'story',
    label: 'Vertical story',
    filename: 'monkeymask-story',
    width: 1080,
    height: 1920,
    aspect: '9:16 · story / Shorts',
    render: () => <StoryShot />,
  },
];

const LOGOS: Array<{
  id: string;
  label: string;
  filename: string;
  width: number;
  height: number;
  render: () => React.ReactNode;
}> = [
  {
    id: 'icon',
    label: 'App icon',
    filename: 'monkeymask-icon',
    width: 640,
    height: 640,
    render: () => <BrandIcon />,
  },
  {
    id: 'mark-light',
    label: 'Mark · on light',
    filename: 'monkeymask-mark',
    width: 640,
    height: 640,
    render: () => <BrandMarkLight />,
  },
  {
    id: 'mark-dark',
    label: 'Mark · on dark',
    filename: 'monkeymask-mark-dark',
    width: 640,
    height: 640,
    render: () => <BrandMarkDark />,
  },
  {
    id: 'wordmark-light',
    label: 'Wordmark · on light',
    filename: 'monkeymask-wordmark',
    width: 1200,
    height: 440,
    render: () => <BrandWordmarkLight />,
  },
  {
    id: 'wordmark-dark',
    label: 'Wordmark · on dark',
    filename: 'monkeymask-wordmark-dark',
    width: 1200,
    height: 440,
    render: () => <BrandWordmarkDark />,
  },
];

export default function PromoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-14">
        {/* Intro */}
        <div className="max-w-3xl">
          <h1 className="mt-6 font-nunito text-5xl font-extrabold tracking-tight md:text-6xl">
            Press kit
          </h1>
          <p className="mt-5 text-xl text-muted-foreground">
            Ready-to-post images for X, Reddit and beyond. Hit <span className="font-bold text-foreground">Copy</span> to drop one
            straight into a post, or <span className="font-bold text-foreground">PNG</span> to
            download at 2× resolution.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Icon icon="lucide:clipboard" className="size-4" /> Copy = clipboard image
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon icon="lucide:download" className="size-4" /> PNG = 2× file
            </span>
            <span className="inline-flex items-center gap-2">
              <Icon icon="lucide:crop" className="size-4" /> Exact export size shown per shot
            </span>
          </div>
        </div>

        {/* Logo & brand */}
        <div className="mt-16">
          <h2 className="font-nunito text-3xl font-extrabold tracking-tight text-foreground">
            Logo &amp; brand
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            The mark, icon and wordmark. Transparent PNGs where usable; dark variants ship their own
            background.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {LOGOS.map((logo) => (
              <PromoShot
                key={logo.id}
                width={logo.width}
                height={logo.height}
                label={logo.label}
                filename={logo.filename}
                className="rounded-2xl border border-border bg-[repeating-conic-gradient(#f4f4f5_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px] p-4"
              >
                {logo.render()}
              </PromoShot>
            ))}
          </div>
        </div>

        {/* Shots */}
        <div className="mt-20 space-y-16">
          {SHOTS.map((shot) => (
            <section key={shot.id}>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                {shot.aspect}
              </div>
              <PromoShot
                width={shot.width}
                height={shot.height}
                label={shot.label}
                filename={shot.filename}
              >
                {shot.render()}
              </PromoShot>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
