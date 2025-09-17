'use client';

import { useState } from 'react';
import { WalletConnection } from '@/components/WalletConnection';
import { ApiTester } from '@/components/ApiTester';
import { Documentation } from '@/components/Documentation';

type Tab = 'demo' | 'docs';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('demo');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🐒</div>
              <div>
                <h1 className="text-xl font-bold text-neutral-100">MonkeyMask dApp Template</h1>
                <p className="text-sm text-neutral-400">Professional Banano wallet integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('demo')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'demo'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                🚀 Demo
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'docs'
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                📚 Documentation
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'demo' ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl">
              <div className="text-6xl mb-4">🐒</div>
              <h2 className="text-4xl font-bold mb-4">MonkeyMask Integration Demo</h2>
              <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
                Experience the power of MonkeyMask wallet integration. This demo showcases all available 
                API methods and provides a foundation for building your own Banano dApps.
              </p>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 text-center">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="font-semibold text-neutral-200 mb-2">Secure Connection</h3>
                <p className="text-sm text-neutral-400">
                  Enterprise-grade security with per-origin permissions and user approval flows
                </p>
              </div>
              <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-neutral-200 mb-2">Complete API</h3>
                <p className="text-sm text-neutral-400">
                  Full access to wallet functionality including signing, transactions, and BNS resolution
                </p>
              </div>
              <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="font-semibold text-neutral-200 mb-2">Modern UI</h3>
                <p className="text-sm text-neutral-400">
                  Beautiful, responsive components built with React and Tailwind CSS
                </p>
              </div>
            </div>

            {/* Wallet Connection */}
            <WalletConnection />

            {/* API Tester */}
            <ApiTester />
          </div>
        ) : (
          <Documentation />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="text-2xl">🐒</div>
              <div>
                <div className="font-semibold text-neutral-200">MonkeyMask dApp Template</div>
                <div className="text-sm text-neutral-500">Built for the Banano ecosystem</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a 
                href="https://github.com/your-org/monkeymask" 
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="text-lg">📱</span> Extension
              </a>
              <a 
                href="https://github.com/your-org/monkeymask-dapp-template" 
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="text-lg">💻</span> Source Code
              </a>
              <a 
                href="https://banano.cc" 
                className="text-neutral-400 hover:text-neutral-200 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="text-lg">🍌</span> Banano
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}