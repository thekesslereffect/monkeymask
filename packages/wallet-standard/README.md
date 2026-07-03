# @monkeymask/wallet-standard

Banano [Wallet Standard](https://github.com/wallet-standard/wallet-standard) types, protocol helpers, and **Sign In With Banano (SIWB)** for [MonkeyMask](https://github.com/thekesslereffect/monkeymask).

Framework-agnostic and safe to import on the server (SIWB verify, codecs, URI parsing).

## Install

```bash
npm install @monkeymask/wallet-standard
```

Optional peer (only needed for client-side signing helpers that call bananojs):

```bash
npm install @bananocoin/bananojs
```

## What's included

| Module | Purpose |
|--------|---------|
| `chains` | `banano:` chain identifiers |
| `features` | Wallet Standard feature + operation types (`send`, `mint`, `transfer`, …) |
| `protocol` | Request/response envelope for extension messaging |
| `siwb` | Build and verify SIWB sign-in messages |
| `nft` / `nftScan` | NFT representative codecs and ledger scan helpers |
| `representatives` | Representative list helpers |
| `uri` | `ban:` payment URI build/parse, BAN ↔ raw conversion |
| `errors` | Standard error codes (`4001` = user rejected) |

## SIWB (server)

```ts
import {
  createSignInMessageText,
  deserializeSignInOutput,
  verifySignIn,
  generateNonce,
} from '@monkeymask/wallet-standard';
import bananojs from '@bananocoin/bananojs';

// 1. Issue a nonce (store it durably — e.g. Convex, Redis, DB).
const input = {
  domain: 'yourdapp.com',
  address: 'ban_1…',
  nonce: generateNonce(),
  issuedAt: new Date().toISOString(),
};
const message = createSignInMessageText(input);

// 2. Wallet signs via banano:signIn; POST { input, output } to your API.
const output = deserializeSignInOutput(rawOutput);
const valid = verifySignIn(input, output, bananojs.BananoUtil, {
  expectedDomain: 'yourdapp.com',
});
```

## Payment URIs

```ts
import {
  buildBananoUri,
  parseBananoUri,
  banToRaw,
  rawToBan,
} from '@monkeymask/wallet-standard';

const uri = buildBananoUri({ address: 'ban_1…', amount: '1.5' });
// ban:ban_1…?amount=1.5

const req = parseBananoUri(uri);
```

## Docs

Full integration guide (features, transaction intents, NFT ops, error handling):

- [MonkeyMask docs](https://github.com/thekesslereffect/monkeymask/blob/main/monkeymask-website/src/app/docs/page.tsx) — source for the live docs site
- [Monorepo README](https://github.com/thekesslereffect/monkeymask#packages)

## Related packages

- [`@monkeymask/react`](https://www.npmjs.com/package/@monkeymask/react) — React provider and hooks
- [MonkeyMask extension](https://github.com/thekesslereffect/monkeymask/tree/main/extension) — Chrome wallet that implements this standard

## License

See the [monkeymask](https://github.com/thekesslereffect/monkeymask) repository.
