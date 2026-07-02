import type { WalletAccount } from '@wallet-standard/base';
import type { BananoChain } from './chains.js';
import { BANANO_MAINNET } from './chains.js';

/** Banano feature identifiers (Wallet Standard namespace). */
export const BananoSignMessage = 'banano:signMessage' as const;
export const BananoSignIn = 'banano:signIn' as const;
export const BananoSignTransaction = 'banano:signTransaction' as const;
export const BananoSignAndSendTransaction = 'banano:signAndSendTransaction' as const;

export type BananoFeature =
  | typeof BananoSignMessage
  | typeof BananoSignIn
  | typeof BananoSignTransaction
  | typeof BananoSignAndSendTransaction;

/**
 * A single payment leg — a plain Banano send the wallet publishes on the user's
 * behalf, shown as its own line in the approval UI. Used both as a fee attached
 * to another operation (e.g. a mint) and as an entry in a `batch` (multi-send /
 * airdrop). An array lets a platform charge its own mint price plus a protocol
 * fee at once, or fan out to many recipients.
 */
export interface BananoFee {
  /** Recipient account (ban_… or a BNS name). */
  readonly to: string;
  /** Amount in BAN (major units). */
  readonly amount: string;
  /** Optional human-readable label shown in the approval UI (e.g. "Mint fee"). */
  readonly label?: string;
}

/** Alias for a payment leg used in a `batch` operation. */
export type BananoPayment = BananoFee;

