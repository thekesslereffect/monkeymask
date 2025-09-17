export interface RpcResponse<T = any> {
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

export class BananoRPC {
  private static readonly RPC_ENDPOINTS = [
    'https://kaliumapi.appditto.com/api',
    'https://booster.dev-ptera.com/banano-rpc',
    'https://api.banano.cc'
  ];

  private currentEndpointIndex = 0;

  /**
   * Make RPC call to Banano node
   */
  private async makeRpcCall<T>(method: string, params: any = {}): Promise<RpcResponse<T>> {
    const payload = {
      action: method,
      ...params
    };

    for (let i = 0; i < BananoRPC.RPC_ENDPOINTS.length; i++) {
      const endpoint = BananoRPC.RPC_ENDPOINTS[this.currentEndpointIndex];
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        return { success: true, data };
      } catch (error) {
        console.warn(`RPC call failed for endpoint ${endpoint}:`, error);
        
        // Try next endpoint
        this.currentEndpointIndex = (this.currentEndpointIndex + 1) % BananoRPC.RPC_ENDPOINTS.length;
        
        // If this was the last endpoint, return the error
        if (i === BananoRPC.RPC_ENDPOINTS.length - 1) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown RPC error'
          };
        }
      }
    }

    return { success: false, error: 'All RPC endpoints failed' };
  }

  /**
   * Get account information including balance
   */
  async getAccountInfo(address: string): Promise<RpcResponse<AccountInfo>> {
    return this.makeRpcCall<AccountInfo>('account_info', {
      account: address,
      representative: true,
      weight: true,
      pending: true
    });
  }

  /**
   * Get account balance in raw units
   */
  async getAccountBalance(address: string): Promise<RpcResponse<{ balance: string; pending: string }>> {
    return this.makeRpcCall('account_balance', {
      account: address
    });
  }

  /**
   * Get multiple account balances at once
   */
  async getAccountsBalances(addresses: string[]): Promise<RpcResponse<{ balances: Record<string, { balance: string; pending: string }> }>> {
    return this.makeRpcCall('accounts_balances', {
      accounts: addresses
    });
  }

  /**
   * Convert raw balance to BAN
   */
  static rawToBan(raw: string): string {
    try {
      const RAW_PER_BAN = BigInt('100000000000000000000000000000'); // 10^29
      const rawBig = BigInt(raw || '0');

      const whole = rawBig / RAW_PER_BAN;
      const frac = rawBig % RAW_PER_BAN;

      // Render up to 6 fractional digits for UI without floating errors
      let fracStr = frac.toString().padStart(29, '0').slice(0, 6);
      fracStr = fracStr.replace(/0+$/, '');

      return fracStr ? `${whole.toString()}.${fracStr}` : whole.toString();
    } catch (error) {
      console.error('Error converting raw to BAN:', error);
      return '0';
    }
  }

  /**
   * Convert BAN to raw
   */
  static banToRaw(ban: string): string {
    try {
      const banDivisor = BigInt('100000000000000000000000000000'); // 10^29
      
      if (ban.includes('.')) {
        const [whole, decimal] = ban.split('.');
        const wholePart = BigInt(whole || '0');
        const decimalPart = decimal.padEnd(29, '0').slice(0, 29);
        const decimalBigInt = BigInt(decimalPart);
        
        return (wholePart * banDivisor + decimalBigInt).toString();
      } else {
        return (BigInt(ban) * banDivisor).toString();
      }
    } catch (error) {
      console.error('Error converting BAN to raw:', error);
      return '0';
    }
  }

  /**
   * Check if an account exists (has been opened)
   */
  async accountExists(address: string): Promise<boolean> {
    const result = await this.getAccountInfo(address);
    return result.success && !!result.data;
  }

  /**
   * Get pending blocks for an account
   */
  async getPending(address: string, count: number = 10): Promise<RpcResponse<{ blocks: Record<string, any> }>> {
    return this.makeRpcCall('pending', {
      account: address,
      count,
      source: true
    });
  }

  /**
   * Get account frontier (latest block hash)
   */
  async getAccountFrontier(address: string): Promise<RpcResponse<{ frontier: string }>> {
    return this.makeRpcCall('account_info', {
      account: address,
      representative: false,
      weight: false,
      pending: false
    });
  }
}
