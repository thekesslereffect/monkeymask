'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  useMonkeyMask,
  useSend,
  useSpendingSession,
  type SpendingSessionInfo,
} from '@/providers';
import { Button, StatusBox } from '@/components/ui';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Spending-session demo: request a per-origin allowance so small `send`s are
 * auto-approved (no popup) until the limit or expiry is reached. Then fire a
 * tiny send to prove it goes through without a prompt.
 */
export function SpendingSessionForm() {
  const { connected } = useMonkeyMask();
  const session = useSpendingSession();
  const send = useSend();

  const [limit, setLimit] = useState('1');
  const [minutes, setMinutes] = useState('30');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [amount, setAmount] = useState('0.01');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const rawInfo: SpendingSessionInfo | null = session.session;
  const activeInfo =
    rawInfo && rawInfo.expiresAt > now ? rawInfo : null;

  // Tick every second while a session is active so the countdown stays live.
  useEffect(() => {
    if (!rawInfo) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [rawInfo]);

  // When the countdown hits zero, refresh provider state so we return to setup.
  useEffect(() => {
    if (!rawInfo || rawInfo.expiresAt > now) return;
    void session.get().catch(() => undefined);
  }, [rawInfo, now, session]);

  const remainingMs = activeInfo ? activeInfo.expiresAt - now : 0;
  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);

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
      setSendResult(null);
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

  return (
    <div className="space-y-3">
      {activeInfo ? (
        <StatusBox variant="success" title="Session active">
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-secondary)]">Expires in</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{countdown}</span>
            </div>
            <div>Limit: {activeInfo.limit} BAN</div>
            <div>Spent: {activeInfo.spent} BAN</div>
            <div>Remaining: {activeInfo.remaining} BAN</div>
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
        {activeInfo ? (
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

      {activeInfo && (
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
