'use client';

import { useMonkeyMask } from '@/hooks/useMonkeyMask';

export function WalletConnection() {
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    error,
    connect,
    disconnect,
    refreshBalance,
    isMonkeyMaskInstalled,
    clearError
  } = useMonkeyMask();

  if (!isMonkeyMaskInstalled) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">❌</div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-100">MonkeyMask Not Found</h3>
            <p className="text-neutral-400 mt-1">
              Please install the MonkeyMask browser extension to use this dApp.
            </p>
            <a 
              href="#" 
              className="inline-block mt-3 px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Install MonkeyMask
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isExtensionContextError = error.includes('Extension connection lost') || 
                                   error.includes('Extension context invalidated') ||
                                   error.includes('refresh the page');
    
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{isExtensionContextError ? '🔄' : '⚠️'}</div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-100">
                {isExtensionContextError ? 'Extension Connection Lost' : 'Connection Error'}
              </h3>
              <p className="text-neutral-400 mt-1">{error}</p>
              {isExtensionContextError && (
                <div className="mt-3 space-x-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 text-sm bg-neutral-700 text-neutral-100 rounded hover:bg-neutral-600 transition-colors"
                  >
                    🔄 Refresh Page
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={clearError}
            className="px-3 py-1 text-sm bg-neutral-800 text-neutral-100 rounded hover:bg-neutral-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🐒</div>
            <div>
              <h3 className="text-xl font-bold text-neutral-100">Connect Your Wallet</h3>
              <p className="text-neutral-400 mt-1">
                Connect MonkeyMask to interact with this dApp
              </p>
            </div>
          </div>
          <button
            onClick={() => connect()}
            disabled={isConnecting}
            className="px-6 py-3 bg-neutral-800 text-neutral-100 rounded-lg font-semibold hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-400 border-t-transparent"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              '🔗 Connect Wallet'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-100">Wallet Connected</h3>
            <div className="text-neutral-300 mt-1">
              <p className="font-mono text-sm bg-neutral-800 px-2 py-1 rounded inline-block">
                {publicKey ? `${publicKey.slice(0, 12)}...${publicKey.slice(-8)}` : 'Loading...'}
              </p>
              {balance && (
                <p className="mt-2">
                  <span className="font-semibold">Balance:</span> {balance} BAN
                  <button
                    onClick={refreshBalance}
                    className="ml-2 text-xs bg-neutral-800 text-neutral-100 px-2 py-1 rounded hover:bg-neutral-700 transition-colors"
                  >
                    🔄 Refresh
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
