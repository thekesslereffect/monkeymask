'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Wallet, WalletAccount } from '@wallet-standard/base';
import type {
  BananoFee,
  BananoOperation,
  BananoSignInInput,
  BananoSignInOutput,
  BananoSignMessageOutput,
  BananoSignAndSendTransactionOutput,
  BananoSignTransactionOutput,
  BananoReceivable,
  BananoHistoryEntry,
} from '@monkeymask/wallet-standard';
import {
  connectWallet,
  disconnectWallet,
  legacyRequest,
  setupWalletDiscovery,
  signAndSendTransactionWithWallet,
  signInWithWallet,
  signMessageWithWallet,
  signTransactionWithWallet,
  subscribeWalletEvents,
  type MonkeyMaskContextValue,
  type MonkeyMaskProviderConfig,
  type SpendingSessionInfo,
} from './provider-utils.js';

const MonkeyMaskContext = createContext<MonkeyMaskContextValue | null>(null);

export function MonkeyMaskProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MonkeyMaskProviderConfig;
}) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [accounts, setAccounts] = useState<readonly WalletAccount[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);
  const autoConnectAttempted = useRef(false);

  const handleError = useCallback(
    (message: string) => {
      setError(message);
      config.onError?.(message);
    },
    [config],
  );

  useEffect(() => {
    return setupWalletDiscovery((foundWallet, isInstalled) => {
      setWallet(foundWallet);
      setInstalled(isInstalled);
    });
  }, []);

  useEffect(() => {
    if (!wallet) return;
    return subscribeWalletEvents(wallet, {
      onChange: (nextAccounts) => setAccounts(nextAccounts),
    });
  }, [wallet]);

  const getActiveAccount = useCallback(
    (account?: WalletAccount): WalletAccount => {
      const active = account ?? accounts[0];
      if (!active) throw new Error('No connected account');
      return active;
    },
    [accounts],
  );

  const connect = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!wallet) {
        handleError('MonkeyMask wallet not found');
        return;
      }
      setConnecting(true);
      setError(null);
      try {
        const result = await connectWallet(wallet, { silent: options?.silent });
        setAccounts(result.accounts);
        const pk = result.accounts[0]?.address;
        if (pk) config.onConnect?.(pk);
      } catch (e) {
        handleError(e instanceof Error ? e.message : 'Connect failed');
        throw e;
      } finally {
        setConnecting(false);
      }
    },
    [wallet, config, handleError],
  );

  const disconnect = useCallback(async () => {
    if (!wallet) return;
    try {
      await disconnectWallet(wallet);
      setAccounts([]);
      config.onDisconnect?.();
    } catch (e) {
      handleError(e instanceof Error ? e.message : 'Disconnect failed');
    }
  }, [wallet, config, handleError]);

  const signMessage = useCallback(
    async (message: Uint8Array, account?: WalletAccount): Promise<BananoSignMessageOutput> => {
      if (!wallet) throw new Error('Wallet not connected');
      return signMessageWithWallet(wallet, getActiveAccount(account), message);
    },
    [wallet, getActiveAccount],
  );

  const signIn = useCallback(
    async (input: BananoSignInInput = {}): Promise<BananoSignInOutput> => {
      if (!wallet) throw new Error('Wallet not connected');
      const output = await signInWithWallet(wallet, input);
      setAccounts([output.account]);
      config.onConnect?.(output.account.address);
      return output;
    },
    [wallet, config],
  );

  const signTransaction = useCallback(
    async (
      transaction: BananoOperation,
      account?: WalletAccount,
    ): Promise<BananoSignTransactionOutput> => {
      if (!wallet) throw new Error('Wallet not connected');
      return signTransactionWithWallet(wallet, getActiveAccount(account), transaction);
    },
    [wallet, getActiveAccount],
  );

  const signAndSendTransaction = useCallback(
    async (
      transaction: BananoOperation,
      account?: WalletAccount,
    ): Promise<BananoSignAndSendTransactionOutput> => {
      if (!wallet) throw new Error('Wallet not connected');
      return signAndSendTransactionWithWallet(wallet, getActiveAccount(account), transaction);
    },
    [wallet, getActiveAccount],
  );

  const resolveBNS = useCallback(async (bnsName: string): Promise<string> => {
    const result = await legacyRequest<{ address: string } | string>('resolveBNS', { bnsName });
    return typeof result === 'string' ? result : result.address;
  }, []);

  const reverseResolveBNS = useCallback(
    async (address?: string, tld?: string): Promise<string[]> => {
      const result = await legacyRequest<{ names: string[] } | string[]>('reverseResolveBNS', {
        address,
        tld,
      });
      return Array.isArray(result) ? result : (result.names ?? []);
    },
    [],
  );

  const getAccountInfo = useCallback(async (address?: string) => {
    const result = await legacyRequest<{ accountInfo: Record<string, unknown> }>('getAccountInfo', {
      address,
    });
    return result.accountInfo;
  }, []);

  const getReceivable = useCallback(
    async (address?: string, count?: number): Promise<BananoReceivable[]> => {
      const result = await legacyRequest<{ receivables: BananoReceivable[] }>('getReceivable', {
        address,
        count,
      });
      return result.receivables ?? [];
    },
    [],
  );

  const getAccountHistory = useCallback(
    async (address?: string, count?: number, head?: string): Promise<BananoHistoryEntry[]> => {
      const result = await legacyRequest<{ transactions: BananoHistoryEntry[] }>(
        'getAccountHistory',
        { address, count, head },
      );
      return result.transactions ?? [];
    },
    [],
  );

  const requestSpendingSession = useCallback(
    async (params?: { limit?: string; durationMs?: number }): Promise<SpendingSessionInfo | null> => {
      const result = await legacyRequest<{ session: SpendingSessionInfo | null } | SpendingSessionInfo | null>(
        'requestSpendingSession',
        { ...params },
      );
      if (!result) return null;
      return 'session' in result ? result.session : result;
    },
    [],
  );

  const getSpendingSession = useCallback(async (): Promise<SpendingSessionInfo | null> => {
    const result = await legacyRequest<{ session: SpendingSessionInfo | null } | SpendingSessionInfo | null>(
      'getSpendingSession',
    );
    if (!result) return null;
    return 'session' in result ? result.session : result;
  }, []);

  const revokeSpendingSession = useCallback(async (): Promise<void> => {
    await legacyRequest<{ revoked: boolean }>('revokeSpendingSession');
  }, []);

  useEffect(() => {
    if (!config.autoConnect || autoConnectAttempted.current || !wallet) return;
    autoConnectAttempted.current = true;
    void connect({ silent: true }).catch(() => {
      // Silent connect failure is expected when not yet authorized.
    });
  }, [config.autoConnect, wallet, connect]);

  const value = useMemo<MonkeyMaskContextValue>(
    () => ({
      wallet,
      accounts,
      connected: accounts.length > 0,
      connecting,
      publicKey: accounts[0]?.address ?? null,
      installed,
      error,
      connect,
      disconnect,
      signMessage,
      signIn,
      signTransaction,
      signAndSendTransaction,
      resolveBNS,
      reverseResolveBNS,
      getAccountInfo,
      getReceivable,
      getAccountHistory,
      requestSpendingSession,
      getSpendingSession,
      revokeSpendingSession,
      clearError: () => setError(null),
    }),
    [
      wallet,
      accounts,
      connecting,
      installed,
      error,
      connect,
      disconnect,
      signMessage,
      signIn,
      signTransaction,
      signAndSendTransaction,
      resolveBNS,
      reverseResolveBNS,
      getAccountInfo,
      getReceivable,
      getAccountHistory,
      requestSpendingSession,
      getSpendingSession,
      revokeSpendingSession,
    ],
  );

  return <MonkeyMaskContext.Provider value={value}>{children}</MonkeyMaskContext.Provider>;
}

