import {
  assessRepresentativeForDelegationChange,
  buildOnlineRepresentativeSet,
  formatWeightBan,
  normalizeRepresentativeAccount,
  pickDecentralizedRepresentative,
  weightSharePercent,
  type DelegationChangeAssessment,
  type RepresentativeEntry,
  type SuggestedRepresentative,
} from '@monkeymask/wallet-standard';
import { BananoRPC } from './rpc';

const rpc = new BananoRPC();

export interface RepLeaderboardRow {
  account: string;
  weightRaw: string;
  weightBan: string;
  sharePercent: number;
  online: boolean;
}

export interface RepNetworkSnapshot {
  representatives: RepLeaderboardRow[];
  totalWeightRaw: string;
  onlineCount: number;
  /** Full online set for lookups (suggested reps may be outside the top-N list). */
  onlineAccounts: string[];
}

async function fetchRepNetworkContext(repCount: number): Promise<{
  entries: RepresentativeEntry[];
  online: ReadonlySet<string>;
  totalWeightRaw: string;
}> {
  const [repResult, onlineResult] = await Promise.all([
    rpc.getRepresentatives(repCount),
    rpc.getRepresentativesOnline(),
  ]);

  if (!repResult.success || !repResult.data?.representatives) {
    throw new Error(repResult.error ?? 'Failed to load representatives');
  }

  const online =
    onlineResult.success && onlineResult.data?.representatives
      ? buildOnlineRepresentativeSet(onlineResult.data.representatives)
      : new Set<string>();

  const entries: RepresentativeEntry[] = Object.entries(repResult.data.representatives).map(
    ([account, weightRaw]) => ({ account, weightRaw }),
  );

  let totalWeight = 0n;
  for (const entry of entries) {
    totalWeight += BigInt(entry.weightRaw || '0');
  }

  return { entries, online, totalWeightRaw: totalWeight.toString() };
}

export async function fetchRepNetworkSnapshot(limit = 25): Promise<RepNetworkSnapshot> {
  const { entries, online, totalWeightRaw } = await fetchRepNetworkContext(Math.max(limit, 50));

  const representatives: RepLeaderboardRow[] = entries.slice(0, limit).map((entry) => ({
    account: entry.account,
    weightRaw: entry.weightRaw,
    weightBan: formatWeightBan(entry.weightRaw),
    sharePercent: weightSharePercent(entry.weightRaw, totalWeightRaw),
    online: online.has(normalizeRepresentativeAccount(entry.account)),
  }));

  return {
    representatives,
    totalWeightRaw,
    onlineCount: online.size,
    onlineAccounts: [...online],
  };
}

export async function suggestDecentralizedRepresentative(
  excludeAccounts: ReadonlySet<string> = new Set(),
): Promise<SuggestedRepresentative | null> {
  const { entries, online, totalWeightRaw } = await fetchRepNetworkContext(200);
  if (online.size === 0) return null;

  const account = pickDecentralizedRepresentative(entries, online, { excludeAccounts });
  if (!account) return null;

  const normalized = normalizeRepresentativeAccount(account);
  if (!online.has(normalized)) return null;

  const entry = entries.find((e) => normalizeRepresentativeAccount(e.account) === normalized);
  if (!entry) return null;

  return {
    account,
    online: true,
    weightBan: formatWeightBan(entry.weightRaw),
    sharePercent: weightSharePercent(entry.weightRaw, totalWeightRaw),
  };
}

export async function fetchAccountDelegation(account: string): Promise<{
  representative: string | null;
  votingWeightRaw: string;
  assessment: DelegationChangeAssessment;
}> {
  const info = await rpc.getAccountInfo(account);
  const representative = info.success ? (info.data?.representative ?? null) : null;
  const weightResult = await rpc.getAccountWeight(account);
  const votingWeightRaw =
    weightResult.success && weightResult.data?.weight ? weightResult.data.weight : '0';
  return {
    representative,
    votingWeightRaw,
    assessment: assessRepresentativeForDelegationChange(representative),
  };
}

export function truncateRep(account: string, head = 12, tail = 8): string {
  if (account.length <= head + tail + 1) return account;
  return `${account.slice(0, head)}…${account.slice(-tail)}`;
}

export function isRepresentativeOnline(
  account: string,
  onlineAccounts: readonly string[],
): boolean {
  const normalized = normalizeRepresentativeAccount(account);
  if (!normalized) return false;
  return onlineAccounts.some((online) => normalizeRepresentativeAccount(online) === normalized);
}
