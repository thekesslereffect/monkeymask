// Typed facade over @bananocoin/bananojs (CJS). The published index.d.ts only
// covers part of the surface we use, so we describe the pieces we call here.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import bananojsImport from '@bananocoin/bananojs';

/** A Banano state block (pre- or post-signature). */
export type BananoBlock = Record<string, unknown>;

/** `account_info` response shape (fields present unless the RPC errored). */
export interface BananojsAccountInfo {
  balance?: string;
  frontier?: string;
  representative?: string;
  error?: unknown;
  [key: string]: unknown;
}

/** One `account_history` entry. */
export interface BananojsHistoryItem {
  height: string;
  subtype?: string;
  representative?: string;
  [key: string]: unknown;
}

export interface BananojsApi {
  BANANO_PREFIX: string;

  setBananodeApiUrl(url: string): void;

  // ---- keys / accounts ----
  getBananoAccountFromSeed(seed: string, index: number): Promise<string>;
  getPrivateKey(seed: string, index: number): string;
  getPublicKey(privateKey: string): Promise<string>;
  getBananoAccount(publicKey: string): string;

  // ---- signing ----
  getSignature(privateKey: string, block: BananoBlock): Promise<string> | string;
  signMessage(privateKey: string, message: string): Promise<string> | string;
  verifyMessage(publicKey: string, message: string, signature: string): boolean;

  // ---- seed-based operations ----
  sendBananoWithdrawalFromSeed(
    seed: string,
    index: number,
    to: string,
    amountBan: string,
    representative?: string,
    previous?: string,
  ): Promise<string | { hash?: string }>;
  receiveBananoDepositsForSeed(
    seed: string,
    index: number,
    representative: string,
    specificPendingBlockHash?: string,
  ): Promise<unknown>;
  changeBananoRepresentativeForSeed(
    seed: string,
    index: number,
    representative: string,
  ): Promise<string | { hash?: string }>;

  // ---- reads / conversions ----
  getAccountInfo(account: string, representative?: boolean): Promise<BananojsAccountInfo>;
  getAccountHistory(
    account: string,
    count: number,
    head?: string,
    raw?: boolean,
  ): Promise<{ history?: BananojsHistoryItem[] }>;
  getAccountsPending(
    accounts: string[],
    count: number,
  ): Promise<{ blocks?: Record<string, Record<string, unknown>> }>;
  getBananoPartsFromRaw(raw: string): Record<string, string>;
  getBananoPartsAsDecimal(parts: Record<string, string>): string;

  BananoUtil: {
    getRawStrFromMajorAmountStr(amount: string, prefix: string): string;
    getAccountPublicKey(account: string): string;
    getAccount(publicKey: string, prefix: string): string;
    hash(block: BananoBlock): string;
    signMessage(privateKey: string, message: string): Promise<string> | string;
    verifyMessage(publicKey: string, message: string, signature: string): boolean;
  };

  BananodeApi: {
    getAccountInfo(account: string, representative?: boolean): Promise<BananojsAccountInfo>;
    getAccountRepresentative(account: string): Promise<string>;
    getGeneratedWork(hash: string): Promise<string>;
    process(block: BananoBlock, subtype: string): Promise<string>;
    setUseRateLimit?(useRateLimit: boolean): void;
  };

  /** Lower-case alias bananojs also exposes (same object as BananodeApi). */
  bananodeApi: BananojsApi['BananodeApi'];
}

export const bananojs = bananojsImport as unknown as BananojsApi;
