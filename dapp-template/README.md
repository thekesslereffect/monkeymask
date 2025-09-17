# 🐒 MonkeyMask dApp Template

A modern, professional Next.js template for building decentralized applications (dApps) with MonkeyMask Banano wallet integration. This template provides everything you need to create production-ready dApps with secure wallet connectivity, beautiful UI components, and comprehensive documentation.

## ✨ Features

### 🔐 **Enterprise-Grade Security**
- **Per-origin permissions** with secure approval flows
- **User consent required** for all wallet operations
- **Standardized error handling** with EIP-1193 compliant error codes
- **Connection persistence** across page refreshes

### ⚡ **Complete Wallet Integration**
- **Full MonkeyMask API** support with TypeScript definitions
- **React hooks** for easy state management
- **Event-driven architecture** for real-time updates
- **BNS resolution** for human-readable addresses
- **Message and block signing** capabilities
- **Transaction sending** with comprehensive validation

### 🎨 **Modern Developer Experience**
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for beautiful, responsive design
- **Custom React hooks** for wallet integration
- **Reusable UI components** with consistent styling
- **Comprehensive documentation** with code examples
- **Live API testing** interface

### 📚 **Learning Resources**
- **Interactive documentation** with code examples
- **Copy-paste ready** code snippets
- **Best practices** and common patterns
- **Error handling** examples
- **Event system** documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MonkeyMask browser extension installed
- Basic knowledge of React and TypeScript

### Installation

1. **Clone or download this template**
   ```bash
   git clone <repository-url>
   cd monkeymask-dapp-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
```bash
npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Install MonkeyMask**
   Make sure you have the MonkeyMask browser extension installed and set up

## 📁 Project Structure

```
src/
├── app/
│   └── page.tsx              # Main application page
├── components/
│   ├── WalletConnection.tsx  # Wallet connection component
│   ├── ApiTester.tsx         # Interactive API testing
│   └── Documentation.tsx    # Code examples and docs
├── hooks/
│   └── useMonkeyMask.ts     # Custom wallet hook
└── types/
    └── monkeymask.ts        # TypeScript definitions
```

## 🛠️ Usage

### Basic Wallet Connection

```typescript
import { useMonkeyMask } from '@/hooks/useMonkeyMask';

function MyComponent() {
  const { isConnected, connect, disconnect, publicKey, balance } = useMonkeyMask();

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {publicKey}</p>
      <p>Balance: {balance} BAN</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### Sending Transactions

```typescript
const { sendTransaction, isConnected } = useMonkeyMask();

const handleSend = async () => {
  if (!isConnected) return;
  
  try {
    const result = await sendTransaction('ban_1recipient...', '1.0');
    console.log('Transaction sent:', result.hash);
  } catch (error) {
    if (error.code === 4001) {
      console.log('User rejected transaction');
    } else {
      console.error('Transaction failed:', error.message);
    }
  }
};
```

### Message Signing

```typescript
const { signMessage } = useMonkeyMask();

const handleSign = async () => {
  try {
    const result = await signMessage('Hello from my dApp!');
    console.log('Signature:', result.signature);
    console.log('Public Key:', result.publicKey);
  } catch (error) {
    console.error('Signing failed:', error.message);
  }
};
```

## 🎯 API Reference

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `connect(options?)` | Connect to wallet | `Promise<ConnectResult>` |
| `disconnect()` | Disconnect from wallet | `Promise<void>` |
| `getAccounts()` | Get connected accounts | `Promise<string[]>` |
| `getBalance(account?)` | Get account balance | `Promise<string>` |
| `getAccountInfo(account?)` | Get account details | `Promise<AccountInfo>` |
| `signMessage(message, encoding?)` | Sign a message | `Promise<SignMessageResult>` |
| `signBlock(block)` | Sign a block | `Promise<SignBlockResult>` |
| `sendTransaction(from, to, amount)` | Send BAN tokens | `Promise<TransactionResult>` |
| `resolveBNS(bnsName)` | Resolve BNS name | `Promise<string>` |

### Event System

| Event | Description | Data |
|-------|-------------|------|
| `connect` | Wallet connected | `{ publicKey: string }` |
| `disconnect` | Wallet disconnected | `void` |
| `accountChanged` | Account switched | `string` (new publicKey) |

### Error Codes (EIP-1193 Compliant)

| Code | Description |
|------|-------------|
| `4001` | User rejected the request |
| `4100` | Account access unauthorized |
| `4900` | Provider disconnected |
| `-32602` | Invalid parameters |
| `-32603` | Internal error |

## 🎨 Customization

### Styling

This template uses Tailwind CSS for styling. You can customize the design by:

1. **Modifying Tailwind configuration** in `tailwind.config.js`
2. **Updating component styles** in the component files
3. **Adding custom CSS** in `src/app/globals.css`

### Components

All components are modular and can be customized:

- **WalletConnection**: Handles connection state and display
- **ApiTester**: Interactive testing interface
- **Documentation**: Code examples and guides

### Hooks

The `useMonkeyMask` hook provides all wallet functionality:

```typescript
const {
  // Connection state
  isConnected,
  isConnecting,
  publicKey,
  accounts,
  
  // Wallet data
  balance,
  accountInfo,
  
  // Error handling
  error,
  clearError,
  
  // Actions
  connect,
  disconnect,
  sendTransaction,
  signMessage,
  // ... more methods
} = useMonkeyMask();
```

## 🔧 Development

### Building for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 🌟 Best Practices

### ✅ Do
- Always check if MonkeyMask is installed before calling methods
- Handle user rejections gracefully (error code 4001)
- Listen to connection events for real-time updates
- Validate addresses before sending transactions
- Show clear loading states during operations
- Use the provided React hook for easier integration

### ❌ Don't
- Don't assume MonkeyMask is always available
- Don't ignore error codes - handle them appropriately
- Don't make calls without user interaction
- Don't store private keys or sensitive data
- Don't spam users with connection requests

## 📖 Examples

### Complete dApp Example

```typescript
'use client';

import { useMonkeyMask } from '@/hooks/useMonkeyMask';
import { useState } from 'react';

export default function MyDApp() {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    publicKey,
    balance,
    sendTransaction,
    error
  } = useMonkeyMask();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    try {
      await sendTransaction(recipient, amount);
      alert('Transaction sent successfully!');
      setRecipient('');
      setAmount('');
    } catch (err) {
      alert('Transaction failed: ' + err.message);
    }
  };

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">My Banano dApp</h1>
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold">Wallet Connected</h2>
        <p className="text-sm font-mono">{publicKey}</p>
        <p>Balance: {balance} BAN</p>
        <button onClick={disconnect} className="text-red-600 text-sm">
          Disconnect
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold">Send BAN</h3>
        <input
          type="text"
          placeholder="Recipient address"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={handleSend}
          disabled={!recipient || !amount}
          className="w-full py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Send Transaction
        </button>
      </div>
    </div>
  );
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This template is open source and available under the [MIT License](LICENSE).

## 🆘 Support

- **Documentation**: Check the built-in documentation tab
- **Issues**: Report bugs or request features on GitHub
- **Community**: Join the Banano community for support

## 🙏 Acknowledgments

- **MonkeyMask Team** for the excellent wallet extension
- **Banano Community** for the amazing ecosystem
- **Next.js Team** for the fantastic framework
- **Tailwind CSS** for the utility-first CSS framework

---

**Built with 🍌 and ❤️ for the Banano ecosystem**