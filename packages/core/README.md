# @monkeymask/core

Banano keys, signing, block publishing, and NFT metaprotocol operations. This is the `@solana/web3.js`-style layer of the MonkeyMask stack: everything the extension wallet can do, as a plain library that runs in **Node servers** and **browsers**.

```
dApp UI          @monkeymask/react            (like @solana/wallet-adapter-react)
extension        MonkeyMask (browser wallet)  (like Phantom)
types/verify     @monkeymask/wallet-standard  (like @wallet-standard, verify-only)
keys + signing   @monkeymask/core             (like @solana/web3.js)  ← this package
```

No storage, no approval UI, no `chrome.*` — callers own key custody. The extension keeps keys encrypted behind a password and user approvals; a server keeps them in an env secret.

## Install

```bash
npm install @monkeymask/core
```

## Server wallet (custodial)

```ts
import { Wallet } from '@monkeymask/core';

// 64-char hex seed or BIP39 mnemonic, e.g. from process.env.BANANO_SEED
const wallet = await Wallet.fromSeed(process.env.BANANO_SEED!);

console.log(wallet.address);              // ban_1…

await wallet.receiveAll();                // claim pending (receivables)
const hash = await wallet.send('ban_1abc…', '1.5');   // BNS names work too: 'user.ban'

// Messages / SIWB
const sig = await wallet.signMessage('hello');
wallet.verifyMessage('hello', sig);       // true
const proof = await wallet.signIn({ domain: 'example.com', nonce });

// NFTs (73-meta-tokens)
const mint = await wallet.mintNFT({ metadataCid: 'Qm…', to: 'ban_1recipient…', maxSupply: 10 });
await wallet.mintEdition({ metadataCid: 'Qm…', to: 'ban_1recipient…' });
await wallet.transferNFT({ assetRepresentative: mint.assetRepresentative, to: 'ban_1buyer…' });
await wallet.burnNFT({ assetRepresentative: mint.assetRepresentative });
await wallet.finishCollection({ metadataCid: 'Qm…' });
await wallet.sendAllNfts({ to: 'ban_1vault…' });

// Airdrops (locally-chained blocks, pipelined work, per-recipient results)
const { results } = await wallet.batchSend([
  { to: 'ban_1a…', amount: '1' },
  { to: 'ban_1b…', amount: '2' },
]);

// Or the same structured envelope dApps send through the provider:
await wallet.sendOperation({ type: 'mint', metadataCid: 'Qm…', to: 'ban_1x…' });
```

## API surface

- **`Wallet`** — `fromSeed`, `deriveIndex`, `getBalance`, `getReceivables`, `send`, `batchSend`, `receivePending`, `receiveAll`, `sweep`, `changeRepresentative`, `signMessage`, `verifyMessage`, `signIn`, `mintNFT`, `mintEdition`, `transferNFT`, `transferNFTs`, `burnNFT`, `finishCollection`, `sendAllNfts`, `signOperation`, `sendOperation`
- **Keys** — `generateSeed`, `generateMnemonic`, `mnemonicToSeed`, `deriveAccount`
- **NFT representative encoders** — `supplyRepresentative`, `metadataRepresentativeFromCid` (v0 `Qm…` and v1 `b…` CIDs), `assetRepresentativeAccount`, `finishSupplyRepresentative` (decoders live in `@monkeymask/wallet-standard`)
- **Node/RPC** — `setBananoRpcEndpoints` (point at your own node), `withBananoNodeFallback`, `BananoRPC`
- **BNS** — `BNSResolver` / `bnsResolver` (forward + reverse resolution)
- **`bananojs`** — the typed underlying `@bananocoin/bananojs` instance, already wired to the active endpoint

Metaprotocol safety rules from the extension are preserved: mints always publish self-delimiting `change#supply` → `send#mint` pairs, a clean representative is restored after every mint/transfer/send-all so ordinary sends can never mint phantom editions or re-trigger send-all, and `changeRepresentative` refuses to overwrite an in-flight protocol representative.

## Security

A seed in an env var is a **hot wallet**. Use a dedicated account (never a treasury), keep only working balances on it, and gate any HTTP endpoint that triggers signing behind authentication (e.g. a verified SIWB session). This package never persists keys.

## Custom node

```ts
import { setBananoRpcEndpoints } from '@monkeymask/core';
setBananoRpcEndpoints(['https://my-node.example.com/api']);
```
