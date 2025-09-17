// Injected script that provides the window.banano API for dApps
// This will be used in Phase 2 for dApp integration

// Standardized error codes (following EIP-1193 and Phantom patterns)
export const PROVIDER_ERRORS = {
  USER_REJECTED: { code: 4001, message: 'User rejected the request' },
  UNAUTHORIZED: { code: 4100, message: 'Unauthorized - not connected to MonkeyMask' },
  UNSUPPORTED_METHOD: { code: 4200, message: 'Unsupported method' },
  DISCONNECTED: { code: 4900, message: 'Provider is disconnected' },
  CHAIN_DISCONNECTED: { code: 4901, message: 'Chain is disconnected' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid method parameters' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' }
} as const;

export interface ProviderError extends Error {
  code: number;
  data?: unknown;
}

export interface ConnectOptions {
  onlyIfTrusted?: boolean;
}

export interface BananoProvider {
  // Core connection methods (Phantom-style)
  connect(options?: ConnectOptions): Promise<{ publicKey: string }>;
  disconnect(): Promise<void>;
  
  // Account methods
  getAccounts(): Promise<string[]>;
  getBalance(address?: string): Promise<string>;
  getAccountInfo(address?: string): Promise<any>;
  
  // Transaction methods
  signBlock(block: any): Promise<any>;
  signMessage(message: Uint8Array | string, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array; publicKey: string }>;
  sendBlock(block: any): Promise<string>;
  sendTransaction(fromAddress: string, toAddress: string, amount: string): Promise<{ hash: string; block: any }>;
  
  // Utility methods
  resolveBNS(bnsName: string): Promise<string>;
  
  // State properties
  isConnected: boolean;
  publicKey: string | null;
  
  // Event system (Phantom-style)
  on(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;
  removeAllListeners(): void;
  
  // Provider metadata
  isMonkeyMask: boolean;
  isBanano: boolean;
}

class BananoProviderImpl implements BananoProvider {
  private _isConnected = false;
  private _publicKey: string | null = null;
  private connectedAccounts: string[] = [];
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();
  private eventListeners = new Map<string, Set<Function>>();
  
  // Provider metadata
  public readonly isMonkeyMask = true;
  public readonly isBanano = true;

  constructor() {
    this.setupMessageListener();
    this.setupProviderEventListener();
    this.attemptSilentReconnection();
  }

