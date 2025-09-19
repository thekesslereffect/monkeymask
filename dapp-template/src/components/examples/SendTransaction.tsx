'use client';

import React, { useState } from 'react';
import { useMonkeyMask } from '@/providers';

/**
 * Simple send transaction component.
 * Shows how to send Banano transactions with BNS support.
 * 
 * Usage:
 * ```tsx
 * import { SendTransaction } from '@/components/examples/SendTransaction';
 * 
 * export default function MyPage() {
 *   return <SendTransaction />;
 * }
 * ```
 */
interface SendTransactionProps {
  className?: string;
  variant?: 'card' | 'plain';
}

export function SendTransaction({ className = '', variant = 'card' }: SendTransactionProps) {
  const { isConnected, sendTransaction, error: providerError, clearError } = useMonkeyMask();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    setLoading(true);
    setError(null);
    setResult(null);
    clearError();

    try {
      // Show different loading messages based on the process
      const isBNS = recipient.includes('.ban') || recipient.includes('.banano');
      
      if (isBNS) {
        setLoadingMessage('Resolving BNS name...');
        console.log(`Resolving BNS name: ${recipient}`);
      } else {
        setLoadingMessage('Preparing transaction...');
      }

      // Update message when actually sending
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('Waiting for wallet approval...');
        }
      }, 1000);

      // Update message after longer wait to reassure user
      setTimeout(() => {
        if (loading) {
          setLoadingMessage('Still waiting for approval (this can take a few minutes)...');
        }
      }, 30000); // After 30 seconds

      const txHash = await sendTransaction(recipient, amount);
      if (txHash) {
        setResult(txHash);
        setRecipient('');
        setAmount('');
        setLoadingMessage('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      setLoadingMessage('');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

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
        <p className="muted">Connect your wallet to send transactions.</p>
      </Container>
    );
  }

  return (
    <Container>
      <h3 className="mb-4">
        Send Transaction
      </h3>
      
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm muted mb-1">
            Recipient Address or BNS Name
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ban_1abc... or username.ban"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--panel)] text-[var(--text)]"
            required
          />
          <p className="text-xs muted mt-1">
            Supports both Banano addresses and BNS names
          </p>
        </div>
        
        <div>
          <label className="block text-sm muted mb-1">
            Amount (BAN)
          </label>
          <input
            type="number"
            step="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--panel)] text-[var(--text)]"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !recipient || !amount}
          className="w-full px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] disabled:opacity-60 transition-colors"
        >
        {loading ? (
          loadingMessage || 'Processing...'
        ) : 'Send Transaction'}
        </button>
      </form>
      
      {(error || providerError) && (
        <div className="mt-4 p-3 rounded border border-[var(--border)] bg-[var(--elevated)]">
          <p className="text-sm" style={{ color: '#fda4af' }}>{error || providerError}</p>
          {providerError && providerError.includes('locked') && (
            <p className="text-xs mt-2 opacity-75">
              💡 The wallet extension will open automatically to unlock your wallet.
            </p>
          )}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 rounded border border-[var(--border)] bg-[var(--elevated)]">
          <p className="text-sm" style={{ color: '#86efac' }}>
            <strong>Transaction sent!</strong>
          </p>
          <p className="text-xs font-mono mt-1 break-all">
            {result}
          </p>
        </div>
      )}
    </Container>
  );
}
