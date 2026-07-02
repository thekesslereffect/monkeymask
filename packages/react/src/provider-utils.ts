import type { Wallet, WalletAccount } from '@wallet-standard/base';
import {
  BananoSignAndSendTransaction,
  BananoSignIn,
  BananoSignMessage,
  BananoSignTransaction,
  BANANO_MAINNET,
  type BananoOperation,
  type BananoSignInInput,
  type BananoSignInOutput,
  type BananoSignMessageOutput,
  type BananoSignAndSendTransactionOutput,
  type BananoSignTransactionOutput,
  type BananoReceivable,
  type BananoHistoryEntry,
  type BananoSignInFeature,
  type BananoSignMessageFeature,
  type BananoSignTransactionFeature,
  type BananoSignAndSendTransactionFeature,
  PROTOCOL_INIT_EVENT,
  PROVIDER_ERRORS,
  createProviderError,
} from '@monkeymask/wallet-standard';
import {
  StandardDisconnect,
  StandardEvents,
  type StandardDisconnectFeature,
  type StandardEventsFeature,
} from '@wallet-standard/features';
import { getWallets } from '@wallet-standard/app';
import {
  connectWallet,
  findMonkeyMaskWallet,
} from './discovery.js';

export interface LegacyBananoProvider {
  request(args: { method: string; params?: Record<string, unknown> }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  readonly isConnected: boolean;
  readonly publicKey: string | null;
  readonly isMonkeyMask: boolean;
}

declare global {
  interface Window {
    banano?: LegacyBananoProvider;
  }
}

/** Info about an active per-origin spending session (auto-approve allowance). */
export interface SpendingSessionInfo {
  /** Account the allowance is scoped to. */
  readonly address: string;
  /** Total allowance in BAN decimals. */
  readonly limit: string;
  /** Amount already spent under this session, in BAN decimals. */
  readonly spent: string;
  /** Remaining spendable in BAN decimals. */
  readonly remaining: string;
  /** Epoch ms when the session expires. */
  readonly expiresAt: number;
}

export interface MonkeyMaskContextValue {
  wallet: Wallet | null;
  accounts: readonly WalletAccount[];
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  installed: boolean;
  error: string | null;
  connect: (options?: { silent?: boolean }) => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array, account?: WalletAccount) => Promise<BananoSignMessageOutput>;
  signIn: (input?: BananoSignInInput) => Promise<BananoSignInOutput>;
  signTransaction: (
    transaction: BananoOperation,
    account?: WalletAccount,
  ) => Promise<BananoSignTransactionOutput>;
  signAndSendTransaction: (
    transaction: BananoOperation,
    account?: WalletAccount,
  ) => Promise<BananoSignAndSendTransactionOutput>;
  resolveBNS: (bnsName: string) => Promise<string>;
  reverseResolveBNS: (address?: string, tld?: string) => Promise<string[]>;
  getAccountInfo: (address?: string) => Promise<Record<string, unknown>>;
  getReceivable: (address?: string, count?: number) => Promise<BananoReceivable[]>;
  getAccountHistory: (address?: string, count?: number, head?: string) => Promise<BananoHistoryEntry[]>;
  requestSpendingSession: (params?: {
    limit?: string;
    durationMs?: number;
  }) => Promise<SpendingSessionInfo | null>;
  getSpendingSession: () => Promise<SpendingSessionInfo | null>;
  revokeSpendingSession: () => Promise<void>;
  clearError: () => void;
}

