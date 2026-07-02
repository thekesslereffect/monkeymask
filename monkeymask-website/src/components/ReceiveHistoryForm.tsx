'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask, useReceive, useReceivable, useAccountHistory } from '@/providers';
import { Button, StatusBox } from '@/components/ui';

interface Receivable {
  hash: string;
  amount: string;
  amountRaw: string;
  source?: string;
}

interface HistoryEntry {
  hash: string;
  type: string;
  amount: string;
  account: string;
  timestamp: string;
}

const truncate = (value?: string, head = 8, tail = 6): string => {
  if (!value) return '';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
};

export function ReceiveHistoryForm() {
  const { connected } = useMonkeyMask();
  const receive = useReceive();
  const getReceivable = useReceivable();
  const getAccountHistory = useAccountHistory();

  const [receivables, setReceivables] = useState<Receivable[] | null>(null);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loadingReceivable, setLoadingReceivable] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null); // hash or 'all'
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState<string | null>(null);

  const refreshReceivables = useCallback(async () => {
    if (!connected) return;
    setLoadingReceivable(true);
    setError(null);
    try {
      const list = (await getReceivable()) as Receivable[];
      setReceivables(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receivables');
    } finally {
      setLoadingReceivable(false);
    }
  }, [connected, getReceivable]);

  const refreshHistory = useCallback(async () => {
    if (!connected) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const list = (await getAccountHistory(undefined, 10)) as HistoryEntry[];
      setHistory(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, [connected, getAccountHistory]);

  useEffect(() => {
    if (connected) {
      void refreshReceivables();
      void refreshHistory();
    } else {
      setReceivables(null);
      setHistory(null);
      setClaimed(null);
      setError(null);
    }
  }, [connected, refreshReceivables, refreshHistory]);

  const handleClaim = async (blockHash?: string) => {
    setError(null);
    setClaimed(null);
    setClaiming(blockHash ?? 'all');
    try {
      const output = await receive(blockHash ? { blockHash } : undefined);
      const count = output.hashes?.length ?? 0;
      setClaimed(count > 0 ? `Claimed ${count} block${count === 1 ? '' : 's'}` : 'Nothing to claim');
      // Refresh both lists after claiming.
      setTimeout(() => {
        void refreshReceivables();
        void refreshHistory();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setClaiming(null);
    }
  };

  if (!connected) {
    return (
      <p className="text-[var(--text-secondary)] text-sm">
        Connect your wallet to view receivables and history.
      </p>
    );
  }

  const hasReceivables = receivables && receivables.length > 0;

  return (
    <div className="space-y-4">
      {/* Receivables */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Receivable (pending)</span>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={refreshReceivables}
              variant="secondary"
              size="sm"
              disabled={loadingReceivable}
            >
              <Icon
                icon={loadingReceivable ? 'mdi:loading' : 'mdi:refresh'}
                className={`size-4 ${loadingReceivable ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              type="button"
              onClick={() => handleClaim()}
              variant="secondary"
              size="sm"
              disabled={!hasReceivables || claiming !== null}
            >
              {claiming === 'all' ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-1" />
                  Claiming…
                </>
              ) : (
                'Claim all'
              )}
            </Button>
          </div>
        </div>

        {hasReceivables ? (
          <div className="space-y-1">
            {receivables!.map((r) => (
              <div key={r.hash} className="flex items-center gap-2 text-xs">
                <Icon icon="mdi:download-circle-outline" className="size-3.5 text-[var(--text-secondary)] shrink-0" />
                <span className="font-mono font-semibold shrink-0">{r.amount} BAN</span>
                <span className="text-[var(--text-secondary)] truncate">
                  {r.source ? `from ${truncate(r.source)}` : truncate(r.hash)}
                </span>
                <Button
                  type="button"
                  onClick={() => handleClaim(r.hash)}
                  variant="secondary"
                  size="sm"
                  disabled={claiming !== null}
                  className="ml-auto shrink-0"
                >
                  {claiming === r.hash ? (
                    <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
                  ) : (
                    'Claim'
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            {loadingReceivable ? 'Loading…' : 'No pending receivables.'}
          </p>
        )}
      </div>

      {claimed && <StatusBox variant="success">{claimed}</StatusBox>}
      {error && <StatusBox variant="error">{error}</StatusBox>}

      {/* History */}
      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Recent history</span>
          <Button
            type="button"
            onClick={refreshHistory}
            variant="secondary"
            size="sm"
            disabled={loadingHistory}
          >
            <Icon
              icon={loadingHistory ? 'mdi:loading' : 'mdi:refresh'}
              className={`size-4 ${loadingHistory ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>

        {history && history.length > 0 ? (
          <div className="space-y-1">
            {history.map((h) => (
              <div key={h.hash} className="flex items-center gap-2 text-xs">
                <Icon
                  icon={h.type === 'send' ? 'mdi:arrow-up-circle' : h.type === 'receive' ? 'mdi:arrow-down-circle' : 'mdi:swap-horizontal-circle'}
                  className={`size-3.5 shrink-0 ${h.type === 'send' ? 'text-red-500' : h.type === 'receive' ? 'text-green-600' : 'text-[var(--text-secondary)]'}`}
                />
                <span className="capitalize shrink-0 w-16">{h.type}</span>
                <span className="font-mono shrink-0">{h.amount} BAN</span>
                <a
                  className="underline font-mono ml-auto shrink-0"
                  href={`https://creeper.banano.cc/hash/${h.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {truncate(h.hash, 8, 6)}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-secondary)]">
            {loadingHistory ? 'Loading…' : 'No history yet.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default ReceiveHistoryForm;
