# 🐒 MonkeyMask - Professional Banano Browser Extension Wallet

MonkeyMask is a **production-ready** browser extension wallet for the Banano cryptocurrency, bringing secure decentralized payments to your browser. Built with modern web standards and security best practices, MonkeyMask provides a **Phantom Wallet-equivalent experience** for the Banano ecosystem.

## 🎯 Production-Ready Features

### 🏆 **Enterprise-Grade Security**
- **Per-origin permissions** with persistent storage and one-click revocation
- **User approval required** for all connections, signatures, and transactions
- **AES-256 encryption** with PBKDF2 key derivation for local storage
- **Phantom-style auto-lock** with configurable timeouts (1/5/15/60 minutes)
- **No auto-approvals** - complete user control over every interaction
- **Secure approval queues** with timeout protection and proper cleanup

### 🔌 **Professional dApp Integration**
- **Phantom-style API** with `window.banano` provider interface
- **Event-driven architecture** with `connect`, `disconnect`, `accountChanged` events
- **Connection persistence** across page refreshes with silent reconnection
- **Standardized error codes** (4001, 4100, 4900) following EIP-1193 patterns
- **Message signing** for authentication and off-chain operations
- **TypeScript support** with comprehensive type definitions

### 💼 **Core Wallet Excellence**
- **BIP39 24-word seeds** for secure wallet generation and import
- **Multi-account support** with custom naming and balance tracking
- **Real-time balance fetching** from multiple RPC endpoints with failover
- **BNS (Banano Name System)** resolution for human-readable addresses
- **Auto-receive pending** transactions with intelligent batching
- **Send BAN transactions** with comprehensive validation and confirmation

### 🎨 **Modern User Experience**
- **Beautiful approval screens** with detailed transaction previews
- **Connected sites management** with usage tracking and quick disconnect
- **Professional settings UI** with instant preference application
- **Responsive design** optimized for extension popup constraints
- **Real-time status indicators** and comprehensive error feedback
- **Accessibility compliant** interface with proper ARIA labels

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
- **Lock/Unlock**: Auto-locks based on configurable timeout (default 15 minutes)
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

### ✅ **Phase 1: Core Wallet Foundation (COMPLETE)**
- ✅ Secure wallet generation with BIP39 24-word seeds
- ✅ Wallet import from seed phrases and private keys
- ✅ Multi-account support with custom naming
- ✅ AES-256 encryption with PBKDF2 key derivation
- ✅ Real-time balance fetching from multiple RPC endpoints
- ✅ BNS (Banano Name System) resolution integration
- ✅ Auto-receive pending transactions

### ✅ **Phase 2: Professional dApp Integration (COMPLETE)**
- ✅ Phantom-style provider API with `window.banano`
- ✅ Event-driven architecture (`connect`, `disconnect`, `accountChanged`)
- ✅ Standardized error codes (4001, 4100, 4900) following EIP-1193
- ✅ Message signing for authentication and off-chain operations
- ✅ Block signing with comprehensive validation
- ✅ Connection persistence across page refreshes
- ✅ Silent reconnection for approved sites

### ✅ **Phase 3: Enterprise Security Model (COMPLETE)**
- ✅ Per-origin permission system with persistent storage
- ✅ User approval required for all connections and signatures
- ✅ Beautiful approval popups with detailed transaction previews
- ✅ Connected sites management with permission revocation
- ✅ No auto-approvals - complete user control
- ✅ Origin-based access control and validation
- ✅ Secure approval queuing with timeout protection

### ✅ **Phase 4: Transaction & UX Excellence (COMPLETE)**
- ✅ Send BAN transactions with comprehensive validation
- ✅ Transaction approval screens with clear information display
- ✅ Real-time balance updates after successful transactions
- ✅ BNS name resolution in transaction flows
- ✅ Transaction confirmation with Creeper explorer links
- ✅ Phantom-style auto-lock with configurable timeouts (1/5/15/60 min)
- ✅ Professional settings UI with user preferences
- ✅ Comprehensive error handling and user feedback

### 🚧 **Phase 5: Ecosystem & Developer Tools (CURRENT)**
- [ ] Transaction history dashboard with filtering and search
- [ ] Enhanced developer documentation with integration guides
- [ ] `@banano/wallet-adapter` NPM package for easy dApp integration
- [ ] Comprehensive example dApps and tutorials
- [ ] Performance optimizations and code splitting
- [ ] Advanced BNS features (reverse resolution, bulk operations)
- [ ] Wallet analytics and usage insights

