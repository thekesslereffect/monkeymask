/**
 * MonkeyMask Provider Types
 * Complete TypeScript definitions for the MonkeyMask Banano wallet extension
 */

export interface MonkeyMaskProvider {
  // Connection management
  connect(options?: ConnectOptions): Promise<ConnectResult>;
  disconnect(): Promise<void>;
  getAccounts(): Promise<string[]>;
  
  // Wallet information
  getBalance(account?: string): Promise<string>;
  getAccountInfo(account?: string): Promise<AccountInfo>;
  
  // Signing operations
  signMessage(message: string, encoding?: 'utf8' | 'hex'): Promise<SignMessageResult>;
  signBlock(block: Block): Promise<SignBlockResult>;
  
  // Transactions
  sendTransaction(from: string, to: string, amount: string): Promise<TransactionResult>;
  sendBlock(block: Block): Promise<string>;
  
  // BNS resolution
  resolveBNS(bnsName: string): Promise<string>;
  
  // Event management
  on(event: 'connect', handler: (data: { publicKey: string; accounts?: string[] }) => void): void;
  on(event: 'disconnect', handler: () => void): void;
  on(event: 'accountChanged', handler: (publicKey: string) => void): void;
  off(event: 'connect', handler: (data: { publicKey: string; accounts?: string[] }) => void): void;
  off(event: 'disconnect', handler: () => void): void;
  off(event: 'accountChanged', handler: (publicKey: string) => void): void;
  removeAllListeners(event?: ProviderEvent): void;
  
  // Provider identification
  readonly isMonkeyMask: boolean;
  readonly isBanano: boolean;
  readonly isConnected: boolean;
  readonly publicKey: string | null;
}

export interface ConnectOptions {
  onlyIfTrusted?: boolean;
}

export interface ConnectResult {
  publicKey: string;
  address: string;
  accounts: string[];
}

export interface AccountInfo {
  address: string;
  balance: string;
  pending: string;
  rawBalance: string;
  rawPending: string;
}

export interface SignMessageResult {
  signature: Uint8Array;
  publicKey: string;
}

export interface SignBlockResult {
  signature: string;
  work?: string;
}

export interface TransactionResult {
  hash: string;
  block: Block;
}

export interface Block {
  type: 'send' | 'receive' | 'change' | 'state';
  account: string;
  previous: string;
  representative: string;
  balance: string;
  link: string;
  signature?: string;
  work?: string;
  amount?: string;
}

export type ProviderEvent = 'connect' | 'disconnect' | 'accountChanged';

export interface ProviderError extends Error {
  code: number;
  data?: unknown;
}

// Error codes (EIP-1193 compliant)
export const PROVIDER_ERRORS = {
  USER_REJECTED: { code: 4001, message: 'User rejected the request' },
  UNAUTHORIZED: { code: 4100, message: 'The requested account and/or method has not been authorized by the user' },
  UNSUPPORTED_METHOD: { code: 4200, message: 'The requested method is not supported by this provider' },
  DISCONNECTED: { code: 4900, message: 'The provider is disconnected from all chains' },
  CHAIN_DISCONNECTED: { code: 4901, message: 'The provider is disconnected from the specified chain' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid Request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid params' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  PARSE_ERROR: { code: -32700, message: 'Parse error' }
} as const;

// Global window interface extension
declare global {
  interface Window {
    banano?: MonkeyMaskProvider;
  }
}

export {};
