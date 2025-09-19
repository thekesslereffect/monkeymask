'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMonkeyMask } from '@/providers';
import { AccountInfo } from '@/types/monkeymask';

/**
 * Simple component to display wallet information.
 * Shows how to access wallet state and call basic methods.
 * 
 * Usage:
 * ```tsx
 * import { WalletInfo } from '@/components/examples/WalletInfo';
 * 
 * export default function MyPage() {
 *   return <WalletInfo />;
 * }
 * ```
 */
interface WalletInfoProps {
  className?: string;
  variant?: 'card' | 'plain';
}

export function WalletInfo({ className = '', variant = 'card' }: WalletInfoProps) {
  const { isConnected, publicKey, accounts, getAccountInfo } = useMonkeyMask();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAccountData = useCallback(async () => {
    if (!isConnected || !publicKey) return;
    
    setLoading(true);
    try {
      const accountInfoResult = await getAccountInfo();
      setAccountInfo(accountInfoResult);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      // Don't clear the data on error - it might just be a temporary issue
    } finally {
      setLoading(false);
    }
  }, [isConnected, publicKey, getAccountInfo]);

  useEffect(() => {
    if (isConnected) {
      fetchAccountData();
    } else {
      setAccountInfo(null);
    }
  }, [isConnected, fetchAccountData]);

  const Container: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    variant === 'card' ? (
      <div className={`card p-5 ${className}`}>{children}</div>
    ) : (
      <div className={className}>{children}</div>
    )
  );

  if (!isConnected) {
    return (
      <Container>
        <p className="muted">Connect your wallet to see account information.</p>
      </Container>
    );
  }

  return (
    <Container>
      <h3 className="mb-4">
        Wallet Information
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm muted mb-1">
            Public Key
          </label>
          <div className="font-mono text-sm bg-[var(--elevated)] p-2 rounded border border-[var(--border)]">
            {publicKey}
          </div>
        </div>

        <div>
          <label className="block text-sm muted mb-1">
            Connected Accounts ({accounts.length})
          </label>
          <div className="space-y-1">
            {accounts.map((account, index) => (
              <div key={index} className="font-mono text-xs bg-[var(--elevated)] p-2 rounded border border-[var(--border)]">
                {account}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm muted mb-1">
            Balance
          </label>
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm bg-[var(--elevated)] p-2 rounded border border-[var(--border)] flex-1">
              {loading ? 'Loading...' : accountInfo ? `${accountInfo.balance} BAN` : 'No balance data'}
            </div>
            <button
              onClick={fetchAccountData}
              disabled={loading}
              className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] disabled:opacity-60 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {accountInfo && (
          <div>
            <label className="block text-sm muted mb-1">
              Account Info
            </label>
            <div className="bg-[var(--elevated)] p-3 rounded border border-[var(--border)]">
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium muted">Balance:</span>
                    <div className="font-mono">{accountInfo.balance} BAN</div>
                  </div>
                  <div>
                    <span className="font-medium muted">Pending:</span>
                    <div className="font-mono">{accountInfo.pending} BAN</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium muted">Raw Balance:</span>
                  <div className="font-mono text-xs break-all bg-[var(--panel)] p-2 rounded border border-[var(--border)]">
                    {accountInfo.rawBalance}
                  </div>
                </div>
                <div>
                  <span className="font-medium muted">Raw Pending:</span>
                  <div className="font-mono text-xs break-all bg-[var(--panel)] p-2 rounded border border-[var(--border)]">
                    {accountInfo.rawPending}
                  </div>
                </div>
                <div>
                  <span className="font-medium muted">Address:</span>
                  <div className="font-mono text-xs break-all bg-[var(--panel)] p-2 rounded border border-[var(--border)]">
                    {accountInfo.address}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
