'use client';

import React from 'react';

/**
 * Quick start guide component showing developers how to use MonkeyMask.
 * Clean, simple documentation with code examples.
 */
export function QuickStart() {
  return (
    <div className="container max-w-4xl py-2 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          🐒 MonkeyMask Integration
        </h1>
        <p className="text-lg muted">
          Dead simple Banano wallet integration for your dApp
        </p>
      </div>

      {/* Quick Setup */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">
          🚀 Quick Setup (3 steps)
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">
              1. Wrap your app with providers
            </h3>
            <pre className="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-md text-sm overflow-x-auto">
              <code>{`// app/layout.tsx
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
}`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">
              2. Add the wallet connect button
            </h3>
            <pre className="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-md text-sm overflow-x-auto">
              <code>{`// Any component
import { WalletConnectButton } from '@/components/WalletConnectButton';

export default function MyPage() {
  return <WalletConnectButton />;
}`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">
              3. Use the wallet in your components
            </h3>
            <pre className="bg-[var(--panel)] border border-[var(--border)] p-4 rounded-md text-sm overflow-x-auto">
              <code>{`// Any component
import { useMonkeyMask } from '@/providers';

export default function MyComponent() {
  const { 
    isConnected, 
    publicKey, 
    accounts,
    getAccounts,
    getBalance, 
    getAccountInfo,
    sendTransaction, 
    signMessage,
    signBlock,
    sendBlock
  } = useMonkeyMask();
  
  const handleSend = async () => {
    if (!isConnected) return;
    // Supports both regular addresses and BNS names
    await sendTransaction('username.ban', '1.0'); // or 'ban_1abc...'
  };
  
  return (
    <div>
      {isConnected ? (
        <p>Connected: {publicKey}</p>
      ) : (
        <p>Not connected</p>
      )}
    </div>
  );
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Available Methods */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">
          📚 Available Methods
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <h3 className="font-medium">Connection</h3>
            <ul className="space-y-1 text-sm muted">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">isConnected</code> - Connection status</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">publicKey</code> - Current wallet address</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">accounts</code> - All connected accounts</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">connect()</code> - Connect wallet</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">disconnect()</code> - Disconnect wallet</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Account Methods</h3>
            <ul className="space-y-1 text-sm muted">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getAccounts()</code> - Get all connected accounts</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getBalance()</code> - Get wallet balance</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getAccountInfo()</code> - Get detailed account info</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Transaction Methods</h3>
            <ul className="space-y-1 text-sm muted">
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">sendTransaction()</code> - Send BAN (supports BNS)</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">signMessage()</code> - Sign text message</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">signBlock()</code> - Sign a block</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">sendBlock()</code> - Send a signed block</li>
              <li><code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">resolveBNS()</code> - Resolve BNS name to address</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">
          ✨ Features
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[var(--elevated)] rounded-md border border-[var(--border)]">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-medium mb-1">Secure</h3>
            <p className="text-sm muted">
              All signing happens in the wallet extension
            </p>
          </div>
          
          <div className="text-center p-4 bg-[var(--elevated)] rounded-md border border-[var(--border)]">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-medium mb-1">Simple</h3>
            <p className="text-sm muted">
              3 lines of code to get started
            </p>
          </div>
          
          <div className="text-center p-4 bg-[var(--elevated)] rounded-md border border-[var(--border)]">
            <div className="text-2xl mb-2">🌐</div>
            <h3 className="font-medium mb-1">BNS Support</h3>
            <p className="text-sm muted">
              Send to username.ban addresses
            </p>
          </div>
        </div>
      </section>

      {/* Wallet Locking Behavior */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          🔒 Wallet Locking Behavior
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded border border-[var(--border)] bg-[var(--elevated)]">
            <h3 className="font-semibold text-green-400 mb-2">✅ Always Available</h3>
            <ul className="space-y-1 text-sm muted">
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">connect()</code> - Works when locked</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getBalance()</code> - Works when locked</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getAccountInfo()</code> - Works when locked</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">getAccounts()</code> - Works when locked</li>
            </ul>
          </div>
          
          <div className="p-4 rounded border border-[var(--border)] bg-[var(--elevated)]">
            <h3 className="font-semibold text-amber-400 mb-2">🔓 Requires Unlock</h3>
            <ul className="space-y-1 text-sm muted">
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">sendTransaction()</code> - Opens unlock popup</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">signMessage()</code> - Opens unlock popup</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">signBlock()</code> - Opens unlock popup</li>
              <li>• <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">sendBlock()</code> - Opens unlock popup</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 rounded border border-blue-500/20 bg-blue-500/10">
          <p className="text-sm">
            <strong>💡 Smart UX:</strong> Users can stay connected to your dApp even when their wallet is locked. 
            When they try to make a transaction, the extension automatically opens and prompts them to unlock.
          </p>
          <p className="text-sm mt-2">
            <strong>⏱️ Timeouts:</strong> Transaction and signing operations have a 15-minute timeout to allow for wallet unlocking and user approval.
          </p>
        </div>
      </section>
    </div>
  );
}
