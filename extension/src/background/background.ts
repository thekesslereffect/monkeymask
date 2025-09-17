import { WalletManager } from '../utils/wallet';
import { BananoRPC } from '../utils/rpc';
import { WalletRequest, Account } from '../types/wallet';

// Standardized error codes (matching injected provider)
const PROVIDER_ERRORS = {
  USER_REJECTED: { code: 4001, message: 'User rejected the request' },
  UNAUTHORIZED: { code: 4100, message: 'Unauthorized - not connected to MonkeyMask' },
  UNSUPPORTED_METHOD: { code: 4200, message: 'Unsupported method' },
  DISCONNECTED: { code: 4900, message: 'Provider is disconnected' },
  CHAIN_DISCONNECTED: { code: 4901, message: 'Chain is disconnected' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid method parameters' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' }
} as const;

interface OriginPermissions {
  origin: string;
  approvedAccounts: string[];
  approvedAt: number;
  lastUsed: number;
}

interface StoredPermissions {
  [origin: string]: OriginPermissions;
}

interface ApprovalResult {
  approved: boolean;
  accounts?: string[];
}

class BackgroundService {
  private walletManager: WalletManager;
  private rpc: BananoRPC;
  private pendingApprovals: Map<string, any> = new Map();
  private approvalResolvers: Map<string, { resolve: Function; reject: Function }> = new Map();
  private transactionResults: Map<string, any> = new Map();
  private permissions: Map<string, OriginPermissions> = new Map();
  private connectedTabs: Map<number, string> = new Map(); // tabId -> origin

  constructor() {
    this.walletManager = WalletManager.getInstance();
    this.rpc = new BananoRPC();
    this.setupMessageListeners();
    this.loadPermissions();
  }

