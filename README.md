# MonkeyMask 🐒

Banano browser wallet implementing the **Wallet Standard** on the `banano:` chain namespace, with **Sign In With Banano (SIWB)** and a reusable adapter package.

## Monorepo Structure

```
monkeymask/
├── packages/
│   ├── core/              # @monkeymask/core — keys, signing, blocks, NFT ops (Node + browser)
│   ├── wallet-standard/   # @monkeymask/wallet-standard — types, SIWB, protocol
│   └── react/             # @monkeymask/react — provider + hooks
├── extension/             # Chrome MV3 wallet
└── monkeymask-website/    # Next.js demo + docs
```

## Quick Start

```bash
npm install
npm run build:packages
npm run build:extension   # requires full install (not Vercel's workspace-only ci)
npm run dev:extension   # build/watch extension
npm run dev:website     # demo site on :3000
```

```bash
$env:MONKEYMASK_CONVEX_URL="https://your-prod-site.convex.site"
npm run build -w monkeymask
```

## Architecture

- **Extension** registers a Wallet Standard wallet + `window.banano` legacy provider
- **Features**: `standard:connect`, `banano:signMessage`, `banano:signIn`, `banano:signTransaction`, `banano:signAndSendTransaction`
- **SIWB**: server issues nonce → wallet signs ABNF message → `/api/auth/verify` validates via `verifySignIn`. Nonce/session storage is **durable via Convex** when configured, else an in-memory fallback
- **Transactions**: structured Banano block intents (`send`, `change`, `receive`, `mint`, `mintEdition`, `transfer`, `burn`, `finishSupply`, `sendAllNfts`, `sweep`), not opaque Solana-style payloads. `send` and `transfer` each take a single target or an array, so one primitive covers a payment and an airdrop; `signAndSendTransaction` returns `{ hash, hashes, results? }` (`results` itemizes each recipient of an array send/transfer)
- **NFTs (read)**: reads come from the **Convex crawler index** when configured (a 24/7 job that crawls issuers, decodes `change#supply` → `#mint` pairs, traces the full mint → transfer → burn chain of custody, and caches IPFS metadata). Both the website and extension merge in a **self-indexed "minted by you"** source (crawls only the account's own history — no third party, and excludes assets you've transferred away) for instant local mints. Without Convex, the gallery falls back to the community indexer for NFTs received from others
- **NFTs (mint)**: the website pins art + metadata to IPFS (`POST /api/ipfs`) and the wallet publishes a `change#supply` + `send#mint` pair; the mint block hash is the asset representative. Requires `PINATA_JWT` set on the website server for pinning. Mints accept an optional `fees` array (platform mint price + protocol fee) sent only after a successful mint, with an up-front balance check for mint + all fees
- **NFTs (editions)**: mint a collection with `maxSupply > 1` (0 = unlimited) to allow multiple copies. `useMintEdition` (or the "Mint copy" button in the NFT detail view) publishes a fresh `change#supply` → `send#mint` pair reusing the collection's `metadata_representative` — each edition is a self-delimiting pair with its own asset representative. Counting whole pairs (never bare sends) matches the banano-nft-crawler and guarantees ordinary payments can never be miscounted as phantom editions. The wallet verifies you issued the collection and rejects the mint once the edition limit is reached
- **NFTs (transfer)**: the wallet transfers an owned NFT with a `send#asset` block — a send whose `representative` is the asset representative — via `useTransferNFT` (website) or the popup NFT view (extension); the crawler follows it to move ownership. Passing a `transfers` array moves several NFTs in one approval (pending pocketed once, then chained `send#asset` blocks, representative restored)
- **NFTs (burn)**: `useBurnNFT` (or the red "Burn" button in the NFT detail view) permanently destroys an owned NFT by sending it to a canonical burn account (the 73-meta-tokens `send#burn` convention). The wallet shows a distinct destructive (red) confirmation; the crawler marks the asset burned so it leaves every gallery. Irreversible
- **NFTs (finish / send-all)**: `useFinishSupply` (or the NFT detail "Finish" button) publishes a `#finish_supply` block that locks a collection you issued so no further editions can be minted; `useSendAllNfts` (or the gallery "Send all" button) moves every NFT the account holds to one recipient in a single `send#all_nfts` block. Metadata CIDs may be IPFS **v0 (`Qm…`) or v1 (`b…`)** sha2-256 CIDs. The codec also decodes `#cancel_supply` and `send#atomic_swap` representatives so the crawler never mis-indexes cancelled supplies or in-flight swaps (atomic-swap execution is not yet wired — see roadmap)
- **Send / airdrop**: `useSend` handles one recipient or many (multi-send / airdrop) in a single approval. Multi-sends run through a **block-lattice-aware executor**: one `account_info` read, in-memory frontier/balance tracking, and proof-of-work pre-computed for the next block while the current one broadcasts (no per-block round-trip, no frontier race). Best-effort — a failed recipient is skipped, not fatal — with an up-front total-balance check and per-recipient `results`
- **Receive & history**: `useReceivable` lists an account's pending blocks and `useReceive` claims them (`{ blockHash }` for one, or nothing for all — one receive/open block per claim). `useAccountHistory` reads recent confirmed transactions. Queries default to the current account or accept an address (`banano:getReceivable` / `banano:getAccountHistory`)
- **Sweep (send max)**: `useSweep` / the popup Send screen's "Max (sweep)" button empties an account into one recipient — claims pending first, then sends the full confirmed balance in raw so no dust remains
- **Payment URIs & QR**: pure `buildBananoUri` / `parseBananoUri` / `isBananoUri` / `banToRaw` / `rawToBan` helpers (re-exported from `@monkeymask/react`) build and parse `ban:` URIs (Nano/BIP21 flavour) for scannable payment codes. Pasting a `ban:` URI into the extension's Send screen auto-fills recipient + amount
- **Spending sessions**: a dApp can request a per-origin allowance (`useSpendingSession` → `request`/`get`/`revoke`, backed by `banano:requestSpendingSession` etc.) so small single-recipient `send`s auto-approve without a popup until the limit or expiry is reached; each auto-approved send is debited from the remaining balance, and anything larger or any other op still prompts. Auto-confirmation is an **advanced, opt-in feature that is off by default** — the user must enable it (Settings → Advanced) before any allowance can be granted, so `request(...)` rejects until they opt in. The user can always view and revoke any allowance from the wallet's **Connected Sites** screen (disconnecting a site clears its allowance, and turning the feature off revokes all allowances at once), so revocation never depends on the dApp exposing a button
- **BNS**: `resolveBNS` turns a `.ban` name into an address (recipients in `send`/`mint` accept names directly). `useReverseBNS` / `banano:reverseResolveBNS` does the reverse (address → name) following the canonical banani-bns approach — scan the address for 4224-raw resolver blocks, decode each candidate domain, then forward-resolve to confirm. Best-effort and ledger-crawling, so slower; defaults to the connected account
- **Backend (Convex)**: `monkeymask-website/convex/` — durable SIWB store, NFT index (`assets`/`ownership`/`metadataCache`), and a cron that re-crawls registered accounts. Fully optional; the app runs without it
- **Server wallet**: `@monkeymask/core` exposes the same signing/publish engine as the extension for Node — a server with `BANANO_SEED` set can send, claim pending, sign messages/SIWB, and run every NFT operation itself (the Solana pattern of a `Keypair` from an env secret). The website's helper is `src/lib/server-wallet.ts`; details in [packages/core/README.md](packages/core/README.md)

