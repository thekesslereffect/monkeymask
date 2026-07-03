import React from 'react';
import { Icon } from '@iconify/react';
import { MonkeyLogo } from '@/components/MonkeyLogo';
import { WalletMockup } from './WalletMockup';
import { BrowserFrame } from './BrowserFrame';

const BANANO = '#FBDD11';

/* ----------------------------- shared bits ------------------------------ */

function Dots({ color = 'rgba(0,0,0,0.06)' }: { color?: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(${color} 1.5px, transparent 1.5px)`,
        backgroundSize: '28px 28px',
      }}
    />
  );
}

function Pill({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-lg font-bold text-foreground shadow-sm">
      <Icon icon={icon} className="size-5" style={{ color: '#d9a800' }} />
      {children}
    </div>
  );
}

function ChromeBadge() {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-black px-6 py-4 text-white shadow-xl">
      <MonkeyLogo className="size-8" faceFill="#fff" />
      <div className="leading-tight">
        <div className="text-xs font-semibold text-white/60">Add to</div>
        <div className="text-xl font-extrabold">Chrome, it&apos;s free</div>
      </div>
    </div>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-11 items-center justify-center rounded-full"
        style={{ background: light ? '#fff' : '#000', color: light ? '#000' : '#fff' }}
      >
        <MonkeyLogo className="size-7" faceFill={light ? '#000' : '#fff'} />
      </div>
      <span className={`text-2xl font-extrabold ${light ? 'text-white' : 'text-foreground'}`}>
        MonKeyMask
      </span>
    </div>
  );
}

/* ------------------------------- shots ---------------------------------- */

/** 1600×900 - flagship launch banner (X / Reddit link card). */
export function HeroShot() {
  return (
    <div className="relative flex h-[900px] w-[1600px] items-center overflow-hidden bg-white font-figtree">
      <Dots />
      <div
        className="pointer-events-none absolute -right-40 -top-40 size-[700px] rounded-full opacity-40 blur-[120px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10 flex w-full items-center gap-10 px-24">
        <div className="w-[720px] shrink-0">
          <Wordmark />
          <h1 className="mt-8 font-nunito text-7xl font-extrabold leading-[1.02] tracking-tight text-foreground">
            A Banano wallet
            <br />
            for the modern{' '}
            <span className="relative whitespace-nowrap">
              Web
              <span
                className="absolute -bottom-2 left-0 h-3 w-full rounded-full"
                style={{ background: BANANO }}
              />
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-2xl font-medium text-muted-foreground">
            Self-custody, zero-fee, instant payments, plus NFTs, BNS names and one-tap dApp sign-in.
            Right in your browser.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Pill icon="lucide:zap">Instant &amp; feeless</Pill>
            <Pill icon="lucide:shield-check">Self-custody</Pill>
            <Pill icon="lucide:image">NFTs &amp; BNS</Pill>
          </div>
          <div className="mt-10">
            <ChromeBadge />
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-8 top-16 rotate-[-8deg]">
            <div className="rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.45)]">
              <WalletMockup screen="nft" />
            </div>
          </div>
          <div className="absolute right-4 top-0 rotate-[6deg]">
            <div className="rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.5)]">
              <WalletMockup screen="dashboard" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1200×1200 - square feature post (send flow). */
export function SendSquareShot() {
  return (
    <div
      className="relative flex h-[1200px] w-[1200px] flex-col items-center overflow-hidden font-figtree"
      style={{ background: `linear-gradient(160deg, ${BANANO} 0%, #f7c600 55%, #f0b400 100%)` }}
    >
      <Dots color="rgba(0,0,0,0.08)" />
      <div className="relative z-10 mt-24 px-16 text-center">
        <h2 className="font-nunito text-7xl font-extrabold leading-tight tracking-tight text-black">
          Send Banano
          <br />
          in one tap.
        </h2>
        <p className="mt-6 text-3xl font-bold text-black/70">Zero fees. Instant. Yours.</p>
      </div>
      <div className="relative z-10 mt-14 flex items-end justify-center gap-8">
        <div className="mb-10 rotate-[-6deg] rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.4)]">
          <WalletMockup screen="dashboard" />
        </div>
        <div className="rotate-[5deg] rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.45)]">
          <WalletMockup screen="send" />
        </div>
      </div>
      <div className="absolute bottom-12 z-10">
        <Wordmark />
      </div>
    </div>
  );
}

/** 1600×900 - developer / integration story (dark). */
export function DeveloperShot() {
  return (
    <div className="relative flex h-[900px] w-[1600px] items-center overflow-hidden bg-[#111112] font-figtree">
      <Dots color="rgba(255,255,255,0.06)" />
      <div
        className="pointer-events-none absolute -left-40 bottom-[-200px] size-[600px] rounded-full opacity-30 blur-[120px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10 flex w-full items-center gap-16 px-24">
        <div className="w-[760px] shrink-0">
          <Wordmark light />
          <h2 className="mt-8 font-nunito text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
            Wallet Standard +<br />
            React hooks
          </h2>
          <p className="mt-6 max-w-xl text-2xl font-medium text-white/60">
            Drop-in <code className="rounded bg-white/10 px-2 py-0.5 text-white">@monkeymask/react</code>.
            Connect, sign-in, send and mint in a few lines.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1d] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-sm text-white/40">App.tsx</span>
            </div>
            <pre className="overflow-hidden px-6 py-5 font-mono text-lg leading-relaxed">
              <code>
                <span style={{ color: '#c586c0' }}>import</span>
                <span style={{ color: '#d4d4d4' }}> {'{'} useMonkeyMask, useSend {'}'} </span>
                <span style={{ color: '#c586c0' }}>from</span>{' '}
                <span style={{ color: '#ce9178' }}>&apos;@monkeymask/react&apos;</span>
                {'\n\n'}
                <span style={{ color: '#569cd6' }}>const</span>
                <span style={{ color: '#d4d4d4' }}> {'{'} connected, connect {'}'} = </span>
                <span style={{ color: '#dcdcaa' }}>useMonkeyMask</span>
                <span style={{ color: '#d4d4d4' }}>()</span>
                {'\n'}
                <span style={{ color: '#569cd6' }}>const</span>
                <span style={{ color: '#d4d4d4' }}> send = </span>
                <span style={{ color: '#dcdcaa' }}>useSend</span>
                <span style={{ color: '#d4d4d4' }}>()</span>
                {'\n\n'}
                <span style={{ color: '#569cd6' }}>await</span>
                <span style={{ color: '#dcdcaa' }}> send</span>
                <span style={{ color: '#d4d4d4' }}>({'{'} to: </span>
                <span style={{ color: '#ce9178' }}>&apos;chef.ban&apos;</span>
                <span style={{ color: '#d4d4d4' }}>, amount: </span>
                <span style={{ color: '#ce9178' }}>&apos;250&apos;</span>
                <span style={{ color: '#d4d4d4' }}> {'}'})</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 rotate-[4deg] rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.6)]">
            <WalletMockup screen="approval" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1200×1200 - square NFT post. */
