'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  KALIUM_DEFAULT_REPRESENTATIVE,
  REPRESENTATIVE_CHANGED_EVENT,
} from '@monkeymask/wallet-standard';
import { useMonkeyMask } from '@/providers';
import { Button, StatusBox } from '@/components/ui';
import { DemoSection } from '@/components/demos/DemoSection';
import {
  fetchAccountDelegation,
  fetchRepNetworkSnapshot,
  suggestDecentralizedRepresentative,
  type RepLeaderboardRow,
} from '@/lib/representativesClient';
import type { SuggestedRepresentative } from '@monkeymask/wallet-standard';
import { normalizeRepresentativeAccount } from '@monkeymask/wallet-standard';

function truncateRep(account: string, head = 12, tail = 8): string {
  if (account.length <= head + tail + 1) return account;
  return `${account.slice(0, head)}…${account.slice(-tail)}`;
}

function RepLeaderboard({
  rows,
  loading,
  selectedAccount,
  onSelect,
  className = '',
}: {
  rows: RepLeaderboardRow[];
  loading: boolean;
  selectedAccount: string;
  onSelect: (account: string) => void;
  className?: string;
}) {
  const selectedNorm = selectedAccount
    ? normalizeRepresentativeAccount(selectedAccount)
    : '';

  return (
    <div className={`space-y-2 overflow-y-auto ${className}`}>
      {rows.map((row) => {
        const isSelected =
          selectedNorm !== '' &&
          normalizeRepresentativeAccount(row.account) === selectedNorm;

        return (
        <button
          key={row.account}
          type="button"
          onClick={() => onSelect(row.account)}
          aria-pressed={isSelected}
          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
            isSelected
              ? 'border-foreground/40 bg-muted/50 ring-1 ring-foreground/15'
              : 'border-border bg-background hover:border-foreground/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-mono text-sm text-foreground">
              {truncateRep(row.account, 12, 8)}
            </span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {row.sharePercent.toFixed(2)}%
              {row.online ? (
                <span className="ml-1 text-green-600">●</span>
              ) : (
                <span className="ml-1 text-muted-foreground/50">○</span>
              )}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{row.weightBan} BAN</div>
        </button>
        );
      })}
      {!loading && rows.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No representatives loaded</p>
      )}
      {loading && rows.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">Loading network data…</p>
      )}
    </div>
  );
}