### 🔮 **Phase 6: Advanced Features (FUTURE)**
- [ ] Hardware wallet support (Ledger/Trezor integration)
- [ ] Multi-network support (Nano + Banano unified experience)
- [ ] NFT display, management, and trading
- [ ] Cross-device sync with encrypted cloud backup (optional)
- [ ] Advanced privacy features and coin mixing
- [ ] DeFi integrations and yield farming support
- [ ] Mobile companion app with QR code signing

### 🌟 **Potential Future Enhancements**
- [ ] WalletConnect v2 integration for mobile dApp connections
- [ ] Multi-signature wallet support for organizations
- [ ] Advanced portfolio tracking and analytics
- [ ] Integration with decentralized exchanges
- [ ] Staking and delegation features (if supported by network)
- [ ] Advanced security features (time locks, spending limits)
- [ ] Plugin system for third-party extensions

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

## 🎉 Production Ready - Enterprise-Grade Banano Wallet

**MonkeyMask has achieved production-ready status** with enterprise-grade security, professional dApp integration, and user experience that rivals industry leaders like Phantom and MetaMask.

### 🏆 **What Makes MonkeyMask Production-Ready**

#### ✅ **Security Excellence**
- **Per-origin permission system** with persistent storage and revocation
- **User approval required** for all connections, signatures, and transactions
- **No auto-approvals** - complete user control over every interaction
- **AES-256 encryption** with PBKDF2 key derivation for wallet storage
- **Secure approval queues** with timeout protection and proper cleanup
- **Origin validation** preventing cross-site access and CSRF attacks

#### ✅ **Professional dApp Integration**
- **Phantom-style API** with `window.banano` provider interface
- **Event-driven architecture** with `connect`, `disconnect`, `accountChanged` events
- **Connection persistence** across page refreshes with silent reconnection
- **Standardized error codes** (4001, 4100, 4900) following EIP-1193 patterns
- **Message signing** for authentication and off-chain operations
- **TypeScript support** with comprehensive type definitions

#### ✅ **Enterprise UX Standards**
- **Phantom-style auto-lock** with configurable timeouts (1/5/15/60 minutes)
- **Beautiful approval screens** with detailed transaction previews
- **Connected sites management** with one-click permission revocation
- **Professional settings UI** with instant application of preferences
- **Real-time balance updates** and comprehensive error handling
- **BNS integration** for human-readable addresses

#### ✅ **Developer-Friendly Architecture**
- **Modern tech stack** - React 18, TypeScript, Tailwind CSS
- **Secure extension architecture** with proper message passing
- **Comprehensive API documentation** with usage examples
- **Standardized error handling** with proper error codes and messages
- **Event system** for reactive dApp development

### 📊 **Current Status: Phase 4 Complete**

**✅ Completed Phases:**
- **Phase 1**: Core Wallet Foundation (Secure generation, encryption, multi-account)
- **Phase 2**: Professional dApp Integration (Phantom-style API, events, persistence)
- **Phase 3**: Enterprise Security Model (Permissions, approvals, site management)
- **Phase 4**: Transaction & UX Excellence (Auto-lock, settings, comprehensive validation)

**🚧 Next Up: Phase 5 - Ecosystem & Developer Tools**
- Transaction history dashboard
- `@banano/wallet-adapter` NPM package
- Enhanced developer documentation
- Performance optimizations

### 🌟 **Industry Comparison**

| Feature | MonkeyMask | Phantom | MetaMask |
|---------|------------|---------|----------|
| **Security Model** | ✅ Per-origin permissions | ✅ Per-origin permissions | ✅ Per-origin permissions |
| **User Approvals** | ✅ Required for all operations | ✅ Required for all operations | ✅ Required for all operations |
| **Event System** | ✅ Full event support | ✅ Full event support | ✅ Full event support |
| **Auto-Lock Options** | ✅ 1/5/15/60 min configurable | ✅ Configurable timeouts | ✅ Configurable timeouts |
| **Connection Persistence** | ✅ Silent reconnection | ✅ Silent reconnection | ✅ Silent reconnection |
| **Message Signing** | ✅ Full support | ✅ Full support | ✅ Full support |
| **Error Standardization** | ✅ EIP-1193 compliant | ✅ EIP-1193 compliant | ✅ EIP-1193 compliant |
| **Network Focus** | 🍌 Banano-optimized | 🔮 Solana-optimized | 🔷 Ethereum-optimized |

**MonkeyMask now delivers the same professional-grade experience as industry leaders, specifically optimized for the Banano ecosystem! 🐒🚀**

---

**Built with 🍌 and ❤️ for the Banano community**