export function useMonkeyMask(): MonkeyMaskContextValue {
  const ctx = useContext(MonkeyMaskContext);
  if (!ctx) throw new Error('useMonkeyMask must be used within MonkeyMaskProvider');
  return ctx;
}

export function useWallet() {
  const { wallet, accounts, connected, connecting, installed } = useMonkeyMask();
  return { wallet, accounts, connected, connecting, installed };
}

export function useConnect() {
  const { connect, disconnect, connecting, connected } = useMonkeyMask();
  return { connect, disconnect, connecting, connected };
}

export function useAccounts() {
  const { accounts, publicKey } = useMonkeyMask();
  return { accounts, publicKey };
}

export function useSignMessage() {
  const { signMessage } = useMonkeyMask();
  return signMessage;
}

export function useSignIn() {
  const { signIn } = useMonkeyMask();
  return signIn;
}

export function useSignTransaction() {
  const { signTransaction } = useMonkeyMask();
  return signTransaction;
}

export function useSignAndSendTransaction() {
  const { signAndSendTransaction } = useMonkeyMask();
  return signAndSendTransaction;
}

/**
 * Send BAN to a single recipient, or to many at once (multi-send / airdrop).
 * Pass `{ to, amount }` for one recipient or `{ sends: [...] }` for many.
 */
