# 🐒 MonkeyMask dApp Template

A clean Next.js (App Router + TypeScript + Tailwind) template that makes integrating MonkeyMask into your Banano dApp dead simple. It follows Phantom/Wallet Adapter patterns: a Provider at the root, a `useMonkeyMask()` hook, a connect button, and a few example components.

## ✨ What You Get

- Provider-based integration (`src/providers/MonkeyMaskProvider.tsx`)
- Simple `useMonkeyMask()` hook via `src/providers/index.tsx`
- Example components: Wallet info, sign message, send transaction
- Clean dark UI with Tailwind tokens and modern spacing
- BNS support (`username.ban` → address) built-in
- Smart timeouts (15m for approvals) and robust error messages

## 🚀 Quick Start

Prereqs: Node 18+, MonkeyMask extension installed

```bash
cd dapp-template
npm install
npm run dev
# open http://localhost:3000
```

The app is already wrapped with `<Providers />` in `src/app/layout.tsx`.

## 📁 Structure (current)

```
src/
├── app/
│   ├── layout.tsx             # Wraps app with Providers
│   └── page.tsx               # Main page with examples and docs
├── components/
│   ├── WalletConnectButton.tsx
│   └── examples/
│       ├── WalletInfo.tsx
│       ├── SendTransaction.tsx
│       └── SignMessage.tsx
├── providers/
│   ├── MonkeyMaskProvider.tsx  # Core context: state + methods
│   └── index.tsx               # Exports Provider + useMonkeyMask
└── types/
    └── monkeymask.ts           # Strong TS types for API & data
```

## 🧩 Use the Hook

```tsx
import { useMonkeyMask } from '@/providers';

export function MyComponent() {
  const { isConnected, isConnecting, connect, disconnect, publicKey, error } = useMonkeyMask();

  if (!isConnected) {
    return (
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting…' : 'Connect MonkeyMask'}
      </button>
    );
  }

  return (
    <div>
      <div>Connected: {publicKey}</div>
      <button onClick={disconnect}>Disconnect</button>
      {error && <div style={{ color: 'tomato' }}>{error}</div>}
    </div>
  );
}
```

## 🛠️ Common Operations

```tsx
const { getAccounts, getBalance, getAccountInfo, resolveBNS } = useMonkeyMask();

// Accounts
const accounts = await getAccounts();

// Balance & info
const balance = await getBalance();
const info = await getAccountInfo();

// BNS
const address = await resolveBNS('name.ban');
```

### Transactions & Signing

```tsx
const { sendTransaction, signMessage, signBlock, sendBlock } = useMonkeyMask();

// Send BAN (BNS auto-resolves)
const hash = await sendTransaction('name.ban', '1.25');

// Sign a message (returns hex signature)
const signatureHex = await signMessage('Hello from my dApp');

// Blocks
const signed = await signBlock(block);
const sentHash = await sendBlock(signed);
```

Notes:
- When the wallet is locked, starting a transaction/signing request will auto-open the extension to unlock, then show the approval.
- Account methods work while locked.
- Rejections never execute actions.

## 🔌 API (from the hook)

- Connection: `connect()`, `disconnect()`
- Data: `getAccounts()`, `getBalance(address?)`, `getAccountInfo(address?)`
- Signing/Tx: `signMessage(message)`, `signBlock(block)`, `sendBlock(block)`, `sendTransaction(to, amount)`
- Utils: `resolveBNS(name)`
- State: `isConnected`, `isConnecting`, `publicKey`, `accounts`, `error`, `clearError`

All methods are typed in `src/types/monkeymask.ts`.

## 🧪 Example Components

- `WalletInfo.tsx`: Shows accounts, balance, and detailed account info
- `SendTransaction.tsx`: Send BAN with BNS resolution and helpful loading states
- `SignMessage.tsx`: Simple message signing example
- `WalletConnectButton.tsx`: Drop-in connect/disconnect control

## 🧰 Scripts

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run start   # Start prod server
npm run lint    # Lint
```

## ⚙️ Styling

Tailwind with dark tokens is set up in `src/app/globals.css`.

## 🔒 Behavior & Timeouts

- Account methods are available while locked
- Sensitive actions auto-open unlock → approval
- Approval timeouts up to 15 minutes; quick calls ~30s

---

Built with 🍌 and ❤️ for the Banano ecosystem