/** Structured block intent — wallet builds, signs, and optionally publishes. */
export type BananoOperation =
  | {
      /**
       * Send BAN to a single recipient. For a multi-send / airdrop, use the
       * `sends` form instead. (`banano:signTransaction`, which only signs a
       * single block, supports this form only.)
       */
      readonly type: 'send';
      /** Recipient (ban_… or a BNS name). */
      readonly to: string;
      /** Amount in BAN. */
      readonly amount: string;
      /**
       * Optional display label (e.g. a payee name from a `ban:` payment URI),
       * shown in the approval UI only.
       */
      readonly name?: string;
      /**
       * Optional free-form note/memo (e.g. a `ban:` URI `message`), shown in the
       * approval UI only. Banano has no on-chain memo, so this is informational.
       */
      readonly message?: string;
    }
  | {
      /**
       * Send BAN to many recipients in a single approval — a multi-send /
       * airdrop. Each entry becomes its own block; the wallet verifies the
       * balance covers the total up front and returns every published hash.
       */
      readonly type: 'send';
      /** Recipients + amounts. */
      readonly sends: readonly BananoPayment[];
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Sweep the account: send its entire spendable balance to one recipient.
       * The wallet claims any pending blocks first, then sends the full confirmed
       * balance in raw so no dust is left behind.
       */
      readonly type: 'sweep';
      /** Recipient (ban_… or a BNS name). */
      readonly to: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | { readonly type: 'change'; readonly representative: string }
  | {
      /**
       * Claim receivable (pending) blocks into the account. With no `blockHash`,
       * the wallet claims every pending block; with `blockHash`, it claims only
       * that specific receivable. Publishes one receive/open block per claim and
       * returns every published hash.
       */
      readonly type: 'receive';
      /** Optional specific receivable block hash to claim (defaults to all). */
      readonly blockHash?: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Mint a Banano NFT (73-meta-tokens metaprotocol) and send it to a
       * recipient. The wallet publishes a `change#supply` block followed by a
       * `send#mint` block; the mint block hash becomes the asset representative.
       */
      readonly type: 'mint';
      /** IPFS CID (v0 `Qm…` or v1 `b…`, sha2-256) of the ERC-721-style metadata JSON. */
      readonly metadataCid: string;
      /** Recipient account (ban_… or a BNS name). */
      readonly to: string;
      /** BAN carried by the `send#mint` block (defaults to a tiny amount). */
      readonly amount?: string;
      /** Max supply for the collection (0 = unlimited; defaults to 1). */
      readonly maxSupply?: number;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
      /**
       * Optional fees/payments to send after the NFT is minted (e.g. a platform
       * mint price + a protocol fee). Sent only if the mint succeeds; the wallet
       * verifies the balance covers the mint plus every fee up front.
       */
      readonly fees?: BananoFee[];
    }
  | {
      /**
       * Mint an additional edition (copy) of an existing collection you issued.
       * The collection must have been created with `maxSupply` > 1 (or 0 for
       * unlimited). The wallet publishes a fresh `change#supply` → `send#mint`
       * pair reusing the collection's `metadata_representative`; the mint block's
       * hash is the new edition's asset representative. Minting whole pairs keeps
       * ordinary sends from ever being miscounted as editions. Rejected if the
       * edition limit is already reached.
       */
      readonly type: 'mintEdition';
      /** IPFS CID (v0 `Qm…` or v1 `b…`, sha2-256) of the existing collection's metadata JSON. */
      readonly metadataCid: string;
      /** Recipient account (ban_… or a BNS name). */
      readonly to: string;
      /** BAN carried by the `send#mint` block (defaults to a tiny amount). */
      readonly amount?: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
      /** Optional fees sent only after a successful mint (see `mint`). */
      readonly fees?: BananoFee[];
    }
  | {
      /**
       * Transfer a single owned Banano NFT. The wallet receives any pending
       * balance for the asset, then publishes a `send#asset` block whose
       * `representative` is the asset representative (the mint block hash
       * encoded as an account), which the indexer follows to move ownership.
       * For several NFTs at once, use the `transfers` form.
       */
      readonly type: 'transfer';
      /** The NFT's asset representative — its mint block hash (64 hex). */
      readonly assetRepresentative: string;
      /** Recipient (ban_… or a BNS name). */
      readonly to: string;
      /** BAN carried by the `send#asset` block (defaults to a tiny amount). */
      readonly amount?: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Transfer several owned Banano NFTs in a single approval. Each entry
       * moves one asset (possibly to a different recipient). Returns every
       * published `send#asset` hash.
       */
      readonly type: 'transfer';
      /** The transfers to publish. */
      readonly transfers: readonly {
        readonly assetRepresentative: string;
        readonly to: string;
        readonly amount?: string;
      }[];
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Permanently destroy an owned Banano NFT. This is a `send#asset` to a
       * canonical burn account (a black-hole address with no recoverable key),
       * per the 73-meta-tokens `send#burn` spec, so the asset can never be moved
       * again. Irreversible — the wallet surfaces a distinct destructive warning.
       */
      readonly type: 'burn';
      /** The NFT's asset representative — its mint block hash (64 hex). */
      readonly assetRepresentative: string;
      /**
       * Optional override for which burn account to send to. Defaults to the
       * canonical burn address. Must be one of the recognized burn accounts for
       * indexers to treat the asset as destroyed.
       */
      readonly to?: string;
      /** BAN carried by the `send#burn` block (defaults to a tiny amount). */
      readonly amount?: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Lock a collection you issued so no further editions can be minted
       * (73-meta-tokens `#finish_supply`). The wallet publishes a change block
       * whose `representative` encodes the collection's supply-block height;
       * afterwards `mintEdition` for this collection is refused.
       */
      readonly type: 'finishSupply';
      /** The collection's metadata CID (identifies which collection to lock). */
      readonly metadataCid: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    }
  | {
      /**
       * Transfer every NFT the account holds to one recipient in a single block
       * (73-meta-tokens `send#all_nfts`). The wallet pockets pending assets
       * first, publishes one send whose `representative` is the "send all NFTs"
       * marker, then restores a clean representative.
       */
      readonly type: 'sendAllNfts';
      /** Recipient (ban_… or a BNS name) that receives every held asset. */
      readonly to: string;
      /** BAN carried by the marker send (defaults to a tiny amount). */
      readonly amount?: string;
      /** Optional display name, shown in the approval UI only. */
      readonly name?: string;
    };

/** Sign In With Banano input (SIWB, modeled on SIWS). All fields optional. */
export interface BananoSignInInput {
  readonly domain?: string;
  readonly address?: string;
  readonly statement?: string;
  readonly uri?: string;
  readonly version?: string;
  readonly chainId?: string;
  readonly nonce?: string;
  readonly issuedAt?: string;
  readonly expirationTime?: string;
  readonly notBefore?: string;
  readonly requestId?: string;
  readonly resources?: readonly string[];
}

export interface BananoSignInOutput {
  readonly account: WalletAccount;
  readonly signedMessage: Uint8Array;
  readonly signature: Uint8Array;
  readonly signatureType?: 'ed25519';
}

export interface BananoSignMessageInput {
  readonly account: WalletAccount;
  readonly message: Uint8Array;
}

export interface BananoSignMessageOutput {
  readonly signedMessage: Uint8Array;
  readonly signature: Uint8Array;
  readonly signatureType?: 'ed25519';
}

export interface BananoSignTransactionInput {
  readonly account: WalletAccount;
  readonly chain: BananoChain;
  readonly transaction: BananoOperation;
}

export interface BananoSignTransactionOutput {
  readonly signedBlock: string;
}

export interface BananoSignAndSendTransactionInput {
  readonly account: WalletAccount;
  readonly chain: BananoChain;
  readonly transaction: BananoOperation;
}

/**
 * Per-recipient outcome of a multi-send / airdrop or multi-NFT transfer. Present
 * only for the array forms of `send`/`transfer`. Because Banano can't publish an
 * atomic multi-block transaction, these run best-effort: each entry reports
 * whether that leg published (`hash`) or failed (`error`), so a partial failure
 * is visible and the remaining recipients still go through.
 */
export interface BananoBatchLegResult {
  /** Recipient account (send) — resolved to ban_… . */
  readonly to?: string;
  /** Asset representative (NFT transfer). */
  readonly assetRepresentative?: string;
  /** Amount in BAN for this leg. */
  readonly amount?: string;
  /** Published block hash, if this leg succeeded. */
  readonly hash?: string;
  /** Failure reason, if this leg did not publish. */
  readonly error?: string;
}

export interface BananoSignAndSendTransactionOutput {
  /** Convenience alias for the first entry of `hashes`. */
  readonly hash: string;
  /**
   * Every published block hash, in publish order. A single send/transfer
   * returns one; a multi-send/airdrop or multi-transfer returns all; a mint
   * returns the mint hash followed by any fee-send hashes.
   */
  readonly hashes: readonly string[];
  /**
   * Per-recipient outcomes, present only for the array forms of `send` /
   * `transfer`. Lets callers see exactly which legs succeeded or failed.
   */
  readonly results?: readonly BananoBatchLegResult[];
}

/** A single claimable (pending/receivable) block for an account. */
export interface BananoReceivable {
  /** The pending block hash to receive. */
  readonly hash: string;
  /** Amount in raw. */
  readonly amountRaw: string;
  /** Amount in BAN (major units). */
  readonly amount: string;
  /** Sending account, if the node returned source info. */
  readonly source?: string;
}

/** One entry in an account's transaction history. */
export interface BananoHistoryEntry {
  readonly hash: string;
  /** 'send' | 'receive' | 'change' | … (as reported by the node). */
  readonly type: string;
  /** Amount in BAN (major units). */
  readonly amount: string;
  /** Counterparty account. */
  readonly account: string;
  /** Node local timestamp (unix seconds as a string; '0' if unknown). */
  readonly timestamp: string;
}

export type BananoSignInMethod = (
  ...inputs: readonly BananoSignInInput[]
) => Promise<readonly BananoSignInOutput[]>;

export type BananoSignMessageMethod = (
  ...inputs: readonly BananoSignMessageInput[]
) => Promise<readonly BananoSignMessageOutput[]>;

export type BananoSignTransactionMethod = (
  ...inputs: readonly BananoSignTransactionInput[]
) => Promise<readonly BananoSignTransactionOutput[]>;

export type BananoSignAndSendTransactionMethod = (
  ...inputs: readonly BananoSignAndSendTransactionInput[]
) => Promise<readonly BananoSignAndSendTransactionOutput[]>;

export interface BananoSignInFeature {
  readonly [BananoSignIn]: {
    readonly version: '1.0.0';
    readonly signIn: BananoSignInMethod;
  };
}

export interface BananoSignMessageFeature {
  readonly [BananoSignMessage]: {
    readonly version: '1.0.0';
    readonly signMessage: BananoSignMessageMethod;
  };
}

export interface BananoSignTransactionFeature {
  readonly [BananoSignTransaction]: {
    readonly version: '1.0.0';
    readonly signTransaction: BananoSignTransactionMethod;
  };
}

export interface BananoSignAndSendTransactionFeature {
  readonly [BananoSignAndSendTransaction]: {
    readonly version: '1.0.0';
    readonly signAndSendTransaction: BananoSignAndSendTransactionMethod;
  };
}

export type BananoFeatures =
  | BananoSignInFeature
  | BananoSignMessageFeature
  | BananoSignTransactionFeature
  | BananoSignAndSendTransactionFeature;

/** MonkeyMask wallet account with Banano address and ed25519 public key bytes. */
export interface BananoWalletAccount extends WalletAccount {
  readonly address: string;
  readonly publicKey: Uint8Array;
  readonly chains: readonly BananoChain[];
}

export function createBananoWalletAccount(
  address: string,
  publicKey: Uint8Array,
  features: readonly BananoFeature[] = [
    BananoSignMessage,
    BananoSignIn,
    BananoSignTransaction,
    BananoSignAndSendTransaction,
  ],
  label?: string,
): BananoWalletAccount {
  return {
    address,
    publicKey,
    chains: [BANANO_MAINNET],
    features,
    ...(label ? { label } : {}),
  };
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