## Packages

| Package | Purpose |
|---------|---------|
| `@monkeymask/core` | Keys, signing, block publishing, and every NFT/metaprotocol operation as a plain library (Node + browser) — the `@solana/web3.js`-style layer. Powers **server-side (custodial) wallets** via `Wallet.fromSeed(process.env.BANANO_SEED)`. See [packages/core/README.md](packages/core/README.md) |
| `@monkeymask/wallet-standard` | Chain IDs, feature types, SIWB build/verify, protocol envelope |
| `@monkeymask/react` | `MonkeyMaskProvider`, `useSignIn`, `useSignAndSendTransaction`, `useSend`, `useReceive`, `useReceivable`, `useAccountHistory`, `useReverseBNS`, `useSweep`, `useSpendingSession`, `useMintNFT`, `useMintEdition`, `useTransferNFT`, `useBurnNFT`, `useFinishSupply`, `useSendAllNfts`, `buildBananoUri`/`parseBananoUri`, etc. |

**Dependency order:** `wallet-standard` → `core` → `react` (`core` depends on `wallet-standard`; `react` depends on `wallet-standard`).

## Publishing packages

Packages are published to npm under the `@monkeymask` scope. Log in once with `npm login`, then publish from the repo root.

**Build first** (each package ships only `dist/` + `README.md`):

