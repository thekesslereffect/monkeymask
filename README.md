# 🐒 MonkeyMask - Professional Banano Browser Extension Wallet

MonkeyMask is a **production-ready** browser extension wallet for the Banano cryptocurrency, bringing secure decentralized payments to your browser. Built with modern web standards and security best practices, MonkeyMask provides a **Phantom Wallet-equivalent experience** for the Banano ecosystem.

## 🎯 Current Features

### ✅ **Core Wallet Functionality**
- **Secure wallet creation** with 24-word BIP39 seed phrases
- **Import existing wallets** from seed phrases or private keys
- **Military-grade encryption** with AES-256 and PBKDF2 key derivation
- **Multiple account support** with custom naming
- **Real-time balance fetching** from multiple RPC endpoints
- **Auto-lock security** with configurable timeout
- **BNS (Banano Name System)** resolution for human-readable addresses

### ✅ **Professional dApp Integration**
- **Phantom-style API** with standardized methods and events
- **Secure connection approval** with per-origin permissions
- **Event-driven architecture** with `connect`, `disconnect`, `accountChanged` events
- **Standardized error codes** (4001, 4100, 4900) following EIP-1193 patterns
- **Message signing** for authentication and off-chain operations
- **Block signing** with comprehensive approval flows
- **Connected sites management** with permission revocation

### ✅ **Advanced Security Model**
- **User approval required** for all connections and signatures
- **Per-origin permission storage** with persistent authorization
- **No auto-approvals** - user controls every interaction
- **Secure approval popups** with clear transaction previews
- **Permission management UI** to view and revoke site access
- **Origin-based access control** preventing unauthorized requests

### ✅ **Transaction Support**
- **Send BAN transactions** with fee estimation
- **Transaction approval screens** with detailed information
- **Real-time balance updates** after successful transactions
- **BNS name resolution** in transaction flows
- **Transaction confirmation** with Creeper explorer links
- **Comprehensive error handling** and user feedback

### ✅ **Modern UI/UX**
- **Beautiful, responsive design** with Tailwind CSS
- **Intuitive approval screens** for connections and signatures
- **Connected sites dashboard** for permission management
- **Account selection interface** for multi-account workflows
- **Real-time status indicators** and loading states
- **Accessibility compliant** with proper ARIA labels

## 🚀 Installation

### For Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/monkeymask.git
   cd monkeymask
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome/Brave**
   - Open Chrome/Brave and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the `dist` folder
   - The MonkeyMask extension should now appear in your extensions

### For Users (Production)

*Coming soon to Chrome Web Store*

## 🔧 Development Scripts

- `npm run dev` - Build in development mode with watch
- `npm run build` - Build for production
- `npm run clean` - Clean the dist directory

## 📱 How to Use

### First Time Setup

1. **Click the MonkeyMask extension icon** in your browser toolbar
2. **Choose your setup method:**
   - **Create New Wallet**: Generate a fresh wallet with a new seed phrase
   - **Import Existing Wallet**: Restore from an existing 24-word seed phrase

### Creating a New Wallet

1. Set a strong password (8+ characters)
2. **CRITICAL**: Write down your 24-word seed phrase and store it safely
3. Confirm your seed phrase to complete setup
4. Your wallet is ready to use!

### Daily Usage

- **View Balances**: See your BAN balance on the dashboard
- **Manage Connections**: Click 🔗 to view and revoke connected sites
- **Send BAN**: Send transactions to addresses or BNS names (e.g., username.ban)
- **Approve Transactions**: Review and approve all dApp requests in secure popups
- **Lock/Unlock**: Auto-locks after 30 minutes for security
- **Refresh Balances**: Click refresh to update account balances

### Using with dApps

1. **Visit a Banano dApp** that supports MonkeyMask
2. **Click "Connect Wallet"** on the dApp
3. **Review connection request** in the MonkeyMask approval popup
4. **Select accounts to share** and approve the connection
5. **Approve signatures** for each transaction or message signing request
6. **Manage permissions** via the connected sites dashboard

## 🔌 Professional dApp API

MonkeyMask provides a **Phantom-style API** with modern standards and security:

