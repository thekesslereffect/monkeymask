'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { Button, StatusBox } from '@/components/ui';

/** Self-contained "send BAN" demo. */
export function SendTransactionDemo() {
  const { connected, signAndSendTransaction, clearError } = useMonkeyMask();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const fillExample = () => {
    setRecipient('cosmic.ban');
    setAmount('0.001');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setSending(true);
    setSendResult(null);
    setSendError(null);
    clearError();
    try {
      const result = await signAndSendTransaction({ type: 'send', to: recipient, amount });
      if (result?.hash) {
        setSendResult(result.hash);
        setRecipient('');
        setAmount('');
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Recipient</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ban_1... or name.ban"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
          />
          <Button type="button" onClick={fillExample} variant="secondary" size="sm">
            Example
          </Button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (BAN)</label>
        <input
          type="text"
          placeholder="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
        />
      </div>
      <Button type="submit" disabled={!connected || sending || !recipient || !amount} size="sm" variant="secondary">
        {sending ? (
          <>
            <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          'Send Transaction'
        )}
      </Button>
      {sendResult && (
        <StatusBox variant="success" title="Transaction Sent!" mono>
          {sendResult}
        </StatusBox>
      )}
      {sendError && <StatusBox variant="error">{sendError}</StatusBox>}
    </form>
  );
}

export default SendTransactionDemo;
