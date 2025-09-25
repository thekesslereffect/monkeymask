'use client';

import React, { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Alert } from '@/components/ui';
import { Header } from '@/components/pages/Header';
import { TryMe } from '@/components/pages/TryMe';
import { Icon } from "@iconify/react";
import Link from 'next/link';
import { DonateButton } from '@/components/DonateButton';
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

      <main className="mx-auto max-w-[1500px] px-4 py-12 md:py-20 space-y-30">
        {/* Hero */}
        <TryMe className="fixed top-24 right-30  hidden md:flex" />
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
            
              <Button variant="default" size="lg" asChild>
                <Link href={`https://chromewebstore.google.com/detail/monkeymask-banano-wallet/chnnondadbnicokkohghndeabhjendci`} target='blank'>
                  <svg xmlns="http://www.w3.org/2000/svg" className='size-6' width="128" height="128" viewBox="0 0 128 128"><path fill="#f9fafb" d="M120.74 54.67c-2.23-1.23-5.19-1.94-7.73-1.68c-2.76-10.67-8.59-20.73-16.54-27.63C87.9 17.91 75.83 14.11 64 14.14c-11.82-.03-23.9 3.77-32.47 11.22c-7.96 6.9-13.79 16.96-16.54 27.63c-2.53-.26-5.49.45-7.73 1.68C.99 58.13-.45 66.45 1.03 73.42c1.18 5.55 4.39 9.72 11.01 11.38c1.28.32 2.44.35 3.45.26c1.85 5.83 4.94 11.18 9.83 15.6c5.81 5.26 13.05 8.82 20.5 10.76c2.84.74 10.16 2.45 17.83 2.45c7.68 0 15.71-1.71 18.54-2.45c7.46-1.94 14.69-5.5 20.5-10.76c4.89-4.43 7.98-9.77 9.83-15.6c1.01.09 2.17.06 3.44-.26c6.62-1.66 9.84-5.83 11.02-11.38c1.47-6.97.04-15.28-6.24-18.75"/><path fill="" d="M6.51 69.82c-.71-7.44 4.04-9.24 7.17-9.62c-.15 1.18-.32 2.36-.38 3.54c-.28 4.96-.14 9.94.63 14.73c-4.25.57-6.89-3.08-7.42-8.65M85.76 100c-6.46 3.3-14.38 4.56-21.76 4.41c-7.38.15-15.3-1.11-21.76-4.41c-6.54-3.34-13.07-9.29-12.59-18.11c.17-3.23 1.74-6.23 2.14-9.44c.42-3.38.38-7.79-.51-11.08c-1.14-4.23-1.69-8.46-.12-12.64c1.67-4.48 4.63-8.32 8.86-9.85c1.5-.54 3.16-.5 4.71-.62c6.7-.54 12.61 6.7 19.29 6.48c6.67.22 12.58-7.02 19.28-6.48c1.55.13 3.21.08 4.71.62c4.22 1.53 7.19 5.37 8.87 9.85c1.55 4.18 1.01 8.42-.12 12.64c-.9 3.29-.94 7.69-.52 11.08c.4 3.22 1.97 6.22 2.14 9.44c.45 8.83-6.08 14.78-12.62 18.11m35.74-30.18c-.54 5.57-3.18 9.23-7.43 8.65c.78-4.78.92-9.76.64-14.73c-.07-1.18-.24-2.36-.38-3.54c3.13.39 7.88 2.18 7.17 9.62"/><path fill="" d="M82.52 80.68c-6.28-2.16-19.73-2.3-28.56-1.27c-21.27 2.48-14.15 11.86-1.36 15.43c3.88 1.08 8.92 1.75 14.59 1.38c9.28-.59 12.57-2.38 15.84-4.56c5.24-3.5 7.12-8.36-.51-10.98"/><path fill="" d="M48.32 68.35c3.4 0 6.16-3.33 6.16-7.42c0-4.11-2.76-7.43-6.16-7.43c-3.39 0-6.15 3.32-6.15 7.43c0 4.1 2.76 7.42 6.15 7.42m31.36 0c3.39 0 6.15-3.33 6.15-7.42c0-4.11-2.76-7.43-6.15-7.43c-3.41 0-6.15 3.32-6.15 7.43c0 4.1 2.75 7.42 6.15 7.42m-18.17 6.4c.85.41 1.95.65 3.2.51c2.03-.22 2.75-.88 3.46-1.69c1.14-1.3 1.56-3.1-.11-4.08c-1.38-.8-4.33-.85-6.25-.46c-4.66.92-3.1 4.4-.3 5.72"/></svg>
                  <span>Get MonKeyMask</span>
                </Link>
              </Button>
              
            
              <a href="#api" className="inline-flex">
                <Button variant="outline" size="md">
                  <Icon icon="cuida:unfold-horizontal-outline" className="size-6" /> <span>API Reference</span>
                </Button>
              </a>
              <Button variant="ghost" size="md" asChild>
              <Link href="https://github.com/thekesslereffect/monkeymask" target="_blank">
                <Icon icon="mdi:github" className="size-6" /> Github
              </Link>
            </Button>
              
              {/* <a href="#installation" className="inline-flex">
                <Button variant="outline" size="sm">
                  <Icon icon="mdi:download" className="size-6" /> <span>Install</span>
                </Button>
              </a> */}
              
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
                    <li>Enable Developer mode</li>
                    <li>Click Load Unpacked and select the <code>dist</code> folder</li>
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
                  <code>{`// providers/index.tsx
import { MonkeyMaskProvider } from './MonkeyMaskProvider';

export function Providers({ children }) {
  return (
    <MonkeyMaskProvider
      config={{
        autoConnect: true,
        onConnect: (publicKey) => {
          console.log('Wallet connected:', publicKey);
        },
        onDisconnect: () => {
          console.log('Wallet disconnected');
        },
        onError: (error) => {
          console.error('Wallet error:', error);
        },
      }}
    >
      {children}
    </MonkeyMaskProvider>
  );
}

// app/layout.tsx
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
                  <code>{`// Use the pre-built ConnectButton component
import { ConnectButton } from '@/components/ConnectButton';

export default function Page() {
  return (
    <div>
      <h1>My Banano dApp</h1>
      <ConnectButton />
    </div>
  );
}

// Or create a custom connect button
import { useMonkeyMask } from '@/providers';

function CustomConnectButton() {
  const { 
    isConnected, 
    isConnecting, 
    publicKey, 
    connect, 
    disconnect, 
    error, 
    clearError,
    isInstalled 
  } = useMonkeyMask();

  if (!isInstalled) {
    return <button>Install MonkeyMask</button>;
  }

  if (error) {
    return <button onClick={clearError}>Error — Dismiss</button>;
  }

  if (isConnected && publicKey) {
    return (
      <button onClick={disconnect}>
        {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
      </button>
    );
  }

  return (
    <button onClick={connect} disabled={isConnecting}>
      {isConnecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
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
        <section id="features" className="max-w-5xl mx-auto flex flex-col justify-center items-center md:block">
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
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function MyComponent() {
  const { connect, isConnected, publicKey } = useMonkeyMask();

  const handleConnect = async () => {
    try {
      await connect();
      console.log('Connected:', publicKey);
    } catch (error) {
      console.log('Connection failed:', error.message);
    }
  };

  return (
    <button onClick={handleConnect} disabled={isConnected}>
      {isConnected ? 'Connected' : 'Connect Wallet'}
    </button>
  );
}`}
                />

                <ApiMethod
                  name="disconnect()"
                  signature="disconnect(): Promise<void>"
                  description="Disconnect from the wallet and clear the connection state."
                  returns="Promise<void>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function DisconnectButton() {
  const { disconnect, isConnected } = useMonkeyMask();

  const handleDisconnect = async () => {
    await disconnect();
    console.log('Disconnected from wallet');
  };

  return (
    <button onClick={handleDisconnect} disabled={!isConnected}>
      Disconnect
    </button>
  );
}`}
                />

                <ApiMethod
                  name="isConnected"
                  signature="readonly isConnected: boolean"
                  description="Current connection status to the wallet."
                  category="property"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function ConnectionStatus() {
  const { isConnected } = useMonkeyMask();

  return (
    <div>
      {isConnected ? (
        <span>✅ Wallet is connected</span>
      ) : (
        <span>❌ Wallet is not connected</span>
      )}
    </div>
  );
}`}
                />

                <ApiMethod
                  name="publicKey"
                  signature="readonly publicKey: string | null"
                  description="The public key of the currently connected account."
                  category="property"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function AccountDisplay() {
  const { publicKey, isConnected } = useMonkeyMask();

  if (!isConnected || !publicKey) {
    return <div>No account connected</div>;
  }

  return (
    <div>
      Current account: {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
    </div>
  );
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
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function AccountsList() {
  const { getAccounts, isConnected } = useMonkeyMask();
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (isConnected) {
      getAccounts().then(setAccounts);
    }
  }, [isConnected, getAccounts]);

  return (
    <div>
      <h3>Connected Accounts ({accounts.length})</h3>
      {accounts.map((account, index) => (
        <div key={index}>{account}</div>
      ))}
    </div>
  );
}`}
                />

                <ApiMethod
                  name="getBalance()"
                  signature="getBalance(address?: string): Promise<string | null>"
                  description="Get the balance for an account. Uses connected account if no address provided."
                  returns="Promise<string | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function BalanceDisplay() {
  const { getBalance, publicKey, isConnected } = useMonkeyMask();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshBalance = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (error) {
      console.error('Failed to get balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [isConnected]);

  return (
    <div>
      <div>Balance: {loading ? 'Loading...' : balance || '0'} BAN</div>
      <button onClick={refreshBalance}>Refresh</button>
    </div>
  );
}`}
                />

                <ApiMethod
                  name="getAccountInfo()"
                  signature="getAccountInfo(address?: string): Promise<AccountInfo | null>"
                  description="Get detailed account information including balance, pending, and raw values."
                  returns="Promise<AccountInfo | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function AccountInfo() {
  const { getAccountInfo, isConnected } = useMonkeyMask();
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAccountInfo = async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const info = await getAccountInfo();
      setAccountInfo(info);
      console.log('Account info:', info);
    } catch (error) {
      console.error('Failed to get account info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, [isConnected]);

  return (
    <div>
      {loading ? (
        <div>Loading account info...</div>
      ) : accountInfo ? (
        <div>
          <div>Address: {accountInfo.address}</div>
          <div>Balance: {accountInfo.balance} BAN</div>
          <div>Pending: {accountInfo.pending} BAN</div>
          <div>Representative: {accountInfo.representative}</div>
        </div>
      ) : (
        <div>No account info available</div>
      )}
    </div>
  );
}`}
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
                  signature="sendTransaction(to: string, amount: string): Promise<string | null>"
                  description="Send a Banano transaction. Supports BNS name resolution for the recipient. Uses the currently connected account as sender."
                  returns="Promise<string | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function SendForm() {
  const { sendTransaction, isConnected } = useMonkeyMask();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    
    setSending(true);
    try {
      // Supports both Banano addresses and BNS names
      const hash = await sendTransaction(recipient, amount);
      if (hash) {
        console.log('Transaction sent:', hash);
        alert('Transaction sent successfully!');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend}>
      <input 
        value={recipient} 
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="ban_1... or username.ban" 
      />
      <input 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in BAN" 
      />
      <button type="submit" disabled={!isConnected || sending}>
        {sending ? 'Sending...' : 'Send Transaction'}
      </button>
    </form>
  );
}`}
                />

                <ApiMethod
                  name="signMessage()"
                  signature="signMessage(message: string, encoding?: 'utf8' | 'hex'): Promise<string | null>"
                  description="Sign an arbitrary message for authentication or verification purposes. Returns signature as hex string."
                  returns="Promise<string | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function MessageSigner() {
  const { signMessage, isConnected } = useMonkeyMask();
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!message.trim()) return;
    
    setSigning(true);
    try {
      // Sign the message (returns hex string)
      const sig = await signMessage(message);
      if (sig) {
        setSignature(sig);
        console.log('Message signed:', sig);
      }
    } catch (error) {
      console.error('Signing failed:', error);
      alert('Signing failed: ' + error.message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div>
      <textarea 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message to sign..."
      />
      <button onClick={handleSign} disabled={!isConnected || signing}>
        {signing ? 'Signing...' : 'Sign Message'}
      </button>
      {signature && (
        <div>
          <strong>Signature:</strong>
          <div style={{wordBreak: 'break-all'}}>{signature}</div>
        </div>
      )}
    </div>
  );
}`}
                />

                <ApiMethod
                  name="signBlock()"
                  signature="signBlock(block: Block): Promise<SignBlockResult>"
                  description="Sign a pre-constructed Banano block for advanced use cases."
                  returns="Promise<SignBlockResult>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function BlockSigner() {
  const { signBlock, isConnected } = useMonkeyMask();
  const [signedBlock, setSignedBlock] = useState(null);
  const [signing, setSigning] = useState(false);

  const handleSignBlock = async () => {
    const block = {
      type: 'send',
      account: 'ban_1sender...',
      previous: 'ABC123...',
      representative: 'ban_1rep...',
      balance: '1000000000000000000000000000',
      link: 'ban_1recipient...'
    };

    setSigning(true);
    try {
      const result = await signBlock(block);
      setSignedBlock(result);
      console.log('Signed block:', result);
    } catch (error) {
      console.error('Block signing failed:', error);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div>
      <button onClick={handleSignBlock} disabled={!isConnected || signing}>
        {signing ? 'Signing Block...' : 'Sign Block'}
      </button>
      {signedBlock && (
        <div>
          <strong>Signed Block Hash:</strong> {signedBlock.hash}
        </div>
      )}
    </div>
  );
}`}
                />

                <ApiMethod
                  name="sendBlock()"
                  signature="sendBlock(block: Block): Promise<string>"
                  description="Send a pre-signed block to the network."
                  returns="Promise<string>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function BlockSender() {
  const { signBlock, sendBlock, isConnected } = useMonkeyMask();
  const [blockHash, setBlockHash] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendBlock = async () => {
    const block = {
      type: 'send',
      account: 'ban_1sender...',
      previous: 'ABC123...',
      representative: 'ban_1rep...',
      balance: '1000000000000000000000000000',
      link: 'ban_1recipient...'
    };

    setSending(true);
    try {
      // First sign the block
      const signedBlock = await signBlock(block);
      
      // Then send it to the network
      const hash = await sendBlock(signedBlock);
      setBlockHash(hash);
      console.log('Block hash:', hash);
    } catch (error) {
      console.error('Block sending failed:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <button onClick={handleSendBlock} disabled={!isConnected || sending}>
        {sending ? 'Sending Block...' : 'Sign & Send Block'}
      </button>
      {blockHash && (
        <div>
          <strong>Block Hash:</strong> {blockHash}
        </div>
      )}
    </div>
  );
}`}
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
                  signature="resolveBNS(bnsName: string): Promise<string | null>"
                  description="Resolve a BNS name to a Banano address. Supports .ban and .banano domains."
                  returns="Promise<string | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function BNSResolver() {
  const { resolveBNS } = useMonkeyMask();
  const [bnsName, setBnsName] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!bnsName.trim()) return;
    
    setResolving(true);
    try {
      const address = await resolveBNS(bnsName);
      if (address) {
        setResolvedAddress(address);
        console.log(\`\${bnsName} resolves to \${address}\`);
      } else {
        setResolvedAddress('Not found');
      }
    } catch (error) {
      console.error('BNS resolution failed:', error);
      setResolvedAddress('Not found');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div>
      <input 
        value={bnsName}
        onChange={(e) => setBnsName(e.target.value)}
        placeholder="username.ban or name.banano"
      />
      <button onClick={handleResolve} disabled={resolving}>
        {resolving ? 'Resolving...' : 'Resolve BNS'}
      </button>
      {resolvedAddress && (
        <div>
          <strong>Resolved:</strong> {resolvedAddress}
        </div>
      )}
    </div>
  );
}`}
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
                  signature="verifySignedMessage(message: string, signatureHex: string, publicKey?: string, encoding?: 'utf8' | 'hex'): Promise<boolean | null>"
                  description="Verify a signed message against a public key. Uses connected account's public key if not provided. Useful for authentication flows."
                  returns="Promise<boolean | null>"
                  example={`// Using the React hook
import { useMonkeyMask } from '@/providers';

function SignatureVerifier() {
  const { verifySignedMessage } = useMonkeyMask();
  const [message, setMessage] = useState('Login to MyApp at 1234567890');
  const [signature, setSignature] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!message || !signature || !publicKey) return;
    
    setVerifying(true);
    try {
      const isValid = await verifySignedMessage(message, signature, publicKey);
      setVerificationResult(isValid);
      
      if (isValid === true) {
        console.log('Signature is valid - user authenticated!');
      } else if (isValid === false) {
        console.log('Invalid signature');
      } else {
        console.log('Verification failed');
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message to verify"
      />
      <input 
        value={signature}
        onChange={(e) => setSignature(e.target.value)}
        placeholder="Signature (hex)"
      />
      <input 
        value={publicKey}
        onChange={(e) => setPublicKey(e.target.value)}
        placeholder="Public key"
      />
      <button onClick={handleVerify} disabled={verifying}>
        {verifying ? 'Verifying...' : 'Verify Signature'}
      </button>
      
      {verificationResult !== null && (
        <div style={{color: verificationResult ? 'green' : 'red'}}>
          {verificationResult ? '✅ Valid signature' : '❌ Invalid signature'}
        </div>
      )}
    </div>
  );
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
                  example={`// Using the React hook with config
import { MonkeyMaskProvider } from '@/providers';

function App() {
  const config = {
    onConnect: (publicKey) => {
      console.log('Wallet connected:', publicKey);
      // Update UI or trigger side effects
      toast.success('Wallet connected successfully!');
    }
  };

  return (
    <MonkeyMaskProvider config={config}>
      <YourAppComponents />
    </MonkeyMaskProvider>
  );
}

// Or listen for connection state changes in components
function ConnectionListener() {
  const { isConnected, publicKey } = useMonkeyMask();
  
  useEffect(() => {
    if (isConnected && publicKey) {
      console.log('Connected to:', publicKey);
    }
  }, [isConnected, publicKey]);
  
  return null;
}`}
                />

                <ApiMethod
                  name="on('disconnect')"
                  signature="on('disconnect', handler: () => void): void"
                  description="Listen for wallet disconnection events."
                  category="event"
                  example={`// Using the React hook with config
import { MonkeyMaskProvider } from '@/providers';

function App() {
  const config = {
    onDisconnect: () => {
      console.log('Wallet disconnected');
      // Update UI or trigger side effects
      toast.info('Wallet disconnected');
    }
  };

  return (
    <MonkeyMaskProvider config={config}>
      <YourAppComponents />
    </MonkeyMaskProvider>
  );
}

// Or listen for disconnection in components
function DisconnectionListener() {
  const { isConnected } = useMonkeyMask();
  
  useEffect(() => {
    if (!isConnected) {
      console.log('Wallet is disconnected');
    }
  }, [isConnected]);
  
  return null;
}`}
                />

                <ApiMethod
                  name="on('accountChanged')"
                  signature="on('accountChanged', handler: (publicKey: string) => void): void"
                  description="Listen for account changes when user switches accounts. Note: The new per-account permission system uses disconnect -> connect flow for better security."
                  category="event"
                  example={`// Account changes are handled automatically by the provider
// The provider will emit disconnect -> connect events when accounts change
// This ensures proper permission handling per account

function AccountChangeListener() {
  const { publicKey, isConnected } = useMonkeyMask();
  
  useEffect(() => {
    if (isConnected && publicKey) {
      console.log('Connected to account:', publicKey);
      // Refresh account-specific data
    } else {
      console.log('Disconnected from wallet');
      // Clear account-specific data
    }
  }, [isConnected, publicKey]);
  
  return null;
}

// The provider config handles connection events
function App() {
  const config = {
    onConnect: (publicKey) => {
      console.log('Wallet connected:', publicKey);
      // Update UI or trigger side effects
    },
    onDisconnect: () => {
      console.log('Wallet disconnected');
      // Update UI or trigger side effects
    }
  };

  return (
    <MonkeyMaskProvider config={config}>
      <YourAppComponents />
    </MonkeyMaskProvider>
  );
}`}
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
  await connect();
  console.log('Connected successfully!');
} catch (err) {
  // Error is automatically handled by the provider
  // and available via the error state
  console.error('Connection failed:', err.message);
}

// The provider automatically handles standard error codes:
// 4001: User rejected request
// 4100: Not connected to MonkeyMask  
// 4900: Provider disconnected
// -32602: Invalid parameters
// -32603: Internal error

// Access errors via the hook:
const { connect, error, clearError } = useMonkeyMask();

return (
  <div>
    <button onClick={handleConnect}>Connect Wallet</button>
    {error && (
      <div style={{color: 'red'}}>
        Error: {error}
        <button onClick={clearError}>Dismiss</button>
      </div>
    )}
  </div>
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
                  <code>{`// Client-side authentication using React hook
import { useMonkeyMask } from '@/providers';

function AuthenticationComponent() {
  const { connect, signMessage, isConnected } = useMonkeyMask();

  const authenticateUser = async () => {
    try {
      // 1. Connect to wallet
      if (!isConnected) {
        await connect();
      }
      
      // 2. Create authentication message
      const timestamp = Date.now();
      const message = \`Login to MyApp at \${timestamp}\`;
      
      // 3. Sign the message
      const signature = await signMessage(message);
      if (!signature) throw new Error('Failed to sign message');
    
    // 4. Send to server for verification
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        signature, // Already a hex string
        publicKey: publicKey,
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
                  <code>{`// Smart address input with BNS support using React hook
import { useMonkeyMask } from '@/providers';

function SmartAddressInput() {
  const { resolveBNS } = useMonkeyMask();
  const [status, setStatus] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');

  const handleAddressInput = async (input) => {
    const addressInput = input.trim();
    
    // Check if it looks like a BNS name
    if (addressInput.includes('.ban') || addressInput.includes('.banano')) {
      try {
        setStatus('Resolving BNS name...');
        const resolvedAddress = await resolveBNS(addressInput);
      
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
  const sendToBNS = async (bnsName, amount) => {
    try {
      const resolvedAddress = await handleAddressInput(bnsName);
      
      const result = await sendTransaction(
        bnsName, // MonkeyMask handles BNS resolution automatically
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
                  <code>{`// Event-driven architecture using React hooks
import { useMonkeyMask } from '@/providers';

function WalletManager() {
  const { isConnected, publicKey } = useMonkeyMask();
  const [walletStatus, setWalletStatus] = useState('Not connected');
  
  // React to connection changes
  useEffect(() => {
    if (isConnected && publicKey) {
      setWalletStatus(\`Connected: \${publicKey.slice(0, 10)}...\`);
      onConnectionChange(true, publicKey);
    } else {
      setWalletStatus('Not connected');
      onConnectionChange(false, null);
    }
  }, [isConnected, publicKey]);
  
  // React to account changes
  useEffect(() => {
    if (publicKey) {
      onAccountChange(publicKey);
    }
  }, [publicKey]);
  
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
  
  const loadAccountData = async (account) => {
    try {
      const balance = await getBalance(account);
      const accountInfo = await getAccountInfo(account);
      
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
        <section id="security" className="max-w-4xl mx-auto  flex flex-col justify-center items-center md:block">
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
                  <h4 className="font-medium mb-2 text-red-600">{`❌ Don't`}</h4>
                  <ul className="text-sm space-y-1 text-[var(--text-secondary)]">
                    <li>• Never store private keys in your dApp</li>
                    <li>• {`Don't assume connection persists`}</li>
                    <li>• Avoid requesting unnecessary permissions</li>
                    <li>• {`Don't ignore error codes`}</li>
                    <li>• Never auto-submit transactions</li>
                    <li>• {`Don't trust client-side verification alone`}</li>
                  </ul>
                </div>
              </div>
                  </CardContent>
                </Card>
        </section>

        {/* Extension Features */}
        <section id="extension-features" className="max-w-4xl mx-auto flex flex-col justify-center items-center md:block">
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
        <DonateButton />
      </main>
    </div>
  );
}


