'use client';

import React, { useState } from 'react';
import { useMonkeyMask } from '@/providers';

/**
 * Simple message signing component.
 * Shows how to sign arbitrary messages with the wallet.
 * 
 * Usage:
 * ```tsx
 * import { SignMessage } from '@/components/examples/SignMessage';
 * 
 * export default function MyPage() {
 *   return <SignMessage />;
 * }
 * ```
 */
export function SignMessage() {
  const { isConnected, signMessage } = useMonkeyMask();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setSignature(null);

    try {
      const result = await signMessage(message);
      if (result) {
        setSignature(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setSignature(null);
    setError(null);
    setMessage('');
  };

  if (!isConnected) {
    return (
      <div className="card p-4">
        <p className="muted">Connect your wallet to sign messages.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4">
        Sign Message
      </h3>
      
      <form onSubmit={handleSign} className="space-y-4">
        <div>
          <label className="block text-sm muted mb-1">
            Message to Sign
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter any message to sign..."
            rows={4}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--panel)] text-[var(--text)] resize-none"
            required
          />
          <p className="text-xs muted mt-1">
            This message will be signed with your private key for verification
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex-1 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] disabled:opacity-60 transition-colors"
          >
            {loading ? 'Signing...' : 'Sign Message'}
          </button>
          
          {(signature || error) && (
            <button
              type="button"
              onClick={clearResults}
              className="px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--panel)] hover:bg-[var(--elevated)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>
      
      {error && (
        <div className="mt-4 p-3 rounded border border-[var(--border)] bg-[var(--elevated)]">
          <p className="text-sm" style={{ color: '#fda4af' }}>{error}</p>
        </div>
      )}
      
      {signature && (
        <div className="mt-4 p-3 rounded border border-[var(--border)] bg-[var(--elevated)]">
          <p className="text-sm font-medium mb-2">
            Message Signed Successfully!
          </p>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium muted mb-1">
                Original Message:
              </label>
              <div className="text-xs font-mono bg-[var(--panel)] p-2 rounded border border-[var(--border)] break-all">
                {message}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium muted mb-1">
                Signature:
              </label>
              <div className="text-xs font-mono bg-[var(--panel)] p-2 rounded border border-[var(--border)] break-all">
                {signature}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