  // State properties
  get isConnected(): boolean {
    return this._isConnected;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  // Event system methods (Phantom-style)
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  removeAllListeners(): void {
    this.eventListeners.clear();
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error('BananoProvider: Error in event handler:', error);
        }
      });
    }
  }

  private async attemptSilentReconnection(): Promise<void> {
    try {
      console.log('BananoProvider: Attempting silent reconnection...');
      
      // Wait a bit for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we're already connected to this origin
      const result = await this.sendMessage('CHECK_CONNECTION');
      
      if (result.isConnected) {
        console.log('BananoProvider: Silent reconnection successful:', result.publicKey);
        
        this._isConnected = true;
        this._publicKey = result.publicKey;
        this.connectedAccounts = result.accounts || [result.publicKey];
        
        // Emit connect event to notify dApps
        this.emit('connect', { publicKey: result.publicKey });
      } else {
        console.log('BananoProvider: No existing connection found for this origin');
      }
      
    } catch (error) {
      // Silent failure is expected if not previously authorized or wallet is locked
      console.log('BananoProvider: Silent reconnection failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data) {
        return;
      }

      if (event.data.source === 'banano-provider-response') {
        const { id, response } = event.data;
        const pendingRequest = this.pendingRequests.get(id);
        
        if (pendingRequest) {
          this.pendingRequests.delete(id);
          
          if (response.success) {
            pendingRequest.resolve(response.data);
          } else {
            const error = this.createProviderError(response.error, response.code);
            pendingRequest.reject(error);
          }
        }
      }
    });
  }

  private setupProviderEventListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data) {
        return;
      }

      // Listen for provider events from background
      if (event.data.source === 'banano-provider-event') {
        const { event: eventName, data } = event.data;
        
        switch (eventName) {
          case 'connect':
            this._isConnected = true;
            this._publicKey = data.publicKey;
            this.connectedAccounts = data.accounts || [];
            this.emit('connect', data);
            break;
            
          case 'disconnect':
            this._isConnected = false;
            this._publicKey = null;
            this.connectedAccounts = [];
            this.emit('disconnect');
            break;
            
          case 'accountChanged':
            this._publicKey = data.publicKey;
            this.connectedAccounts = data.accounts || [];
            this.emit('accountChanged', data.publicKey);
            break;
        }
      }
    });
  }

  private createProviderError(message: string, code?: number): ProviderError {
    const error = new Error(message) as ProviderError;
    error.code = code || PROVIDER_ERRORS.INTERNAL_ERROR.code;
    return error;
  }

  private async sendMessage(type: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      window.postMessage({
        source: 'banano-provider',
        id,
        type,
        ...params
      }, '*');
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          const error = this.createProviderError('Request timeout', PROVIDER_ERRORS.INTERNAL_ERROR.code);
          reject(error);
        }
      }, 30000);
    });
  }

  async connect(options?: ConnectOptions): Promise<{ publicKey: string }> {
    try {
      console.log('BananoProvider: Connecting with options:', options);
      
      const result = await this.sendMessage('CONNECT_WALLET', { options });
      
      this._isConnected = true;
      this._publicKey = result.publicKey || result.address; // Support both formats
      this.connectedAccounts = result.accounts || [this._publicKey];
      
      if (!this._publicKey) {
        throw this.createProviderError(
          'No public key received from wallet',
          PROVIDER_ERRORS.INTERNAL_ERROR.code
        );
      }
      
      console.log('BananoProvider: Connected with publicKey:', this._publicKey);
      
      // Emit connect event
      this.emit('connect', { publicKey: this._publicKey });
      
      return { publicKey: this._publicKey };
    } catch (error) {
      console.error('BananoProvider: Connect failed:', error);
      
      if (error instanceof Error && (error as ProviderError).code) {
        throw error;
      }
      
      throw this.createProviderError(
        'Failed to connect to MonkeyMask',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.sendMessage('DISCONNECT_WALLET');
      this._isConnected = false;
      this._publicKey = null;
      this.connectedAccounts = [];
      
      // Emit disconnect event
      this.emit('disconnect');
      
      console.log('BananoProvider: Disconnected');
    } catch (error) {
      console.error('BananoProvider: Disconnect failed:', error);
      // Don't throw error for disconnect - always clean up state
      this._isConnected = false;
      this._publicKey = null;
      this.connectedAccounts = [];
      this.emit('disconnect');
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask. Call connect() first.',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    console.log('BananoProvider: Returning accounts:', this.connectedAccounts);
    return [...this.connectedAccounts]; // Return a copy
  }

  async signMessage(message: Uint8Array | string, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array; publicKey: string }> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    if (!this._publicKey) {
      throw this.createProviderError(
        'No public key available',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      );
    }
    
    try {
      console.log('BananoProvider: Signing message with display:', display);
      
      // Convert message to appropriate format
      let messageToSign: string;
      if (message instanceof Uint8Array) {
        messageToSign = Array.from(message).map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        messageToSign = message;
      }
      
      const result = await this.sendMessage('SIGN_MESSAGE', {
        message: messageToSign,
        display: display || 'utf8',
        publicKey: this._publicKey
      });
      
      // Convert signature back to Uint8Array
      const signature = new Uint8Array(result.signature.match(/.{2}/g).map((byte: string) => parseInt(byte, 16)));
      
      return {
        signature,
        publicKey: this._publicKey
      };
    } catch (error) {
      console.error('BananoProvider: Sign message failed:', error);
      
      if (error instanceof Error && (error as ProviderError).code) {
        throw error;
      }
      
      throw this.createProviderError(
        'Failed to sign message',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      );
    }
  }

  async signBlock(block: any): Promise<any> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    return this.sendMessage('SIGN_BLOCK', { block });
  }

  async sendBlock(block: any): Promise<string> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    const result = await this.sendMessage('SEND_BLOCK', { block });
    return result.hash;
  }

  async sendTransaction(fromAddress: string, toAddress: string, amount: string): Promise<{ hash: string; block: any }> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    console.log('BananoProvider: Sending transaction:', fromAddress, '->', toAddress, amount, 'BAN');
    
    const result = await this.sendMessage('SEND_TRANSACTION', {
      fromAddress,
      toAddress,
      amount
    });
    
    return {
      hash: result.hash,
      block: result.block
    };
  }

  async resolveBNS(bnsName: string): Promise<string> {
    console.log('BananoProvider: Resolving BNS name:', bnsName);
    
    const result = await this.sendMessage('RESOLVE_BNS', {
      bnsName
    });
    
    return result.address;
  }

  async getBalance(address?: string): Promise<string> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    // Use first connected account if no address specified
    const targetAddress = address || this.connectedAccounts[0];
    if (!targetAddress) {
      throw this.createProviderError(
        'No address available',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      );
    }
    
    console.log('BananoProvider: Getting balance for:', targetAddress);
    
    const result = await this.sendMessage('GET_BALANCE', {
      address: targetAddress
    });
    
    return result.balance;
  }

  async getAccountInfo(address?: string): Promise<any> {
    if (!this._isConnected) {
      throw this.createProviderError(
        'Not connected to MonkeyMask',
        PROVIDER_ERRORS.UNAUTHORIZED.code
      );
    }
    
    // Use first connected account if no address specified
    const targetAddress = address || this.connectedAccounts[0];
    if (!targetAddress) {
      throw this.createProviderError(
        'No address available',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      );
    }
    
    console.log('BananoProvider: Getting account info for:', targetAddress);
    
    const result = await this.sendMessage('GET_ACCOUNT_INFO', {
      address: targetAddress
    });
    
    return result.accountInfo;
  }
}

// TypeScript declarations for window.banano
interface Window {
  banano?: BananoProvider;
}

// Only inject if not already present
if (!(window as any).banano) {
  const provider = new BananoProviderImpl();
  
  // Make provider available globally
  Object.defineProperty(window, 'banano', {
    value: provider,
    writable: false,
    configurable: false
  });

  // Dispatch event to notify dApps that MonkeyMask is available
  window.dispatchEvent(new CustomEvent('banano#initialized', {
    detail: { provider }
  }));
}
