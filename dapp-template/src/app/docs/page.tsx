'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Alert } from '@/components/ui';
import { Header } from '@/components/pages/Header';
import { TryMe } from '@/components/pages/TryMe';
import { Icon } from "@iconify/react";
import Link from 'next/link';

// Expandable section component
const ExpandableSection = ({ 
  title, 
  children, 
  defaultExpanded = false,
  icon 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultExpanded?: boolean;
  icon?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-[var(--panel)] hover:bg-[var(--elevated)] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} className="size-4" />}
          <span className="font-medium">{title}</span>
        </div>
        <Icon 
          icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
          className="size-4 transition-transform" 
        />
      </button>
      {isExpanded && (
        <div className="p-4 bg-[var(--elevated)] border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </div>
  );
};

// API Method component
const ApiMethod = ({ 
  name, 
  signature, 
  description, 
  example, 
  returns,
  category = "method"
}: { 
  name: string; 
  signature: string; 
  description: string; 
  example?: string;
  returns?: string;
  category?: "method" | "property" | "event";
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCategoryIcon = () => {
    switch (category) {
      case "property": return "mdi:variable";
      case "event": return "mdi:lightning-bolt";
      default: return "mdi:function";
    }
  };
  
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-[var(--panel)] hover:bg-[var(--elevated)] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon icon={getCategoryIcon()} className="size-4 text-[var(--accent)]" />
          <code className="font-mono text-sm">{name}</code>
          <Badge variant="outline" className="text-xs">{category}</Badge>
        </div>
        <Icon 
          icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"} 
          className="size-4 transition-transform" 
        />
      </button>
      {isExpanded && (
        <div className="p-4 bg-[var(--elevated)] border-t border-[var(--border)] space-y-3">
          <div>
            <div className="text-sm font-medium mb-1">Signature</div>
            <pre className="text-xs bg-[var(--panel)] p-2 rounded border border-[var(--border)] overflow-x-auto">
              <code>{signature}</code>
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Description</div>
            <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          </div>
          {returns && (
            <div>
              <div className="text-sm font-medium mb-1">Returns</div>
              <code className="text-xs bg-[var(--panel)] px-2 py-1 rounded">{returns}</code>
            </div>
          )}
          {example && (
            <div>
              <div className="text-sm font-medium mb-1">Example</div>
              <pre className="text-xs bg-[var(--panel)] p-3 rounded border border-[var(--border)] overflow-x-auto">
                <code>{example}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1500px] px-4 py-12 md:py-20 space-y-16">
        {/* Hero */}
        <TryMe className="fixed top-24 right-30" />
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <Badge>Documentation</Badge>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mt-3">
              Build Banano dApps with MonkeyMask
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mt-6 leading-relaxed">
              MonkeyMask is a production-ready browser extension wallet for Banano with enterprise-grade security, 
              Phantom-style API compatibility, and comprehensive ecosystem integration.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button variant="secondary" size="md" asChild>
                <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                  <Icon icon="mdi:github" className="size-6" /> Github
                </Link>
              </Button>
              <a href="#api" className="inline-flex">
                <Button variant="outline" size="sm">
                  <Icon icon="cuida:unfold-horizontal-outline" className="size-6" /> <span>API Reference</span>
                </Button>
              </a>
              <a href="#installation" className="inline-flex">
                <Button variant="outline" size="sm">
                  <Icon icon="mdi:download" className="size-6" /> <span>Install</span>
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Installation */}
        <section id="installation" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Installation</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:account" className="size-5" />
                  For Users
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Icon icon="mdi:information" className="size-4" />
                  <div>
                    <div className="font-medium">Coming Soon</div>
                    <div className="text-sm">MonkeyMask will be available on the Chrome Web Store soon!</div>
                  </div>
                </Alert>
                <div>
                  <div className="font-medium mb-2">Manual Installation (Development)</div>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-[var(--text-secondary)]">
                    <li>Download the latest release from GitHub</li>
                    <li>Open Chrome and go to <code>chrome://extensions/</code></li>
                    <li>Enable "Developer mode" (toggle in top right)</li>
                    <li>Click "Load unpacked" and select the <code>dist</code> folder</li>
                    <li>MonkeyMask will appear in your extensions!</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:code-braces" className="size-5" />
                  For Developers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium mb-2">Build from Source</div>
                  <pre className="text-xs bg-[var(--panel)] p-3 rounded border border-[var(--border)] overflow-x-auto">
                    <code>{`git clone https://github.com/thekesslereffect/monkeymask.git
cd monkeymask/extension
npm install
npm run build`}</code>
                  </pre>
                </div>
                <div>
                  <div className="font-medium mb-2">Browser Compatibility</div>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline">Chrome</Badge>
                    <Badge variant="outline">Brave</Badge>
                    <Badge variant="outline">Edge</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quickstart */}
        <section id="quickstart" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Quickstart</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="mdi:react" className="size-5" />
                Next.js Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ExpandableSection 
                title="1. Wrap your app with MonkeyMaskProvider" 
                icon="mdi:package-variant"
                defaultExpanded
              >
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`// app/layout.tsx
import { Providers } from '@/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}`}</code>
                </pre>
              </ExpandableSection>

              <ExpandableSection 
                title="2. Add a connect button" 
                icon="mdi:connection"
              >
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`import { ConnectButton } from '@/components/ConnectButton';

export default function Page() {
  return (
    <div>
      <h1>My Banano dApp</h1>
      <ConnectButton />
    </div>
  );
}`}</code>
                </pre>
              </ExpandableSection>

              <ExpandableSection 
                title="3. Use wallet methods in your components" 
                icon="mdi:function"
              >
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`import { useMonkeyMask } from '@/providers';

export default function MyComponent() {
  const { 
    isConnected, 
    publicKey, 
    sendTransaction, 
    signMessage,
    getBalance 
  } = useMonkeyMask();

  const handleSend = async () => {
    if (!isConnected) return;
    
    try {
      const hash = await sendTransaction('ban_1recipient...', '1.0');
      console.log('Transaction sent:', hash);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {publicKey}</p>
          <button onClick={handleSend}>Send 1 BAN</button>
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}`}</code>
                </pre>
              </ExpandableSection>
            </CardContent>
          </Card>
        </section>

        {/* Core Features */}
        <section id="features" className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:shield-check" className="size-5 text-green-500" />
                  Enterprise Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  <li>• Per-origin permissions</li>
                  <li>• AES-256 encryption</li>
                  <li>• Auto-lock protection</li>
                  <li>• User approval required</li>
                  <li>• No auto-approvals</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:api" className="size-5 text-blue-500" />
                  Phantom-Style API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  <li>• Event-driven architecture</li>
                  <li>• Connection persistence</li>
                  <li>• Standardized error codes</li>
                  <li>• TypeScript support</li>
                  <li>• Silent reconnection</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:web" className="size-5 text-yellow-500" />
                  BNS Integration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  <li>• Resolve .ban domains</li>
                  <li>• Human-readable addresses</li>
                  <li>• Automatic resolution</li>
                  <li>• Transaction support</li>
                  <li>• Developer-friendly API</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Reference */}
        <section id="api" className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">API Reference</h2>
          
          <div className="space-y-8">
            {/* Connection Methods */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:connection" className="size-6" />
                Connection Management
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="connect()"
                  signature="connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: string }>"
                  description="Connect to the user's wallet. Shows approval popup if not previously authorized."
                  returns="Promise<{ publicKey: string }>"
                  example={`// Basic connection
const result = await window.banano.connect();
console.log('Connected:', result.publicKey);

// Silent connection (only if previously authorized)
try {
  const result = await window.banano.connect({ onlyIfTrusted: true });
  console.log('Silently connected:', result.publicKey);
} catch (error) {
  // User hasn't authorized this site before
  console.log('Not previously authorized');
}`}
                />

                <ApiMethod
                  name="disconnect()"
                  signature="disconnect(): Promise<void>"
                  description="Disconnect from the wallet and clear the connection state."
                  returns="Promise<void>"
                  example={`await window.banano.disconnect();
console.log('Disconnected from wallet');`}
                />

                <ApiMethod
                  name="isConnected"
                  signature="readonly isConnected: boolean"
                  description="Current connection status to the wallet."
                  category="property"
                  example={`if (window.banano.isConnected) {
  console.log('Wallet is connected');
} else {
  console.log('Wallet is not connected');
}`}
                />

                <ApiMethod
                  name="publicKey"
                  signature="readonly publicKey: string | null"
                  description="The public key of the currently connected account."
                  category="property"
                  example={`const publicKey = window.banano.publicKey;
if (publicKey) {
  console.log('Current account:', publicKey);
}`}
                />
              </div>
            </div>

            {/* Account Methods */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:account" className="size-6" />
                Account Information
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="getAccounts()"
                  signature="getAccounts(): Promise<string[]>"
                  description="Get all connected account addresses."
                  returns="Promise<string[]>"
                  example={`const accounts = await window.banano.getAccounts();
console.log('Connected accounts:', accounts);
// ['ban_1abc...', 'ban_1def...']`}
                />

                <ApiMethod
                  name="getBalance()"
                  signature="getBalance(address?: string): Promise<string>"
                  description="Get the balance for an account. Uses connected account if no address provided."
                  returns="Promise<string>"
                  example={`// Get balance for connected account
const balance = await window.banano.getBalance();
console.log('Balance:', balance, 'BAN');

// Get balance for specific account
const balance2 = await window.banano.getBalance('ban_1abc...');
console.log('Account balance:', balance2, 'BAN');`}
                />

                <ApiMethod
                  name="getAccountInfo()"
                  signature="getAccountInfo(address?: string): Promise<AccountInfo>"
                  description="Get detailed account information including balance, pending, and raw values."
                  returns="Promise<AccountInfo>"
                  example={`const info = await window.banano.getAccountInfo();
console.log('Account info:', {
  address: info.address,
  balance: info.balance,
  pending: info.pending,
  rawBalance: info.rawBalance,
  rawPending: info.rawPending
});`}
                />
              </div>
            </div>

            {/* Transaction Methods */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:send" className="size-6" />
                Transactions
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="sendTransaction()"
                  signature="sendTransaction(from: string, to: string, amount: string): Promise<{ hash: string; block: any }>"
                  description="Send a Banano transaction. Supports BNS name resolution for the recipient."
                  returns="Promise<{ hash: string; block: any }>"
                  example={`// Send to Banano address
const result = await window.banano.sendTransaction(
  'ban_1sender...',
  'ban_1recipient...',
  '1.5'
);
console.log('Transaction hash:', result.hash);

// Send to BNS name (automatically resolved)
const result2 = await window.banano.sendTransaction(
  'ban_1sender...',
  'username.ban',
  '0.1'
);
console.log('Sent to BNS name:', result2.hash);`}
                />

                <ApiMethod
                  name="signMessage()"
                  signature="signMessage(message: string | Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array; publicKey: string }>"
                  description="Sign an arbitrary message for authentication or verification purposes."
                  returns="Promise<{ signature: Uint8Array; publicKey: string }>"
                  example={`// Sign a login message
const message = \`Login to MyApp at \${Date.now()}\`;
const result = await window.banano.signMessage(message, 'utf8');

console.log('Signature:', result.signature);
console.log('Signed by:', result.publicKey);

// Convert signature to hex for storage/transmission
const signatureHex = Array.from(result.signature, 
  byte => byte.toString(16).padStart(2, '0')
).join('');`}
                />

                <ApiMethod
                  name="signBlock()"
                  signature="signBlock(block: Block): Promise<SignBlockResult>"
                  description="Sign a pre-constructed Banano block for advanced use cases."
                  returns="Promise<SignBlockResult>"
                  example={`const block = {
  type: 'send',
  account: 'ban_1sender...',
  previous: 'ABC123...',
  representative: 'ban_1rep...',
  balance: '1000000000000000000000000000',
  link: 'ban_1recipient...'
};

const result = await window.banano.signBlock(block);
console.log('Signed block:', result);`}
                />

                <ApiMethod
                  name="sendBlock()"
                  signature="sendBlock(block: Block): Promise<string>"
                  description="Send a pre-signed block to the network."
                  returns="Promise<string>"
                  example={`// First sign the block
const signedBlock = await window.banano.signBlock(block);

// Then send it to the network
const hash = await window.banano.sendBlock(signedBlock);
console.log('Block hash:', hash);`}
                />
              </div>
            </div>

            {/* BNS Methods */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:web" className="size-6" />
                Banano Name System (BNS)
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="resolveBNS()"
                  signature="resolveBNS(bnsName: string): Promise<string>"
                  description="Resolve a BNS name to a Banano address. Supports .ban and .banano domains."
                  returns="Promise<string>"
                  example={`// Resolve BNS names
const address1 = await window.banano.resolveBNS('username.ban');
const address2 = await window.banano.resolveBNS('myname.banano');

console.log('Resolved addresses:', address1, address2);

// Use in transactions (automatic resolution)
await window.banano.sendTransaction(
  myAddress,
  'recipient.ban', // Automatically resolved
  '1.0'
);`}
                />
              </div>
            </div>

            {/* Verification Methods */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:shield-check" className="size-6" />
                Message Verification
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="verifySignedMessage()"
                  signature="verifySignedMessage(message: string, signature: string, publicKey: string, display?: 'utf8' | 'hex'): Promise<boolean>"
                  description="Verify a signed message against a public key. Useful for authentication flows."
                  returns="Promise<boolean>"
                  example={`// Verify a signature
const message = 'Login to MyApp at 1234567890';
const signature = '0123456789abcdef...'; // hex signature
const publicKey = 'ban_1abc...'; // or hex public key

const isValid = await window.banano.verifySignedMessage(
  message, 
  signature, 
  publicKey, 
  'utf8'
);

if (isValid) {
  console.log('Signature is valid - user authenticated!');
} else {
  console.log('Invalid signature');
}`}
                />
              </div>
            </div>

            {/* Events */}
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Icon icon="mdi:lightning-bolt" className="size-6" />
                Event System
              </h3>
              <div className="space-y-3">
                <ApiMethod
                  name="on('connect')"
                  signature="on('connect', handler: (data: { publicKey: string }) => void): void"
                  description="Listen for wallet connection events."
                  category="event"
                  example={`window.banano.on('connect', (data) => {
  console.log('Wallet connected:', data.publicKey);
  // Update UI to show connected state
  updateConnectionStatus(true, data.publicKey);
});`}
                />

                <ApiMethod
                  name="on('disconnect')"
                  signature="on('disconnect', handler: () => void): void"
                  description="Listen for wallet disconnection events."
                  category="event"
                  example={`window.banano.on('disconnect', () => {
  console.log('Wallet disconnected');
  // Update UI to show disconnected state
  updateConnectionStatus(false, null);
});`}
                />

                <ApiMethod
                  name="on('accountChanged')"
                  signature="on('accountChanged', handler: (publicKey: string) => void): void"
                  description="Listen for account changes when user switches accounts."
                  category="event"
                  example={`window.banano.on('accountChanged', (newPublicKey) => {
  console.log('Account changed to:', newPublicKey);
  // Refresh account-specific data
  refreshAccountData(newPublicKey);
});`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Error Handling */}
        <section id="errors" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Error Handling</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" className="size-5" />
                Standardized Error Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[var(--text-secondary)]">
                MonkeyMask follows EIP-1193 error standards for consistent error handling across dApps.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--panel)] rounded border border-[var(--border)]">
                    <div className="font-mono text-sm font-medium">4001 - User Rejected</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">User rejected the request</div>
                  </div>
                  <div className="p-3 bg-[var(--panel)] rounded border border-[var(--border)]">
                    <div className="font-mono text-sm font-medium">4100 - Unauthorized</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Not connected to MonkeyMask</div>
                  </div>
                  <div className="p-3 bg-[var(--panel)] rounded border border-[var(--border)]">
                    <div className="font-mono text-sm font-medium">4900 - Disconnected</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Provider is disconnected</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-[var(--panel)] rounded border border-[var(--border)]">
                    <div className="font-mono text-sm font-medium">-32602 - Invalid Params</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Invalid method parameters</div>
                  </div>
                  <div className="p-3 bg-[var(--panel)] rounded border border-[var(--border)]">
                    <div className="font-mono text-sm font-medium">-32603 - Internal Error</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Internal error occurred</div>
                  </div>
                </div>
              </div>

              <ExpandableSection 
                title="Error Handling Example" 
                icon="mdi:code-braces"
              >
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`try {
  const result = await window.banano.connect();
  console.log('Connected:', result.publicKey);
} catch (error) {
  switch (error.code) {
    case 4001:
      console.log('User rejected the connection request');
      break;
    case 4100:
      console.log('Please connect to MonkeyMask first');
      break;
    case 4900:
      console.log('MonkeyMask is disconnected');
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}`}</code>
                </pre>
              </ExpandableSection>
            </CardContent>
          </Card>
        </section>

        {/* Advanced Examples */}
        <section id="examples" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Advanced Examples</h2>
          
          <div className="space-y-6">
            <ExpandableSection 
              title="Complete Authentication Flow" 
              icon="mdi:shield-account"
            >
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Implement secure user authentication using message signing and server-side verification.
                </p>
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`// Client-side authentication
async function authenticateUser() {
  try {
    // 1. Connect to wallet
    const connection = await window.banano.connect();
    
    // 2. Create authentication message
    const timestamp = Date.now();
    const message = \`Login to MyApp at \${timestamp}\`;
    
    // 3. Sign the message
    const signature = await window.banano.signMessage(message, 'utf8');
    
    // 4. Send to server for verification
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature: Array.from(signature.signature, 
          byte => byte.toString(16).padStart(2, '0')
        ).join(''),
        publicKey: connection.publicKey,
        timestamp
      })
    });
    
    const result = await response.json();
    if (result.success) {
      localStorage.setItem('authToken', result.token);
      console.log('Authentication successful!');
    }
    
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}`}</code>
                </pre>
              </div>
            </ExpandableSection>

            <ExpandableSection 
              title="Server-Side Signature Verification" 
              icon="mdi:server"
            >
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Your dApp template includes a complete server-side verification endpoint.
                </p>
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`// Server-side verification (Next.js API route)
export async function POST(request) {
  const { message, signature, publicKey, origin } = await request.json();
  
  try {
    // Build domain-separated message (same as extension)
    const messageToVerify = \`MonkeyMask Signed Message:
Origin: \${origin}
Message: \${message}\`;
    
    // Verify using bananojs
    const isValid = bananojs.BananoUtil.verifyMessage(
      publicKey, 
      messageToVerify, 
      signature
    );
    
    if (isValid) {
      // Generate JWT token or session
      const token = generateAuthToken(publicKey);
      return Response.json({ success: true, token });
    } else {
      return Response.json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}`}</code>
                </pre>
              </div>
            </ExpandableSection>

            <ExpandableSection 
              title="BNS Integration Example" 
              icon="mdi:web"
            >
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Build user-friendly interfaces with BNS name resolution.
                </p>
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`// Smart address input with BNS support
async function handleAddressInput(input) {
  const addressInput = input.trim();
  
  // Check if it looks like a BNS name
  if (addressInput.includes('.ban') || addressInput.includes('.banano')) {
    try {
      setStatus('Resolving BNS name...');
      const resolvedAddress = await window.banano.resolveBNS(addressInput);
      
      setResolvedAddress(resolvedAddress);
      setStatus(\`Resolved to: \${resolvedAddress.slice(0, 10)}...\`);
      
      return resolvedAddress;
    } catch (error) {
      setStatus('BNS name not found');
      throw new Error(\`Failed to resolve BNS name: \${addressInput}\`);
    }
  } else if (addressInput.startsWith('ban_')) {
    // Regular Banano address
    setResolvedAddress(addressInput);
    return addressInput;
  } else {
    throw new Error('Invalid address or BNS name');
  }
}

// Use in transaction
async function sendToBNS(bnsName, amount) {
  try {
    const resolvedAddress = await handleAddressInput(bnsName);
    
    const result = await window.banano.sendTransaction(
      myAddress,
      resolvedAddress, // or just use bnsName directly
      amount
    );
    
    console.log(\`Sent \${amount} BAN to \${bnsName} (\${resolvedAddress})\`);
    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}`}</code>
                </pre>
              </div>
            </ExpandableSection>

            <ExpandableSection 
              title="Event-Driven dApp Architecture" 
              icon="mdi:lightning-bolt"
            >
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Build reactive dApps that respond to wallet state changes.
                </p>
                <pre className="text-sm bg-[var(--panel)] p-4 rounded border border-[var(--border)] overflow-x-auto">
                  <code>{`class WalletManager {
  constructor() {
    this.isConnected = false;
    this.currentAccount = null;
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    window.banano.on('connect', (data) => {
      this.isConnected = true;
      this.currentAccount = data.publicKey;
      this.onConnectionChange(true, data.publicKey);
    });
    
    window.banano.on('disconnect', () => {
      this.isConnected = false;
      this.currentAccount = null;
      this.onConnectionChange(false, null);
    });
    
    window.banano.on('accountChanged', (newAccount) => {
      this.currentAccount = newAccount;
      this.onAccountChange(newAccount);
    });
  }
  
  onConnectionChange(connected, account) {
    // Update UI
    document.getElementById('wallet-status').textContent = 
      connected ? \`Connected: \${account.slice(0, 10)}...\` : 'Not connected';
    
    // Enable/disable features
    document.querySelectorAll('.wallet-required').forEach(el => {
      el.disabled = !connected;
    });
    
    // Load account data
    if (connected) {
      this.loadAccountData(account);
    }
  }
  
  onAccountChange(newAccount) {
    console.log('Account changed to:', newAccount);
    // Refresh account-specific data
    this.loadAccountData(newAccount);
  }
  
  async loadAccountData(account) {
    try {
      const balance = await window.banano.getBalance(account);
      const accountInfo = await window.banano.getAccountInfo(account);
      
      // Update UI with new data
      this.updateAccountDisplay(balance, accountInfo);
    } catch (error) {
      console.error('Failed to load account data:', error);
    }
  }
}

// Initialize wallet manager
const walletManager = new WalletManager();`}</code>
                </pre>
              </div>
            </ExpandableSection>
          </div>
        </section>

        {/* Security Best Practices */}
        <section id="security" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Security Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:shield-check" className="size-5 text-green-500" />
                  Permission Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>Per-Origin Permissions:</strong> Each website requires explicit user approval</p>
                  <p><strong>Persistent Authorization:</strong> Approved connections survive browser restarts</p>
                  <p><strong>User Control:</strong> Users can revoke permissions anytime via Connected Sites</p>
                  <p><strong>No Auto-Approvals:</strong> Every transaction requires user confirmation</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:lock" className="size-5 text-blue-500" />
                  Wallet Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>Auto-Lock:</strong> Configurable timeouts (1/5/15/60 minutes)</p>
                  <p><strong>AES-256 Encryption:</strong> Private keys encrypted with PBKDF2</p>
                  <p><strong>Local Storage:</strong> Keys never leave the browser</p>
                  <p><strong>Secure Approval:</strong> Clear transaction previews</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="mdi:code-braces" className="size-5" />
                Developer Security Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-green-600">✅ Do</h4>
                  <ul className="text-sm space-y-1 text-[var(--text-secondary)]">
                    <li>• Always handle user rejection gracefully</li>
                    <li>• Verify signatures server-side for authentication</li>
                    <li>• Use domain-separated messages for signing</li>
                    <li>• Listen for disconnect events</li>
                    <li>• Implement proper error handling</li>
                    <li>• Show clear transaction details to users</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-red-600">❌ Don't</h4>
                  <ul className="text-sm space-y-1 text-[var(--text-secondary)]">
                    <li>• Never store private keys in your dApp</li>
                    <li>• Don't assume connection persists</li>
                    <li>• Avoid requesting unnecessary permissions</li>
                    <li>• Don't ignore error codes</li>
                    <li>• Never auto-submit transactions</li>
                    <li>• Don't trust client-side verification alone</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Extension Features */}
        <section id="extension-features" className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8">Extension Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:cog" className="size-5" />
                  Settings & Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  <li>• <strong>Auto-Lock Timer:</strong> 1, 5, 15, or 60 minutes</li>
                  <li>• <strong>Theme Options:</strong> Dark, Light, or Banano theme</li>
                  <li>• <strong>Connected Sites:</strong> Manage permissions per website</li>
                  <li>• <strong>Account Management:</strong> Multiple accounts with custom names</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon icon="mdi:apps" className="size-5" />
                  Built-in Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
                  <li>• <strong>Transaction History:</strong> View past transactions</li>
                  <li>• <strong>QR Code Generation:</strong> Share addresses easily</li>
                  <li>• <strong>Explore Screen:</strong> 50+ Banano ecosystem sites</li>
                  <li>• <strong>Faucet Integration:</strong> Built-in faucet access</li>
                  <li>• <strong>NFT Display:</strong> View Banano NFTs (coming soon)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <section className="max-w-4xl mx-auto text-center py-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Ready to build with MonkeyMask?</h3>
            <p className="text-[var(--text-secondary)]">
              Join the growing Banano ecosystem and create amazing dApps with enterprise-grade wallet integration.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="secondary" size="md" asChild>
                <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                  <Icon icon="mdi:github" className="size-5" /> View on GitHub
                </Link>
              </Button>
              <Button variant="outline" size="md" asChild>
                <Link href="https://banano.cc" target="_blank">
                  <Icon icon="mdi:web" className="size-5" /> Learn about Banano
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


