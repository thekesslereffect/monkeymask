'use client';

import React from 'react';
import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 scroll-mt-20" id={title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold">MonkeyMask Developer Docs</h1>
        <p className="text-lg text-muted-foreground">
          Build Banano dApps with the MonkeyMask browser wallet. Integration is via the{' '}
          <strong>Wallet Standard</strong> on the <code>banano:</code> namespace, with{' '}
          <strong>Sign In With Banano (SIWB)</strong>, structured block intents, and first-class NFT
          minting.
        </p>
        <nav className="flex flex-wrap gap-3 text-sm">
          {[
            'Install',
            'Provider',
            'Hooks',
            'Features',
            'Accounts',
            'Sign In With Banano',
            'Sign Message',
            'Transactions',
            'NFTs',
            'BNS',
            'Events',
            'Error Handling',
            'Legacy Provider',
            'Backend',
          ].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="text-primary underline underline-offset-4"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section title="Install">
        <Code>{`npm install @monkeymask/react @monkeymask/wallet-standard`}</Code>
        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
          <li>
            <code>@monkeymask/react</code> — <code>MonkeyMaskProvider</code>, hooks, wallet discovery.
          </li>
          <li>
            <code>@monkeymask/wallet-standard</code> — chain IDs, feature/operation types, SIWB
            build/verify, NFT codecs, error codes. Safe to import server-side.
          </li>
        </ul>
      </Section>

      <Section title="Provider">
        <p className="text-sm text-muted-foreground">
          Wrap your app once. <code>autoConnect</code> silently reconnects previously-authorized
          origins.
        </p>
        <Code>{`// providers/index.tsx
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
}`}</Code>
      </Section>

      <Section title="Hooks">
        <p className="text-sm text-muted-foreground">
          <code>useMonkeyMask()</code> exposes the full context; the smaller hooks are ergonomic
          slices of it.
        </p>
        <Code>{`import {
  useMonkeyMask,   // full context (state + all actions)
  useWallet,       // { wallet, accounts, connected, connecting, installed }
  useConnect,      // { connect, disconnect, connecting, connected }
  useAccounts,     // { accounts, publicKey }
  useSignIn,       // (input?) => BananoSignInOutput
  useSignMessage,  // (message: Uint8Array, account?) => output
  useSignTransaction,        // (op, account?) => { signedBlock }
  useSignAndSendTransaction, // (op, account?) => { hash, hashes, results? }
  useSend,         // (params, account?) => { hash, hashes, results? } — one or many recipients
  useReceive,      // (params?, account?) => { hash, hashes } — claim receivables
  useReceivable,   // (address?, count?) => BananoReceivable[]
  useAccountHistory, // (address?, count?, head?) => BananoHistoryEntry[]
  useReverseBNS,   // (address?, tld?) => string[] — address → BNS name(s)
  useSweep,        // ({ to, name? }, account?) => { hash } — send entire balance
  useSpendingSession, // { request, get, revoke } — per-origin auto-approve allowance
  useMintNFT,      // (params, account?) => { hash, hashes }
  useMintEdition,  // (params, account?) => { hash, hashes } — extra copy of a collection
  useTransferNFT,  // (params, account?) => { hash, hashes, results? } — one or many NFTs
  // pure ban: payment-URI + QR helpers
  buildBananoUri, parseBananoUri, isBananoUri, banToRaw, rawToBan,
} from '@monkeymask/react';

const {
  connected, connecting, installed, publicKey, accounts, error,
  connect, disconnect,
  signIn, signMessage, signTransaction, signAndSendTransaction,
  resolveBNS, reverseResolveBNS, getAccountInfo, getReceivable, getAccountHistory, clearError,
} = useMonkeyMask();`}</Code>
        <Code>{`function ConnectButton() {
  const { connected, connecting, publicKey, connect, disconnect } = useMonkeyMask();
  if (connected) {
    return <button onClick={() => disconnect()}>{publicKey?.slice(0, 12)}… (disconnect)</button>;
  }
  return (
    <button disabled={connecting} onClick={() => connect()}>
      {connecting ? 'Connecting…' : 'Connect MonkeyMask'}
    </button>
  );
}`}</Code>
      </Section>

      <Section title="Features">
        <p className="text-sm text-muted-foreground">
          MonkeyMask registers these Wallet Standard features (plus{' '}
          <code>standard:connect</code>/<code>disconnect</code>/<code>events</code>):
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <code>banano:signMessage</code> — raw message signing (<code>Uint8Array</code> → ed25519
            signature)
          </li>
          <li>
            <code>banano:signIn</code> — Sign In With Banano (SIWB)
          </li>
          <li>
            <code>banano:signTransaction</code> — build + sign a block, returns{' '}
            <code>{`{ signedBlock }`}</code> (does not publish)
          </li>
          <li>
            <code>banano:signAndSendTransaction</code> — build, sign, and publish; returns{' '}
            <code>{`{ hash, hashes, results? }`}</code> (<code>hashes</code> lists every block
            published; the array forms of <code>send</code>/<code>transfer</code> also return{' '}
            <code>results</code>, one entry per recipient with its <code>hash</code> or{' '}
            <code>error</code>)
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Transactions are <strong>structured block intents</strong>, not opaque payloads. Most ops
          take a single target <em>or</em> an array, so one primitive covers a send and an airdrop:
        </p>
        <Code>{`type BananoOperation =
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
  // send the entire spendable balance (claims pending first, no dust left)
  | { type: 'sweep'; to: string; name?: string };`}</Code>
      </Section>

      <Section title="Accounts">
        <p className="text-sm text-muted-foreground">
          Accounts update reactively — read them from the hook. <code>getAccountInfo</code> proxies
          balance/representative/frontier info from the wallet.
        </p>
        <Code>{`const { accounts, publicKey } = useAccounts();
// accounts[i].address -> ban_..., accounts[i].publicKey -> Uint8Array

const { getAccountInfo } = useMonkeyMask();
const info = await getAccountInfo();        // current account
const other = await getAccountInfo('ban_...'); // any account`}</Code>
      </Section>

      <Section title="Sign In With Banano">
        <p className="text-sm text-muted-foreground">
          SIWB proves account ownership without a transaction. The server issues a nonce, the wallet
          signs an ABNF message, and the server verifies it with <code>verifySignIn</code>. Bind the
          message to the request host, and treat the nonce as single-use.
        </p>
        <Code>{`// Client
import { useSignIn } from '@monkeymask/react';
const signIn = useSignIn();

const input = await fetch('/api/auth/nonce').then((r) => r.json());
const output = await signIn(input);
const res = await fetch('/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input, output }),
}).then((r) => r.json());
// res.valid === true, res.address, res.sessionToken (also set as httpOnly cookie)`}</Code>
        <Code>{`// Server (app/api/auth/verify/route.ts)
import { deserializeSignInOutput, verifySignIn } from '@monkeymask/wallet-standard';
const bananojs = require('@bananocoin/bananojs');

const output = deserializeSignInOutput(rawOutput);
const valid = verifySignIn(input, output, bananojs.BananoUtil, { expectedDomain });`}</Code>
      </Section>

      <Section title="Sign Message">
        <Code>{`const signMessage = useSignMessage();
const bytes = new TextEncoder().encode('gm banano');
const { signedMessage, signature } = await signMessage(bytes);`}</Code>
      </Section>

      <Section title="Transactions">
        <p className="text-sm text-muted-foreground">
          <code>amount</code> is a decimal BAN string. Both methods take an optional second argument
          to target a specific account.
        </p>
        <Code>{`const send = useSignAndSendTransaction();

// Send BAN (recipient may be a ban_ address or a .ban BNS name)
const { hash } = await send({ type: 'send', to: 'ban_1...', amount: '1.0' });

// Change representative
await send({ type: 'change', representative: 'ban_1...' });

// Sign only (returns the signed block without publishing)
const signTx = useSignTransaction();
const { signedBlock } = await signTx({ type: 'send', to: 'ban_1...', amount: '0.1' });`}</Code>
      </Section>

      <Section title="NFTs">
        <p className="text-sm text-muted-foreground">
          MonkeyMask mints Banano NFTs using the <strong>73-meta-tokens</strong> metaprotocol: the
          wallet publishes a <code>change#supply</code> block followed by a <code>send#mint</code>{' '}
          block, and the mint block hash becomes the asset representative. Art + metadata are pinned
          to IPFS by your app.
        </p>
        <h3 className="text-lg font-semibold">Mint</h3>
        <Code>{`import { useMintNFT } from '@monkeymask/react';
const mint = useMintNFT();

// 1) Pin art + metadata to IPFS (server route; needs PINATA_JWT).
const form = new FormData();
form.append('image', file);
form.append('name', 'My NFT');
form.append('description', 'Minted with MonkeyMask');
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
});`}</Code>
        <h3 className="text-lg font-semibold">Mint fees / pricing</h3>
        <p className="text-sm text-muted-foreground">
          Building a mint platform? Attach a <code>fees</code> array to the mint. Each entry is a plain
          send published <strong>after</strong> a successful mint, and the wallet verifies the balance
          covers the mint <em>plus every fee</em> before publishing anything — so a failed mint never
          costs the user a fee. Every leg is itemized in the approval UI. Fees are opt-in and set by
          the calling app (honor system): charge your own mint price and, if you like, a MonkeyMask
          protocol fee.
        </p>
        <Code>{`const { hash } = await mint({
  metadataCid,
  to: buyer,
  name: 'My NFT',
  fees: [
    { to: PLATFORM_TREASURY,   amount: '10', label: 'Mint price' },
    { to: MONKEYMASK_TREASURY, amount: '19', label: 'MonkeyMask fee' },
  ],
});`}</Code>
        <h3 className="text-lg font-semibold">Transfer</h3>
        <p className="text-sm text-muted-foreground">
          Send an owned NFT to another account. The wallet pockets any pending balance for the asset,
          then publishes a <code>send#asset</code> block — a normal send whose <code>representative</code>{' '}
          is the asset representative — which the indexer follows to move ownership. Sends to a burn
          account destroy the asset. Pass a <code>transfers</code> array to move several NFTs in one
          approval: the wallet pockets pending once, publishes each <code>send#asset</code> block as a
          locally-chained sequence (frontier tracked in memory, work pre-computed for the next block
          while the current one broadcasts), then restores your representative. <code>hashes</code>{' '}
          lists each block and <code>results</code> reports per-NFT success/failure.
        </p>
        <Code>{`import { useTransferNFT } from '@monkeymask/react';
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
// results: { assetRepresentative, to, amount, hash? | error? }[]`}</Code>
        <h3 className="text-lg font-semibold">Read</h3>
        <p className="text-sm text-muted-foreground">
          Fetch normalized NFTs for an address from <code>/api/nfts</code>. When the Convex index is
          configured it is authoritative (its crawler traces the full mint → transfer → burn chain of
          custody); a reliable self-indexed &quot;minted by you&quot; crawl is merged in so your own
          fresh mints appear instantly, and a community indexer is used as a fallback. IPFS metadata
          is resolved server-side.
        </p>
        <Code>{`const { nfts, error } = await fetch(\`/api/nfts?address=\${address}\`).then((r) => r.json());
// nfts: { id, name, description?, image?, collection?, assetRepresentative?, metadataCid? }[]`}</Code>
      </Section>

      <Section title="Send / airdrop">
        <p className="text-sm text-muted-foreground">
          <code>useSend</code> covers both a single payment and a multi-send / airdrop with one
          method — pass <code>{`{ to, amount }`}</code> or a <code>sends</code> array. The wallet
          verifies the balance covers the total up front, then publishes the airdrop as a single
          locally-chained block sequence: it reads <code>account_info</code> once, tracks the frontier
          and balance in memory, and pre-computes proof-of-work for the next block while the current
          one broadcasts (no per-block round-trip, no frontier race). It runs best-effort — a failed
          recipient is skipped, not fatal — and Banano can&apos;t publish an atomic batch, so{' '}
          <code>results</code> reports each recipient&apos;s <code>hash</code> or <code>error</code>.
          Recipients accept <code>ban_…</code> or <code>.ban</code> names.
        </p>
        <Code>{`import { useSend } from '@monkeymask/react';
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
// results: { to, amount, hash? | error? }[] — one entry per recipient`}</Code>
      </Section>

      <Section title="Receive & history">
        <p className="text-sm text-muted-foreground">
          <code>useReceivable</code> lists an account&apos;s pending (claimable) blocks and{' '}
          <code>useReceive</code> claims them — pass a <code>blockHash</code> to claim one specific
          receivable, or nothing to claim them all. It publishes one receive/open block per claim and
          returns every <code>hash</code>. <code>useAccountHistory</code> reads recent confirmed
          transactions. The read hooks default to the current account; pass an address to query
          another.
        </p>
        <Code>{`import { useReceive, useReceivable, useAccountHistory } from '@monkeymask/react';

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
// history: { hash, type, amount, account, timestamp }[]`}</Code>
      </Section>

      <Section title="BNS">
        <p className="text-sm text-muted-foreground">
          Resolve Banano Name System (<code>.ban</code>) names to addresses. Recipients in{' '}
          <code>send</code>/<code>mint</code> operations also accept BNS names directly.
        </p>
        <Code>{`const { resolveBNS } = useMonkeyMask();
const address = await resolveBNS('mycoolname.ban'); // -> ban_1...`}</Code>
        <p className="text-sm text-muted-foreground">
          Reverse resolution goes the other way — address → name(s). It&apos;s best-effort (an
          address can have several names, or none) and crawls the ledger, so it&apos;s slower than a
          forward lookup. Pass no address to look up the connected account.
        </p>
        <Code>{`const reverse = useReverseBNS();
const names = await reverse();                 // your account -> ['mycoolname.ban']
const other = await reverse('ban_1...', 'ban'); // optional TLD filter`}</Code>
      </Section>

      <Section title="NFT editions">
        <p className="text-sm text-muted-foreground">
          Mint a collection with <code>maxSupply &gt; 1</code> (0 = unlimited) to allow multiple
          copies. Later, mint additional editions of a collection you issued with{' '}
          <code>useMintEdition</code> — the wallet reuses the collection&apos;s metadata and rejects
          the mint if the edition limit is already reached. Each edition gets its own asset
          representative.
        </p>
        <Code>{`const mint = useMintNFT();
const mintEdition = useMintEdition();

// Create a 10-copy edition collection (first copy minted now)
const { hash } = await mint({ metadataCid, to, maxSupply: 10 });

// Mint another copy later
await mintEdition({ metadataCid, to: recipient });`}</Code>
      </Section>

      <Section title="Sweep (send max)">
        <p className="text-sm text-muted-foreground">
          <code>useSweep</code> empties an account into one recipient. It claims any pending blocks
          first, then sends the full confirmed balance in raw so no dust is left behind. Returns{' '}
          <code>{`{ hash }`}</code>.
        </p>
        <Code>{`const sweep = useSweep();
await sweep({ to: 'coldwallet.ban' }); // claims pending, then sends everything`}</Code>
      </Section>

      <Section title="Payment URIs & QR codes">
        <p className="text-sm text-muted-foreground">
          Pure helpers build and parse <code>ban:</code> URIs (the Banano flavour of the Nano/BIP21
          scheme). They speak BAN decimals at the edges and convert to/from raw internally — no
          bananojs needed — so you can generate scannable payment codes anywhere.
        </p>
        <Code>{`import { buildBananoUri, parseBananoUri } from '@monkeymask/react';

const uri = buildBananoUri({ address: 'cosmic.ban', amount: '1.5', label: 'Coffee' });
// -> "ban:ban_1...?amount=150000000000000000000000000000&label=Coffee"

const req = parseBananoUri(uri); // { address, amount: '1.5', label: 'Coffee' }

// Pay it (single send):
const send = useSend();
await send({ to: req.address, amount: req.amount ?? '0', name: req.label });`}</Code>
        <p className="text-sm text-muted-foreground">
          Render the URI as a QR with any QR library (e.g. <code>qrcode</code>). Pasting a{' '}
          <code>ban:</code> URI into the extension&apos;s Send screen auto-fills the recipient and
          amount.
        </p>
      </Section>

      <Section title="Spending sessions">
        <p className="text-sm text-muted-foreground">
          A dApp can request a per-origin allowance so small <code>send</code>s are auto-approved
          (no popup) until the limit or expiry is reached. The user approves the allowance once; each
          auto-approved send is debited from the remaining balance. Only single-recipient{' '}
          <code>send</code>s within the limit qualify — anything larger, or any other operation,
          still prompts.
        </p>
        <Code>{`const session = useSpendingSession();

// Ask the user for a 5 BAN / 30-minute allowance
await session.request({ limit: '5', durationMs: 30 * 60_000 });

// Check / revoke it
const active = await session.get();  // { address, limit, spent, remaining, expiresAt } | null
await session.revoke();

// While active, tiny sends go through without a prompt:
const send = useSend();
await send({ to: 'game.ban', amount: '0.01' }); // auto-approved`}</Code>
      </Section>

      <Section title="Events">
        <p className="text-sm text-muted-foreground">
          Prefer the reactive hooks — <code>accounts</code>/<code>publicKey</code>/
          <code>connected</code> update automatically when the user switches or disconnects accounts
          (via the Wallet Standard <code>standard:events</code> <code>change</code> event). Lifecycle
          callbacks are available on the provider config:
        </p>
        <Code>{`<MonkeyMaskProvider config={{
  onConnect: (publicKey) => {},
  onDisconnect: () => {},
  onError: (message) => {},
}} />

// Or react to account changes directly:
const { publicKey } = useAccounts();
useEffect(() => { /* refetch data for the active account */ }, [publicKey]);`}</Code>
      </Section>

      <Section title="Error Handling">
        <p className="text-sm text-muted-foreground">
          Actions throw on failure; rejected requests surface a code from{' '}
          <code>PROVIDER_ERRORS</code> (EIP-1193 style). Always handle user rejection gracefully.
        </p>
        <Code>{`import { PROVIDER_ERRORS } from '@monkeymask/wallet-standard';

try {
  await signAndSendTransaction({ type: 'send', to, amount: '1.0' });
} catch (e) {
  if ((e as { code?: number }).code === PROVIDER_ERRORS.USER_REJECTED.code) {
    // user clicked "Reject"
  }
}`}</Code>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4 font-semibold">Code</th>
                <th className="py-2 font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ['4001', 'User rejected the request'],
                ['4100', 'Unauthorized — not connected'],
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

      <Section title="Legacy Provider">
        <p className="text-sm text-muted-foreground">
          For simple integrations MonkeyMask also injects <code>window.banano</code>. Prefer the
          Wallet Standard packages for new apps.
        </p>
        <Code>{`if (window.banano?.isMonkeyMask) {
  const { publicKey } = await window.banano.request({ method: 'connect' });
  window.banano.on('accountChanged', (pk) => {});
}`}</Code>
      </Section>

      <Section title="Backend">
        <p className="text-sm text-muted-foreground">
          The dApp template ships an optional <strong>Convex</strong> backend (
          <code>monkeymask-website/convex/</code>) that makes SIWB nonces/sessions durable and powers
          the NFT index with a 24/7 crawler cron. It&apos;s fully optional — without it the app uses
          an in-memory SIWB store and a self-crawl NFT source. Enable it with{' '}
          <code>npx convex dev</code> and set <code>NEXT_PUBLIC_CONVEX_URL</code> /{' '}
          <code>NEXT_PUBLIC_CONVEX_SITE_URL</code>. See the repository README for details.
        </p>
      </Section>

      <Section title="Chain ID">
        <p>
          <code>banano:mainnet</code>
        </p>
      </Section>

      <p className="pt-4">
        <Link href="/" className="text-primary underline">
          ← Back to demo
        </Link>
      </p>
    </main>
  );
}
