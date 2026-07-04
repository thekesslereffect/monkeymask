// Banano node (RPC) endpoint management for bananojs, with rotation on rate
// limits / transient failures. Works in Node and in browsers.

import { bananojs } from './bananojs.js';

/** Public Banano RPC endpoints (ordered by preference). */
export const DEFAULT_BANANO_RPC_ENDPOINTS: readonly string[] = [
  'https://kaliumapi.appditto.com/api',
  /** Full-node proxy — supports `representatives_online` and other node-only RPCs. */
  'https://api.banano.trade/proxy',
  'https://booster.dev-ptera.com/banano-rpc',
];

let endpoints: readonly string[] = DEFAULT_BANANO_RPC_ENDPOINTS;
let activeEndpointIndex = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Replace the RPC endpoint list (e.g. a self-hosted node). The first entry
 * becomes the active endpoint.
 */
export function setBananoRpcEndpoints(list: readonly string[]): void {
  if (!list.length) throw new Error('At least one RPC endpoint is required');
  endpoints = [...list];
  activeEndpointIndex = 0;
  configureBananoNode(0);
}

export function getBananoRpcEndpoints(): readonly string[] {
  return endpoints;
}

/** Configure bananojs to use a specific RPC endpoint (defaults to the active one). */
export function configureBananoNode(endpointIndex = activeEndpointIndex): void {
  const url = endpoints[endpointIndex % endpoints.length];
  bananojs.setBananodeApiUrl(url);
  if (bananojs.BananodeApi && typeof bananojs.BananodeApi.setUseRateLimit === 'function') {
    bananojs.BananodeApi.setUseRateLimit(true);
  }
}

export function getActiveBananoEndpoint(): string {
  return endpoints[activeEndpointIndex % endpoints.length];
}

export function rotateBananoEndpoint(): string {
  activeEndpointIndex = (activeEndpointIndex + 1) % endpoints.length;
  configureBananoNode(activeEndpointIndex);
  return getActiveBananoEndpoint();
}

export function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('429') || msg.includes('too many requests');
}

export function isTransientNodeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    isRateLimitError(error) ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed') ||
    msg.includes('network')
  );
}

/**
 * Run a bananojs RPC operation with endpoint rotation on rate limits / transient
 * failures. Tries each configured endpoint before surfacing the last error.
 */
export async function withBananoNodeFallback<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  const startIndex = activeEndpointIndex;

  for (let attempt = 0; attempt < endpoints.length; attempt++) {
    configureBananoNode((startIndex + attempt) % endpoints.length);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientNodeError(error) || attempt === endpoints.length - 1) {
        throw error;
      }
      activeEndpointIndex = (startIndex + attempt + 1) % endpoints.length;
      await sleep(350 * (attempt + 1));
    }
  }

  throw lastError;
}

/** Initial bananojs configuration — importing this module wires the default endpoint. */
configureBananoNode(0);
