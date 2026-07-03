import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { KALIUM_DEFAULT_REPRESENTATIVE } from '@monkeymask/wallet-standard';
import { useAccounts } from '../hooks/useAccounts';
import { truncateRep, isRepresentativeOnline } from '../../utils/representatives';
import type { SuggestedRepresentative } from '@monkeymask/wallet-standard';
import { Alert, Button, Card, ContentContainer, Footer, Header, Input, PageName } from './ui';

interface RepLeaderboardRow {
  account: string;
  weightBan: string;
  sharePercent: number;
  online: boolean;
}

interface DelegationInfo {
  representative: string | null;
  votingWeightRaw: string;
  assessment: {
    allowed: boolean;
    severity: 'ok' | 'warn' | 'block';
    message?: string;
  };
}

interface RepData {
  account: string;
  delegation: DelegationInfo;
  snapshot: {
    representatives: RepLeaderboardRow[];
    onlineCount: number;
    onlineAccounts: string[];
  };
  metaprotocolBusy: boolean;
  accounts: { address: string; name: string }[];
}

function RepList({
  rows,
  onSelect,
  className = '',
}: {
  rows: RepLeaderboardRow[];
  onSelect: (account: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 overflow-y-auto ${className}`}>
      {rows.map((row) => (
        <button
          key={row.account}
          type="button"
          onClick={() => onSelect(row.account)}
          className="w-full rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-left transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-mono text-sm text-foreground">
              {truncateRep(row.account, 12, 8)}
            </span>
            <span className="shrink-0 text-sm text-tertiary tabular-nums">
              {row.sharePercent.toFixed(2)}%
              {row.online ? (
                <span className="ml-1 text-green-500">●</span>
              ) : (
                <span className="ml-1 text-tertiary/40">○</span>
              )}
            </span>
          </div>
          <div className="text-xs text-tertiary/70">{row.weightBan} BAN</div>
        </button>
      ))}
    </div>
  );
}

export const RepresentativeScreen: React.FC = () => {
  const { currentAccount, accounts } = useAccounts();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [data, setData] = useState<RepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualRep, setManualRep] = useState('');
  const [changing, setChanging] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [success, setSuccess] = useState('');
  const [suggestedMeta, setSuggestedMeta] = useState<SuggestedRepresentative | null>(null);

  const activeAddress = selectedAddress || currentAccount?.address || '';

  const loadData = useCallback(async (address: string, opts?: { preserveRepInput?: boolean }) => {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_REPRESENTATIVE_DATA',
        address,
      });
      if (!response.success) {
        throw new Error(response.error ?? 'Failed to load representative data');
      }
      const repData = response.data as RepData;
      setData(repData);
      if (!opts?.preserveRepInput) {
        setManualRep(repData.delegation.representative ?? '');
        setSuggestedMeta(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentAccount?.address && !selectedAddress) {
      setSelectedAddress(currentAccount.address);
    }
  }, [currentAccount?.address, selectedAddress]);

  useEffect(() => {
    if (activeAddress) {
      void loadData(activeAddress);
    }
  }, [activeAddress, loadData]);

  const handleSuggest = async () => {
    setSuggesting(true);
    setError('');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SUGGEST_REPRESENTATIVE' });
      if (!response.success) {
        throw new Error(response.error ?? 'No suggestion available');
      }
      const suggestion = response.data.suggestion as SuggestedRepresentative;
      setManualRep(suggestion.account);
      setSuggestedMeta(suggestion);
      await loadData(activeAddress, { preserveRepInput: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggest failed');
    } finally {
      setSuggesting(false);
    }
  };

  const handleChange = async (allAccounts: boolean) => {
    const rep = manualRep.trim();
    if (!rep.startsWith('ban_')) {
      setError('Enter a valid ban_ representative address');
      return;
    }
    if (rep === currentRep) {
      setError('Already delegated to this representative');
      return;
    }
    setChanging(true);
    setError('');
    setSuccess('');
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHANGE_REPRESENTATIVE',
        address: activeAddress,
        representative: rep,
        allAccounts,
      });
      if (!response.success) {
        throw new Error(response.error ?? 'Change failed');
      }
      if (allAccounts) {
        const { changed, skipped } = response.data as {
          changed: string[];
          skipped: { address: string; reason: string }[];
        };
        setSuccess(
          changed.length > 0
            ? `Updated ${changed.length} account(s).${skipped.length ? ` Skipped ${skipped.length}.` : ''}`
            : 'No accounts were updated.',
        );
      } else {
        setSuccess('Representative updated.');
      }
      await loadData(activeAddress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Change failed');
    } finally {
      setChanging(false);
    }
  };

  const delegation = data?.delegation;
  const currentRep = delegation?.representative ?? null;
  const repChanged = manualRep.trim() !== (currentRep ?? '');
  const canChange =
    delegation?.assessment.allowed &&
    !data?.metaprotocolBusy &&
    manualRep.trim().startsWith('ban_') &&
    repChanged;

  const targetRepMeta = (() => {
    const rep = manualRep.trim();
    if (!rep.startsWith('ban_') || !data) return null;
    const inList = data.snapshot.representatives.find((row) => row.account === rep);
    if (inList) {
      return {
        online: inList.online,
        sharePercent: inList.sharePercent,
        weightBan: inList.weightBan,
      };
    }
    if (suggestedMeta?.account === rep) return suggestedMeta;
    return {
      online: isRepresentativeOnline(rep, data.snapshot.onlineAccounts ?? []),
      sharePercent: null as number | null,
      weightBan: null as string | null,
    };
  })();

  const delegationNotice =
    delegation?.assessment.severity === 'block'
      ? delegation.assessment.message
      : delegation?.assessment.severity === 'warn'
        ? delegation.assessment.message
        : data?.metaprotocolBusy
          ? 'NFT operation in progress—wait before changing rep.'
          : null;

  return (
    <div className="flex h-full flex-col font-semibold">
      <Header active />
      <ContentContainer className="gap-3">
        <PageName name="Voting Representative" back={true} />

        <p className="text-sm text-tertiary">
          Delegates voting weight only. ● online · ○ offline
        </p>

        {accounts.length > 1 && (
          <select
            value={activeAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {accounts.map((acc, i) => (
              <option key={acc.address} value={acc.address}>
                {acc.name || `Account ${i + 1}`} — {truncateRep(acc.address, 8, 6)}
              </option>
            ))}
          </select>
        )}

        {loading && (
          <div className="py-6 text-center text-sm text-tertiary">Loading network data…</div>
        )}

        {!loading && delegation && data && (
          <>
            <Card label="Representative" className="w-full">
              <div className="space-y-3">
                {delegationNotice && (
                  <div className="flex items-start gap-2 text-sm text-amber-600">
                    <Icon icon="lucide:alert-triangle" className="mt-0.5 size-4 shrink-0" />
                    <span>{delegationNotice}</span>
                  </div>
                )}

                <Input
                  label="Representative address"
                  value={manualRep}
                  onChange={(e) => {
                    setManualRep(e.target.value);
                    setSuggestedMeta(null);
                  }}
                  placeholder="ban_1…"
                  className="font-mono text-left"
                />

                {targetRepMeta && (
                  <div className="text-sm text-tertiary">
                    {targetRepMeta.online ? (
                      <span className="text-green-500">● Online</span>
                    ) : (
                      <span className="text-tertiary/70">○ Offline</span>
                    )}
                    {targetRepMeta.sharePercent != null && (
                      <span>{` · ${targetRepMeta.sharePercent.toFixed(2)}% of network`}</span>
                    )}
                    {targetRepMeta.weightBan && <span>{` · ${targetRepMeta.weightBan} BAN`}</span>}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void handleSuggest()}
                    disabled={suggesting || changing}
                  >
                    {suggesting ? 'Picking…' : 'Suggest'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setManualRep(KALIUM_DEFAULT_REPRESENTATIVE)}
                    disabled={changing}
                  >
                    Kalium default
                  </Button>
                  <Button
                    onClick={() => void handleChange(false)}
                    disabled={!canChange || changing}
                    className="col-span-2"
                  >
                    {changing ? 'Updating…' : 'Update'}
                  </Button>
                  {accounts.length > 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => void handleChange(true)}
                      disabled={!canChange || changing}
                      className="col-span-2"
                    >
                      Apply to all accounts
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card
              label={`Top representatives (${data.snapshot.onlineCount} online)`}
              className="w-full"
            >
              <RepList
                rows={data.snapshot.representatives}
                onSelect={setManualRep}
                className="min-h-[18rem] max-h-[22rem] overflow-y-auto overscroll-y-contain"
              />
            </Card>
          </>
        )}

        {error && (
          <Alert variant="destructive" className="w-full">
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            variant="default"
            className="flex w-full items-center gap-2 border-green-500/30 text-foreground"
          >
            <Icon icon="lucide:check-circle" className="shrink-0 text-green-500" />
            <span className="text-sm text-secondary-foreground">{success}</span>
          </Alert>
        )}
      </ContentContainer>
      <Footer />
    </div>
  );
};
