'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import {
  useMonkeyMask,
  useSend,
  useSpendingSession,
  type SpendingSessionInfo,
} from '@/providers';
import { Button, StatusBox } from '@/components/ui';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

/**
 * Spending-session demo: request a per-origin allowance so small `send`s are
 * auto-approved (no popup) until the limit or expiry is reached. Then fire a
 * tiny send to prove it goes through without a prompt.
 */
export function SpendingSessionForm() {
  const { connected } = useMonkeyMask();
  const session = useSpendingSession();
  const send = useSend();

  // `session.session` is reactive: it updates automatically when the allowance is
  // granted, debited, or revoked — including a revoke done inside the wallet.
  const info: SpendingSessionInfo | null = session.session;

  const [limit, setLimit] = useState('1');
  const [minutes, setMinutes] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('0.01');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleRequest = async () => {
    setError(null);
    setBusy(true);
    try {
      await session.request({
        limit: limit.trim(),
        durationMs: Math.max(1, parseInt(minutes, 10) || 30) * 60_000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    setBusy(true);
    try {
      await session.revoke();
    } finally {
      setBusy(false);
    }
  };

  const handleAutoSend = async () => {
    setSending(true);
    setSendResult(null);
    setError(null);
    try {
      const output = await send({ to: 'cosmic.ban', amount: amount.trim() });
      setSendResult(output.hash ?? output.hashes[0] ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  if (!connected) {
    return (
      <p className="text-[var(--text-secondary)] text-sm">
        Connect your wallet to grant a spending session.
      </p>
    );
  }

  const expiresIn = info ? Math.max(0, Math.round((info.expiresAt - Date.now()) / 60000)) : 0;

  return (
    <div className="space-y-3">
      {info ? (
        <StatusBox variant="success" title="Session active">
          <div className="text-xs space-y-0.5">
            <div>Limit: {info.limit} BAN</div>
            <div>Spent: {info.spent} BAN</div>
            <div>Remaining: {info.remaining} BAN</div>
            <div>Expires in ~{expiresIn} min</div>
          </div>
        </StatusBox>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Limit (BAN)</label>
              <input
                type="text"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Minutes</label>
              <input
                type="text"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {info ? (
          <Button onClick={handleRevoke} variant="secondary" size="sm" disabled={busy}>
            Revoke
          </Button>
        ) : (
          <Button onClick={handleRequest} variant="secondary" size="sm" disabled={busy}>
            {busy ? (
              <>
                <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              'Grant allowance'
            )}
          </Button>
        )}
      </div>

      {info && (
        <div className="border-t border-[var(--border)] pt-3 space-y-2">
          <label className="block text-sm font-medium">Auto-approved send (no popup)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              className={`${FIELD_CLASS} w-32`}
            />
            <Button onClick={handleAutoSend} variant="secondary" size="sm" disabled={sending}>
              {sending ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send to cosmic.ban'
              )}
            </Button>
          </div>
          {sendResult && (
            <StatusBox variant="success" title="Sent without a prompt!" mono>
              {sendResult}
            </StatusBox>
          )}
        </div>
      )}

      {error && <StatusBox variant="error">{error}</StatusBox>}
    </div>
  );
}

export default SpendingSessionForm;