  private setupMessageListeners(): void {
    // Listen for messages from popup and content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Track tab connections
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.connectedTabs.delete(tabId);
    });

    // Auto-lock wallet after 30 minutes of inactivity
    this.setupAutoLock();
  }

  // Permissions management
  private async loadPermissions(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['permissions']);
      const stored: StoredPermissions = result.permissions || {};
      
      for (const [origin, permission] of Object.entries(stored)) {
        this.permissions.set(origin, permission);
      }
      
      console.log('Background: Loaded permissions for', this.permissions.size, 'origins');
    } catch (error) {
      console.error('Background: Failed to load permissions:', error);
    }
  }

  private async savePermissions(): Promise<void> {
    try {
      const stored: StoredPermissions = {};
      for (const [origin, permission] of this.permissions.entries()) {
        stored[origin] = permission;
      }
      
      await chrome.storage.local.set({ permissions: stored });
      console.log('Background: Saved permissions for', this.permissions.size, 'origins');
    } catch (error) {
      console.error('Background: Failed to save permissions:', error);
    }
  }

  private isOriginAuthorized(origin: string, requiredAccounts?: string[]): boolean {
    const permission = this.permissions.get(origin);
    if (!permission) return false;
    
    // Update last used timestamp
    permission.lastUsed = Date.now();
    this.savePermissions(); // Fire and forget
    
    // If specific accounts are required, check if they're approved
    if (requiredAccounts && requiredAccounts.length > 0) {
      return requiredAccounts.every(account => 
        permission.approvedAccounts.includes(account)
      );
    }
    
    return permission.approvedAccounts.length > 0;
  }

  private async authorizeOrigin(origin: string, accounts: string[]): Promise<void> {
    const permission: OriginPermissions = {
      origin,
      approvedAccounts: accounts,
      approvedAt: Date.now(),
      lastUsed: Date.now()
    };
    
    this.permissions.set(origin, permission);
    await this.savePermissions();
    
    console.log('Background: Authorized origin:', origin, 'for accounts:', accounts);
  }

  private async revokeOriginPermission(origin: string): Promise<void> {
    this.permissions.delete(origin);
    await this.savePermissions();
    
    // Emit disconnect event to all tabs from this origin
    this.emitProviderEvent('disconnect', null, origin);
    
    console.log('Background: Revoked permission for origin:', origin);
  }

  private createStandardError(message: string, code: number, data?: unknown): any {
    return {
      success: false,
      error: message,
      code,
      data
    };
  }

  private emitProviderEvent(event: string, data: any, targetOrigin?: string): void {
    // Send event to all connected tabs (or specific origin)
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id && (!targetOrigin || this.connectedTabs.get(tab.id) === targetOrigin)) {
          chrome.tabs.sendMessage(tab.id, {
            source: 'banano-provider-event-broadcast',
            event,
            data
          }).catch(() => {
            // Tab might be closed or not have content script
          });
        }
      });
    });
  }

  private async handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): Promise<void> {
    try {
      switch (request.type) {
        case 'CREATE_WALLET':
          await this.handleCreateWallet(request, sendResponse);
          break;
        
        case 'IMPORT_WALLET':
          await this.handleImportWallet(request, sendResponse);
          break;
        
        case 'UNLOCK_WALLET':
          await this.handleUnlockWallet(request, sendResponse);
          break;
        
        case 'LOCK_WALLET':
          await this.handleLockWallet(sendResponse);
          break;
        
        case 'GET_WALLET_STATE':
          await this.handleGetWalletState(sendResponse);
          break;
        
        case 'GET_ACCOUNTS':
          await this.handleGetAccounts(sendResponse);
          break;
        
        case 'UPDATE_BALANCES':
          await this.handleUpdateBalances(sendResponse);
          break;
        
        // dApp Integration Methods
        case 'CONNECT_WALLET':
          await this.handleConnectWallet(request, sendResponse);
          break;
        
        case 'DISCONNECT_WALLET':
          await this.handleDisconnectWallet(sendResponse);
          break;
        
        case 'SIGN_BLOCK':
          await this.handleSignBlock(request, sendResponse);
          break;
        
        case 'SEND_BLOCK':
          await this.handleSendBlock(request, sendResponse);
          break;
        
        case 'SEND_TRANSACTION':
          await this.handleSendTransaction(request, sendResponse);
          break;
        
        case 'RECEIVE_PENDING':
          await this.handleReceivePending(request, sendResponse);
          break;
        
        case 'GET_BALANCE':
          await this.handleGetBalance(request, sendResponse);
          break;
        
        case 'GET_ACCOUNT_INFO':
          await this.handleGetAccountInfo(request, sendResponse);
          break;
        
        case 'RESOLVE_BNS':
          await this.handleResolveBNS(request, sendResponse);
          break;
        
        case 'SIGN_MESSAGE':
          await this.handleSignMessage(request, sendResponse);
          break;
        
        case 'GET_PENDING_APPROVAL':
          this.handleGetPendingApproval(sendResponse);
          break;
        
        case 'APPROVE_TRANSACTION':
          this.handleApproveTransaction(request, sendResponse);
          break;
        
        case 'REJECT_TRANSACTION':
          this.handleRejectTransaction(request, sendResponse);
          break;
        
        case 'GET_TRANSACTION_RESULT':
          this.handleGetTransactionResult(request, sendResponse);
          break;
        
        case 'REVOKE_PERMISSION':
          await this.handleRevokePermission(request, sendResponse);
          break;
        
        case 'CHECK_CONNECTION':
          await this.handleCheckConnection(request, sendResponse);
          break;
        
        case 'GET_AUTO_LOCK_TIMEOUT':
          await this.handleGetAutoLockTimeout(sendResponse);
          break;
        
        case 'SET_AUTO_LOCK_TIMEOUT':
          await this.handleSetAutoLockTimeout(request, sendResponse);
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown request type' });
      }
    } catch (error) {
      console.error('Background service error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handleCreateWallet(request: { password: string }, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Creating new wallet...');
      
      // Generate new mnemonic for user-friendly backup
      const mnemonic = this.walletManager.generateMnemonic();
      console.log('Background: Generated mnemonic');
      
      // Create wallet from mnemonic (which gets converted to hex seed internally)
      const accounts = await this.walletManager.createWalletFromSeed(mnemonic);
      console.log('Background: Created accounts:', accounts.length);
      
      // Save encrypted wallet
      await this.walletManager.saveWallet(accounts, request.password);
      console.log('Background: Saved wallet to storage');
      
      // Verify wallet state after creation
      const isUnlocked = this.walletManager.isWalletUnlocked();
      console.log('Background: Wallet unlocked after creation:', isUnlocked);
      
      sendResponse({
        success: true,
        data: {
          mnemonic,
          accounts: accounts.map(acc => ({
            address: acc.address,
            name: acc.name,
            balance: acc.balance
          }))
        }
      });
    } catch (error) {
      console.error('Background: Error creating wallet:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create wallet'
      });
    }
  }

  private async handleImportWallet(request: { password: string; seed: string }, sendResponse: (response: any) => void): Promise<void> {
    try {
      const accounts = await this.walletManager.createWalletFromSeed(request.seed);
      await this.walletManager.saveWallet(accounts, request.password);
      
      sendResponse({
        success: true,
        data: {
          accounts: accounts.map(acc => ({
            address: acc.address,
            name: acc.name,
            balance: acc.balance
          }))
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import wallet'
      });
    }
  }

  private async handleUnlockWallet(request: { password: string }, sendResponse: (response: any) => void): Promise<void> {
    try {
      const accounts = await this.walletManager.unlockWallet(request.password);
      
      sendResponse({
        success: true,
        data: {
          accounts: accounts.map(acc => ({
            address: acc.address,
            name: acc.name,
            balance: acc.balance
          }))
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unlock wallet'
      });
    }
  }

  private async handleLockWallet(sendResponse: (response: any) => void): Promise<void> {
    this.walletManager.lockWallet();
    sendResponse({ success: true });
  }

  private async handleGetWalletState(sendResponse: (response: any) => void): Promise<void> {
    try {
      const isInitialized = await this.walletManager.isWalletInitialized();
      const isUnlocked = this.walletManager.isWalletUnlocked();
      
      console.log('Background: Wallet state check - initialized:', isInitialized, 'unlocked:', isUnlocked);
      
      sendResponse({
        success: true,
        data: {
          isInitialized,
          isUnlocked
        }
      });
    } catch (error) {
      console.error('Background: Error getting wallet state:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wallet state'
      });
    }
  }

  private async handleGetAccounts(sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: handleGetAccounts called');
      
      if (!this.walletManager.isWalletUnlocked()) {
        console.log('Background: Wallet is locked');
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }

      const accounts = this.walletManager.getAccounts();
      console.log('Background: Got accounts:', accounts.length);
      
      const response = {
        success: true,
        data: accounts.map(acc => ({
          address: acc.address,
          name: acc.name,
          balance: acc.balance
        }))
      };
      
      console.log('Background: Sending accounts response:', response);
      sendResponse(response);
    } catch (error) {
      console.error('Background: Error getting accounts:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get accounts'
      });
    }
  }

  private async handleUpdateBalances(sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: handleUpdateBalances called');
      
      if (!this.walletManager.isWalletUnlocked()) {
        console.log('Background: Wallet is locked for balance update');
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }

      const accounts = this.walletManager.getAccounts();
      const addresses = accounts.map(acc => acc.address);
      
      console.log('Background: Fetching balances for addresses:', addresses);
      
      // First, get current balance info to check for pending
      let pendingAmounts: Record<string, string> = {};
      try {
        const preBalanceResult = await Promise.race([
          this.rpc.getAccountsBalances(addresses),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Pre-balance timeout')), 5000))
        ]) as any;
        
        if (preBalanceResult.success) {
          // Store pending amounts for each address
          for (const address of addresses) {
            const balanceData = preBalanceResult.data?.balances[address];
            if (balanceData?.receivable_decimal && parseFloat(balanceData.receivable_decimal) > 0) {
              pendingAmounts[address] = balanceData.receivable_decimal;
              console.log('Background: Found pending amount for', address, ':', balanceData.receivable_decimal);
            }
          }
        }
      } catch (error) {
        console.warn('Background: Failed to get pre-balance for pending check:', error);
      }
      
      // Now try to auto-receive any pending transactions
      for (const address of addresses) {
        try {
          const pendingAmount = pendingAmounts[address];
          if (pendingAmount) {
            console.log('Background: Auto-receiving pending for:', address, 'amount:', pendingAmount);
            await this.walletManager.autoReceivePending(address, pendingAmount);
          }
        } catch (error) {
          console.warn('Background: Failed to auto-receive pending for', address, ':', error);
          // Continue with other addresses even if one fails
        }
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Balance fetch timeout')), 10000);
      });
      
      const balanceResult = await Promise.race([
        this.rpc.getAccountsBalances(addresses),
        timeoutPromise
      ]) as any;
      
      console.log('Background: Balance result:', balanceResult);
      
      if (!balanceResult.success) {
        throw new Error(balanceResult.error);
      }

      // Update account balances
      const updatedAccounts = accounts.map(account => {
        const balanceData = balanceResult.data?.balances[account.address];
        if (balanceData) {
          // Always use our own rawToBan conversion for consistency
          account.balance = BananoRPC.rawToBan(balanceData.balance || '0');
          console.log('Background: Converted raw balance', balanceData.balance, 'to', account.balance, 'BAN');
          
          // For pending, use receivable_decimal if available, otherwise convert from raw
          let pendingAmount = '0';
          if (balanceData.receivable_decimal && parseFloat(balanceData.receivable_decimal) > 0) {
            pendingAmount = balanceData.receivable_decimal;
          } else if (balanceData.receivable && balanceData.receivable !== '0') {
            pendingAmount = BananoRPC.rawToBan(balanceData.receivable);
          }
          
          (account as any).pending = pendingAmount;
          
          if (parseFloat(pendingAmount) > 0) {
            console.log('Background: Account has pending balance:', pendingAmount);
          }
        }
        return account;
      });

      console.log('Background: Updated accounts with balances:', updatedAccounts);

      sendResponse({
        success: true,
        data: updatedAccounts.map(acc => ({
          address: acc.address,
          name: acc.name,
          balance: acc.balance,
          pending: (acc as any).pending || '0'
        }))
      });
    } catch (error) {
      console.error('Background: Error updating balances:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update balances'
      });
    }
  }


  // dApp Integration Handlers
  
  private async handleConnectWallet(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Connect wallet request from dApp, origin:', request.origin);
      
      // Check if wallet is initialized first
      const isInitialized = await this.walletManager.isWalletInitialized();
      if (!isInitialized) {
        sendResponse(this.createStandardError(
          'Wallet not initialized',
          PROVIDER_ERRORS.DISCONNECTED.code
        ));
        return;
      }

      // Allow connection even when locked - get stored accounts
      let accounts;
      if (this.walletManager.isWalletUnlocked()) {
        accounts = this.walletManager.getAccounts();
      } else {
        // Get accounts from storage when locked
        accounts = await this.walletManager.getStoredAccounts();
      }

      if (accounts.length === 0) {
        sendResponse(this.createStandardError(
          'No accounts available',
          PROVIDER_ERRORS.INTERNAL_ERROR.code
        ));
        return;
      }

      const { options = {}, origin } = request;
      const { onlyIfTrusted = false } = options;

      // Check if origin is already authorized
      if (this.isOriginAuthorized(origin)) {
        const permission = this.permissions.get(origin)!;
        const primaryAccount = accounts.find(acc => 
          permission.approvedAccounts.includes(acc.address)
        ) || accounts[0];
        
        console.log('Background: Origin already authorized, connecting to:', primaryAccount.address);
        
        sendResponse({
          success: true,
          data: {
            publicKey: primaryAccount.address,
            address: primaryAccount.address, // For backward compatibility
            accounts: permission.approvedAccounts
          }
        });
        return;
      }

      // If onlyIfTrusted is true and not authorized, reject silently
      if (onlyIfTrusted) {
        sendResponse(this.createStandardError(
          'Origin not trusted',
          PROVIDER_ERRORS.UNAUTHORIZED.code
        ));
        return;
      }

      // Create connection approval request
      console.log('Background: Creating connection approval request for:', origin);
      
      const requestId = 'connect_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const approvalRequest = {
        id: requestId,
        origin: origin,
        type: 'connect',
        data: { 
          origin,
          accounts: accounts.map(acc => ({
            address: acc.address,
            name: acc.name,
            balance: acc.balance
          }))
        }
      };

      // Store the request and set up promise for approval
      this.pendingApprovals.set(requestId, approvalRequest);
      
      const approvalPromise = new Promise((resolve, reject) => {
        this.approvalResolvers.set(requestId, { resolve, reject });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.approvalResolvers.has(requestId)) {
            this.approvalResolvers.delete(requestId);
            this.pendingApprovals.delete(requestId);
            reject(new Error('User approval timeout'));
          }
        }, 5 * 60 * 1000);
      });

      console.log('Background: Connection request queued for approval:', requestId);
      
      // Open popup for approval
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.log('Popup might already be open');
      }

      try {
        // Wait for user approval
        const approvalResult = await approvalPromise as ApprovalResult;
        
        if (approvalResult && approvalResult.approved) {
          // User approved - store authorization
          const selectedAccounts = approvalResult.accounts || [accounts[0].address];
          await this.authorizeOrigin(origin, selectedAccounts);
          
          // Emit connect event to the origin
          this.emitProviderEvent('connect', {
            publicKey: selectedAccounts[0],
            accounts: selectedAccounts
          }, origin);
          
          sendResponse({
            success: true,
            data: {
              publicKey: selectedAccounts[0],
              address: selectedAccounts[0], // For backward compatibility
              accounts: selectedAccounts
            }
          });
          
          console.log('Background: Connection approved and established for:', origin);
        } else {
          // User rejected
          sendResponse(this.createStandardError(
            'User rejected the connection request',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
        }
      } catch (error) {
        console.error('Background: Connection approval failed:', error);
        sendResponse(this.createStandardError(
          error instanceof Error ? error.message : 'Connection request failed',
          PROVIDER_ERRORS.USER_REJECTED.code
        ));
      }
    } catch (error) {
      console.error('Background: Error connecting wallet:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to connect wallet',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleDisconnectWallet(sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Disconnect wallet request from dApp');
      // For now, just acknowledge disconnection
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disconnect'
      });
    }
  }

  private async handleSignBlock(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Sign block request:', request.block);
      
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse(this.createStandardError(
          'Wallet is locked',
          PROVIDER_ERRORS.DISCONNECTED.code
        ));
        return;
      }

      const { block, origin } = request;
      if (!block || !block.account) {
        sendResponse(this.createStandardError(
          'Invalid block data',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      // Check if origin is authorized for this account
      if (!this.isOriginAuthorized(origin, [block.account])) {
        sendResponse(this.createStandardError(
          'Origin not authorized for this account',
          PROVIDER_ERRORS.UNAUTHORIZED.code
        ));
        return;
      }

      // Create block signing approval request
      console.log('Background: Creating block signing approval request for:', origin);
      
      const requestId = 'sign_block_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const approvalRequest = {
        id: requestId,
        origin: origin,
        type: 'signBlock',
        data: { 
          block,
          account: block.account,
          origin
        }
      };

      // Store the request and set up promise for approval
      this.pendingApprovals.set(requestId, approvalRequest);
      
      const approvalPromise = new Promise((resolve, reject) => {
        this.approvalResolvers.set(requestId, { resolve, reject });
        
        // Timeout after 5 minutes
        setTimeout(() => {
          if (this.approvalResolvers.has(requestId)) {
            this.approvalResolvers.delete(requestId);
            this.pendingApprovals.delete(requestId);
            reject(new Error('User approval timeout'));
          }
        }, 5 * 60 * 1000);
      });

      console.log('Background: Block signing request queued for approval:', requestId);
      
      // Open popup for approval
      try {
        await chrome.action.openPopup();
      } catch (error) {
        console.log('Popup might already be open');
      }

      try {
        // Wait for user approval
        const approvalResult = await approvalPromise as ApprovalResult;
        
        if (approvalResult && approvalResult.approved) {
          // User approved - perform the actual signing
          console.log('Background: Block signing approved, performing signature');
          
          const signedBlock = await this.walletManager.signBlock(block, block.account);
          
          sendResponse({
            success: true,
            data: signedBlock
          });
          
          console.log('Background: Block signed successfully');
        } else {
          // User rejected
          sendResponse(this.createStandardError(
            'User rejected the signing request',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
        }
      } catch (error) {
        console.error('Background: Block signing approval failed:', error);
        sendResponse(this.createStandardError(
          error instanceof Error ? error.message : 'Block signing request failed',
          PROVIDER_ERRORS.USER_REJECTED.code
        ));
      }
      
    } catch (error) {
      console.error('Background: Error signing block:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign block',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleSendBlock(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Send block request:', request.block);
      
      const { block } = request;
      if (!block || !block.signature) {
        sendResponse({ success: false, error: 'Invalid or unsigned block' });
        return;
      }

      // For Phase 3, we implement basic block sending via RPC
      // This would submit the signed block to the Banano network
      
      // For now, simulate successful submission
      const blockHash = 'SIMULATED_' + Date.now().toString(16).toUpperCase();
      
      console.log('Background: Block sent successfully with hash:', blockHash);
      
      sendResponse({
        success: true,
        data: { hash: blockHash }
      });
      
    } catch (error) {
      console.error('Background: Error sending block:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send block'
      });
    }
  }

  private async handleSendTransaction(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Send transaction request:', request);
      
      // Check if wallet is initialized first
      const isInitialized = await this.walletManager.isWalletInitialized();
      if (!isInitialized) {
        sendResponse(this.createStandardError(
          'Wallet not initialized',
          PROVIDER_ERRORS.DISCONNECTED.code
        ));
        return;
      }


      const { fromAddress, toAddress, amount, origin } = request;
      
      if (!fromAddress || !toAddress || !amount) {
        sendResponse({ success: false, error: 'Missing required fields: fromAddress, toAddress, amount' });
        return;
      }

      // Validate addresses
      if (!toAddress.startsWith('ban_') || toAddress.length !== 64) {
        sendResponse({ success: false, error: 'Invalid destination address format' });
        return;
      }

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        sendResponse({ success: false, error: 'Invalid amount' });
        return;
      }

      // Check balance - use stored accounts if wallet is locked
      let accounts;
      const isWalletUnlocked = this.walletManager.isWalletUnlocked();
      
      if (isWalletUnlocked) {
        accounts = this.walletManager.getAccounts();
      } else {
        // Wallet is locked, use stored accounts for validation
        accounts = await this.walletManager.getStoredAccounts();
      }
      
      const account = accounts.find(acc => acc.address === fromAddress);
      if (!account) {
        sendResponse({ success: false, error: 'Account not found' });
        return;
      }

      // Only check balance if wallet is unlocked (we have current balance data)
      if (isWalletUnlocked) {
        const currentBalance = parseFloat(account.balance) || 0;
        if (numAmount > currentBalance) {
          sendResponse({ success: false, error: 'Insufficient balance' });
          return;
        }
      }
      // If wallet is locked, skip balance check - it will be checked again after unlock

      // Check if this is a dApp request (has origin) or extension request (no origin)
      const isDAppRequest = origin && origin !== 'chrome-extension://' + chrome.runtime.id;
      
      if (isDAppRequest) {
        // This is a dApp request - require approval
        const walletIsLocked = !this.walletManager.isWalletUnlocked();
        console.log('Background: dApp transaction request - requiring approval from:', origin, 'wallet locked:', walletIsLocked);
        
        // Create approval request
        const requestId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        const approvalRequest = {
          id: requestId,
          origin: origin,
          type: 'sendTransaction',
          data: { fromAddress, toAddress, amount }
        };

        // Store the request and set up promise for approval
        this.pendingApprovals.set(requestId, approvalRequest);
        
        const approvalPromise = new Promise((resolve, reject) => {
          this.approvalResolvers.set(requestId, { resolve, reject });
          
          // Longer timeout if wallet is locked (user needs to unlock + approve)
          const timeoutMs = walletIsLocked ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10 min vs 5 min
          setTimeout(() => {
            if (this.approvalResolvers.has(requestId)) {
              this.approvalResolvers.delete(requestId);
              this.pendingApprovals.delete(requestId);
              reject(new Error('User approval timeout'));
            }
          }, timeoutMs);
        });

        console.log('Background: dApp transaction queued for approval:', requestId);
        
        // Open popup for approval
        try {
          await chrome.action.openPopup();
        } catch (error) {
          console.log('Popup might already be open');
        }

        // Wait for user approval
        let approvalResult;
        try {
          approvalResult = await approvalPromise as ApprovalResult;
        } catch (error) {
          console.error('Background: Transaction approval failed:', error);
          sendResponse(this.createStandardError(
            error instanceof Error && error.message.includes('timeout') 
              ? 'Transaction approval timed out' 
              : 'Transaction request failed',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
          return;
        }

        // Check if user actually approved the transaction
        if (!approvalResult || !approvalResult.approved) {
          console.log('Background: User rejected the transaction');
          sendResponse(this.createStandardError(
            'User rejected the transaction request',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
          return;
        }
        
        // Execute the transaction after approval
        console.log('Background: Transaction approved, executing:', requestId);
        const transactionHash = await this.walletManager.sendBanano(fromAddress, toAddress, amount);
        
        // Store transaction result
        this.transactionResults.set(requestId, {
          success: true,
          hash: transactionHash,
          block: { type: 'send', fromAddress, toAddress, amount }
        });
        
        // Update balances after successful transaction
        try {
          console.log('Background: Updating balances after dApp transaction...');
          await this.handleUpdateBalances(() => {});
        } catch (balanceError) {
          console.warn('Background: Failed to update balances after transaction:', balanceError);
        }
        
        sendResponse({
          success: true,
          data: { 
            hash: transactionHash,
            block: { type: 'send', fromAddress, toAddress, amount }
          }
        });
        
        console.log('Background: dApp transaction sent successfully:', transactionHash);
        
      } else {
        // This is an extension request - execute immediately without approval
        console.log('Background: Extension transaction request - executing immediately');
        
        const transactionHash = await this.walletManager.sendBanano(fromAddress, toAddress, amount);
        
        // Update balances after successful transaction
        try {
          console.log('Background: Updating balances after extension transaction...');
          await this.handleUpdateBalances(() => {});
        } catch (balanceError) {
          console.warn('Background: Failed to update balances after transaction:', balanceError);
        }
        
        sendResponse({
          success: true,
          data: { 
            hash: transactionHash,
            block: { type: 'send', fromAddress, toAddress, amount }
          }
        });
        
        console.log('Background: Extension transaction sent successfully:', transactionHash);
      }
      
    } catch (error) {
      console.error('Background: Error sending transaction:', error);
      
      // Store error result if this was a dApp request
      if (request.origin && request.origin !== chrome.runtime.id) {
        this.transactionResults.set(request.requestId, {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send transaction'
        });
      }
      
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send transaction'
      });
    }
  }

  private async handleReceivePending(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Receive pending request for:', request.address);
      
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }

      const { address } = request;
      if (!address) {
        sendResponse({ success: false, error: 'Address is required' });
        return;
      }

      // Auto-receive pending transactions
      const receivedHashes = await this.walletManager.autoReceivePending(address);
      
      sendResponse({
        success: true,
        data: { 
          received: receivedHashes.length,
          hashes: receivedHashes
        }
      });
      
      console.log('Background: Received', receivedHashes.length, 'pending transactions for', address);
      
    } catch (error) {
      console.error('Background: Error receiving pending:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to receive pending'
      });
    }
  }

  private async handleGetBalance(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Get balance request for:', request.address);
      
      const { address } = request;
      if (!address) {
        sendResponse({ success: false, error: 'Address is required' });
        return;
      }

      // Get balance from RPC
      const balanceResult = await this.rpc.getAccountsBalances([address]);
      
      if (!balanceResult.success) {
        sendResponse({ success: false, error: 'Failed to fetch balance' });
        return;
      }

      const balanceData = balanceResult.data?.balances[address];
      const balance = balanceData ? BananoRPC.rawToBan(balanceData.balance || '0') : '0';
      
      console.log('Background: Balance for', address, ':', balance);
      
      sendResponse({
        success: true,
        data: { balance: balance }
      });
      
    } catch (error) {
      console.error('Background: Error getting balance:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get balance'
      });
    }
  }

  private async handleGetAccountInfo(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Get account info request for:', request.address);
      
      const { address } = request;
      if (!address) {
        sendResponse({ success: false, error: 'Address is required' });
        return;
      }

      // Get full account info from RPC
      const balanceResult = await this.rpc.getAccountsBalances([address]);
      
      if (!balanceResult.success) {
        sendResponse({ success: false, error: 'Failed to fetch account info' });
        return;
      }

      const balanceData = balanceResult.data?.balances[address];
      const accountInfo = {
        address: address,
        balance: balanceData ? BananoRPC.rawToBan(balanceData.balance || '0') : '0',
        pending: (balanceData as any)?.receivable_decimal || '0',
        rawBalance: balanceData?.balance || '0',
        rawPending: (balanceData as any)?.receivable || '0'
      };
      
      console.log('Background: Account info for', address, ':', accountInfo);
      
      sendResponse({
        success: true,
        data: { accountInfo: accountInfo }
      });
      
    } catch (error) {
      console.error('Background: Error getting account info:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account info'
      });
    }
  }

  private async handleResolveBNS(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Resolve BNS request for:', request.bnsName);
      
      const { bnsName } = request;
      if (!bnsName) {
        sendResponse(this.createStandardError(
          'BNS name is required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      // Import the BNS resolver
      const { bnsResolver } = await import('../utils/bns');
      
      // Resolve the BNS name
      const resolvedAddress = await bnsResolver.resolveBNS(bnsName);
      
      console.log('Background: Resolved BNS', bnsName, 'to', resolvedAddress);
      
      sendResponse({
        success: true,
        data: { address: resolvedAddress }
      });
      
    } catch (error) {
      console.error('Background: Error resolving BNS:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to resolve BNS name',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleSignMessage(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Sign message request from origin:', request.origin);
      
      // Check if wallet is initialized first
      const isInitialized = await this.walletManager.isWalletInitialized();
      if (!isInitialized) {
        sendResponse(this.createStandardError(
          'Wallet not initialized',
          PROVIDER_ERRORS.DISCONNECTED.code
        ));
        return;
      }

      // Check if wallet is locked for extended timeout
      const walletIsLocked = !this.walletManager.isWalletUnlocked();
      console.log('Background: Sign message request, wallet locked:', walletIsLocked);
      
      // Create approval request
      const signRequestId = 'signMessage_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const signApprovalRequest = {
        id: signRequestId,
        origin: request.origin,
        type: 'signMessage',
        data: request
      };
      
      this.pendingApprovals.set(signRequestId, signApprovalRequest);
      
      const signApprovalPromise = new Promise<ApprovalResult>((resolve, reject) => {
        this.approvalResolvers.set(signRequestId, { resolve, reject });
        
        // Longer timeout if wallet is locked (user needs to unlock + approve)
        const timeoutMs = walletIsLocked ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10 min vs 5 min
        setTimeout(() => {
          if (this.approvalResolvers.has(signRequestId)) {
            this.approvalResolvers.delete(signRequestId);
            this.pendingApprovals.delete(signRequestId);
            reject(new Error('Approval request timeout'));
          }
        }, timeoutMs);
      });

      // Open popup for approval/unlock
      await chrome.action.openPopup();

      try {
        const approvalResult = await signApprovalPromise as ApprovalResult;
        if (!approvalResult.approved) {
          sendResponse(this.createStandardError(
            'User rejected the message signing request',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
          return;
        }
        
        console.log('Background: Message signing approved, proceeding with execution');
      } catch (error) {
        console.error('Background: Message signing approval failed:', error);
        sendResponse(this.createStandardError(
          error instanceof Error && error.message.includes('timeout') 
            ? 'Message signing approval timed out' 
            : 'Message signing request failed',
          PROVIDER_ERRORS.USER_REJECTED.code
        ));
        return;
      }

      const { message, display = 'utf8', publicKey, origin } = request;
      
      if (!message || !publicKey) {
        sendResponse(this.createStandardError(
          'Message and publicKey are required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      // Check if origin is authorized for this account
      if (!this.isOriginAuthorized(origin, [publicKey])) {
        sendResponse(this.createStandardError(
          'Origin not authorized for this account',
          PROVIDER_ERRORS.UNAUTHORIZED.code
        ));
        return;
      }

      // At this point, approval was already handled above, so proceed with signing
      console.log('Background: Message signing approved, performing signature');
      
      // For now, simulate message signing
      // In a real implementation, this would use the account's private key
      const mockSignature = Array.from({ length: 64 }, (_, i) => 
        ((i + message.length) % 256).toString(16).padStart(2, '0')
      ).join('');
      
      sendResponse({
        success: true,
        data: {
          signature: mockSignature,
          publicKey: publicKey
        }
      });
      
      console.log('Background: Message signed successfully');
      
    } catch (error) {
      console.error('Background: Error signing message:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign message',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private handleGetPendingApproval(sendResponse: (response: any) => void): void {
    const pendingRequests = Array.from(this.pendingApprovals.values());
    // Get the most recent request (last in array)
    const nextRequest = pendingRequests[pendingRequests.length - 1] || null;
    
    console.log('Background: Get pending approval, total pending:', pendingRequests.length);
    console.log('Background: Returning request:', nextRequest?.id || 'none');
    console.log('Background: All pending IDs:', pendingRequests.map(r => r.id));
    
    sendResponse({
      success: true,
      data: nextRequest
    });
  }

  private handleApproveTransaction(request: any, sendResponse: (response: any) => void): void {
    const { requestId, accounts } = request;
    
    console.log('Background: Approving request:', requestId, 'with accounts:', accounts);
    
    const resolver = this.approvalResolvers.get(requestId);
    if (resolver) {
      this.approvalResolvers.delete(requestId);
      this.pendingApprovals.delete(requestId);
      
      // Resolve with approval data
      resolver.resolve({ 
        approved: true, 
        accounts: accounts || undefined 
      });
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Request not found or already processed' });
    }
  }

  private handleRejectTransaction(request: any, sendResponse: (response: any) => void): void {
    const { requestId } = request;
    
    console.log('Background: Rejecting request:', requestId);
    
    const resolver = this.approvalResolvers.get(requestId);
    if (resolver) {
      this.approvalResolvers.delete(requestId);
      this.pendingApprovals.delete(requestId);
      
      // Reject the promise to indicate user rejection
      resolver.reject(new Error('User rejected the request'));
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Request not found or already processed' });
    }
  }

  private handleGetTransactionResult(request: any, sendResponse: (response: any) => void): void {
    const { requestId } = request;
    
    console.log('Background: Getting transaction result for:', requestId);
    
    const result = this.transactionResults.get(requestId);
    if (result) {
      // Clean up the result after retrieving it
      this.transactionResults.delete(requestId);
      sendResponse({
        success: true,
        data: result
      });
    } else {
      sendResponse({
        success: false,
        error: 'Transaction result not found'
      });
    }
  }

  private async handleRevokePermission(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { origin } = request;
      
      if (!origin) {
        sendResponse(this.createStandardError(
          'Origin is required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      console.log('Background: Revoking permission for origin:', origin);
      
      await this.revokeOriginPermission(origin);
      
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('Background: Error revoking permission:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to revoke permission',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleCheckConnection(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { origin } = request;
      
      if (!origin) {
        sendResponse(this.createStandardError(
          'Origin is required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      console.log('Background: Checking connection for origin:', origin);
      
      // Check if wallet is initialized first
      const isInitialized = await this.walletManager.isWalletInitialized();
      if (!isInitialized) {
        sendResponse(this.createStandardError(
          'Wallet not initialized',
          PROVIDER_ERRORS.DISCONNECTED.code
        ));
        return;
      }

      // Allow checking connection even when locked - get stored accounts
      let accounts;
      if (this.walletManager.isWalletUnlocked()) {
        accounts = this.walletManager.getAccounts();
      } else {
        // Get accounts from storage when locked
        accounts = await this.walletManager.getStoredAccounts();
      }

      if (accounts.length === 0) {
        sendResponse(this.createStandardError(
          'No accounts available',
          PROVIDER_ERRORS.INTERNAL_ERROR.code
        ));
        return;
      }

      // Check if origin is authorized
      if (this.isOriginAuthorized(origin)) {
        const permission = this.permissions.get(origin)!;
        const primaryAccount = accounts.find(acc => 
          permission.approvedAccounts.includes(acc.address)
        ) || accounts[0];
        
        console.log('Background: Origin is connected, returning connection info');
        
        sendResponse({
          success: true,
          data: {
            publicKey: primaryAccount.address,
            address: primaryAccount.address, // For backward compatibility
            accounts: permission.approvedAccounts,
            isConnected: true
          }
        });
      } else {
        console.log('Background: Origin is not connected');
        
        sendResponse({
          success: true,
          data: {
            isConnected: false
          }
        });
      }
      
    } catch (error) {
      console.error('Background: Error checking connection:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to check connection',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleGetAutoLockTimeout(sendResponse: (response: any) => void): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['autoLockTimeout']);
      const timeout = result.autoLockTimeout || (15 * 60 * 1000); // 15 minutes default
      
      sendResponse({
        success: true,
        data: {
          timeout: timeout,
          minutes: timeout / 1000 / 60
        }
      });
    } catch (error) {
      console.error('Background: Error getting auto-lock timeout:', error);
      sendResponse(this.createStandardError(
        'Failed to get auto-lock timeout',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleSetAutoLockTimeout(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { timeout } = request;
      
      if (!timeout || typeof timeout !== 'number' || timeout < 60000) { // Minimum 1 minute
        sendResponse(this.createStandardError(
          'Invalid timeout. Minimum is 1 minute (60000 ms)',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }
      
      await chrome.storage.local.set({ autoLockTimeout: timeout });
      
      console.log('Background: Auto-lock timeout set to', timeout / 1000 / 60, 'minutes');
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Background: Error setting auto-lock timeout:', error);
      sendResponse(this.createStandardError(
        'Failed to set auto-lock timeout',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private setupAutoLock(): void {
    let lockTimer: NodeJS.Timeout | null = null;
    
    // Default to 15 minutes like Phantom, but make it configurable
    const getAutoLockTimeout = async (): Promise<number> => {
      try {
        const result = await chrome.storage.local.get(['autoLockTimeout']);
        // Default to 15 minutes (15 * 60 * 1000 ms), with options: 1, 5, 15, 60 minutes
        return result.autoLockTimeout || (15 * 60 * 1000);
      } catch (error) {
        return 15 * 60 * 1000; // 15 minutes default
      }
    };

    const resetLockTimer = async () => {
      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }
      
      if (this.walletManager.isWalletUnlocked()) {
        const timeout = await getAutoLockTimeout();
        lockTimer = setTimeout(() => {
          this.walletManager.lockWallet();
          console.log('Wallet auto-locked due to inactivity');
          
          // Emit disconnect event to all connected sites
          this.emitProviderEvent('disconnect', null);
        }, timeout);
        
        console.log(`Auto-lock timer set for ${timeout / 1000 / 60} minutes`);
      }
    };

    // Reset timer on any message (user activity)
    chrome.runtime.onMessage.addListener(() => {
      resetLockTimer();
    });

    // Reset timer when extension popup is opened (user activity)
    chrome.action.onClicked.addListener(() => {
      resetLockTimer();
    });

    // Initial timer setup
    resetLockTimer();
  }
}

// Initialize the background service
new BackgroundService();
