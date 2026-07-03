// eslint-disable-next-line @typescript-eslint/no-var-requires
const bananojs = require('@bananocoin/bananojs');
import { BANANO_RPC_ENDPOINTS } from './bananoEndpoints';

let activeEndpointIndex = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Configure bananojs to use a specific RPC endpoint (defaults to the active one). */
export function configureBananoNode(endpointIndex = activeEndpointIndex): void {
  const url = BANANO_RPC_ENDPOINTS[endpointIndex % BANANO_RPC_ENDPOINTS.length];
  bananojs.setBananodeApiUrl(url);
  if (bananojs.BananodeApi && typeof bananojs.BananodeApi.setUseRateLimit === 'function') {
    bananojs.BananodeApi.setUseRateLimit(true);
  }
}

export function getActiveBananoEndpoint(): string {
  return BANANO_RPC_ENDPOINTS[activeEndpointIndex % BANANO_RPC_ENDPOINTS.length];
}

export function rotateBananoEndpoint(): string {
  activeEndpointIndex = (activeEndpointIndex + 1) % BANANO_RPC_ENDPOINTS.length;
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

  for (let attempt = 0; attempt < BANANO_RPC_ENDPOINTS.length; attempt++) {
    configureBananoNode((startIndex + attempt) % BANANO_RPC_ENDPOINTS.length);
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientNodeError(error) || attempt === BANANO_RPC_ENDPOINTS.length - 1) {
        throw error;
      }
      activeEndpointIndex = (startIndex + attempt + 1) % BANANO_RPC_ENDPOINTS.length;
      await sleep(350 * (attempt + 1));
    }
  }

  throw lastError;
}

/** Initial bananojs configuration — import this module once at startup. */
configureBananoNode(0);

export { bananojs };