/** Read-only rep leaderboard + wallet change when connected. */
export function RepExplorerDemo() {
  const { connected, publicKey, signAndSendTransaction } = useMonkeyMask();

  const [rows, setRows] = useState<RepLeaderboardRow[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineAccounts, setOnlineAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentRep, setCurrentRep] = useState<string | null>(null);
  const [targetRep, setTargetRep] = useState('');
  const [suggestedMeta, setSuggestedMeta] = useState<SuggestedRepresentative | null>(null);
  const [delegationWarning, setDelegationWarning] = useState<string | null>(null);
  const [delegationBlocked, setDelegationBlocked] = useState(false);
  const [changing, setChanging] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [changeResult, setChangeResult] = useState<string | null>(null);

  const loadNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchRepNetworkSnapshot(25);
      setRows(snapshot.representatives);
      setOnlineCount(snapshot.onlineCount);
      setOnlineAccounts(snapshot.onlineAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load representatives');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccount = useCallback(async (opts?: { preserveTarget?: boolean }) => {
    if (!publicKey) {
      setCurrentRep(null);
      setDelegationWarning(null);
      setDelegationBlocked(false);
      if (!opts?.preserveTarget) setTargetRep('');
      return;
    }
    try {
      const delegation = await fetchAccountDelegation(publicKey);
      setCurrentRep(delegation.representative);
      if (!opts?.preserveTarget) {
        setTargetRep(delegation.representative ?? '');
      }
      if (!delegation.assessment.allowed) {
        setDelegationBlocked(true);
        setDelegationWarning(delegation.assessment.message ?? 'Cannot change rep for this account');
      } else {
        setDelegationBlocked(false);
        setDelegationWarning(
          delegation.assessment.severity === 'warn'
            ? (delegation.assessment.message ?? null)
            : null,
        );
      }
    } catch {
      setCurrentRep(null);
    }
  }, [publicKey]);

  useEffect(() => {
    void loadNetwork();
  }, [loadNetwork]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  // The extension dispatches this DOM event when the user changes their rep
  // from inside the wallet, so the demo stays in sync without polling.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ addresses?: string[]; representative?: string }>)
        .detail;
      if (!publicKey) return;
      if (detail?.addresses && !detail.addresses.includes(publicKey)) return;
      void loadAccount();
    };
    window.addEventListener(REPRESENTATIVE_CHANGED_EVENT, handler);
    return () => window.removeEventListener(REPRESENTATIVE_CHANGED_EVENT, handler);
  }, [publicKey, loadAccount]);

  const handleSuggest = async () => {
    setSuggesting(true);
    setError(null);
    try {
      const exclude = new Set<string>();
      if (publicKey) exclude.add(publicKey);
      if (currentRep) exclude.add(currentRep);
      const suggested = await suggestDecentralizedRepresentative(exclude);
      if (!suggested) {
        setError(
          currentRep
            ? 'No other online representative under 1% network weight found — pick one from the list'
            : 'No online representative under 1% network weight found',
        );
        return;
      }
      // Suggestion includes online/weight metadata — no need to reload the list.
      setTargetRep(suggested.account);
      setSuggestedMeta(suggested);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggest failed');
    } finally {
      setSuggesting(false);
    }
  };

  const repChanged =
    normalizeRepresentativeAccount(targetRep) !==
    normalizeRepresentativeAccount(currentRep ?? '');

  const handleSelectRep = (account: string) => {
    setTargetRep(account);
    setSuggestedMeta(null);
  };

  const handleChange = async () => {
    if (!connected || !targetRep.startsWith('ban_') || !repChanged) return;
    setChanging(true);
    setChangeResult(null);
    setError(null);
    try {
      const { hash } = await signAndSendTransaction({
        type: 'change',
        representative: targetRep.trim(),
      });
      setChangeResult(hash);
      await loadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Change failed');
    } finally {
      setChanging(false);
    }
  };

  const targetRepMeta = (() => {
    const rep = targetRep.trim();
    if (!rep.startsWith('ban_')) return null;
    const repNorm = normalizeRepresentativeAccount(rep);
    const inList = rows.find(
      (row) => normalizeRepresentativeAccount(row.account) === repNorm,
    );
    if (inList) {
      return {
        online: inList.online,
        sharePercent: inList.sharePercent,
        weightBan: inList.weightBan,
      };
    }
    if (suggestedMeta?.account === rep || normalizeRepresentativeAccount(suggestedMeta?.account ?? '') === repNorm) {
      return suggestedMeta;
    }
    const normalized = normalizeRepresentativeAccount(rep);
    return {
      online: onlineAccounts.some((a) => normalizeRepresentativeAccount(a) === normalized),
      sharePercent: null as number | null,
      weightBan: null as string | null,
    };
  })();

  return (
    <div className="flex min-h-[420px] flex-col gap-3 text-foreground">
      <p className="shrink-0 text-sm text-muted-foreground">
        Delegates voting weight only. ● online · ○ offline
      </p>

      <DemoSection label="Representative">
        <div className="space-y-3">
          {connected && publicKey && (
            <div className="text-sm text-muted-foreground">
              Account{' '}
              <span className="font-mono text-foreground">{truncateRep(publicKey, 10, 8)}</span>
            </div>
          )}

          {delegationWarning && (
            <div className="flex items-start gap-2 text-sm text-amber-700">
              <Icon icon="lucide:alert-triangle" className="mt-0.5 size-4 shrink-0" />
              <span>{delegationWarning}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Representative address</label>
            <input
              type="text"
              value={targetRep}
              onChange={(e) => {
                setTargetRep(e.target.value);
                setSuggestedMeta(null);
              }}
              placeholder="ban_1…"
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {targetRepMeta && (
            <div className="text-sm text-muted-foreground">
              {targetRepMeta.online ? (
                <span className="text-green-600">● Online</span>
              ) : (
                <span>○ Offline</span>
              )}
              {targetRepMeta.sharePercent != null && (
                <span>{` · ${targetRepMeta.sharePercent.toFixed(2)}% of network`}</span>
              )}
              {targetRepMeta.weightBan && <span>{` · ${targetRepMeta.weightBan} BAN`}</span>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleSuggest()}
              disabled={suggesting || changing}
            >
              {suggesting ? 'Picking…' : 'Suggest'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTargetRep(KALIUM_DEFAULT_REPRESENTATIVE)}
              disabled={changing}
            >
              Kalium default
            </Button>
            {connected ? (
              <Button
                type="button"
                size="sm"
                onClick={() => void handleChange()}
                disabled={changing || !targetRep.startsWith('ban_') || delegationBlocked || !repChanged}
                className="col-span-2"
              >
                {changing ? 'Updating…' : 'Update'}
              </Button>
            ) : (
              <p className="col-span-2 text-sm text-muted-foreground">
                Connect your wallet to update representative.
              </p>
            )}
          </div>
        </div>
      </DemoSection>

      <DemoSection
        label={`Top representatives (${onlineCount} online)`}
        className="flex min-h-0 flex-1 flex-col"
        bodyClassName="min-h-0 flex-1"
      >
        <RepLeaderboard
          rows={rows}
          loading={loading}
          selectedAccount={targetRep}
          onSelect={handleSelectRep}
          className="min-h-[16rem] max-h-[28rem] flex-1 lg:max-h-[32rem]"
        />
      </DemoSection>

      {changeResult && (
        <StatusBox variant="success" title="Representative updated" mono>
          {changeResult}
        </StatusBox>
      )}

      {error && <StatusBox variant="error">{error}</StatusBox>}
    </div>
  );
}

export default RepExplorerDemo;