export type SendParams =
  | { to: string; amount: string; name?: string }
  | { sends: BananoFee[]; name?: string };

/**
 * Convenience wrapper over `signAndSendTransaction` for plain BAN sends. Handles
 * both a single recipient and a multi-send / airdrop; the wallet verifies the
 * balance covers the total up front. Returns `{ hash, hashes }` — `hashes` lists
 * every published block (airdrop receipts).
 */
export function useSend() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: SendParams, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'send', ...params }, account),
    [signAndSendTransaction],
  );
}

/**
 * Claim receivable (pending) blocks. Pass a `blockHash` to claim one specific
 * receivable, or omit it to claim all pending. Returns `{ hash, hashes }` —
 * `hashes` lists every published receive/open block.
 */
export function useReceive() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params?: { blockHash?: string; name?: string }, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'receive', ...(params ?? {}) }, account),
    [signAndSendTransaction],
  );
}

/**
 * Sweep an account: send its entire spendable balance to one recipient. Claims
 * any pending first and sends in raw so no dust is left. Returns `{ hash }`.
 */
export function useSweep() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: { to: string; name?: string }, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'sweep', ...params }, account),
    [signAndSendTransaction],
  );
}

/**
 * Manage a per-origin spending session. While active, the wallet auto-approves
 * single `send` payments (no popup) up to the granted allowance for this site.
 * Returns `{ request, get, revoke }`.
 */
export function useSpendingSession() {
  const { requestSpendingSession, getSpendingSession, revokeSpendingSession } = useMonkeyMask();
  return useMemo(
    () => ({
      request: requestSpendingSession,
      get: getSpendingSession,
      revoke: revokeSpendingSession,
    }),
    [requestSpendingSession, getSpendingSession, revokeSpendingSession],
  );
}

/** Read an account's claimable (pending/receivable) blocks. */
export function useReceivable() {
  const { getReceivable } = useMonkeyMask();
  return getReceivable;
}

/** Read an account's transaction history. */
export function useAccountHistory() {
  const { getAccountHistory } = useMonkeyMask();
  return getAccountHistory;
}

/**
 * Reverse-resolve a Banano address into the BNS name(s) currently pointing to
 * it. Defaults to the connected account when no address is given. Best-effort
 * (a single address can have several names); returns `[]` when none are found.
 */
export function useReverseBNS() {
  const { reverseResolveBNS } = useMonkeyMask();
  return reverseResolveBNS;
}

