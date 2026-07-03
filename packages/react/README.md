# @monkeymask/react

React provider and hooks for integrating [MonkeyMask](https://github.com/thekesslereffect/monkeymask) — a Banano browser wallet on the Wallet Standard `banano:` chain.

## Install

Users need the [MonkeyMask extension](https://github.com/thekesslereffect/monkeymask/tree/main/extension) installed in Chrome.

```bash
npm install @monkeymask/react @monkeymask/wallet-standard
```

Peer dependencies: `react` and `react-dom` ≥ 18.

## Quickstart

```tsx
'use client';

import {
  MonkeyMaskProvider,
  useMonkeyMask,
  useSend,
} from '@monkeymask/react';

export function App() {
  return (
    <MonkeyMaskProvider config={{ autoConnect: true }}>
      <Wallet />
    </MonkeyMaskProvider>
  );
}

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
      <p>{publicKey}</p>
      <button
        onClick={async () => {
          try {
            const { hash } = await send({ to: 'ban_1…', amount: '1.0' });
            console.log('sent', hash);
          } catch (e) {
            // User rejection => code 4001
            console.error(e);
          }
        }}
      >
        Send 1 BAN
      </button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
```

## Provider

Wrap your app once. `autoConnect` silently reconnects on origins the user already approved.

```tsx
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
```

## Hooks

| Hook | Description |
|------|-------------|
| `useMonkeyMask` | Connection state, `connect`, `disconnect`, `publicKey`, `wallet` |
| `useSend` | Send BAN to one or many recipients (address or `.ban` name) |
| `useReceive` / `useReceivable` | Claim pending blocks / list receivable |
| `useSweep` | Send entire balance to one recipient |
| `useSignMessage` / `useSignIn` | Message sign + SIWB |
| `useSignTransaction` / `useSignAndSendTransaction` | Low-level transaction intents |
| `useAccountHistory` | Recent confirmed transactions |
| `useReverseBNS` | Address → `.ban` name (best-effort) |
| `useSpendingSession` | Per-origin spending allowance (opt-in in wallet) |
| `useMintNFT` / `useMintEdition` | NFT mint + edition copies |
| `useTransferNFT` / `useBurnNFT` | Transfer or burn owned NFTs |
| `useFinishSupply` / `useSendAllNfts` | Lock collection supply / bulk NFT send |

Payment URI helpers (`buildBananoUri`, `parseBananoUri`, `banToRaw`, `rawToBan`) are re-exported from `@monkeymask/wallet-standard`.

## Wallet discovery

For custom UI without the provider:

```ts
import {
  findMonkeyMaskWallet,
  getBananoWallets,
  connectWallet,
} from '@monkeymask/react';
```

## Conventions

- **`amount`** is always a decimal BAN string (e.g. `"1.5"`), not raw.
- **Recipients** accept a `ban_…` address or a `.ban` BNS name.
- **Errors**: rejected requests throw with `code === 4001`. Always `try/catch` action hooks.
- **Multi-send**: pass an array to `useSend` for airdrops; response includes per-recipient `results`.

## Docs

Full integration guide (SIWB, NFTs, spending sessions, agent cheat sheet):

- [MonkeyMask docs](https://github.com/thekesslereffect/monkeymask/blob/main/monkeymask-website/src/app/docs/page.tsx)
- [Monorepo README](https://github.com/thekesslereffect/monkeymask#packages)

## Related packages

- [`@monkeymask/wallet-standard`](https://www.npmjs.com/package/@monkeymask/wallet-standard) — types, SIWB, protocol (server-safe)

## License

See the [monkeymask](https://github.com/thekesslereffect/monkeymask) repository.
