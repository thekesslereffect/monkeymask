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
interface SignMessageProps {
  className?: string;
  variant?: 'card' | 'plain';
}

export function SignMessage({ className = '', variant = 'card' }: SignMessageProps) {
  const { isConnected, publicKey, signMessage, verifySignedMessage } = useMonkeyMask();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [serverValid, setServerValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setSignature(null);
    setIsValid(null);
    setServerValid(null);

    try {
      // Use the signMessage from context which handles the provider call
      const result = await signMessage(message);
      if (result) {
        setSignature(result);
        
        // Client-side verification (extension-based)
        const valid = await verifySignedMessage(message, result, publicKey || undefined);
        setIsValid(valid === true);
        
        // Server-side verification (more secure)
        // For now, let's use the publicKey from context - we'll need to ensure it's hex format
        try {
          const response = await fetch('/api/verify-signature', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              signature: result,
              publicKey: publicKey, // This should be the hex public key
              origin: window.location.origin
            }),
          });
          
          if (response.ok) {
            const serverResult = await response.json();
            setServerValid(serverResult.valid);
          } else {
            console.error('Server verification failed:', response.statusText);
            setServerValid(false);
          }
        } catch (serverError) {
          console.error('Server verification error:', serverError);
          setServerValid(null); // null indicates server verification unavailable
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setSignature(null);
    setIsValid(null);
    setServerValid(null);
    setError(null);
    setMessage('');
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
        <p className="muted">Connect your wallet to sign messages.</p>
      </Container>
    );
  }

  return (
    <Container>
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
            <div>
              <label className="block text-xs font-medium muted mb-1">
                Extension Verified:
              </label>
              <div className="text-xs font-mono bg-[var(--panel)] p-2 rounded border border-[var(--border)]">
                {isValid === null ? 'Verifying...' : isValid ? 'true' : 'false'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium muted mb-1">
                Server Verified:
              </label>
              <div className="text-xs font-mono bg-[var(--panel)] p-2 rounded border border-[var(--border)]">
                {serverValid === null ? 'Verifying...' : serverValid ? 'true' : 'false'}
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
