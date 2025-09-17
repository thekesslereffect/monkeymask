# 🐒 MonkeyMask Integration Guide

## Dead Simple Banano Wallet Integration

This template provides the simplest possible way to integrate MonkeyMask wallet functionality into your dApp. It's designed to be as easy as WalletConnect for Solana.

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Wrap Your App

```tsx
// app/layout.tsx
import { Providers } from '@/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 3. Add Wallet Connection

```tsx
// Any component
import { WalletConnectButton } from '@/components/WalletConnectButton';

export default function MyPage() {
  return (
    <div>
      <h1>My dApp</h1>
      <WalletConnectButton />
    </div>
  );
}
```

## 🎯 Using the Wallet

```tsx
import { useMonkeyMask } from '@/providers';

export default function MyComponent() {
  const { 
    isConnected, 
    publicKey, 
    getBalance, 
    sendTransaction, 
    signMessage 
  } = useMonkeyMask();

  const handleSend = async () => {
    if (!isConnected) return;
    
    const txHash = await sendTransaction('ban_1abc...', '1.0');
    console.log('Transaction sent:', txHash);
  };

  const handleSign = async () => {
    const signature = await signMessage('Hello, Banano!');
    console.log('Message signed:', signature);
  };

  const handleGetBalance = async () => {
    const balance = await getBalance();
    console.log('Balance:', balance);
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {publicKey}</p>
          <button onClick={handleGetBalance}>Get Balance</button>
          <button onClick={handleSend}>Send BAN</button>
          <button onClick={handleSign}>Sign Message</button>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}
```

## 📁 Project Structure

```
src/
├── providers/           # Wallet providers
│   ├── index.tsx       # Main providers wrapper
│   └── MonkeyMaskProvider.tsx
├── components/
│   ├── WalletConnectButton.tsx  # Simple connect button
│   ├── QuickStart.tsx          # Documentation
│   └── examples/               # Example components
│       ├── WalletInfo.tsx
│       ├── SendTransaction.tsx
│       └── SignMessage.tsx
├── hooks/
│   └── index.ts        # Re-exports useMonkeyMask
└── types/
    └── monkeymask.ts   # TypeScript definitions
```

## 🔧 Available Methods

| Method | Description | Returns |
|--------|-------------|---------|
| **Connection** |
| `isConnected` | Connection status | `boolean` |
| `publicKey` | Current wallet address | `string \| null` |
| `accounts` | All connected accounts | `string[]` |
| `connect()` | Connect wallet | `Promise<void>` |
| `disconnect()` | Disconnect wallet | `Promise<void>` |
| **Account Methods** |
| `getAccounts()` | Get all connected accounts | `Promise<string[]>` |
| `getBalance(address?)` | Get wallet balance | `Promise<string \| null>` |
| `getAccountInfo(address?)` | Get detailed account info | `Promise<AccountInfo \| null>` |
| **Transaction Methods** |
| `sendTransaction(to, amount)` | Send BAN (supports BNS) | `Promise<string \| null>` |
| `signMessage(message)` | Sign text message | `Promise<string \| null>` |
| `signBlock(block)` | Sign a block | `Promise<SignBlockResult \| null>` |
| `sendBlock(block)` | Send a signed block | `Promise<string \| null>` |
| **Utility Methods** |
| `resolveBNS(bnsName)` | Resolve BNS name to address | `Promise<string \| null>` |

## ✨ Features

- **🔐 Secure**: All signing happens in the wallet extension
- **🎯 Simple**: 3 lines of code to get started
- **🌐 BNS Support**: Send to `username.ban` addresses
- **⚡ Auto-Connect**: Automatically reconnects on page refresh
- **🎨 Customizable**: Easy to style and extend
- **📱 Responsive**: Works on all screen sizes
- **🌙 Dark Mode**: Built-in dark theme support

## 🚨 Error Handling

The provider automatically handles common errors:

- Extension not installed
- Connection lost/context invalidated
- User rejection
- Network errors

```tsx
const { error, clearError } = useMonkeyMask();

if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={clearError}>Dismiss</button>
      {error.includes('refresh') && (
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      )}
    </div>
  );
}
```

## 🎨 Customization

### Custom Connect Button

```tsx
import { useMonkeyMask } from '@/providers';

export function MyCustomButton() {
  const { isConnected, connect, disconnect, publicKey } = useMonkeyMask();
  
  return (
    <button 
      onClick={isConnected ? disconnect : connect}
      className="my-custom-styles"
    >
      {isConnected ? `Disconnect ${publicKey?.slice(0,8)}...` : 'Connect Wallet'}
    </button>
  );
}
```

### Custom Provider Configuration

```tsx
// providers/index.tsx
export function Providers({ children }: ProvidersProps) {
  return (
    <MonkeyMaskProvider
      config={{
        autoConnect: false,  // Disable auto-connect
        onConnect: (publicKey) => {
          console.log('Custom connect handler:', publicKey);
        },
        onDisconnect: () => {
          console.log('Custom disconnect handler');
        },
        onError: (error) => {
          // Custom error handling
          console.error('Wallet error:', error);
        },
      }}
    >
      {children}
    </MonkeyMaskProvider>
  );
}
```

## 🔗 Example Components

The template includes ready-to-use example components:

- `WalletInfo` - Display wallet information and balance
- `SendTransaction` - Send BAN with BNS support
- `SignMessage` - Sign arbitrary text messages

Import and use them directly:

```tsx
import { WalletInfo, SendTransaction, SignMessage } from '@/components/examples';

export default function MyApp() {
  return (
    <div>
      <WalletInfo />
      <SendTransaction />
      <SignMessage />
    </div>
  );
}
```

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Learn More

- View the live examples in the template
- Check out the `QuickStart` component for interactive documentation
- Explore the example components in `src/components/examples/`

---

**Built with ❤️ for the Banano community** 🐒🍌
