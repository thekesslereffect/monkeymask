'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Highlight, themes } from 'prism-react-renderer';
import { Icon } from '@iconify/react';
import { Header } from '@/components/pages/Header';
import { Footer } from '@/components/pages/Footer';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Navigation model: keep ids in sync with the <Section> / <Sub> ids. */
/* ------------------------------------------------------------------ */

const NAV: { group: string; items: [string, string][] }[] = [
  {
    group: 'Getting started',
    items: [
      ['install', 'Install'],
      ['quickstart', 'Quickstart'],
      ['provider', 'Provider setup'],
      ['agent', 'Agent cheat sheet'],
    ],
  },
  {
    group: 'Core API',
    items: [
      ['hooks', 'Hooks'],
      ['operations', 'Operations'],
      ['accounts', 'Accounts'],
      ['transactions', 'Send & change'],
      ['airdrop', 'Send & airdrop'],
      ['receive', 'Receive & history'],
      ['sweep', 'Sweep (send max)'],
      ['uris', 'Payment URIs & QR'],
      ['sessions', 'Spending sessions'],
      ['bns', 'BNS names'],
    ],
  },
  {
    group: 'Authentication',
    items: [
      ['siwb', 'Sign In With Banano'],
      ['sign-message', 'Sign message'],
    ],
  },
  {
    group: 'NFTs',
    items: [
      ['nft-mint', 'Mint'],
      ['nft-fees', 'Mint fees & pricing'],
      ['nft-editions', 'Editions'],
      ['nft-transfer', 'Transfer'],
      ['nft-burn', 'Burn'],
      ['nft-finish', 'Finish (lock)'],
      ['nft-sendall', 'Send all'],
      ['nft-read', 'Read / query'],
    ],
  },
  {
    group: 'Reference',
    items: [
      ['reference', 'Operation reference'],
      ['errors', 'Error handling'],
      ['events', 'Events'],
      ['legacy', 'Legacy provider'],
      ['backend', 'Backend (Convex)'],
      ['chain', 'Chain ID'],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function CodeBlock({ children, language = 'tsx' }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const code = children.replace(/\n+$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-md border border-border bg-white/80 px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 backdrop-blur transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="size-3.5" />
        {copied ? 'Copied' : 'Copy'}
      </button>
      <Highlight theme={themes.oneLight} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              className,
              'overflow-x-auto rounded-xl border border-border p-4 text-[13px] leading-relaxed',
            )}
            style={{ ...style, background: 'var(--secondary)' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={i} {...lineProps}>
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function GroupHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-28 border-b border-border pb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground"
    >
      {children}
    </h2>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-muted-foreground">{children}</p>;
}

function Sidebar() {
  return (
    <nav className="space-y-6 text-sm">
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        On this page
      </div>
      {NAV.map((group) => (
        <div key={group.group} className="space-y-1.5">
          <div className="font-bold text-foreground">{group.group}</div>
          <ul className="space-y-1 border-l border-border">
            {group.items.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="-ml-px block border-l border-transparent py-0.5 pl-3 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-[1500px] px-6 pt-10 md:px-10">
        <div className="p-8 md:p-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Icon icon="mdi:code-braces" className="size-4" />
            Developer Documentation
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Build Banano dApps with MonkeyMask
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Integration is via the <strong>Wallet Standard</strong> on the <code>banano:</code>{' '}
            namespace, with <strong>Sign In With Banano</strong>, structured block intents,
            first-class NFTs, airdrops, payment URIs, and spending sessions. Everything below is
            copy-paste ready.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="sm" asChild>
              <a href="#quickstart">
                <Icon icon="mdi:rocket-launch" className="size-4" /> Quickstart
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="#agent">
                <Icon icon="mdi:robot" className="size-4" /> Agent cheat sheet
              </a>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                <Icon icon="mdi:github" className="size-5" /> GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Body: sidebar + content */}
      <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-12 md:px-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
            <Sidebar />
          </div>
        </aside>

        <main className="min-w-0 max-w-3xl space-y-16">
          {/* ---------------- Getting started ---------------- */}
          <div className="space-y-10">
            <GroupHeading id="getting-started">Getting started</GroupHeading>

            <Section id="install" title="Install">
              <CodeBlock language="bash">{`npm install @monkeymask/react @monkeymask/wallet-standard`}</CodeBlock>
              <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
                <li>
                  <code>@monkeymask/react</code>: <code>MonkeyMaskProvider</code>, hooks, wallet
                  discovery.
                </li>
                <li>
                  <code>@monkeymask/wallet-standard</code>: chain IDs, feature/operation types, SIWB
                  build/verify, NFT codecs, error codes. Safe to import server-side.
                </li>
              </ul>
            </Section>

            <Section id="quickstart" title="Quickstart">
              <P>
                A complete component: connect the wallet, show the balance, and send BAN. This is the
                golden path. Everything else is a variation on it.
              </P>
              <CodeBlock>{`'use client';
import {
  MonkeyMaskProvider,
  useMonkeyMask,
  useSend,
} from '@monkeymask/react';

// 1) Wrap your app once (see "Provider setup").
export function App() {
  return (
    <MonkeyMaskProvider config={{ autoConnect: true }}>
      <Wallet />
    </MonkeyMaskProvider>
  );
}

// 2) Connect + act.
function Wallet() {
  const { connected, connecting, publicKey, connect, disconnect } = useMonkeyMask();
  const send = useSend();

  if (!connected) {
    return (
      <button disabled={connecting} onClick={() => connect()}>
        {connecting ? 'Connecting…' : 'Connect MonkeyMask'}
      </button>
    );
  }

  return (
    <div>
      <div>{publicKey}</div>
      <button
        onClick={async () => {
          try {
            const { hash } = await send({ to: 'ban_1...', amount: '1.0' });
            console.log('sent', hash);
          } catch (e) {
            console.error(e); // user rejection => code 4001
          }
        }}
      >
        Send 1 BAN
      </button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}`}</CodeBlock>
            </Section>

            <Section id="provider" title="Provider setup">
              <P>
                Wrap your app once. <code>autoConnect</code> silently reconnects previously-authorized
                origins.
              </P>
              <CodeBlock>{`// providers/index.tsx
'use client';
import { MonkeyMaskProvider } from '@monkeymask/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MonkeyMaskProvider
      config={{
        autoConnect: true,
        onConnect: (publicKey) => console.log('connected', publicKey),
        onDisconnect: () => console.log('disconnected'),
        onError: (message) => console.error(message),
      }}
    >
      {children}
    </MonkeyMaskProvider>
  );
}

// app/layout.tsx
import { Providers } from '@/providers';
export default function RootLayout({ children }) {
  return (
    <html lang="en"><body><Providers>{children}</Providers></body></html>
  );
}`}</CodeBlock>
            </Section>

            <Section id="agent" title="Agent cheat sheet">
              <P>
                Everything an AI agent needs to wire a dApp, condensed. Rules of thumb:{' '}
                <strong>every action hook returns a Promise</strong>. Always{' '}
                <code>try/catch</code>; a rejected request throws with{' '}
                <code>code === 4001</code>; <code>amount</code> is always a decimal BAN string;
                recipients accept a <code>ban_…</code> address <em>or</em> a <code>.ban</code> BNS
                name.
              </P>
              <CodeBlock>{`// 1. Install
//    npm install @monkeymask/react @monkeymask/wallet-standard
// 2. Wrap once with <MonkeyMaskProvider config={{ autoConnect: true }}>
// 3. State + actions all come from hooks:

const { connected, connecting, publicKey, accounts, error,
        connect, disconnect } = useMonkeyMask();

// --- Money -------------------------------------------------------------
const send = useSend();      await send({ to, amount });                  // { hash }
                             await send({ sends: [{ to, amount }, ...] }); // airdrop -> { hashes, results }
const sweep = useSweep();    await sweep({ to });                          // send entire balance
const receive = useReceive();      await receive();                       // claim all pending
const receivable = useReceivable(); await receivable();                   // list claimable
const history = useAccountHistory(); await history(undefined, 10);        // recent tx

// --- Auth --------------------------------------------------------------
const signIn = useSignIn();        await signIn(nonceInput);              // SIWB
const signMsg = useSignMessage();  await signMsg(bytes);                  // raw ed25519

// --- NFTs --------------------------------------------------------------
const mint = useMintNFT();         await mint({ metadataCid, to, maxSupply });
const edition = useMintEdition();  await edition({ metadataCid, to });
const transfer = useTransferNFT(); await transfer({ assetRepresentative, to });
const burn = useBurnNFT();         await burn({ assetRepresentative });
const finish = useFinishSupply();  await finish({ metadataCid });         // lock collection
const sendAll = useSendAllNfts();  await sendAll({ to });                 // move every NFT

// --- Names + URIs ------------------------------------------------------
const { resolveBNS } = useMonkeyMask(); await resolveBNS('name.ban');
buildBananoUri({ address, amount, label });   // -> "ban:ban_1...?amount=..."

// Low level: signAndSendTransaction(op) accepts ANY BananoOperation (see Operations).`}</CodeBlock>
            </Section>
          </div>

          {/* ---------------- Core API ---------------- */}
          <div className="space-y-10">
            <GroupHeading id="core-api">Core API</GroupHeading>

            <Section id="hooks" title="Hooks">
              <P>
                <code>useMonkeyMask()</code> exposes the full context; the smaller hooks are ergonomic
                slices of it.
              </P>
              <CodeBlock>{`import {
  useMonkeyMask,   // full context (state + all actions)
  useWallet,       // { wallet, accounts, connected, connecting, installed }
  useConnect,      // { connect, disconnect, connecting, connected }
  useAccounts,     // { accounts, publicKey }
  useSignIn,       // (input?) => BananoSignInOutput
  useSignMessage,  // (message: Uint8Array, account?) => output
  useSignTransaction,        // (op, account?) => { signedBlock }
  useSignAndSendTransaction, // (op, account?) => { hash, hashes, results? }
  useSend,         // (params, account?) => { hash, hashes, results? }: one or many recipients
  useReceive,      // (params?, account?) => { hash, hashes }: claim receivables
  useReceivable,   // (address?, count?) => BananoReceivable[]
  useAccountHistory, // (address?, count?, head?) => BananoHistoryEntry[]
  useReverseBNS,   // (address?, tld?) => string[]: address → BNS name(s)
  useSweep,        // ({ to, name? }, account?) => { hash }: send entire balance
  useSpendingSession, // { request, get, revoke }: per-origin auto-approve allowance
  useMintNFT,      // (params, account?) => { hash, hashes }
  useMintEdition,  // (params, account?) => { hash, hashes }: extra copy of a collection
  useTransferNFT,  // (params, account?) => { hash, hashes, results? }: one or many NFTs
  useBurnNFT,      // (params, account?) => { hash, hashes }: destroy an NFT (send#burn)
  useFinishSupply, // (params, account?) => { hash }: lock a collection (#finish_supply)
  useSendAllNfts,  // (params, account?) => { hash }: move every held NFT (send#all_nfts)
  // pure ban: payment-URI + QR helpers
  buildBananoUri, parseBananoUri, isBananoUri, banToRaw, rawToBan,
} from '@monkeymask/react';

const {
  connected, connecting, installed, publicKey, accounts, error,
  connect, disconnect,
  signIn, signMessage, signTransaction, signAndSendTransaction,
  resolveBNS, reverseResolveBNS, getAccountInfo, getReceivable, getAccountHistory, clearError,
} = useMonkeyMask();`}</CodeBlock>
            </Section>

            <Section id="operations" title="Operations">
              <P>
                Transactions are <strong>structured block intents</strong>, not opaque payloads. Pass
                one to <code>signAndSendTransaction</code> (build + sign + publish) or{' '}
                <code>signTransaction</code> (build + sign only). Most ops take a single target{' '}
                <em>or</em> an array, so one primitive covers a send and an airdrop.
              </P>
              <CodeBlock language="typescript">{`type BananoOperation =
  // single payment...
  | { type: 'send'; to: string; amount: string; name?: string }
  // ...or a multi-send / airdrop
  | { type: 'send'; name?: string;
      sends: { to: string; amount: string; label?: string }[] }
  | { type: 'change'; representative: string }
  // claim all pending, or one specific receivable by hash
  | { type: 'receive'; blockHash?: string; name?: string }
  | { type: 'mint'; metadataCid: string; to: string;
      amount?: string; maxSupply?: number; name?: string;
      fees?: { to: string; amount: string; label?: string }[] }
  // mint an extra copy of a collection you issued (maxSupply > 1)
  | { type: 'mintEdition'; metadataCid: string; to: string;
      amount?: string; name?: string;
      fees?: { to: string; amount: string; label?: string }[] }
  // single NFT transfer...
  | { type: 'transfer'; assetRepresentative: string; to: string;
      amount?: string; name?: string }
  // ...or many at once
  | { type: 'transfer'; name?: string;
      transfers: { assetRepresentative: string; to: string; amount?: string }[] }
  // permanently destroy an NFT (send#burn to a black-hole account)
  | { type: 'burn'; assetRepresentative: string;
      to?: string; amount?: string; name?: string }
  // lock a collection you issued: no more editions can be minted
  | { type: 'finishSupply'; metadataCid: string; name?: string }
  // move every NFT the account holds to one recipient in a single block
  | { type: 'sendAllNfts'; to: string; amount?: string; name?: string }
  // send the entire spendable balance (claims pending first, no dust left)
  | { type: 'sweep'; to: string; name?: string };`}</CodeBlock>
              <P>
                <code>signAndSendTransaction</code> returns <code>{`{ hash, hashes, results? }`}</code>:{' '}
                <code>hashes</code> lists every block published; the array forms of{' '}
                <code>send</code>/<code>transfer</code> also return <code>results</code>, one entry
                per recipient with its <code>hash</code> or <code>error</code>.
              </P>
            </Section>

            <Section id="accounts" title="Accounts">
              <P>
                Accounts update reactively. Read them from the hook. <code>getAccountInfo</code>{' '}
                proxies balance/representative/frontier info from the wallet.
              </P>
              <CodeBlock>{`const { accounts, publicKey } = useAccounts();
// accounts[i].address -> ban_..., accounts[i].publicKey -> Uint8Array

const { getAccountInfo } = useMonkeyMask();
const info = await getAccountInfo();        // current account
const other = await getAccountInfo('ban_...'); // any account`}</CodeBlock>
            </Section>

            <Section id="transactions" title="Send & change">
              <P>
                <code>amount</code> is a decimal BAN string. Both methods take an optional second
                argument to target a specific account.
              </P>
              <CodeBlock>{`const send = useSignAndSendTransaction();

// Send BAN (recipient may be a ban_ address or a .ban BNS name)
const { hash } = await send({ type: 'send', to: 'ban_1...', amount: '1.0' });

// Change representative
await send({ type: 'change', representative: 'ban_1...' });

// Sign only (returns the signed block without publishing)
const signTx = useSignTransaction();
const { signedBlock } = await signTx({ type: 'send', to: 'ban_1...', amount: '0.1' });`}</CodeBlock>
            </Section>

            <Section id="airdrop" title="Send & airdrop">
              <P>
                <code>useSend</code> covers both a single payment and a multi-send / airdrop with one
                method. Pass <code>{`{ to, amount }`}</code> or a <code>sends</code> array. The
                wallet verifies the balance covers the total up front, then publishes the airdrop as a
                single locally-chained block sequence: it reads <code>account_info</code> once, tracks
                the frontier and balance in memory, and pre-computes proof-of-work for the next block
                while the current one broadcasts (no per-block round-trip, no frontier race). It runs
                best-effort: a failed recipient is skipped, not fatal, and Banano can&apos;t publish
                an atomic batch, so <code>results</code> reports each recipient&apos;s{' '}
                <code>hash</code> or <code>error</code>. Recipients accept <code>ban_…</code> or{' '}
                <code>.ban</code> names.
              </P>
              <CodeBlock>{`import { useSend } from '@monkeymask/react';
const send = useSend();

// Single payment:
const { hash } = await send({ to: 'ban_1...', amount: '1' });

// Airdrop (many recipients, one approval, best-effort):
const { hashes, results } = await send({
  name: 'Community airdrop',
  sends: [
    { to: 'ban_1...',   amount: '1',  label: 'Winner #1' },
    { to: 'name.ban',   amount: '1',  label: 'Winner #2' },
    { to: 'ban_3...',   amount: '5' },
  ],
});
// results: { to, amount, hash? | error? }[]: one entry per recipient`}</CodeBlock>
            </Section>

            <Section id="receive" title="Receive & history">
              <P>
                <code>useReceivable</code> lists an account&apos;s pending (claimable) blocks and{' '}
                <code>useReceive</code> claims them. Pass a <code>blockHash</code> to claim one
                specific receivable, or nothing to claim them all. It publishes one receive/open block
                per claim and returns every <code>hash</code>. <code>useAccountHistory</code> reads
                recent confirmed transactions. The read hooks default to the current account; pass an
                address to query another.
              </P>
              <P>
                MonkeyMask also <strong>auto-claims</strong> pending funds whenever the wallet
                refreshes. These primitives are for dApps that need to force a claim on demand.
              </P>
              <CodeBlock>{`import { useReceive, useReceivable, useAccountHistory } from '@monkeymask/react';

const receive = useReceive();
const getReceivable = useReceivable();
const getHistory = useAccountHistory();

// What can I claim?
const pending = await getReceivable();
// pending: { hash, amount, amountRaw, source? }[]

// Claim everything...
const { hashes } = await receive();
// ...or just one:
await receive({ blockHash: pending[0].hash });

// Recent activity
const history = await getHistory(undefined, 10);
// history: { hash, type, amount, account, timestamp }[]`}</CodeBlock>
            </Section>

            <Section id="sweep" title="Sweep (send max)">
              <P>
                <code>useSweep</code> empties an account into one recipient. It claims any pending
                blocks first, then sends the full confirmed balance in raw so no dust is left behind.
                Returns <code>{`{ hash }`}</code>.
              </P>
              <CodeBlock>{`const sweep = useSweep();
await sweep({ to: 'coldwallet.ban' }); // claims pending, then sends everything`}</CodeBlock>
            </Section>

            <Section id="uris" title="Payment URIs & QR codes">
              <P>
                Pure helpers build and parse <code>ban:</code> URIs (the Banano flavour of the
                Nano/BIP21 scheme). They speak BAN decimals at the edges and convert to/from raw
                internally (no bananojs needed), so you can generate scannable payment codes
                anywhere.
              </P>
              <CodeBlock>{`import { buildBananoUri, parseBananoUri } from '@monkeymask/react';

const uri = buildBananoUri({ address: 'cosmic.ban', amount: '1.5', label: 'Coffee' });
// -> "ban:ban_1...?amount=150000000000000000000000000000&label=Coffee"

const req = parseBananoUri(uri); // { address, amount: '1.5', label: 'Coffee' }

// Pay it (single send):
const send = useSend();
await send({ to: req.address, amount: req.amount ?? '0', name: req.label });`}</CodeBlock>
              <P>
                Render the URI as a QR with any QR library (e.g. <code>qrcode</code>). Pasting a{' '}
                <code>ban:</code> URI into the extension&apos;s Send screen auto-fills the recipient
                and amount.
              </P>
            </Section>

            <Section id="sessions" title="Spending sessions">
              <P>
                A dApp can request a per-origin allowance so small <code>send</code>s are
                auto-approved (no popup) until the limit or expiry is reached. The user approves the
                allowance once; each auto-approved send is debited from the remaining balance. Only
                single-recipient <code>send</code>s within the limit qualify. Anything larger, or any
                other operation, still prompts.
              </P>
              <P>
                Auto-confirmation is an <strong>advanced, opt-in</strong> feature that is{' '}
                <strong>off by default</strong>. The user must explicitly enable it (Settings →
                Advanced, or via the warning shown when a site first requests one) before any
                allowance can be granted, so <code>session.request(...)</code> will reject unless
                the user turns it on and approves. While the feature is off, every payment always
                prompts.
              </P>
              <P>
                The user stays in control: an allowance can be revoked at any time from the
                wallet&apos;s <strong>Connected Sites</strong> screen (which shows the limit, spent,
                remaining, and expiry per site), disconnecting a site clears its allowance, and
                turning the feature off in Settings revokes <em>all</em> active allowances at once.
                So the wallet, not the dApp, is the ultimate kill switch;{' '}
                <code>session.revoke()</code> is just a convenience for dApps that want to offer it.
              </P>
              <CodeBlock>{`const session = useSpendingSession();

// Ask the user for a 5 BAN / 30-minute allowance
await session.request({ limit: '5', durationMs: 30 * 60_000 });

// Check / revoke it
const active = await session.get();  // { address, limit, spent, remaining, expiresAt } | null
await session.revoke();

// While active, tiny sends go through without a prompt:
const send = useSend();
await send({ to: 'game.ban', amount: '0.01' }); // auto-approved`}</CodeBlock>
            </Section>

            <Section id="bns" title="BNS names">
              <P>
                Resolve Banano Name System (<code>.ban</code>) names to addresses. Recipients in{' '}
                <code>send</code>/<code>mint</code>/<code>transfer</code> operations also accept BNS
                names directly.
              </P>
              <CodeBlock>{`const { resolveBNS } = useMonkeyMask();
const address = await resolveBNS('mycoolname.ban'); // -> ban_1...`}</CodeBlock>
              <P>
                Reverse resolution goes the other way: address → name(s). It&apos;s best-effort (an
                address can have several names, or none) and crawls the ledger, so it&apos;s slower
                than a forward lookup. Pass no address to look up the connected account.
              </P>
              <CodeBlock>{`const reverse = useReverseBNS();
const names = await reverse();                 // your account -> ['mycoolname.ban']
const other = await reverse('ban_1...', 'ban'); // optional TLD filter`}</CodeBlock>
            </Section>
          </div>

          {/* ---------------- Authentication ---------------- */}
          <div className="space-y-10">
            <GroupHeading id="authentication">Authentication</GroupHeading>

            <Section id="siwb" title="Sign In With Banano">
              <P>
                SIWB proves account ownership without a transaction. The server issues a nonce, the
                wallet signs an ABNF message, and the server verifies it with <code>verifySignIn</code>.
                Bind the message to the request host, and treat the nonce as single-use.
              </P>
              <CodeBlock>{`// Client
import { useSignIn } from '@monkeymask/react';
const signIn = useSignIn();

const input = await fetch('/api/auth/nonce').then((r) => r.json());
const output = await signIn(input);
const res = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input, output }),
}).then((r) => r.json());
// res.valid === true, res.address, res.sessionToken (also set as httpOnly cookie)`}</CodeBlock>
              <CodeBlock>{`// Server (app/api/auth/verify/route.ts)
import { deserializeSignInOutput, verifySignIn } from '@monkeymask/wallet-standard';
const bananojs = require('@bananocoin/bananojs');

const output = deserializeSignInOutput(rawOutput);
const valid = verifySignIn(input, output, bananojs.BananoUtil, { expectedDomain });`}</CodeBlock>
            </Section>

            <Section id="sign-message" title="Sign message">
              <P>Raw message signing returns the message plus its ed25519 signature.</P>
              <CodeBlock>{`const signMessage = useSignMessage();
const bytes = new TextEncoder().encode('gm banano');
const { signedMessage, signature } = await signMessage(bytes);`}</CodeBlock>
            </Section>
          </div>

          {/* ---------------- NFTs ---------------- */}
          <div className="space-y-10">
            <GroupHeading id="nfts">NFTs</GroupHeading>

            <P>
              MonkeyMask mints Banano NFTs using the <strong>73-meta-tokens</strong> metaprotocol: the
              wallet publishes a <code>change#supply</code> block followed by a <code>send#mint</code>{' '}
              block, and the mint block hash becomes the asset representative. Art + metadata are
              pinned to IPFS by your app (v0 <code>Qm…</code> or v1 <code>b…</code> sha2-256 CIDs).
            </P>
            <P>
              The pinned metadata follows the standard ERC-721 / ERC-1155 JSON shape (
              <code>name</code>, <code>description</code>, <code>image</code>, optional{' '}
              <code>attributes</code>). The metaprotocol itself only reads the CID, so traits are
              purely for display. The artwork&apos;s MIME type is auto-detected and stored under{' '}
              <code>properties.content_type</code>.
            </P>

            <Section id="nft-mint" title="Mint">
              <CodeBlock>{`import { useMintNFT } from '@monkeymask/react';
const mint = useMintNFT();

// 1) Pin art + metadata to IPFS (server route; needs PINATA_JWT).
const form = new FormData();
form.append('file', file);
form.append('name', 'My NFT');
form.append('description', 'Minted with MonkeyMask');
// Optional ERC-721 traits (shown by wallets/marketplaces):
form.append('attributes', JSON.stringify([
  { trait_type: 'Background', value: 'Volcano' },
]));
const { metadataCid, imageCid } = await fetch('/api/ipfs', {
  method: 'POST', body: form,
}).then((r) => r.json());

// 2) Mint + send. hash = the asset representative;
//    hashes = [mint, ...feeSends].
const { hash } = await mint({
  metadataCid,
  to: publicKey,   // mint to yourself, or any ban_/.ban recipient
  maxSupply: 1,
  name: 'My NFT',
});`}</CodeBlock>
            </Section>

            <Section id="nft-fees" title="Mint fees & pricing">
              <P>
                Building a mint platform? Attach a <code>fees</code> array to the mint. Each entry is a
                plain send published <strong>after</strong> a successful mint, and the wallet verifies
                the balance covers the mint <em>plus every fee</em> before publishing anything, so a
                failed mint never costs the user a fee. Every leg is itemized in the approval UI. Fees
                are opt-in and set by the calling app (honor system): charge your own mint price and,
                if you like, a MonkeyMask protocol fee.
              </P>
              <CodeBlock>{`const { hash } = await mint({
  metadataCid,
  to: buyer,
  name: 'My NFT',
  fees: [
    { to: PLATFORM_TREASURY,   amount: '10', label: 'Mint price' },
    { to: MONKEYMASK_TREASURY, amount: '19', label: 'MonkeyMask fee' },
  ],
});`}</CodeBlock>
            </Section>

            <Section id="nft-editions" title="Editions">
              <P>
                Mint a collection with <code>maxSupply &gt; 1</code> (0 = unlimited) to allow multiple
                copies. Later, mint additional editions of a collection you issued with{' '}
                <code>useMintEdition</code>. The wallet reuses the collection&apos;s metadata and
                rejects the mint if the edition limit is reached or the collection has been finished.
                Each edition is its own self-delimiting <code>change#supply → send#mint</code> pair, so
                an ordinary send can never be miscounted as an edition, and each copy gets its own
                asset representative.
              </P>
              <CodeBlock>{`const mint = useMintNFT();
const mintEdition = useMintEdition();

// Create a 10-copy edition collection (first copy minted now)
const { hash } = await mint({ metadataCid, to, maxSupply: 10 });

// Mint another copy later
await mintEdition({ metadataCid, to: recipient });`}</CodeBlock>
            </Section>

            <Section id="nft-transfer" title="Transfer">
              <P>
                Send an owned NFT to another account. The wallet pockets any pending balance for the
                asset, then publishes a <code>send#asset</code> block: a normal send whose{' '}
                <code>representative</code> is the asset representative, which the indexer follows to
                move ownership. Pass a <code>transfers</code> array to move several NFTs in one
                approval: the wallet pockets pending once, publishes each block as a locally-chained
                sequence (frontier tracked in memory, work pre-computed for the next block while the
                current one broadcasts), then restores your representative. <code>hashes</code> lists
                each block and <code>results</code> reports per-NFT success/failure.
              </P>
              <CodeBlock>{`import { useTransferNFT } from '@monkeymask/react';
const transfer = useTransferNFT();

// One NFT (assetRepresentative is the NFT's id = its mint block hash):
const { hash } = await transfer({
  assetRepresentative: nft.assetRepresentative,
  to: 'ban_1...',   // or a .ban name
  name: nft.name,   // shown in the approval UI
});

// Or many at once (best-effort; results itemizes each NFT):
const { hashes, results } = await transfer({
  transfers: [
    { assetRepresentative: a.assetRepresentative, to: 'ban_1...' },
    { assetRepresentative: b.assetRepresentative, to: 'name.ban' },
  ],
});
// results: { assetRepresentative, to, amount, hash? | error? }[]`}</CodeBlock>
            </Section>

            <Section id="nft-burn" title="Burn">
              <P>
                Permanently destroy an owned NFT. This is a <code>send#asset</code> to a canonical
                burn account (the 73-meta-tokens <code>send#burn</code> convention): a black-hole
                address with no recoverable key, so the asset can never be moved again. The wallet
                surfaces a distinct red, destructive confirmation. <strong>Irreversible.</strong> The
                default target is the canonical burn account; pass <code>to</code> only to pick a
                different recognized burn address.
              </P>
              <CodeBlock>{`import { useBurnNFT } from '@monkeymask/react';
const burn = useBurnNFT();

const { hash } = await burn({
  assetRepresentative: nft.assetRepresentative,
  name: nft.name,   // shown in the approval UI
});`}</CodeBlock>
            </Section>

            <Section id="nft-finish" title="Finish (lock a collection)">
              <P>
                Lock a collection you issued so no further editions can ever be minted (73-meta-tokens{' '}
                <code>#finish_supply</code>). The wallet publishes a change block whose{' '}
                <code>representative</code> encodes the collection&apos;s supply-block height;
                afterwards <code>useMintEdition</code> for this collection is refused. Existing copies
                are unaffected.
              </P>
              <CodeBlock>{`import { useFinishSupply } from '@monkeymask/react';
const finish = useFinishSupply();

const { hash } = await finish({ metadataCid: nft.metadataCid, name: nft.name });`}</CodeBlock>
            </Section>

            <Section id="nft-sendall" title="Send all NFTs">
              <P>
                Move <em>every</em> NFT the account holds to one recipient in a single block
                (73-meta-tokens <code>send#all_nfts</code>). The wallet pockets pending assets first,
                publishes one send whose <code>representative</code> is the &quot;send all NFTs&quot;
                marker, then restores a clean representative so later ordinary sends aren&apos;t
                treated as send-all.
              </P>
              <CodeBlock>{`import { useSendAllNfts } from '@monkeymask/react';
const sendAll = useSendAllNfts();

const { hash } = await sendAll({ to: 'ban_1...' }); // or a .ban name`}</CodeBlock>
            </Section>

            <Section id="nft-read" title="Read / query">
              <P>
                Fetch normalized NFTs for an address from <code>/api/nfts</code>. Ownership is read
                directly from the account&apos;s own ledger chain (a bounded set of batched{' '}
                <code>account_history</code> + <code>blocks_info</code> calls), so NFTs minted on any
                site appear for the minter and every recipient with no crawler, index, or backend
                required. IPFS metadata is resolved server-side.
              </P>
              <CodeBlock>{`const { nfts, error } = await fetch(\`/api/nfts?address=\${address}\`).then((r) => r.json());
// nfts: {
//   id, name, description?, image?, collection?, assetRepresentative?, metadataCid?,
//   supplyType?: 'unique' | 'limited' | 'unlimited',
//   maxSupply?, mintedCount?, heldCount?,
// }[]`}</CodeBlock>
            </Section>
          </div>

          {/* ---------------- Reference ---------------- */}
          <div className="space-y-10">
            <GroupHeading id="reference-group">Reference</GroupHeading>

            <Section id="reference" title="Operation reference">
              <P>
                Every operation, its ergonomic hook, and what it resolves to. All action hooks accept
                an optional trailing <code>account</code> argument and go through the wallet approval
                UI (unless a spending session auto-approves a small send).
              </P>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-semibold">Operation</th>
                      <th className="py-2 pr-4 font-semibold">Hook</th>
                      <th className="py-2 font-semibold">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['send', 'useSend', '{ hash, hashes, results? }'],
                      ['change', 'useSignAndSendTransaction', '{ hash }'],
                      ['receive', 'useReceive', '{ hashes }'],
                      ['mint', 'useMintNFT', '{ hash, hashes }'],
                      ['mintEdition', 'useMintEdition', '{ hash, hashes }'],
                      ['transfer', 'useTransferNFT', '{ hash, hashes, results? }'],
                      ['burn', 'useBurnNFT', '{ hash, hashes }'],
                      ['finishSupply', 'useFinishSupply', '{ hash }'],
                      ['sendAllNfts', 'useSendAllNfts', '{ hash }'],
                      ['sweep', 'useSweep', '{ hash }'],
                    ].map(([op, hook, ret]) => (
                      <tr key={op} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <code>{op}</code>
                        </td>
                        <td className="py-2 pr-4">
                          <code>{hook}</code>
                        </td>
                        <td className="py-2">
                          <code>{ret}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <P>
                Read-only helpers (no approval): <code>useReceivable</code>,{' '}
                <code>useAccountHistory</code>, <code>resolveBNS</code>, <code>useReverseBNS</code>,{' '}
                <code>getAccountInfo</code>.
              </P>
            </Section>

            <Section id="errors" title="Error handling">
              <P>
                Actions throw on failure; rejected requests surface a code from{' '}
                <code>PROVIDER_ERRORS</code> (EIP-1193 style). Always handle user rejection
                gracefully.
              </P>
              <CodeBlock>{`import { PROVIDER_ERRORS } from '@monkeymask/wallet-standard';

try {
  await signAndSendTransaction({ type: 'send', to, amount: '1.0' });
} catch (e) {
  if ((e as { code?: number }).code === PROVIDER_ERRORS.USER_REJECTED.code) {
    // user clicked "Reject"
  }
}`}</CodeBlock>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4 font-semibold">Code</th>
                      <th className="py-2 font-semibold">Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['4001', 'User rejected the request'],
                      ['4100', 'Unauthorized: not connected'],
                      ['4200', 'Unsupported method'],
                      ['4900', 'Provider is disconnected'],
                      ['-32602', 'Invalid method parameters'],
                      ['-32603', 'Internal error'],
                    ].map(([code, meaning]) => (
                      <tr key={code} className="border-b border-border/50">
                        <td className="py-2 pr-4">
                          <code>{code}</code>
                        </td>
                        <td className="py-2">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="events" title="Events">
              <P>
                Prefer the reactive hooks: <code>accounts</code>/<code>publicKey</code>/
                <code>connected</code> update automatically when the user switches or disconnects
                accounts (via the Wallet Standard <code>standard:events</code> <code>change</code>{' '}
                event). Lifecycle callbacks are available on the provider config:
              </P>
              <CodeBlock>{`<MonkeyMaskProvider config={{
  onConnect: (publicKey) => {},
  onDisconnect: () => {},
  onError: (message) => {},
}} />

// Or react to account changes directly:
const { publicKey } = useAccounts();
useEffect(() => { /* refetch data for the active account */ }, [publicKey]);`}</CodeBlock>
            </Section>

            <Section id="legacy" title="Legacy provider">
              <P>
                For simple integrations MonkeyMask also injects <code>window.banano</code>. Prefer the
                Wallet Standard packages for new apps.
              </P>
              <CodeBlock>{`if (window.banano?.isMonkeyMask) {
  const { publicKey } = await window.banano.request({ method: 'connect' });
  window.banano.on('accountChanged', (pk) => {});
}`}</CodeBlock>
            </Section>

            <Section id="backend" title="Backend (Convex)">
              <P>
                The dApp template ships an optional <strong>Convex</strong> backend (
                <code>monkeymask-website/convex/</code>) that makes SIWB nonces/sessions durable and
                serves the Explore directory. It&apos;s fully optional: NFT ownership is always read
                crawler-free from the chain (no backend involved), and without Convex the app just uses
                an in-memory SIWB store. Enable it with{' '}
                <code>npx convex dev</code> and set <code>NEXT_PUBLIC_CONVEX_URL</code> /{' '}
                <code>NEXT_PUBLIC_CONVEX_SITE_URL</code>. See the repository README for details.
              </P>
            </Section>

            <Section id="chain" title="Chain ID">
              <P>
                <code>banano:mainnet</code>
              </P>
            </Section>
          </div>

          <div className="border-t border-border pt-8">
            <Button variant="ghost" asChild>
              <Link href="/">
                <Icon icon="lucide:arrow-left" className="size-4" /> Back to demo
              </Link>
            </Button>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
