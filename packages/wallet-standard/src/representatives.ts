import {
  ATOMIC_SWAP_HEADER_HEX,
  SEND_ALL_NFTS_REPRESENTATIVE,
  accountToPublicKeyHex,
  isFinishSupplyRepresentative,
  isSupplyRepresentative,
} from './nft.js';

/** Kalium's default node representative (also used post-NFT-mint cleanup). */
export const KALIUM_DEFAULT_REPRESENTATIVE =
  'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs';

/** Well-known reps excluded from "decentralized pick" suggestions. */
export const KNOWN_MEGA_REPRESENTATIVES = new Set<string>([
  KALIUM_DEFAULT_REPRESENTATIVE,
  'ban_1111111111111111111111111111111111111111111111111111hifc8npp',
]);

export interface RepresentativeEntry {
  account: string;
  weightRaw: string;
}

export type DelegationChangeSeverity = 'ok' | 'warn' | 'block';

export interface DelegationChangeAssessment {
  allowed: boolean;
  severity: DelegationChangeSeverity;
  message?: string;
}

/** True when the rep encodes an IPFS metadata pointer (post-mint issuer state). */
export function isMetadataRepresentative(account: string): boolean {
  try {
    return accountToPublicKeyHex(account).startsWith('1220');
  } catch {
    return false;
  }
}

/** Reps that must not be overwritten by a user-initiated delegation change. */
export function isDelegationChangeBlockedRepresentative(rep: string): boolean {
  if (rep === SEND_ALL_NFTS_REPRESENTATIVE) return true;
  if (isSupplyRepresentative(rep)) return true;
  if (isFinishSupplyRepresentative(rep)) return true;
  try {
    if (accountToPublicKeyHex(rep).startsWith(ATOMIC_SWAP_HEADER_HEX)) return true;
  } catch {
    /* invalid account */
  }
  return false;
}

/** Whether the wallet may publish a `change` block to set a node representative. */
export function assessRepresentativeForDelegationChange(
  rep: string | undefined | null,
): DelegationChangeAssessment {
  if (!rep) {
    return { allowed: true, severity: 'ok' };
  }
  if (isDelegationChangeBlockedRepresentative(rep)) {
    return {
      allowed: false,
      severity: 'block',
      message:
        'This account representative is reserved for an NFT protocol operation. Finish or cancel that flow before changing your voting delegate.',
    };
  }
  if (isMetadataRepresentative(rep)) {
    return {
      allowed: true,
      severity: 'warn',
      message:
        'Your representative encodes NFT collection metadata. Switching to a node representative is recommended—it prevents accidental extra mints.',
    };
  }
  return { allowed: true, severity: 'ok' };
}

const RAW_PER_BAN = BigInt('100000000000000000000000000000');

/** Format raw weight as BAN with up to 2 decimal places (for display). */
export function formatWeightBan(weightRaw: string): string {
  try {
    const raw = BigInt(weightRaw || '0');
    const whole = raw / RAW_PER_BAN;
    const frac = raw % RAW_PER_BAN;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(29, '0').slice(0, 2).replace(/0+$/, '');
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return '0';
  }
}

/** Share of total network weight (0–100). */
export function weightSharePercent(weightRaw: string, totalWeightRaw: string): number {
  try {
    const weight = BigInt(weightRaw || '0');
    const total = BigInt(totalWeightRaw || '0');
    if (total === 0n) return 0;
    return Number((weight * 10000n) / total) / 100;
  } catch {
    return 0;
  }
}

export interface PickDecentralizedRepOptions {
  /** Max share of total weight (default 1%). */
  maxSharePercent?: number;
  excludeAccounts?: ReadonlySet<string>;
}

export interface SuggestedRepresentative {
  account: string;
  online: boolean;
  weightBan: string;
  sharePercent: number;
}

/** Normalize a rep address for set lookups (trim only; Banano addresses are case-sensitive). */
export function normalizeRepresentativeAccount(account: string): string {
  return account.trim();
}

/** Build a lookup set from `representatives_online` RPC results. */
export function buildOnlineRepresentativeSet(accounts: readonly string[]): ReadonlySet<string> {
  const online = new Set<string>();
  for (const account of accounts) {
    const normalized = normalizeRepresentativeAccount(account);
    if (normalized) online.add(normalized);
  }
  return online;
}

/**
 * Pick a random online representative under the weight cap to spread delegation.
 * Returns null when no candidate matches the filters.
 */
export function pickDecentralizedRepresentative(
  representatives: RepresentativeEntry[],
  online: ReadonlySet<string>,
  options: PickDecentralizedRepOptions = {},
): string | null {
  const maxSharePercent = options.maxSharePercent ?? 1;
  const exclude = options.excludeAccounts ?? new Set<string>();
  const excluded = new Set<string>();
  for (const account of exclude) {
    excluded.add(normalizeRepresentativeAccount(account));
  }

  let totalWeight = 0n;
  for (const entry of representatives) {
    totalWeight += BigInt(entry.weightRaw || '0');
  }
  if (totalWeight === 0n) return null;

  const maxWeight = (totalWeight * BigInt(Math.floor(maxSharePercent * 100))) / 10000n;

  const candidates = representatives.filter((entry) => {
    const account = normalizeRepresentativeAccount(entry.account);
    if (!online.has(account)) return false;
    if (excluded.has(account)) return false;
    if (KNOWN_MEGA_REPRESENTATIVES.has(entry.account)) return false;
    const weight = BigInt(entry.weightRaw || '0');
    if (weight <= 0n) return false;
    if (weight > maxWeight) return false;
    return true;
  });

  if (candidates.length === 0) return null;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index]?.account ?? null;
}
