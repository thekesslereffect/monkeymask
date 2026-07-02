# MonkeyMask Extension

Chrome MV3 Banano wallet implementing the Wallet Standard (`banano:` features) plus a legacy `window.banano` provider.

## Build

From repo root:

```bash
npm install
npm run build:packages
npm run build -w monkeymask
```

Load `extension/dist` as an unpacked extension in Chrome.

## Architecture

| Layer | Role |
|-------|------|
| `injected.ts` | Registers Wallet Standard wallet + `window.banano` |
| `content.ts` | postMessage bridge using `@monkeymask/wallet-standard` protocol |
| `background.ts` | Method dispatch, approvals, events |
| `wallet.ts` | WebCrypto keystore, block build/sign/publish, SIWB |

## Features

- `standard:connect` / `standard:disconnect` / `standard:events`
- `banano:signMessage` — raw bytes via `BananoUtil.signMessage`
- `banano:signIn` — Sign In With Banano (SIWB)
- `banano:signTransaction` — signed state block JSON (no publish)
- `banano:signAndSendTransaction` — sign + publish via bananojs

## Mobile / deep links (future)

The shared protocol envelope in `@monkeymask/wallet-standard` is transport-agnostic. A future mobile app can handle `monkeymask://` requests using the same schema (stub documented in root README).

## RPC hosts

Configured in `manifest.json` `host_permissions`: kaliumapi, dev-ptera, banano.cc.
