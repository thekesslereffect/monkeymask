'use client';

import React from 'react';
import { useMonkeyMask } from '@/providers';

interface WalletConnectButtonProps {
  className?: string;
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
}

/**
 * Simple wallet connect button component.
 * Handles all connection logic automatically using the MonkeyMask provider.
 * 
 * Usage:
 * ```tsx
 * import { WalletConnectButton } from '@/components/WalletConnectButton';
 * 
 * export default function MyPage() {
 *   return (
 *     <div>
 *       <WalletConnectButton 
 *         onConnect={(publicKey) => console.log('Connected:', publicKey)}
 *         onDisconnect={() => console.log('Disconnected')}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function WalletConnectButton({ 
  className = '', 
  onConnect,
  onDisconnect 
}: WalletConnectButtonProps) {
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

  const handleConnect = async () => {
    clearError();
    await connect();
    if (publicKey) {
      onConnect?.(publicKey);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect?.();
  };

  // Installation prompt
  if (!isInstalled) {
    return (
      <div className={`flex flex-col items-center space-y-3 ${className}`}>
        <div className="text-left card px-4 py-3">
          <h3 className="text-sm font-medium">MonkeyMask Not Detected</h3>
          <p className="text-xs muted mt-1">
            Please install the MonkeyMask browser extension to continue.
          </p>
          <a
            href="https://github.com/your-repo/monkeymask"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center mt-3 px-3 py-2 bg-[var(--accent)] hover:opacity-90 text-black font-medium rounded-md transition-colors"
          >
            🐒 Install MonkeyMask
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️ Connection Error</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="flex space-x-2">
            <button
              onClick={clearError}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Dismiss
            </button>
            {error.includes('refresh') && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  if (isConnected && publicKey) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <button
          onClick={handleDisconnect}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] transition-colors"
        >
          <span className="inline-flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="font-mono">{publicKey.slice(0, 6)}...{publicKey.slice(-6)}</span>
          </span>
          <span className="text-xs muted">Disconnect</span>
        </button>
      </div>
    );
  }

  // Connect button
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] transition-colors ${isConnecting ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {isConnecting ? (
          <span className="flex items-center gap-2 text-sm">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Connecting...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-[var(--accent)] rounded-full"></span>
            <span>Connect MonkeyMask</span>
          </span>
        )}
      </button>
    </div>
  );
}
