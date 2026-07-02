'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { Button, StatusBox } from '@/components/ui';

/** Self-contained message-signing demo. */
export function MessageSigningDemo() {
  const { connected, signMessage, clearError } = useMonkeyMask();

  const [message, setMessage] = useState('Hello from MonkeyMask!');
  const [signature, setSignature] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);

  const handleSign = async () => {
    if (!connected || !message.trim()) return;
    setSigning(true);
    setSignature(null);
    setVerifyResult(null);
    clearError();
    try {
      const output = await signMessage(new TextEncoder().encode(message.trim()));
      const sigHex = Array.from(output.signature)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setSignature(sigHex);
      setVerifyResult(true);
    } catch (err) {
      console.error('Signing failed:', err);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm resize-none"
          placeholder="Enter message to sign..."
        />
      </div>
      <Button onClick={handleSign} disabled={!connected || signing || !message.trim()} size="sm" variant="secondary">
        {signing ? (
          <>
            <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
            Signing...
          </>
        ) : (
          'Sign Message'
        )}
      </Button>
      {signature && (
        <div className="space-y-2">
          <StatusBox variant="info" title="Signature" mono>
            {signature.slice(0, 40)}...
          </StatusBox>
          {verifyResult !== null && (
            <StatusBox variant={verifyResult ? 'success' : 'error'}>
              Verification: {verifyResult ? '✅ Valid' : '❌ Invalid'}
            </StatusBox>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageSigningDemo;