export function NftSquareShot() {
  return (
    <div className="relative flex h-[1200px] w-[1200px] flex-col items-center overflow-hidden bg-[#0f0f10] font-figtree">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(139,92,246,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(236,72,153,0.35), transparent 45%)',
        }}
      />
      <div className="relative z-10 mt-24 px-16 text-center">
        <h2 className="font-nunito text-7xl font-extrabold leading-tight tracking-tight text-white">
          Mint, hold &amp; trade
          <br />
          Banano NFTs
        </h2>
        <p className="mt-6 text-3xl font-bold text-white/60">On-chain. In your wallet.</p>
      </div>
      <div className="relative z-10 mt-16 rotate-[-3deg] rounded-[26px] shadow-[0_60px_100px_-25px_rgba(0,0,0,0.7)]">
        <WalletMockup screen="nft" />
      </div>
      <div className="absolute bottom-12 z-10">
        <Wordmark light />
      </div>
    </div>
  );
}

/** 1600×900 - the "click the extension" in-browser moment. */
export function InBrowserShot() {
  return (
    <div className="relative flex h-[900px] w-[1600px] items-center justify-center overflow-hidden bg-[#f6f6f7] font-figtree">
      <Dots />
      <div className="relative z-10 w-[1360px]">
        <BrowserFrame url="monkey.market" className="w-full">
          <div className="relative h-[560px] bg-white p-16">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-foreground">
                <span className="size-2 rounded-full" style={{ background: BANANO }} /> Powered by
                MonkeyMask
              </span>
              <h3 className="mt-6 font-nunito text-6xl font-extrabold leading-tight tracking-tight text-foreground">
                Sign in with
                <br />
                Banano.
              </h3>
              <p className="mt-5 text-2xl font-medium text-muted-foreground">
                No password. No seed phrase pasting. One click and you&apos;re in.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-4 text-xl font-bold text-primary-foreground">
                <MonkeyLogo className="size-6" faceFill="#fff" /> Connect MonkeyMask
              </div>
            </div>

            {/* extension popup dropping from the toolbar */}
            <div className="absolute -right-2 -top-2 rotate-[2deg] scale-90 rounded-[26px] shadow-[0_50px_90px_-25px_rgba(0,0,0,0.5)]">
              <WalletMockup screen="approval" />
            </div>
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}

/** 1600×900 - bento feature grid (no mockup, pure breadth). */
export function BentoShot() {
  const feats = [
    { icon: 'lucide:zap', title: 'Instant & feeless', desc: 'Sub-second confirmations. Never pay gas.' },
    { icon: 'lucide:shield-check', title: 'Self-custody', desc: 'Keys encrypted locally. Your coins, always.' },
    { icon: 'lucide:image', title: 'NFTs built-in', desc: 'Mint, hold, transfer & burn on-chain.' },
    { icon: 'lucide:at-sign', title: '.ban names', desc: 'Send to chef.ban, no long addresses.' },
    { icon: 'lucide:fingerprint', title: 'Sign in with Banano', desc: 'Passwordless login for any dApp.' },
    { icon: 'lucide:code', title: 'Open & typed', desc: 'Wallet Standard + React hooks.' },
  ];
  return (
    <div className="relative flex h-[900px] w-[1600px] flex-col justify-center overflow-hidden bg-white px-24 font-figtree">
      <Dots />
      <div
        className="pointer-events-none absolute -right-40 -bottom-40 size-[560px] rounded-full opacity-40 blur-[120px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10 flex items-end justify-between">
        <div>
          <Wordmark />
          <h2 className="mt-6 font-nunito text-6xl font-extrabold tracking-tight text-foreground">
            One wallet. Everything Banano.
          </h2>
        </div>
        <ChromeBadge />
      </div>
      <div className="relative z-10 mt-12 grid grid-cols-3 gap-6">
        {feats.map((f) => (
          <div
            key={f.title}
            className="rounded-3xl border border-black/10 bg-white p-8 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.25)]"
          >
            <div
              className="flex size-14 items-center justify-center rounded-2xl"
              style={{ background: BANANO }}
            >
              <Icon icon={f.icon} className="size-7 text-black" />
            </div>
            <div className="mt-5 text-2xl font-extrabold text-foreground">{f.title}</div>
            <div className="mt-2 text-lg font-medium text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 1500×500 - X / Twitter profile banner (safe zone kept clear bottom-left). */
export function XBannerShot() {
  return (
    <div className="relative flex h-[500px] w-[1500px] items-center overflow-hidden bg-[#111112] font-figtree">
      <Dots color="rgba(255,255,255,0.06)" />
      <div
        className="pointer-events-none absolute -right-24 top-1/2 size-[520px] -translate-y-1/2 rounded-full opacity-30 blur-[110px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10 flex w-full items-center justify-between px-20">
        <div className="max-w-2xl pb-4">
          <Wordmark light />
          <h2 className="mt-5 font-nunito text-5xl font-extrabold leading-tight tracking-tight text-white">
            A Banano wallet for the modern Web
          </h2>
          <p className="mt-3 text-xl font-semibold text-white/50">
            Instant · feeless · self-custody · NFTs · SIWB
          </p>
        </div>
        <div className="relative mr-6 shrink-0">
          <div className="rotate-[6deg] scale-[0.72] rounded-[26px] shadow-[0_40px_80px_-25px_rgba(0,0,0,0.7)]">
            <WalletMockup screen="dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1080×1920 - vertical story (IG / X story). */
export function StoryShot() {
  return (
    <div
      className="relative flex h-[1920px] w-[1080px] flex-col items-center overflow-hidden font-figtree"
      style={{ background: `linear-gradient(180deg, #ffffff 0%, #fff9dd 55%, ${BANANO} 100%)` }}
    >
      <Dots color="rgba(0,0,0,0.06)" />
      <div className="relative z-10 mt-28 flex flex-col items-center px-16 text-center">
        <Wordmark />
        <h1 className="mt-12 font-nunito text-8xl font-extrabold leading-[0.98] tracking-tight text-foreground">
          Banano,
          <br />
          finally on
          <br />
          the Web.
        </h1>
        <p className="mt-8 text-3xl font-semibold text-foreground/60">
          Zero fees. Instant. 100% yours.
        </p>
      </div>
      <div className="relative z-10 mt-20 rotate-[-3deg] rounded-[26px] shadow-[0_70px_120px_-30px_rgba(0,0,0,0.4)]">
        <WalletMockup screen="dashboard" />
      </div>
      <div className="absolute bottom-24 z-10">
        <ChromeBadge />
      </div>
    </div>
  );
}

/** 1200×1200 - big-number stats card. */
export function StatsShot() {
  const stats = [
    { big: '0', label: 'fees, forever' },
    { big: '<1s', label: 'confirmations' },
    { big: '100%', label: 'self-custody' },
  ];
  return (
    <div className="relative flex h-[1200px] w-[1200px] flex-col justify-center overflow-hidden bg-[#111112] px-20 font-figtree">
      <Dots color="rgba(255,255,255,0.06)" />
      <div
        className="pointer-events-none absolute left-1/2 top-[-200px] size-[560px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10">
        <Wordmark light />
        <h2 className="mt-8 font-nunito text-6xl font-extrabold leading-tight tracking-tight text-white">
          Money that just
          <br />
          gets out of the way.
        </h2>
        <div className="mt-16 space-y-10">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-6 border-b border-white/10 pb-8">
              <span
                className="font-nunito text-8xl font-extrabold leading-none"
                style={{ color: BANANO }}
              >
                {s.big}
              </span>
              <span className="text-3xl font-bold text-white/70">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 1600×900 - open-source / install terminal. */
export function OpenSourceShot() {
  return (
    <div className="relative flex h-[900px] w-[1600px] items-center overflow-hidden bg-white font-figtree">
      <Dots />
      <div className="relative z-10 flex w-full items-center gap-16 px-24">
        <div className="w-[720px] shrink-0">
          <Wordmark />
          <h2 className="mt-8 font-nunito text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground">
            Two npm packages.
            <br />
            Whole app.
          </h2>
          <p className="mt-6 max-w-xl text-2xl font-medium text-muted-foreground">
            Install @monkeymask/react and @monkeymask/wallet-standard. Wrap once, wire hooks,
            connect, send, mint. No repo clone required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Pill icon="lucide:package">npm published</Pill>
            <Pill icon="lucide:code">React hooks</Pill>
            <Pill icon="lucide:zap">No backend required</Pill>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#1b1b1d] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="size-3 rounded-full bg-[#ff5f57]" />
              <span className="size-3 rounded-full bg-[#febc2e]" />
              <span className="size-3 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-sm text-white/40">bash</span>
            </div>
            <pre className="px-6 py-6 font-mono text-lg leading-relaxed">
              <code>
                <span style={{ color: '#7ee787' }}>$</span>
                <span style={{ color: '#d4d4d4' }}> npm install @monkeymask/react \</span>
                {'\n'}
                <span style={{ color: '#d4d4d4' }}>{'      '}@monkeymask/wallet-standard</span>
                {'\n'}
                <span style={{ color: '#8b949e' }}>  added 2 packages</span>
                {'\n\n'}
                <span style={{ color: '#7ee787' }}>#</span>
                <span style={{ color: '#dcdcaa' }}> wrap once, wire hooks, ship it </span>
                <span style={{ color: '#f0b400' }}>🍌</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 1200×1200 - airdrop / multi-send square. */
export function AirdropSquareShot() {
  return (
    <div
      className="relative flex h-[1200px] w-[1200px] flex-col items-center overflow-hidden font-figtree"
      style={{ background: 'linear-gradient(160deg, #10b981 0%, #059669 60%, #047857 100%)' }}
    >
      <Dots color="rgba(255,255,255,0.1)" />
      <div className="relative z-10 mt-24 px-16 text-center">
        <h2 className="font-nunito text-7xl font-extrabold leading-tight tracking-tight text-white">
          Airdrop to 1,000
          <br />
          wallets in one tap.
        </h2>
        <p className="mt-6 text-3xl font-bold text-white/70">One approval. One block-lattice sweep.</p>
      </div>
      <div className="relative z-10 mt-14 rotate-[3deg] rounded-[26px] shadow-[0_60px_100px_-25px_rgba(0,0,0,0.5)]">
        <WalletMockup screen="multisend" />
      </div>
      <div className="absolute bottom-12 z-10">
        <Wordmark light />
      </div>
    </div>
  );
}

/** 1600×900 - feature line-up (three screens). */
export function FeatureTrioShot() {
  return (
    <div className="relative flex h-[900px] w-[1600px] flex-col items-center overflow-hidden bg-white font-figtree">
      <Dots />
      <div
        className="pointer-events-none absolute left-1/2 top-[-260px] size-[640px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: BANANO }}
      />
      <div className="relative z-10 mt-20 text-center">
        <h2 className="font-nunito text-6xl font-extrabold tracking-tight text-foreground">
          Everything a Banano
          <br />
          power-user needs
        </h2>
      </div>
      <div className="relative z-10 mt-14 flex items-center justify-center gap-8">
        <div className="rotate-[-6deg] rounded-[26px] shadow-[0_45px_80px_-25px_rgba(0,0,0,0.4)]">
          <WalletMockup screen="receive" />
        </div>
        <div className="z-10 -mx-4 rounded-[26px] shadow-[0_55px_95px_-25px_rgba(0,0,0,0.5)]">
          <WalletMockup screen="dashboard" />
        </div>
        <div className="rotate-[6deg] rounded-[26px] shadow-[0_45px_80px_-25px_rgba(0,0,0,0.4)]">
          <WalletMockup screen="send" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ logo lockups ---------------------------- */
/* Transparent backgrounds where usable; dark variants ship their own bg.  */

/** App icon: black circle + white silhouette. Transparent tile. */
export function BrandIcon() {
  return (
    <div className="flex h-[640px] w-[640px] items-center justify-center font-figtree">
      <div
        className="flex items-center justify-center rounded-full bg-black text-white"
        style={{ width: 440, height: 440 }}
      >
        <MonkeyLogo className="size-[280px]" />
      </div>
    </div>
  );
}

/** Monkey mark only, black (for light backgrounds). Transparent tile. */
export function BrandMarkLight() {
  return (
    <div className="flex h-[640px] w-[640px] items-center justify-center text-black font-figtree">
      <MonkeyLogo className="size-[360px]" faceFill="#000" />
    </div>
  );
}

/** Monkey mark only, white on black. */
export function BrandMarkDark() {
  return (
    <div className="flex h-[640px] w-[640px] items-center justify-center bg-black text-white font-figtree">
      <MonkeyLogo className="size-[360px]" faceFill="#f9fafb" />
    </div>
  );
}

/** Horizontal wordmark for light backgrounds. Transparent tile. */
export function BrandWordmarkLight() {
  return (
    <div className="flex h-[440px] w-[1200px] items-center justify-center gap-8 text-black font-figtree">
      <div
        className="flex items-center justify-center rounded-full bg-black text-white"
        style={{ width: 184, height: 184 }}
      >
        <MonkeyLogo className="size-[118px]" />
      </div>
      <span className="text-[104px] font-extrabold tracking-tight">MonKeyMask</span>
    </div>
  );
}

/** Horizontal wordmark for dark backgrounds. */
export function BrandWordmarkDark() {
  return (
    <div className="flex h-[440px] w-[1200px] items-center justify-center gap-8 bg-black text-white font-figtree">
      <div
        className="flex items-center justify-center rounded-full bg-white text-black"
        style={{ width: 184, height: 184 }}
      >
        <MonkeyLogo className="size-[118px]" faceFill="#000" />
      </div>
      <span className="text-[104px] font-extrabold tracking-tight">MonKeyMask</span>
    </div>
  );
}