### Core Interface

```typescript
interface BananoProvider {
  // Connection Management (Phantom-style)
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: string }>
  disconnect(): Promise<void>
  
  // Account Information
  getAccounts(): Promise<string[]>
  getBalance(address?: string): Promise<string>
  getAccountInfo(address?: string): Promise<any>
  
  // Transaction Methods
  signMessage(message: Uint8Array | string, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array; publicKey: string }>
  signBlock(block: BananoBlock): Promise<SignedBlock>
  sendBlock(block: SignedBlock): Promise<string>
  sendTransaction(fromAddress: string, toAddress: string, amount: string): Promise<{ hash: string; block: any }>
  
  // Utility Methods
  resolveBNS(bnsName: string): Promise<string>
  
  // State Properties
  isConnected: boolean
  publicKey: string | null
  isMonkeyMask: boolean
  isBanano: boolean
  
  // Event System (Phantom-style)
  on(event: string, handler: (...args: any[]) => void): void
  off(event: string, handler: (...args: any[]) => void): void
  removeAllListeners(): void
}
```

### Event System

```javascript
// Listen for connection events
window.banano.on('connect', (data) => {
  console.log('Connected to:', data.publicKey);
});

// Listen for disconnection
window.banano.on('disconnect', () => {
  console.log('Wallet disconnected');
});

// Listen for account changes
window.banano.on('accountChanged', (publicKey) => {
  console.log('Active account changed to:', publicKey);
});
```

### Example Usage

```javascript
// Modern connection with error handling
try {
  // Check if MonkeyMask is available
  if (!window.banano?.isMonkeyMask) {
    throw new Error('MonkeyMask not installed');
  }
  
  // Connect to wallet
  const result = await window.banano.connect();
  console.log('Connected to:', result.publicKey);
  
  // Sign a message for authentication
  const message = `Login to MyApp at ${Date.now()}`;
  const signature = await window.banano.signMessage(message, 'utf8');
  console.log('Authentication signature:', signature);
  
  // Send transaction with approval
  const tx = await window.banano.sendTransaction(
    result.publicKey,
    'ban_1recipient...',
    '1.5'
  );
  console.log('Transaction hash:', tx.hash);
  
} catch (error) {
  if (error.code === 4001) {
    console.log('User rejected the request');
  } else if (error.code === 4100) {
    console.log('Not connected to MonkeyMask');
  } else {
    console.error('Error:', error.message);
  }
}
```

### Standardized Error Codes

MonkeyMask follows industry standards for error handling:

- **4001**: User rejected the request
- **4100**: Unauthorized - not connected to MonkeyMask  
- **4900**: Provider is disconnected
- **-32602**: Invalid method parameters
- **-32603**: Internal error

## 🛠️ Technical Architecture

### Modern Extension Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   dApp Website  │    │  Content Script │    │ Background Page │
│                 │    │                 │    │                 │
│ window.banano   │◄──►│ Message Bridge  │◄──►│ Wallet Manager  │
│ API & Events    │    │ Event Proxy     │    │ RPC Handler     │
│                 │    │                 │    │ Permissions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       ▲
                                                       │
                                               ┌───────▼────────┐
                                               │  Extension UI  │
                                               │                │
                                               │ Approval Popups│
                                               │ Dashboard      │
                                               │ Settings       │
                                               └────────────────┘