```bash
npm run build:packages
```

**First publish** of a scoped package requires public access:

```bash
npm publish -w @monkeymask/core --access public
```

After the first publish, add `"publishConfig": { "access": "public" }` to that package's `package.json` so later releases can omit the flag.

**Publish order** when releasing updates (bump versions in each `package.json` first — npm rejects a version that already exists):

```bash
npm publish -w @monkeymask/wallet-standard --access public
npm publish -w @monkeymask/core --access public
npm publish -w @monkeymask/react --access public
```

Only publish packages that changed. If `wallet-standard` is unchanged on npm, you can publish `core` alone as long as its dependency version is already on the registry.

**Verify:**

```bash
npm whoami
npm view @monkeymask/core version
npm view @monkeymask/wallet-standard version
npm view @monkeymask/react version
```

Optional git tag after a release: `git tag @monkeymask/core@<version> && git push origin @monkeymask/core@<version>` (use the version from that package's `package.json`).

## Environment

Website (`monkeymask-website`):

| Variable | Purpose |
|----------|---------|
| `PINATA_JWT` | IPFS pinning JWT used by `POST /api/ipfs` to pin NFT art + metadata (v0 CIDs). Without it, minting returns HTTP 501. |
| `BANANO_RPC_URL` / `IPFS_GATEWAY` (optional) | RPC node + IPFS gateway used by the crawler-free NFT scan behind `GET /api/nfts`. |
| `NEXT_PUBLIC_CONVEX_URL` / `NEXT_PUBLIC_CONVEX_SITE_URL` (optional) | Convex deployment + HTTP-actions URLs. Written by `npx convex dev`. Enables durable SIWB and the Explore directory. **Production:** run `cd monkeymask-website && npm run convex:deploy`, then set both vars on Vercel to the **prod** URLs (`*.convex.cloud` / `*.convex.site`). In this monorepo, run `npm install` from the repo root first so the Convex CLI can resolve `convex/server`. |
| `BANANO_SEED` (optional) | Enables the **server wallet** (`src/lib/server-wallet.ts`, backed by `@monkeymask/core`): the server can send, claim pending, sign messages/SIWB, and mint/transfer/burn NFTs with its own account. Hot-wallet secret — dedicated account, working balances only, never `NEXT_PUBLIC_`. See [packages/core/README.md](packages/core/README.md#security). |

NFT ownership is read directly from each account's own ledger chain (a bounded set of batched `account_history` + `blocks_info` RPC calls), so NFTs minted on **any** site show up for the minter and every recipient with no crawler, index, or backend required. A developer can build a full mint/display/transfer/burn dApp alongside MonkeyMask with zero backend. Convex is optional and only powers durable SIWB + the Explore directory: `cd monkeymask-website && npx convex dev` provisions a deployment, and building the **extension** with `MONKEYMASK_CONVEX_URL=https://your-deployment.convex.site` points its Explore tab at the same catalog.

## Security

- WebCrypto AES-GCM keystore (PBKDF2 600k iterations)
- Per-origin permissions with approval UI
- Banano-native `BananoUtil.signMessage` / `verifyMessage` for SIWB

See [monkeymask-website/src/app/docs/page.tsx](monkeymask-website/src/app/docs/page.tsx) for integration details.
