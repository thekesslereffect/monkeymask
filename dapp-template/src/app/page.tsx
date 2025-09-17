'use client';

import React, { useState } from 'react';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { QuickStart } from '@/components/QuickStart';
import { WalletInfo, SendTransaction, SignMessage } from '@/components/examples';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'guide' | 'examples'>('guide');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--elevated)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--elevated)]/70">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🐒</div>
              <div>
                <h1 className="text-xl font-bold">MonkeyMask dApp Template</h1>
                <p className="text-sm muted">Simple Banano wallet integration</p>
              </div>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-[var(--border)] bg-[var(--elevated)]">
        <div className="container">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('guide')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'guide'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--heading)]'
              }`}
            >
              📚 Quick Start Guide
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'examples'
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--heading)]'
              }`}
            >
              🧪 Live Examples
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container py-10">
        {activeTab === 'guide' && <QuickStart />}
        
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                🧪 Live Examples
              </h2>
              <p className="muted">
                Interactive examples showing MonkeyMask integration in action
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <WalletInfo />
                <SendTransaction />
              </div>
              <div className="space-y-6">
                <SignMessage />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--elevated)] mt-16">
        <div className="container py-10">
          <div className="text-center muted">
            <p className="mb-2">
              Built with ❤️ for the Banano community
            </p>
            <p className="text-sm">
              This template provides everything you need to build dApps with MonkeyMask
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}