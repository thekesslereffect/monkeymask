import { PROVIDER_ERRORS } from './errors.js';

/** Transport-agnostic protocol envelope (browser postMessage, future mobile deep-link). */
export const PROTOCOL_SOURCE_REQUEST = 'monkeymask-provider' as const;
export const PROTOCOL_SOURCE_RESPONSE = 'monkeymask-provider-response' as const;
export const PROTOCOL_SOURCE_EVENT = 'monkeymask-provider-event' as const;
export const PROTOCOL_INIT_EVENT = 'monkeymask#initialized' as const;

/**
 * DOM CustomEvent the injected provider dispatches on `window` when a per-origin
 * spending session changes in the wallet (granted, revoked, debited, expired).
 * The React provider listens for this to keep session UI reactive without polling.
 * `event.detail` is `{ session: SpendingSessionInfo | null }`.
 */
export const SPENDING_SESSION_EVENT = 'monkeymask:spendingSessionChanged' as const;

/**
 * DOM CustomEvent the injected provider dispatches on `window` when the user
 * changes an account's voting representative from inside the wallet (or a dApp
 * publishes a change block). Lets a connected dApp refresh its delegation UI
 * without polling. `event.detail` is
 * `{ addresses: string[]; representative: string; hash?: string }`.
 */
export const REPRESENTATIVE_CHANGED_EVENT = 'monkeymask:representativeChanged' as const;

/**
 * DOM CustomEvent the injected provider dispatches on `window` after the wallet
 * publishes any block that moves funds or assets (send, sweep, NFT transfer/burn,
 * pending claims, …) — whether initiated from the wallet popup or a dApp. A
 * connected dApp should re-fetch whatever account state it displays (balance,
 * receivable, history, NFTs). `event.detail` is `{ addresses: string[] }` — the
 * wallet accounts whose state changed.
 */
export const BALANCES_CHANGED_EVENT = 'monkeymask:balancesChanged' as const;

export const WALLET_STANDARD_REGISTER_EVENT = 'wallet-standard:register-wallet' as const;
export const WALLET_STANDARD_APP_READY_EVENT = 'wallet-standard:app-ready' as const;

export type ProtocolMethod =
  | 'standard:connect'
  | 'standard:disconnect'
  | 'banano:signMessage'
  | 'banano:signIn'
  | 'banano:signTransaction'
  | 'banano:signAndSendTransaction'
  | 'banano:getAccountInfo'
  | 'banano:getReceivable'
  | 'banano:getAccountHistory'
  | 'banano:resolveBNS'
  | 'banano:reverseResolveBNS'
  | 'banano:requestSpendingSession'
  | 'banano:getSpendingSession'
  | 'banano:revokeSpendingSession';

export interface ProtocolRequest {
  readonly source: typeof PROTOCOL_SOURCE_REQUEST;
  readonly id: number;
  readonly method: ProtocolMethod;
  readonly params?: Record<string, unknown>;
}

export interface ProtocolSuccessResponse<T = unknown> {
  readonly success: true;
  readonly data: T;
}

export interface ProtocolErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code?: number;
}

export type ProtocolResponse<T = unknown> = ProtocolSuccessResponse<T> | ProtocolErrorResponse;

export interface ProtocolEventMessage {
  readonly source: typeof PROTOCOL_SOURCE_EVENT;
  readonly event:
    | 'connect'
    | 'disconnect'
    | 'change'
    | 'spendingSessionChanged'
    | 'representativeChanged'
    | 'balancesChanged';
  readonly data?: unknown;
}

export interface LegacyProtocolRequest {
  readonly source: typeof PROTOCOL_SOURCE_REQUEST;
  readonly id: number;
  readonly type: string;
  readonly origin?: string;
  readonly [key: string]: unknown;
}

export function createProtocolSuccess<T>(data: T): ProtocolSuccessResponse<T> {
  return { success: true, data };
}

export function createProtocolError(
  error: string,
  code: number = PROVIDER_ERRORS.INTERNAL_ERROR.code,
): ProtocolErrorResponse {
  return { success: false, error, code };
}

export function getProtocolTimeoutMs(method: ProtocolMethod): number {
  switch (method) {
    case 'standard:connect':
      return 5 * 60 * 1000;
    case 'banano:signMessage':
    case 'banano:signIn':
    case 'banano:signTransaction':
    case 'banano:signAndSendTransaction':
    case 'banano:requestSpendingSession':
      return 15 * 60 * 1000;
    case 'banano:reverseResolveBNS':
      // Reverse resolution crawls several accounts; give it extra headroom.
      return 60 * 1000;
    default:
      return 30 * 1000;
  }
}

/** Transport interface for browser extension or future mobile deep-link. */
export interface MonkeyMaskTransport {
  sendRequest<T = unknown>(
    method: ProtocolMethod,
    params?: Record<string, unknown>,
  ): Promise<T>;
  onEvent(
    handler: (event: ProtocolEventMessage['event'], data?: unknown) => void,
  ): () => void;
}
