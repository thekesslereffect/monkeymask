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

const RPC_URL = process.env.BANANO_RPC_URL ?? 'https://kaliumapi.appditto.com/api';

const RPC_ENDPOINTS = [
  RPC_URL,
  'https://kaliumapi.appditto.com/api',
  'https://api.banano.trade/proxy',
  'https://booster.dev-ptera.com/banano-rpc',
];

async function bananoRpc<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  let lastError: Error | null = null;
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as T & { error?: string };
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error('All RPC endpoints failed');
}

async function fetchOnlineRepresentatives(): Promise<ReadonlySet<string>> {
  const onlineEndpoints = [
    'https://api.banano.trade/proxy',
    ...RPC_ENDPOINTS.filter((url) => url !== 'https://api.banano.trade/proxy'),
  ];
  for (const endpoint of onlineEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'representatives_online' }),
        cache: 'no-store',
      });
      if (!response.ok) continue;
      const data = (await response.json()) as { representatives?: string[]; error?: string };
      if (data.error || !data.representatives) continue;
      return buildOnlineRepresentativeSet(data.representatives);
    } catch {
      /* try next endpoint */
    }
  }
  return new Set();
}

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
  onlineAccounts: string[];
}

async function fetchRepNetworkContext(repCount: number): Promise<{
  entries: RepresentativeEntry[];
  online: ReadonlySet<string>;
  totalWeightRaw: string;
}> {
  const [repList, online] = await Promise.all([
    bananoRpc<{ representatives: Record<string, string> }>('representatives', {
      sorting: true,
      count: String(repCount),
    }),
    fetchOnlineRepresentatives(),
  ]);

  const entries: RepresentativeEntry[] = Object.entries(repList.representatives ?? {}).map(
    ([account, weightRaw]) => ({ account, weightRaw }),
  );

  let totalWeight = BigInt(0);
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
  try {
    const info = await bananoRpc<{ representative?: string; weight?: string }>('account_info', {
      account,
      representative: true,
      weight: true,
    });
    const representative = info.representative ?? null;
    return {
      representative,
      votingWeightRaw: info.weight ?? '0',
      assessment: assessRepresentativeForDelegationChange(representative),
    };
  } catch {
    return {
      representative: null,
      votingWeightRaw: '0',
      assessment: assessRepresentativeForDelegationChange(null),
    };
  }
}

export function isRepresentativeOnline(
  account: string,
  onlineAccounts: readonly string[],
): boolean {
  const normalized = normalizeRepresentativeAccount(account);
  if (!normalized) return false;
  return onlineAccounts.some((online) => normalizeRepresentativeAccount(online) === normalized);
}

export type { SuggestedRepresentative };