```

### Security Model

- **Per-Origin Permissions**: Each website requires explicit approval
- **Persistent Authorization**: Approved connections survive browser restarts  
- **Approval Queuing**: All sensitive operations require user confirmation
- **Secure Storage**: AES-256 encryption with PBKDF2 key derivation
- **No Auto-Approvals**: User must approve every connection and signature

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **Webpack 5** for optimized bundling and code splitting

### Blockchain Integration
- **@bananocoin/bananojs** for Banano protocol operations
- **bip39** for secure mnemonic generation and validation
- **crypto-js** for client-side encryption
- **Multiple RPC endpoints** with automatic failover

### Browser Extension Components
- **Background Service**: Manages wallet state, permissions, and RPC communication
- **Content Script**: Bridges dApp communication and injects provider API
- **Injected Provider**: Provides `window.banano` API with events and error handling
- **Extension Popup**: Handles approvals, account management, and settings
- **Secure Storage**: Encrypted persistence with Chrome storage API

## 🔐 Security Features

### Wallet Security
- **Private keys never leave your browser** - no external key exposure
- **Military-grade AES-256 encryption** with PBKDF2 key stretching
- **Secure seed phrase generation** using cryptographically secure random numbers
- **Auto-lock protection** prevents unauthorized access
- **No external dependencies** for cryptographic operations

### dApp Security  
- **Explicit approval required** for all connections and operations
- **Per-origin permission model** prevents cross-site access
- **Clear approval interfaces** showing exactly what's being signed
- **Standardized error handling** prevents information leakage
- **Event-driven security** notifies dApps of permission changes

### Network Security
- **Multiple RPC endpoints** prevent single points of failure
- **Request validation** prevents malformed transaction attempts
- **Origin verification** ensures requests come from authorized sources
- **Timeout protection** prevents hanging requests

## 🗺️ Development Roadmap

### ✅ **Phase 1: Core Wallet (COMPLETE)**
- ✅ Secure wallet generation and import
- ✅ Multi-account support with encryption
- ✅ Real-time balance fetching
- ✅ BNS resolution integration

### ✅ **Phase 2: dApp Integration (COMPLETE)**
- ✅ Phantom-style provider API
- ✅ Event system with connection management
- ✅ Standardized error codes
- ✅ Message and block signing

### ✅ **Phase 3: Security Model (COMPLETE)**
- ✅ Per-origin permission system
- ✅ User approval flows for all operations
- ✅ Connected sites management
- ✅ Secure approval popups

### ✅ **Phase 4: Transaction Support (COMPLETE)**
- ✅ Send transaction functionality
- ✅ Transaction approval screens
- ✅ Real-time balance updates
- ✅ Creeper explorer integration

### 🚧 **Phase 5: Ecosystem Tools (CURRENT)**
- [ ] Transaction history dashboard
- [ ] Enhanced developer documentation
- [ ] `@banano/wallet-adapter` NPM package
- [ ] Comprehensive dApp integration examples
- [ ] Performance optimizations

### 🔮 **Phase 6: Advanced Features (FUTURE)**
- [ ] Hardware wallet support (Ledger/Trezor)
- [ ] Multi-network support (Nano + Banano)
- [ ] NFT display and management
- [ ] Cross-device sync (optional)
- [ ] Advanced privacy features

## 🤝 Contributing

We welcome contributions from the community! Please:

1. **Fork the repository** and create a feature branch
2. **Follow our coding standards** and include tests
3. **Update documentation** for any API changes
4. **Submit a pull request** with a clear description

### Development Guidelines
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Add comprehensive tests
- Update documentation

## 📄 License

MIT License - see LICENSE file for details.

## 🍌 About Banano

Banano is a feeless, instant, rich in potassium cryptocurrency. Learn more at [banano.cc](https://banano.cc)

---

## ⚠️ Security Notice

- **Never share your seed phrase** with anyone or any website
- **MonkeyMask will never ask** for your seed phrase outside of import
- **Always verify** you're using the official MonkeyMask extension
- **Keep your seed phrase** written down in a safe, offline location
- **Use strong passwords** and enable auto-lock for security

---

## 🎉 Production Ready

**MonkeyMask is now a production-ready Banano wallet** with enterprise-grade security and professional dApp integration:

### ✅ **Security-First Design**
- Per-origin permissions with user approval
- No auto-approvals or silent operations  
- Comprehensive approval interfaces
- Persistent permission management

### ✅ **Professional API**
- Phantom-style provider interface
- Event-driven architecture  
- Standardized error handling
- TypeScript support

### ✅ **Modern Architecture**
- React 18 with TypeScript
- Secure extension architecture
- Optimized build pipeline
- Comprehensive testing

**MonkeyMask is now the professional-grade wallet the Banano ecosystem deserves! 🚀**

---

**Built with 🍌 and ❤️ for the Banano community**