export interface MintNFTParams {
  /** IPFS v0 CID (Qm…) of the metadata JSON. */
  metadataCid: string;
  /** Recipient account (ban_… or a BNS name). */
  to: string;
  /** BAN carried by the mint block (optional; wallet uses a tiny default). */
  amount?: string;
  /** Max supply for the collection (optional; defaults to 1). */
  maxSupply?: number;
  /** Optional display name shown in the wallet approval UI. */
  name?: string;
  /**
   * Optional fees/payments sent after a successful mint (e.g. a platform mint
   * price + a protocol fee). The wallet checks the balance covers the mint plus
   * every fee before publishing anything.
   */
  fees?: BananoFee[];
}

/**
 * Convenience wrapper over `signAndSendTransaction` that mints a Banano NFT
 * (73-meta-tokens) and sends it to a recipient. Returns the mint block hash,
 * which is the NFT's asset representative.
 */
export function useMintNFT() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: MintNFTParams, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'mint', ...params }, account),
    [signAndSendTransaction],
  );
}

export interface MintEditionParams {
  /** IPFS v0 CID (Qm…) of the existing collection's metadata JSON. */
  metadataCid: string;
  /** Recipient account (ban_… or a BNS name). */
  to: string;
  /** BAN carried by the mint block (optional; wallet uses a tiny default). */
  amount?: string;
  /** Optional display name shown in the wallet approval UI. */
  name?: string;
  /** Optional fees sent only after a successful mint (see MintNFTParams). */
  fees?: BananoFee[];
}

/**
 * Mint an additional edition (copy) of a collection you issued with
 * `maxSupply` > 1 (or unlimited). Returns `{ hash, hashes }`; the first hash is
 * the new edition's asset representative. Rejects if the edition limit is hit.
 */
export function useMintEdition() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: MintEditionParams, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'mintEdition', ...params }, account),
    [signAndSendTransaction],
  );
}

/**
 * Transfer a single owned NFT (`{ assetRepresentative, to }`) or many at once
 * (`{ transfers: [...] }`).
 */
export type TransferNFTParams =
  | {
      /** The NFT's asset representative — i.e. its mint block hash (64 hex). */
      assetRepresentative: string;
      /** Recipient account (ban_… or a BNS name). */
      to: string;
      /** BAN carried by the transfer block (optional; wallet uses a tiny default). */
      amount?: string;
      /** Optional display name shown in the wallet approval UI. */
      name?: string;
    }
  | {
      /** Many transfers, each moving one asset (possibly to different recipients). */
      transfers: { assetRepresentative: string; to: string; amount?: string }[];
      /** Optional display name shown in the wallet approval UI. */
      name?: string;
    };

/**
 * Convenience wrapper over `signAndSendTransaction` that transfers one or many
 * owned Banano NFTs (73-meta-tokens). Returns `{ hash, hashes }` — `hashes` lists
 * every `send#asset` block published.
 */
export function useTransferNFT() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: TransferNFTParams, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'transfer', ...params }, account),
    [signAndSendTransaction],
  );
}

export interface BurnNFTParams {
  /** The NFT's asset representative — i.e. its mint block hash (64 hex). */
  assetRepresentative: string;
  /**
   * Optional burn account override. Defaults to the canonical burn address;
   * must be a recognized burn account for indexers to treat the asset as gone.
   */
  to?: string;
  /** BAN carried by the burn block (optional; wallet uses a tiny default). */
  amount?: string;
  /** Optional display name shown in the wallet approval UI. */
  name?: string;
}

/**
 * Convenience wrapper over `signAndSendTransaction` that permanently destroys an
 * owned Banano NFT by sending it to a canonical burn account (73-meta-tokens
 * `send#burn`). Irreversible. Returns `{ hash, hashes }`.
 */
export function useBurnNFT() {
  const { signAndSendTransaction } = useMonkeyMask();
  return useCallback(
    (params: BurnNFTParams, account?: WalletAccount) =>
      signAndSendTransaction({ type: 'burn', ...params }, account),
    [signAndSendTransaction],
  );
}
