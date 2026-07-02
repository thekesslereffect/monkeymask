'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask, useSend } from '@/providers';
import { Button, StatusBox } from '@/components/ui';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

interface Row {
  to: string;
  amount: string;
  label: string;
}

interface LegResult {
  to?: string;
  amount?: string;
  hash?: string;
  error?: string;
}

const emptyRow = (): Row => ({ to: '', amount: '', label: '' });

/**
 * Multi-send / airdrop demo: collects several recipients and sends them all in a
 * single approval via `useSend({ sends })`. The wallet publishes the airdrop as
 * one locally-chained block sequence and returns per-recipient `results`, which
 * we render as a receipt (hash) or a per-recipient error (best-effort).
 */
export function AirdropForm() {
  const { connected } = useMonkeyMask();
  const send = useSend();

  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LegResult[] | null>(null);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
    [rows],
  );

  const validRows = useMemo(
    () => rows.filter((r) => r.to.trim() !== '' && (parseFloat(r.amount) || 0) > 0),
    [rows],
  );

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const fillExample = () => {
    setRows([
      { to: 'cosmic.ban', amount: '0.001', label: 'Winner #1' },
      { to: 'cosmic.ban', amount: '0.002', label: 'Winner #2' },
    ]);
  };

  const handleSend = async () => {
    setError(null);
    setResults(null);

    if (!connected) {
      setError('Connect your wallet first.');
      return;
    }
    if (validRows.length === 0) {
      setError('Add at least one recipient with an amount.');
      return;
    }

    setBusy(true);
    try {
      const output = await send({
        name: 'MonkeyMask airdrop',
        sends: validRows.map((r) => ({
          to: r.to.trim(),
          amount: r.amount.trim(),
          label: r.label.trim() || undefined,
        })),
      });
      setResults(
        (output.results as LegResult[] | undefined) ??
          output.hashes.map((hash) => ({ hash })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Airdrop failed');
    } finally {
      setBusy(false);
    }
  };

  if (!connected) {
    return (
      <p className="text-[var(--text-secondary)] text-sm">
        Connect your wallet to run a multi-send / airdrop.
      </p>
    );
  }

  const succeeded = results?.filter((r) => r.hash).length ?? 0;
  const failed = results?.filter((r) => r.error).length ?? 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={row.to}
                onChange={(e) => updateRow(i, { to: e.target.value })}
                placeholder="ban_1... or name.ban"
                disabled={busy}
                className={FIELD_CLASS}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={row.amount}
                  onChange={(e) => updateRow(i, { amount: e.target.value })}
                  placeholder="0.001"
                  disabled={busy}
                  className={`${FIELD_CLASS} w-28`}
                />
                <input
                  type="text"
                  value={row.label}
                  onChange={(e) => updateRow(i, { label: e.target.value })}
                  placeholder="label (optional)"
                  disabled={busy}
                  className={FIELD_CLASS}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={busy || rows.length <= 1}
              className="mt-1 p-2 text-[var(--text-secondary)] hover:text-red-600 disabled:opacity-30"
              aria-label="Remove recipient"
            >
              <Icon icon="mdi:close" className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" onClick={addRow} disabled={busy} variant="secondary" size="sm">
          <Icon icon="mdi:plus" className="size-4 mr-1" />
          Add recipient
        </Button>
        <Button type="button" onClick={fillExample} disabled={busy} variant="secondary" size="sm">
          Example
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">
          {validRows.length} recipient{validRows.length === 1 ? '' : 's'}
        </span>
        <span className="font-mono font-semibold">{total.toString()} BAN total</span>
      </div>

      <Button
        onClick={handleSend}
        disabled={busy || !connected || validRows.length === 0}
        size="sm"
        variant="secondary"
      >
        {busy ? (
          <>
            <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
            Sending airdrop...
          </>
        ) : (
          'Send Airdrop'
        )}
      </Button>

      {error && (
        <StatusBox variant="error" title="Airdrop failed">
          {error}
        </StatusBox>
      )}

      {results && (
        <StatusBox
          variant={failed === 0 ? 'success' : succeeded === 0 ? 'error' : 'info'}
          title={`Sent ${succeeded}/${results.length}${failed ? ` — ${failed} failed` : ''}`}
        >
          <div className="space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.hash ? (
                  <>
                    <Icon icon="mdi:check-circle" className="size-3.5 text-green-600 shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate">
                      {r.to ?? `#${i + 1}`}
                      {r.amount ? ` · ${r.amount} BAN` : ''}
                    </span>
                    <a
                      className="underline font-mono ml-auto shrink-0"
                      href={`https://creeper.banano.cc/hash/${r.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.hash.slice(0, 10)}…
                    </a>
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:alert-circle" className="size-3.5 text-red-600 shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate">
                      {r.to ?? `#${i + 1}`}
                    </span>
                    <span className="text-red-700 ml-auto shrink-0">{r.error}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </StatusBox>
      )}
    </div>
  );
}

export default AirdropForm;