export interface MonkeyMaskProviderConfig {
  autoConnect?: boolean;
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function createMonkeyMaskContextValue(
  state: {
    wallet: Wallet | null;
    accounts: readonly WalletAccount[];
    connecting: boolean;
    error: string | null;
    installed: boolean;
  },
  actions: Pick<
    MonkeyMaskContextValue,
    | 'connect'
    | 'disconnect'
    | 'signMessage'
    | 'signIn'
    | 'signTransaction'
    | 'signAndSendTransaction'
    | 'resolveBNS'
    | 'reverseResolveBNS'
    | 'getAccountInfo'
    | 'getReceivable'
    | 'getAccountHistory'
    | 'requestSpendingSession'
    | 'getSpendingSession'
    | 'revokeSpendingSession'
    | 'clearError'
  >,
): MonkeyMaskContextValue {
  const publicKey = state.accounts[0]?.address ?? null;
  return {
    ...state,
    connected: state.accounts.length > 0,
    publicKey,
    ...actions,
  };
}

export async function signMessageWithWallet(
  wallet: Wallet,
  account: WalletAccount,
  message: Uint8Array,
): Promise<BananoSignMessageOutput> {
  const feature = wallet.features[BananoSignMessage] as
    | BananoSignMessageFeature[typeof BananoSignMessage]
    | undefined;
  if (!feature) throw new Error('Wallet does not support banano:signMessage');
  const [output] = await feature.signMessage({ account, message });
  return output;
}

export async function signInWithWallet(
  wallet: Wallet,
  input: BananoSignInInput = {},
): Promise<BananoSignInOutput> {
  const feature = wallet.features[BananoSignIn] as
    | BananoSignInFeature[typeof BananoSignIn]
    | undefined;
  if (!feature) throw new Error('Wallet does not support banano:signIn');
  const [output] = await feature.signIn(input);
  return output;
}

export async function signTransactionWithWallet(
  wallet: Wallet,
  account: WalletAccount,
  transaction: BananoOperation,
): Promise<BananoSignTransactionOutput> {
  const feature = wallet.features[BananoSignTransaction] as
    | BananoSignTransactionFeature[typeof BananoSignTransaction]
    | undefined;
  if (!feature) throw new Error('Wallet does not support banano:signTransaction');
  const [output] = await feature.signTransaction({
    account,
    chain: BANANO_MAINNET,
    transaction,
  });
  return output;
}

export async function signAndSendTransactionWithWallet(
  wallet: Wallet,
  account: WalletAccount,
  transaction: BananoOperation,
): Promise<BananoSignAndSendTransactionOutput> {
  const feature = wallet.features[BananoSignAndSendTransaction] as
    | BananoSignAndSendTransactionFeature[typeof BananoSignAndSendTransaction]
    | undefined;
  if (!feature) throw new Error('Wallet does not support banano:signAndSendTransaction');
  const [output] = await feature.signAndSendTransaction({
    account,
    chain: BANANO_MAINNET,
    transaction,
  });
  return output;
}

export async function legacyRequest<T>(
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  if (!window.banano) {
    throw createProviderError('MonkeyMask extension not found', PROVIDER_ERRORS.DISCONNECTED.code);
  }
  return window.banano.request({ method, params }) as Promise<T>;
}

export function setupWalletDiscovery(
  onWallet: (wallet: Wallet | null, installed: boolean) => void,
): () => void {
  // getWallets() dispatches wallet-standard:app-ready with { register } in event.detail.
  const walletsApi = getWallets();
  const sync = () => {
    const wallet = findMonkeyMaskWallet(walletsApi.get());
    onWallet(wallet ?? null, !!wallet || !!window.banano?.isMonkeyMask);
  };

  sync();
  const unsubRegister = walletsApi.on('register', sync);
  const unsubUnregister = walletsApi.on('unregister', sync);

  if (typeof window !== 'undefined') {
    window.addEventListener(PROTOCOL_INIT_EVENT, sync);
  }

  return () => {
    unsubRegister();
    unsubUnregister();
    if (typeof window !== 'undefined') {
      window.removeEventListener(PROTOCOL_INIT_EVENT, sync);
    }
  };
}

export async function disconnectWallet(wallet: Wallet): Promise<void> {
  const feature = wallet.features[StandardDisconnect] as
    | StandardDisconnectFeature[typeof StandardDisconnect]
    | undefined;
  if (feature) {
    await feature.disconnect();
  }
}

export function subscribeWalletEvents(
  wallet: Wallet,
  handlers: {
    onChange?: (accounts: readonly WalletAccount[]) => void;
  },
): () => void {
  const eventsFeature = wallet.features[StandardEvents] as
    | StandardEventsFeature[typeof StandardEvents]
    | undefined;
  if (!eventsFeature) return () => {};
  return eventsFeature.on('change', (properties: { accounts?: readonly WalletAccount[] }) => {
    if (properties.accounts && handlers.onChange) {
      handlers.onChange(properties.accounts);
    }
  });
}

export { connectWallet, findMonkeyMaskWallet, getWallets };
