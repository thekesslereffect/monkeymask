import type { DelegationChangeAssessment, SuggestedRepresentative } from '@monkeymask/wallet-standard';
import type { RepLeaderboardRow, RepNetworkSnapshot } from '@/lib/representatives';

export type { RepLeaderboardRow, RepNetworkSnapshot, SuggestedRepresentative };

async function repApi<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export async function fetchRepNetworkSnapshot(limit = 25): Promise<RepNetworkSnapshot> {
  return repApi<RepNetworkSnapshot>(`/api/representatives?view=snapshot&limit=${limit}`);
}

export async function fetchAccountDelegation(account: string): Promise<{
  representative: string | null;
  votingWeightRaw: string;
  assessment: DelegationChangeAssessment;
}> {
  return repApi(`/api/representatives?view=delegation&account=${encodeURIComponent(account)}`);
}

export async function suggestDecentralizedRepresentative(
  excludeAccounts: ReadonlySet<string> = new Set(),
): Promise<SuggestedRepresentative | null> {
  const params = new URLSearchParams({ view: 'suggest' });
  for (const account of excludeAccounts) {
    params.append('exclude', account);
  }
  const data = await repApi<{ suggestion: SuggestedRepresentative | null }>(
    `/api/representatives?${params}`,
  );
  return data.suggestion;
}
