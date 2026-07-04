// Minimal raw JSON-RPC client for Banano nodes with endpoint rotation.
// Used for read RPCs that bananojs doesn't wrap cleanly (pending with source,
// representatives_online, etc.). Uses global fetch (Node >= 18 and browsers).

import { getBananoRpcEndpoints } from './node.js';

export interface RpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AccountInfo {
  balance: string;
  frontier: string;
  representative: string;
  confirmation_height: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export class BananoRPC {
  private currentEndpointIndex = 0;

  private get endpoints(): readonly string[] {
    return getBananoRpcEndpoints();
  }

  /** POST a JSON-RPC action to the node, rotating endpoints on failure. */
  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<RpcResponse<T>> {
    const payload = { action: method, ...params };
    const endpoints = this.endpoints;
    let lastError: string | undefined;

    for (let round = 0; round < endpoints.length; round++) {
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[this.currentEndpointIndex % endpoints.length];
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.text().catch(() => '');
            if (isTransientHttpStatus(response.status)) {
              throw new Error(`HTTP ${response.status}: ${body || response.statusText}`);
            }
            return {
              success: false,
              error: body || `HTTP ${response.status}: ${response.statusText}`,
            };
          }

          const data = (await response.json()) as T & { error?: string };
          if (data && typeof data === 'object' && 'error' in data && data.error) {
            throw new Error(String(data.error));
          }
          return { success: true, data };
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown RPC error';
          this.currentEndpointIndex = (this.currentEndpointIndex + 1) % endpoints.length;
          if (i < endpoints.length - 1) {
            await sleep(250 * (i + 1));
          }
        }
      }
      if (round < endpoints.length - 1) {
        await sleep(500 * (round + 1));
      }
    }

    return { success: false, error: lastError ?? 'All RPC endpoints failed' };
  }

  async getAccountInfo(address: string): Promise<RpcResponse<AccountInfo>> {
    return this.call<AccountInfo>('account_info', {
      account: address,
      representative: true,
      weight: true,
      pending: true,
    });
  }

  async getAccountBalance(
    address: string,
  ): Promise<RpcResponse<{ balance: string; pending: string }>> {
    return this.call('account_balance', { account: address });
  }

  async getPending(
    address: string,
    count = 10,
  ): Promise<RpcResponse<{ blocks: Record<string, unknown> | null }>> {
    return this.call('pending', { account: address, count, source: true });
  }

  async getAccountHistory(
    address: string,
    count = 10,
    head?: string,
  ): Promise<RpcResponse<{ history?: unknown[] }>> {
    return this.call('account_history', {
      account: address,
      count: String(count),
      ...(head ? { head } : {}),
    });
  }
}
