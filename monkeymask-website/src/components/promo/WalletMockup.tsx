import React from 'react';
import { Icon } from '@iconify/react';
import { MonkeyLogo } from '@/components/MonkeyLogo';
import { PromoQr } from './PromoQr';

/**
 * Pixel-styled static recreation of the MonkeyMask extension popup.
 *
 * Intentionally self-contained: all colors are hardcoded to the extension's
 * dark theme (background 13%, card 16%, primary text 95%, tertiary 46%) so the
 * mockup renders identically inside promo shots regardless of page theme.
 */

const BG = '#212121';
const CARD = '#292929';
const POP = '#303030';
const TEXT = '#f2f2f2';
const SUB = '#8a8a8a';
const FAINT = '#5c5c5c';
const BANANO = '#FBDD11';

export type WalletScreen = 'dashboard' | 'send' | 'nft' | 'approval' | 'receive' | 'multisend';

function Chrome({ children, footer = 'dashboard' }: { children: React.ReactNode; footer?: WalletScreen | 'none' }) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ width: 360, height: 600, background: BG, color: TEXT, borderRadius: 20 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: CARD, borderBottom: `1px solid ${POP}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-black text-white">
            <MonkeyLogo className="size-5" />
          </div>
          <span className="text-sm font-bold">MonKeyMask</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: BG, color: TEXT }}
          >
            <span className="size-2 rounded-full" style={{ background: '#3fcf6b' }} />
            Account 1
          </div>
          <Icon icon="lucide:settings" width={18} style={{ color: FAINT }} />
        </div>
      </div>

      {/* Screen body */}
      <div className="flex-1 overflow-hidden px-4 py-4">{children}</div>

      {/* Footer nav */}
      {footer !== 'none' && (
        <div
          className="flex items-center justify-around px-2 py-3"
          style={{ background: CARD, borderTop: `1px solid ${POP}` }}
        >
          {[
            { icon: 'lucide:wallet', id: 'dashboard' },
            { icon: 'lucide:image', id: 'nft' },
            { icon: 'lucide:compass', id: 'explore' },
            { icon: 'lucide:landmark', id: 'rep' },
          ].map((t) => (
            <Icon
              key={t.id}
              icon={t.icon}
              width={22}
              style={{ color: footer === t.id ? TEXT : FAINT }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <div
      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl"
      style={{ background: CARD, color: SUB }}
    >
      <Icon icon={icon} width={22} />
      <span className="text-[11px] font-semibold">{label}</span>
    </div>
  );
}

function Tx({ dir, amount, addr }: { dir: 'in' | 'out'; amount: string; addr: string }) {
  const isIn = dir === 'in';
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div
          className="flex size-9 items-center justify-center rounded-full"
          style={{ background: POP, color: isIn ? '#3fcf6b' : TEXT }}
        >
          <Icon icon={isIn ? 'lucide:arrow-down-left' : 'lucide:arrow-up-right'} width={18} />
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: TEXT }}>
            {isIn ? 'Received' : 'Sent'}
          </div>
          <div className="text-[11px]" style={{ color: FAINT }}>
            {addr}
          </div>
        </div>
      </div>
      <div className="text-sm font-bold" style={{ color: isIn ? '#3fcf6b' : TEXT }}>
        {isIn ? '+' : '-'}
        {amount}
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex min-h-32 flex-col items-center justify-center gap-1">
        <div className="text-5xl font-bold" style={{ color: TEXT }}>
          19,420.69
        </div>
        <div className="text-lg" style={{ color: SUB }}>
          $184.53
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <ActionButton icon="lucide:qr-code" label="Receive" />
        <ActionButton icon="lucide:send" label="Send" />
        <ActionButton icon="lucide:droplet" label="Faucet" />
        <ActionButton icon="lucide:dollar-sign" label="Buy" />
      </div>

      <div className="flex-1 rounded-2xl p-4" style={{ background: CARD }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: TEXT }}>
            History
          </span>
          <span className="text-xs font-semibold" style={{ color: BANANO }}>
            See More
          </span>
        </div>
        <Tx dir="in" amount="500.00" addr="ban_1faucet…8h3k" />
        <div style={{ borderTop: `1px solid ${POP}` }} />
        <Tx dir="out" amount="42.00" addr="ban_3monkey…z9qm" />
        <div style={{ borderTop: `1px solid ${POP}` }} />
        <Tx dir="in" amount="1,000.00" addr="ban_1kessler…p2ld" />
      </div>
    </div>
  );
}

function Send() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon icon="lucide:arrow-left" width={20} style={{ color: SUB }} />
        <span className="text-base font-bold">Send BANANO</span>
      </div>

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <div className="mb-1 text-[11px] font-semibold" style={{ color: FAINT }}>
          To
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: TEXT }}>
            chef.ban
          </span>
          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: POP, color: BANANO }}>
            BNS
          </span>
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <div className="mb-1 text-[11px] font-semibold" style={{ color: FAINT }}>
          Amount
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold" style={{ color: TEXT }}>
            250
          </span>
          <span className="text-lg font-semibold" style={{ color: SUB }}>
            BAN
          </span>
        </div>
        <div className="mt-1 text-xs" style={{ color: FAINT }}>
          ≈ $2.38
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: CARD }}
        >
          <span className="text-xs font-semibold" style={{ color: SUB }}>
            Network fee
          </span>
          <span className="text-xs font-bold" style={{ color: '#3fcf6b' }}>
            FREE · instant
          </span>
        </div>
        <div
          className="flex items-center justify-center rounded-xl py-3.5 text-base font-bold"
          style={{ background: TEXT, color: BG }}
        >
          Review Send
        </div>
      </div>
    </div>
  );
}

function nftGradient(i: number) {
  const grads = [
    'linear-gradient(135deg,#FBDD11,#f59e0b)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#22d3ee,#3b82f6)',
    'linear-gradient(135deg,#34d399,#10b981)',
    'linear-gradient(135deg,#f472b6,#fb7185)',
    'linear-gradient(135deg,#a3e635,#22c55e)',
  ];
  return grads[i % grads.length];
}

function Nft() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">Collectibles</span>
        <span className="text-xs font-semibold" style={{ color: FAINT }}>
          6 items
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl" style={{ background: CARD }}>
            <div
              className="flex aspect-square items-center justify-center"
              style={{ background: nftGradient(i) }}
            >
              <MonkeyLogo className="size-10" faceFill="rgba(0,0,0,0.85)" />
            </div>
            <div className="px-3 py-2">
              <div className="text-xs font-bold" style={{ color: TEXT }}>
                Monk #{100 + i}
              </div>
              <div className="text-[10px]" style={{ color: FAINT }}>
                Genesis Apes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Approval() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl" style={{ background: CARD }}>
            <Icon icon="lucide:globe" width={26} style={{ color: SUB }} />
          </div>
          <Icon icon="lucide:arrow-right" width={20} style={{ color: FAINT }} />
          <div className="flex size-14 items-center justify-center rounded-full bg-black text-white">
            <MonkeyLogo className="size-8" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: TEXT }}>
            Connect wallet
          </div>
          <div className="mt-1 text-sm" style={{ color: SUB }}>
            monkey.market wants to connect
          </div>
        </div>
        <div className="w-full rounded-2xl p-4 text-left" style={{ background: CARD }}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: FAINT }}>
            This app will be able to
          </div>
          {['View your account address', 'Request approval for transactions'].map((t) => (
            <div key={t} className="flex items-center gap-2 py-1">
              <Icon icon="lucide:check" width={16} style={{ color: '#3fcf6b' }} />
              <span className="text-xs" style={{ color: TEXT }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div
          className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold"
          style={{ background: CARD, color: SUB }}
        >
          Cancel
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-xl py-3 text-sm font-bold"
          style={{ background: TEXT, color: BG }}
        >
          Connect
        </div>
      </div>
    </div>
  );
}

function Receive() {
  return (
    <div className="flex h-full flex-col items-center gap-4">
      <span className="self-start text-base font-bold">Receive</span>
      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        <div className="rounded-3xl p-5" style={{ background: '#fff' }}>
          <PromoQr pixelSize={6} />
        </div>
        <div className="rounded-xl px-4 py-2 text-xs font-semibold" style={{ background: CARD, color: SUB }}>
          ban_3monkeymask…z9qm
        </div>
      </div>
    </div>
  );
}

function MultiSend() {
  const rows = [
    { name: 'chef.ban', amt: '250' },
    { name: 'art.ban', amt: '250' },
    { name: 'ban_3monkey…z9qm', amt: '250' },
    { name: 'ban_1kessler…p2ld', amt: '250' },
  ];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon icon="lucide:arrow-left" width={20} style={{ color: SUB }} />
        <span className="text-base font-bold">Airdrop</span>
      </div>

      <div className="rounded-2xl p-4" style={{ background: CARD }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold" style={{ color: FAINT }}>
            Total
          </span>
          <span className="rounded-md px-2 py-0.5 text-[10px] font-bold" style={{ background: POP, color: BANANO }}>
            1,000 recipients
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-bold" style={{ color: TEXT }}>
            250,000
          </span>
          <span className="text-lg font-semibold" style={{ color: SUB }}>
            BAN
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl p-2" style={{ background: CARD }}>
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="flex items-center justify-between px-2 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-full" style={{ background: POP, color: TEXT }}>
                  <Icon icon="lucide:user" width={15} />
                </div>
                <span className="text-sm font-semibold" style={{ color: TEXT }}>
                  {r.name}
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: TEXT }}>
                {r.amt}
              </span>
            </div>
            {i < rows.length - 1 && <div style={{ borderTop: `1px solid ${POP}` }} />}
          </div>
        ))}
        <div className="px-2 py-2 text-center text-xs font-semibold" style={{ color: FAINT }}>
          + 996 more
        </div>
      </div>

      <div
        className="flex items-center justify-center rounded-xl py-3.5 text-base font-bold"
        style={{ background: TEXT, color: BG }}
      >
        Send airdrop
      </div>
    </div>
  );
}

export function WalletMockup({
  screen = 'dashboard',
  className = '',
}: {
  screen?: WalletScreen;
  className?: string;
}) {
  const footer: WalletScreen | 'none' =
    screen === 'approval' || screen === 'receive' ? 'none' : screen === 'nft' ? 'nft' : 'dashboard';
  return (
    <div className={className}>
      <Chrome footer={footer}>
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'send' && <Send />}
        {screen === 'multisend' && <MultiSend />}
        {screen === 'nft' && <Nft />}
        {screen === 'approval' && <Approval />}
        {screen === 'receive' && <Receive />}
      </Chrome>
    </div>
  );
}

export default WalletMockup;
