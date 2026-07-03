import { WalletManager } from '../utils/wallet';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bananojs = require('@bananocoin/bananojs');
import { BananoRPC } from '../utils/rpc';
import {
  fetchAccountDelegation,
  fetchRepNetworkSnapshot,
  suggestDecentralizedRepresentative,
} from '../utils/representatives';
import { banToRaw, rawToBan } from '@monkeymask/wallet-standard';
import { handleProtocolRequest, type ProtocolHandlerHost } from './protocolHandlers';

/** A per-origin spending allowance for auto-approved small sends. */
interface SpendSession {
  address: string;
  /** Total allowance in raw. */
  limitRaw: string;
  /** Amount already auto-approved in raw. */
  spentRaw: string;
  /** Epoch ms when the allowance expires. */
  expiresAt: number;
}

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

interface AccountPermission {
  account: string;
  origin: string;
  approvedAt: number;
  lastUsed: number;
}

interface StoredPermissions {
  [accountOriginKey: string]: AccountPermission; // Key format: "account:origin"
}

interface ApprovalResult {
  approved: boolean;
  accounts?: string[];
}

class BackgroundService {
  private static readonly LOCK_ALARM_NAME = 'monkeymask-autolock';
  private walletManager: WalletManager;
  private resetLockTimer: (() => Promise<void>) | null = null;
  private rpc: BananoRPC;
  private pendingApprovals: Map<string, any> = new Map();
  private approvalResolvers: Map<string, { resolve: Function; reject: Function }> = new Map();
  private transactionResults: Map<string, any> = new Map();
  private permissions: Map<string, AccountPermission> = new Map();
  private connectedTabs: Map<number, string> = new Map(); // tabId -> origin
  private accountInfoCache: Map<string, { accountInfo: any; ts: number }> = new Map();
  private spendSessions: Map<string, SpendSession> = new Map();
  private static readonly SPEND_SESSIONS_KEY = 'mm_spend_sessions';
  private static readonly AUTO_CONFIRM_KEY = 'mm_auto_confirm_enabled';
  private static readonly DEFAULT_SESSION_MS = 60 * 60 * 1000; // 1 hour
  private static readonly MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private spendSessionsLoaded = false;
  // Global advanced opt-in: auto-confirmation (spending allowances) is OFF until
  // the user explicitly enables it. Cached in memory so the synchronous
  // auto-approve check can fail closed after a service-worker restart.
  private autoConfirmEnabled = false;
  private static readonly ACCOUNT_INFO_TTL_MS = 5000;
  private lastPendingApprovalCheck: Map<string, number> = new Map(); // origin -> timestamp
  private static readonly PENDING_APPROVAL_RATE_LIMIT_MS = 1000; // 1 second
  private readonly ready: Promise<void>;

  constructor() {
    this.walletManager = WalletManager.getInstance();
    this.rpc = new BananoRPC();
    this.setupMessageListeners();
    this.loadPermissions();
    void this.loadSpendSessions();
    // Restore any valid unlocked session left by a previous worker instance.
    // Message handling awaits this so state reads don't race the restore.
    this.ready = this.restoreSessionOnStartup();
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

    // Auto-lock wallet after configured timeout (default 15 minutes)
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

  private async handleVerifySignedMessage(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { message, signature, publicKey, display = 'utf8', origin } = request;
      
      if (!message || !signature || !publicKey) {
        sendResponse(this.createStandardError(
          'message, signature and publicKey are required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      // Use WalletManager for verification with domain separation
      try {
        // Build the same domain-separated message bytes as in signing
        const messageBytes = this.getPrefixedMessageBytes(message, display, origin || 'unknown');
        
        const isValid = await this.walletManager.verifySignedMessage(publicKey, messageBytes, signature, message, origin || 'unknown');
        
        sendResponse({ success: true, data: { valid: isValid } });
      } catch (verifyError) {
        console.error('Background: Verification failed:', verifyError);
        sendResponse({ success: true, data: { valid: false } });
      }
    } catch (error) {
      console.error('Background: Error verifying signed message:', error);
      sendResponse(this.createStandardError(
        'Failed to verify signed message',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async getCurrentAccountIndex(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(['currentAccountIndex']);
      return result.currentAccountIndex || 0;
    } catch (error) {
      console.warn('Background: Failed to get current account index, using 0:', error);
      return 0;
    }
  }

  private async getCurrentAccountAddress(): Promise<string | null> {
    try {
      const accounts = this.walletManager.isWalletUnlocked()
        ? this.walletManager.getAccounts()
        : await this.walletManager.getStoredAccounts();

      if (accounts.length === 0) {
        return null;
      }

      const currentAccountIndex = await this.getCurrentAccountIndex();
      const currentAccount = accounts[currentAccountIndex] || accounts[0];
      return currentAccount.address;
    } catch (error) {
      console.warn('Background: Failed to get current account address:', error);
      return null;
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

  private isAccountAuthorizedForOrigin(account: string, origin: string): boolean {
    const key = `${account}:${origin}`;
    const permission = this.permissions.get(key);
    
    if (!permission) return false;
    
    // Update last used timestamp
    permission.lastUsed = Date.now();
    this.savePermissions(); // Fire and forget
    
    return true;
  }

  private getAuthorizedAccountsForOrigin(origin: string): string[] {
    const authorizedAccounts: string[] = [];
    
    this.permissions.forEach((permission, key) => {
      if (permission.origin === origin) {
        authorizedAccounts.push(permission.account);
      }
    });
    
    return authorizedAccounts;
  }

  private async authorizeAccountsForOrigin(origin: string, accounts: string[]): Promise<void> {
    const now = Date.now();
    
    // Create individual permission entries for each account-origin pair
    for (const account of accounts) {
      const key = `${account}:${origin}`;
      const permission: AccountPermission = {
        account,
        origin,
        approvedAt: now,
        lastUsed: now
      };
      
      this.permissions.set(key, permission);
      console.log(`Background: Authorized account ${account} for origin ${origin}`);
    }
    
    await this.savePermissions();
    console.log('Background: Authorization complete for origin:', origin, 'accounts:', accounts);
  }

  private async revokeOriginPermission(origin: string): Promise<void> {
    // Remove all account permissions for this origin
    const keysToDelete: string[] = [];
    
    this.permissions.forEach((permission, key) => {
      if (permission.origin === origin) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.permissions.delete(key);
    });
    
    await this.savePermissions();

    // Disconnecting must also tear down any auto-approve allowance for this
    // origin — the user's disconnect is the ultimate kill switch, independent of
    // whether the dApp offers its own revoke.
    await this.loadSpendSessions();
    if (this.spendSessions.delete(origin)) {
      await this.persistSpendSessions();
    }
    
    // Emit disconnect event to all tabs from this origin
    this.emitProviderEvent('disconnect', null, origin);
    
    console.log('Background: Revoked all account permissions for origin:', origin, 'removed keys:', keysToDelete);
  }

  private async revokeAccountPermissionForOrigin(account: string, origin: string): Promise<void> {
    const key = `${account}:${origin}`;
    this.permissions.delete(key);
    await this.savePermissions();
    
    console.log(`Background: Revoked permission for account ${account} on origin ${origin}`);
  }

  private async handleRevokeAccountPermission(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { account, origin } = request;
      
      if (!account || !origin) {
        sendResponse({ success: false, error: 'Missing account or origin' });
        return;
      }
      
      console.log(`Background: Revoking permission for account ${account} on origin ${origin}`);
      
      // Revoke the specific account permission
      await this.revokeAccountPermissionForOrigin(account, origin);
      
      // Emit disconnect event to the specific origin for this account
      // Note: This will disconnect all accounts from the site, but that's expected behavior
      // when revoking permissions from the settings screen
      this.emitProviderEvent('disconnect', null, origin);
      
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('Background: Error revoking account permission:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke account permission'
      });
    }
  }

  private async handleRemoveAccount(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { address } = request;
      
      if (!address) {
        sendResponse({ success: false, error: 'Missing account address' });
        return;
      }
      
      console.log(`Background: Removing account: ${address}`);
      
      // Check if wallet is unlocked
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet must be unlocked to remove accounts' });
        return;
      }
      
      // Remove the account
      await this.walletManager.removeAccount(address);
      
      // Also remove all permissions for this account across all origins
      const keysToDelete: string[] = [];
      this.permissions.forEach((permission, key) => {
        if (permission.account === address) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.permissions.delete(key);
      });
      
      if (keysToDelete.length > 0) {
        await this.savePermissions();
        console.log(`Background: Removed ${keysToDelete.length} permissions for account ${address}`);
      }

      await this.persistUnlockedSession();
      
      sendResponse({ success: true });
      
    } catch (error) {
      console.error('Background: Error removing account:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove account'
      });
    }
  }

  private createStandardError(message: string, code: number, data?: unknown): any {
    return {
      success: false,
      error: message,
      code,
      data
    };
  }

  private getPrefixedMessageBytes(message: string, display: 'utf8' | 'hex', origin: string): Uint8Array {
    const encoder = new TextEncoder();
    const prefix = encoder.encode(`MonkeyMask Signed Message:\nOrigin: ${origin}\nMessage: `);
    let messageBytes: Uint8Array;
    if (display === 'hex') {
      messageBytes = Buffer.from(message, 'hex');
    } else { // utf8
      messageBytes = encoder.encode(message);
    }
    const combined = new Uint8Array(prefix.length + messageBytes.length);
    combined.set(prefix, 0);
    combined.set(messageBytes, prefix.length);
    return combined;
  }

  private emitProviderEvent(event: string, data: any, targetOrigin?: string): void {
    // Send event to all connected tabs (or specific origin)
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id && (!targetOrigin || this.connectedTabs.get(tab.id) === targetOrigin)) {
          chrome.tabs.sendMessage(tab.id, {
            source: 'monkeymask-provider-event-broadcast',
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
      // Ensure any persisted session is restored before we read wallet state,
      // otherwise a message that starts the worker could race the restore and
      // incorrectly report the wallet as locked.
      await this.ready;

      // Track tab/origin for provider event routing.
      if (sender.tab?.id && typeof request?.origin === 'string' && request.origin.length > 0) {
        this.connectedTabs.set(sender.tab.id, request.origin);
      }

      // Reset lock timer on any user activity (except for certain system messages)
      const activityKey = request.method ?? request.type;
      if (this.resetLockTimer && activityKey && !['GET_AUTO_LOCK_TIMEOUT', 'SET_AUTO_LOCK_TIMEOUT'].includes(activityKey)) {
        this.resetLockTimer();
      }

      if (request.method) {
        await handleProtocolRequest(this as unknown as ProtocolHandlerHost, request, sendResponse);
        return;
      }
      
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
          await this.handleDisconnectWallet(request, sendResponse);
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

        case 'TRANSFER_NFT':
          await this.handleTransferNFT(request, sendResponse);
          break;

        case 'BURN_NFT':
          await this.handleBurnNFT(request, sendResponse);
          break;

        case 'FINISH_COLLECTION':
          await this.handleFinishCollection(request, sendResponse);
          break;

        case 'SEND_ALL_NFTS':
          await this.handleSendAllNfts(request, sendResponse);
          break;

        case 'SWEEP_TRANSACTION':
          await this.handleSweepTransaction(request, sendResponse);
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

        case 'VERIFY_SIGNED_MESSAGE':
          await this.handleVerifySignedMessage(request, sendResponse);
          break;
        
        case 'GET_ACCOUNT_HISTORY':
          await this.handleGetAccountHistory(request, sendResponse);
          break;

        case 'GET_NFTS':
          await this.handleGetNFTs(request, sendResponse);
          break;

        case 'GET_EXPLORE':
          await this.handleGetExplore(sendResponse);
          break;
        
        case 'GET_PENDING_APPROVAL':
          // Add debugging to track where these calls are coming from
          console.log('Background: GET_PENDING_APPROVAL called from:', sender.tab?.url || sender.url || 'extension popup');
          console.log('Background: Request details:', JSON.stringify(request, null, 2));
          this.handleGetPendingApproval(sendResponse, sender);
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
        
        case 'CREATE_NEW_ACCOUNT':
          await this.handleCreateNewAccount(sendResponse);
          break;
        
        case 'ACCOUNT_CHANGED':
          await this.handleAccountChanged(request, sendResponse);
          break;
        
        case 'REVOKE_ACCOUNT_PERMISSION':
          await this.handleRevokeAccountPermission(request, sendResponse);
          break;
        
        case 'REMOVE_ACCOUNT':
          await this.handleRemoveAccount(request, sendResponse);
          break;

        case 'GET_SPENDING_SESSIONS':
          await this.handleListSpendingSessions(sendResponse);
          break;

        case 'REVOKE_SPENDING_SESSION':
          await this.handleRevokeSpendingSession(request.origin, sendResponse);
          break;

        case 'GET_AUTO_CONFIRM_ENABLED':
          await this.handleGetAutoConfirmEnabled(sendResponse);
          break;

        case 'SET_AUTO_CONFIRM_ENABLED':
          await this.handleSetAutoConfirmEnabled(request, sendResponse);
          break;

        case 'GET_REPRESENTATIVE_DATA':
          await this.handleGetRepresentativeData(request, sendResponse);
          break;

        case 'CHANGE_REPRESENTATIVE':
          await this.handleChangeRepresentative(request, sendResponse);
          break;

        case 'SUGGEST_REPRESENTATIVE':
          await this.handleSuggestRepresentative(request, sendResponse);
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
      
      // Persist session and arm auto-lock after successful wallet creation
      if (isUnlocked) {
        console.log('Background: Persisting session after wallet creation');
        await this.persistUnlockedSession();
      }
      
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
      
      // Verify wallet state after import
      const isUnlocked = this.walletManager.isWalletUnlocked();
      console.log('Background: Wallet unlocked after import:', isUnlocked);
      
      // Persist session and arm auto-lock after successful wallet import
      if (isUnlocked) {
        console.log('Background: Persisting session after wallet import');
        await this.persistUnlockedSession();
      }
      
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
      
      // Verify wallet state after unlock
      const isUnlocked = this.walletManager.isWalletUnlocked();
      console.log('Background: Wallet unlocked after unlock:', isUnlocked);
      
      // Persist session and arm auto-lock after successful wallet unlock
      if (isUnlocked) {
        console.log('Background: Persisting session after wallet unlock');
        await this.persistUnlockedSession();
      }
      
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
    await chrome.alarms.clear(BackgroundService.LOCK_ALARM_NAME);
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
      
      if (accounts.length === 0) {
        console.log('Background: No accounts found');
        sendResponse({ success: false, error: 'No accounts found' });
        return;
      }

      // Process all accounts to get their balances
      console.log('Background: Fetching balances for all accounts:', accounts.length);
      
      // First, handle pending transactions for current account (auto-receive)
      const currentAccountIndex = await this.getCurrentAccountIndex();
      const currentAccount = accounts[currentAccountIndex] || accounts[0]; // Fallback to first account if index is invalid
      const currentAddress = currentAccount.address;

      let pendingAmount = '0';
      try {
        const preBalanceResult = await Promise.race([
          this.rpc.getAccountBalance(currentAddress),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Pre-balance timeout')), 5000))
        ]) as any;

        if (preBalanceResult.success && preBalanceResult.data?.pending && preBalanceResult.data.pending !== '0') {
          pendingAmount = BananoRPC.rawToBan(preBalanceResult.data.pending);
          console.log('Background: Found pending amount for current account:', pendingAmount);
        }
      } catch (error) {
        console.warn('Background: Failed to get pre-balance for pending check:', error);
      }

      // Try to auto-receive any pending transactions on current account (needs seed)
      if (pendingAmount !== '0' && this.walletManager.hasSeed()) {
        console.log(
          'Background: Auto-receiving pending for current account:',
          currentAddress,
          'amount:',
          pendingAmount,
        );
        await this.walletManager.autoReceivePending(currentAddress, pendingAmount);
      }
      
      // Now fetch balances for ALL accounts
      const updatedAccounts = await Promise.all(accounts.map(async (account, index) => {
        try {
          console.log(`Background: Fetching balance for account ${index}:`, account.address);
          
          const balanceResult = await Promise.race([
            this.rpc.getAccountBalance(account.address),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Balance fetch timeout')), 10000))
          ]) as any;
          
          console.log(`Background: Balance result for account ${index}:`, balanceResult);
          
          if (balanceResult.success && balanceResult.data) {
            const balanceData = balanceResult.data;
            account.balance = BananoRPC.rawToBan(balanceData.balance || '0');
            const pendingRaw = balanceData.pending || '0';
            const pendingAmount = BananoRPC.rawToBan(pendingRaw);
            (account as any).pending = pendingAmount;
            
            console.log(`Background: Updated account ${index} balance:`, account.balance, 'pending:', pendingAmount);
          } else {
            console.warn(`Background: Failed to get balance for account ${index}:`, balanceResult.error);
            // Keep existing balance data if fetch fails
          }
        } catch (error) {
          console.error(`Background: Error fetching balance for account ${index}:`, error);
          // Keep existing balance data if fetch fails
        }
        
        return account;
      }));

      console.log('Background: Updated all accounts with balances:', updatedAccounts.length);

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

  /**
   * Optimistically subtract the sent amount from the sender's balance in memory
   * to provide instant UI feedback. This is reconciled later by a real refresh.
   */
  private updateBalanceOptimistically(fromAddress: string, amountBan: string): void {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        return;
      }

      const accounts = this.walletManager.getAccounts();
      const sender = accounts.find(acc => acc.address === fromAddress);
      if (!sender) {
        return;
      }

      const currentBalance = parseFloat(sender.balance) || 0;
      const sentAmount = parseFloat(amountBan) || 0;
      const newBalance = Math.max(0, currentBalance - sentAmount);

      sender.balance = newBalance.toString();
      console.log('Background: Optimistically updated balance from', currentBalance, 'to', newBalance, 'BAN');
    } catch (error) {
      console.warn('Background: Failed to update balance optimistically:', error);
    }
  }

  /**
   * Refresh balances without needing a sendResponse callback. Fire-and-forget.
   * Only updates the primary account for performance optimization.
   */
  private async updateBalancesAsync(): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        return;
      }

      const accounts = this.walletManager.getAccounts();
      
      if (accounts.length === 0) {
        return;
      }

      // Update current account (or primary if no current account set)
      const currentAccountIndex = await this.getCurrentAccountIndex();
      const currentAccount = accounts[currentAccountIndex] || accounts[0]; // Fallback to first account if index is invalid
      const currentAddress = currentAccount.address;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Balance fetch timeout')), 10000);
      });

      const balanceResult = await Promise.race([
        this.rpc.getAccountBalance(currentAddress),
        timeoutPromise
      ]) as any;

      if (!balanceResult?.success) {
        throw new Error(balanceResult?.error || 'Unknown balance fetch error');
      }

      // Update only the current account
      if (balanceResult.data) {
        currentAccount.balance = BananoRPC.rawToBan(balanceResult.data.balance || '0');
      }
      
      console.log('Background: updateBalancesAsync completed for current account');
    } catch (error) {
      console.warn('Background: updateBalancesAsync failed:', error);
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

      const { options = {}, origin } = request;
      const { onlyIfTrusted = false } = options;

      // Check if wallet is locked
      const isWalletUnlocked = this.walletManager.isWalletUnlocked();
      console.log('Background: Connect request, wallet unlocked:', isWalletUnlocked);

      // Get accounts (from memory if unlocked, from storage if locked)
      let accounts;
      if (isWalletUnlocked) {
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

      // Get the currently selected account from storage
      let currentAccountIndex = 0;
      try {
        const result = await chrome.storage.local.get(['currentAccountIndex']);
        currentAccountIndex = result.currentAccountIndex || 0;
      } catch (error) {
        console.log('Background: Could not get current account index, using 0');
      }
      
      // Ensure the index is valid
      if (currentAccountIndex >= accounts.length) {
        currentAccountIndex = 0;
      }
      
      const currentAccount = accounts[currentAccountIndex];
      console.log('Background: Current selected account:', currentAccount.address, 'at index:', currentAccountIndex);
      
      // Check if the CURRENTLY SELECTED account is authorized for this origin
      const isCurrentAccountAuthorized = this.isAccountAuthorizedForOrigin(currentAccount.address, origin);
      
      if (isCurrentAccountAuthorized) {
        console.log('Background: Currently selected account is already authorized, connecting to:', currentAccount.address);
        
        // Get all authorized accounts for this origin (for the accounts array in response)
        const authorizedAccounts = this.getAuthorizedAccountsForOrigin(origin);
        
        sendResponse({
          success: true,
          data: {
            publicKey: currentAccount.address,
            address: currentAccount.address, // For backward compatibility
            accounts: authorizedAccounts
          }
        });
        return;
      }
      
      // If currently selected account is not authorized, we'll proceed to show approval screen
      console.log('Background: Currently selected account is not authorized, will show approval screen');

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
          currentAccountAddress: currentAccount.address, // Include currently selected account
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
          await this.authorizeAccountsForOrigin(origin, selectedAccounts);
          
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

  private async handleDisconnectWallet(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Disconnect wallet request from dApp:', request.origin);
      
      // Revoke permission for this origin
      if (request.origin) {
        await this.revokeOriginPermission(request.origin);
        console.log('Background: Revoked permissions for origin:', request.origin);
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error('Background: Error disconnecting wallet:', error);
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
      if (!this.isAccountAuthorizedForOrigin(block.account, origin)) {
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

      // Returning a simulated hash is unsafe for production dApps.
      sendResponse(this.createStandardError(
        'sendBlock is not implemented yet. Use sendTransaction instead.',
        PROVIDER_ERRORS.UNSUPPORTED_METHOD.code
      ));
    } catch (error) {
      console.error('Background: Error sending block:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to send block',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  /**
   * Transfer an owned NFT from within the extension popup (no dApp approval —
   * this is a first-party user action). Publishes a `send#asset` block.
   */
  private async handleTransferNFT(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }
      const { fromAddress, assetRepresentative, toAddress, amount } = request;
      if (!fromAddress || !assetRepresentative || !toAddress) {
        sendResponse({
          success: false,
          error: 'Missing required fields: fromAddress, assetRepresentative, toAddress',
        });
        return;
      }

      const hash = await this.walletManager.transferNFT(fromAddress, {
        assetRepresentative,
        to: toAddress,
        amount,
      });

      setTimeout(() => {
        this.updateBalancesAsync().catch((err) => {
          console.warn('Background: post transfer refresh failed:', err);
        });
      }, 0);

      sendResponse({ success: true, data: { hash } });
    } catch (error) {
      console.error('Background: Error transferring NFT:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transfer NFT',
      });
    }
  }

  /**
   * Permanently burn an owned NFT from within the extension popup (first-party
   * user action). Publishes a `send#burn` to a canonical burn account.
   */
  private async handleBurnNFT(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }
      const { fromAddress, assetRepresentative, amount } = request;
      if (!fromAddress || !assetRepresentative) {
        sendResponse({
          success: false,
          error: 'Missing required fields: fromAddress, assetRepresentative',
        });
        return;
      }

      const hash = await this.walletManager.burnNFT(fromAddress, {
        assetRepresentative,
        amount,
      });

      setTimeout(() => {
        this.updateBalancesAsync().catch((err) => {
          console.warn('Background: post burn refresh failed:', err);
        });
      }, 0);

      sendResponse({ success: true, data: { hash } });
    } catch (error) {
      console.error('Background: Error burning NFT:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to burn NFT',
      });
    }
  }

  /**
   * Lock a collection the account issued (first-party popup action). Publishes a
   * `#finish_supply` block so no further editions can be minted.
   */
  private async handleFinishCollection(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }
      const { fromAddress, metadataCid } = request;
      if (!fromAddress || !metadataCid) {
        sendResponse({
          success: false,
          error: 'Missing required fields: fromAddress, metadataCid',
        });
        return;
      }
      const hash = await this.walletManager.finishCollection(fromAddress, { metadataCid });
      sendResponse({ success: true, data: { hash } });
    } catch (error) {
      console.error('Background: Error finishing collection:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to finish collection',
      });
    }
  }

  /**
   * Transfer every NFT the account holds to one recipient (first-party popup
   * action) via a single `send#all_nfts` block.
   */
  private async handleSendAllNfts(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }
      const { fromAddress, toAddress, amount } = request;
      if (!fromAddress || !toAddress) {
        sendResponse({
          success: false,
          error: 'Missing required fields: fromAddress, toAddress',
        });
        return;
      }
      const hash = await this.walletManager.sendAllNfts(fromAddress, { to: toAddress, amount });
      setTimeout(() => {
        this.updateBalancesAsync().catch((err) => {
          console.warn('Background: post send-all refresh failed:', err);
        });
      }, 0);
      sendResponse({ success: true, data: { hash } });
    } catch (error) {
      console.error('Background: Error sending all NFTs:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send all NFTs',
      });
    }
  }

  private async handleSweepTransaction(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }
      const { fromAddress, toAddress } = request;
      if (!fromAddress || !toAddress) {
        sendResponse({ success: false, error: 'Missing required fields: fromAddress, toAddress' });
        return;
      }

      const { hash, amount } = await this.walletManager.sweep(fromAddress, toAddress);

      setTimeout(() => {
        this.updateBalancesAsync().catch((err) => {
          console.warn('Background: post sweep refresh failed:', err);
        });
      }, 0);

      sendResponse({
        success: true,
        data: { hash, block: { type: 'sweep', fromAddress, toAddress, amount } },
      });
    } catch (error) {
      console.error('Background: Error sweeping:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sweep',
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
        
        // Check for existing pending transaction requests from the same origin
        const existingTxRequests = Array.from(this.pendingApprovals.values())
          .filter(req => req.origin === origin && req.type === 'sendTransaction');
        
        // Only prevent if there are too many pending requests (more than 1 for transactions)
        if (existingTxRequests.length >= 1) {
          console.log('Background: Found existing transaction request from same origin:', existingTxRequests.map(r => r.id));
          // Still open popup to show existing request
          try {
            await chrome.action.openPopup();
          } catch (error) {
            console.log('Popup might already be open');
          }
          
          sendResponse(this.createStandardError(
            'A transaction request is already pending. Please complete or reject it first.',
            PROVIDER_ERRORS.USER_REJECTED.code
          ));
          return;
        }
        
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

        // Optimistic UI update: subtract immediately for fast feedback
        this.updateBalanceOptimistically(fromAddress, amount);

        const transactionHash = await this.walletManager.sendBanano(fromAddress, toAddress, amount);
        
        // Store transaction result
        this.transactionResults.set(requestId, {
          success: true,
          hash: transactionHash,
          block: { type: 'send', fromAddress, toAddress, amount }
        });
        
        // Kick off non-blocking balance refresh (do not await)
        setTimeout(() => {
          this.updateBalancesAsync().catch(err => {
            console.warn('Background: post dApp tx refresh failed:', err);
          });
        }, 0);
        
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

        // Optimistic UI update
        this.updateBalanceOptimistically(fromAddress, amount);

        const transactionHash = await this.walletManager.sendBanano(fromAddress, toAddress, amount);
        
        // Fire-and-forget refresh
        setTimeout(() => {
          this.updateBalancesAsync().catch(err => {
            console.warn('Background: post extension tx refresh failed:', err);
          });
        }, 0);
        
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

  private async handleGetBalance(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Get balance request for:', request.address);

      let { address } = request;

      // If no address provided, default to current account
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No accounts available' });
          return;
        }
        address = currentAddress;
        console.log('Background: Using current account for balance request:', address);
      }

      // Serve from cache if fresh
      const cached = this.accountInfoCache.get(address);
      if (cached && (Date.now() - cached.ts) < BackgroundService.ACCOUNT_INFO_TTL_MS) {
        sendResponse({ success: true, data: { balance: cached.accountInfo.balance } });
        return;
      }

      // Fetch account info and derive balance
      const infoResult = await this.rpc.getAccountInfo(address);
      if (!infoResult.success) {
        sendResponse({ success: false, error: 'Failed to fetch balance' });
        return;
      }

      const rawBalance = (infoResult.data as any)?.balance || '0';
      const rawPending = (infoResult.data as any)?.pending || '0';
      const balance = BananoRPC.rawToBan(rawBalance);
      const pending = BananoRPC.rawToBan(rawPending);

      const accountInfo = { address, balance, pending, rawBalance, rawPending };
      this.accountInfoCache.set(address, { accountInfo, ts: Date.now() });

      sendResponse({ success: true, data: { balance } });
      
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

      let { address } = request;

      // If no address provided, default to current account
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No accounts available' });
          return;
        }
        address = currentAddress;
        console.log('Background: Using current account for account info request:', address);
      }

      // Serve from cache if fresh
      const cached = this.accountInfoCache.get(address);
      if (cached && (Date.now() - cached.ts) < BackgroundService.ACCOUNT_INFO_TTL_MS) {
        sendResponse({ success: true, data: { accountInfo: cached.accountInfo } });
        return;
      }

      // Get full account info from RPC (includes raw balance/pending)
      const infoResult = await this.rpc.getAccountInfo(address);
      if (!infoResult.success) {
        sendResponse({ success: false, error: 'Failed to fetch account info' });
        return;
      }

      const rawBalance = (infoResult.data as any)?.balance || '0';
      const rawPending = (infoResult.data as any)?.pending || '0';
      const accountInfo = {
        address,
        balance: BananoRPC.rawToBan(rawBalance),
        pending: BananoRPC.rawToBan(rawPending),
        rawBalance,
        rawPending
      };

      // Cache it briefly to coalesce GET_BALANCE calls
      this.accountInfoCache.set(address, { accountInfo, ts: Date.now() });

      console.log('Background: Account info for', address, ':', accountInfo);

      sendResponse({ success: true, data: { accountInfo } });
      
    } catch (error) {
      console.error('Background: Error getting account info:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account info'
      });
    }
  }

  private async handleGetRepresentativeData(
    request: { address?: string },
    sendResponse: (response: unknown) => void,
  ): Promise<void> {
    try {
      let address = request.address;
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No account selected' });
          return;
        }
        address = currentAddress;
      }

      const [snapshot, delegation] = await Promise.all([
        fetchRepNetworkSnapshot(25),
        fetchAccountDelegation(address),
      ]);

      sendResponse({
        success: true,
        data: {
          account: address,
          delegation,
          snapshot,
          metaprotocolBusy: this.walletManager.isMetaprotocolBusy(),
          accounts: this.walletManager.getAccounts().map((a) => ({
            address: a.address,
            name: a.name,
          })),
        },
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load representative data',
      });
    }
  }

  private async handleChangeRepresentative(
    request: { address?: string; representative?: string; allAccounts?: boolean },
    sendResponse: (response: unknown) => void,
  ): Promise<void> {
    try {
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({ success: false, error: 'Wallet is locked' });
        return;
      }

      const representative = request.representative?.trim();
      if (!representative || !representative.startsWith('ban_')) {
        sendResponse({ success: false, error: 'A valid ban_ representative address is required' });
        return;
      }

      if (request.allAccounts) {
        const result = await this.walletManager.changeAllAccountsRepresentative(representative);
        sendResponse({ success: true, data: result });
        return;
      }

      let address = request.address;
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No account selected' });
          return;
        }
        address = currentAddress;
      }

      const hash = await this.walletManager.changeAccountRepresentative(address, representative);
      sendResponse({ success: true, data: { hash, address } });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change representative',
      });
    }
  }

  private async handleSuggestRepresentative(
    request: { excludeAddresses?: string[] },
    sendResponse: (response: unknown) => void,
  ): Promise<void> {
    try {
      const exclude = new Set<string>(request.excludeAddresses ?? []);
      for (const account of this.walletManager.getAccounts()) {
        exclude.add(account.address);
      }
      const suggested = await suggestDecentralizedRepresentative(exclude);
      if (!suggested) {
        sendResponse({
          success: false,
          error: 'No suitable online representative found under 1% network weight',
        });
        return;
      }
      sendResponse({ success: true, data: { suggestion: suggested } });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to suggest representative',
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

  private async handleReverseResolveBNS(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      let { address } = request;
      const { tld } = request;
      if (!address) {
        address = await this.getCurrentAccountAddress();
      }
      if (!address) {
        sendResponse(this.createStandardError(
          'Address is required',
          PROVIDER_ERRORS.INVALID_PARAMS.code,
        ));
        return;
      }

      const { bnsResolver } = await import('../utils/bns');
      const names = await bnsResolver.reverseResolve(address, tld);

      console.log('Background: Reverse resolved', address, 'to', names);
      sendResponse({ success: true, data: { names } });
    } catch (error) {
      console.error('Background: Error reverse resolving BNS:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to reverse resolve address',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ));
    }
  }

  // ---- Spending sessions (auto-approve small dApp sends) -------------------

  private async loadSpendSessions(): Promise<void> {
    if (this.spendSessionsLoaded) return;
    try {
      const stored = await chrome.storage.local.get([
        BackgroundService.SPEND_SESSIONS_KEY,
        BackgroundService.AUTO_CONFIRM_KEY,
      ]);
      this.autoConfirmEnabled = stored[BackgroundService.AUTO_CONFIRM_KEY] === true;
      const raw = stored[BackgroundService.SPEND_SESSIONS_KEY] as Record<string, SpendSession> | undefined;
      if (raw) {
        for (const [origin, session] of Object.entries(raw)) {
          this.spendSessions.set(origin, session);
        }
      }
    } catch (error) {
      console.warn('Background: failed to load spend sessions:', error);
    }
    this.spendSessionsLoaded = true;
  }

  private async persistSpendSessions(): Promise<void> {
    const obj: Record<string, SpendSession> = {};
    for (const [origin, session] of this.spendSessions.entries()) obj[origin] = session;
    try {
      await chrome.storage.local.set({ [BackgroundService.SPEND_SESSIONS_KEY]: obj });
    } catch (error) {
      console.warn('Background: failed to persist spend sessions:', error);
    }
  }

  private getActiveSession(origin: string, address?: string): SpendSession | null {
    const session = this.spendSessions.get(origin);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.spendSessions.delete(origin);
      void this.persistSpendSessions();
      return null;
    }
    if (address && session.address !== address) return null;
    return session;
  }

  private sessionInfo(session: SpendSession) {
    const remainingBig = BigInt(session.limitRaw) - BigInt(session.spentRaw);
    const remainingRaw = (remainingBig < 0n ? 0n : remainingBig).toString();
    return {
      address: session.address,
      limit: rawToBan(session.limitRaw),
      spent: rawToBan(session.spentRaw),
      remaining: rawToBan(remainingRaw),
      expiresAt: session.expiresAt,
    };
  }

  canAutoApproveSend(origin: string, address: string, amountBan: string): boolean {
    // Master switch: if the user hasn't opted into auto-confirmation, nothing is
    // ever auto-approved — every send prompts, regardless of any stored session.
    if (!this.autoConfirmEnabled) return false;
    const session = this.getActiveSession(origin, address);
    if (!session) return false;
    let amountRaw: bigint;
    try {
      amountRaw = BigInt(banToRaw(amountBan));
    } catch {
      return false;
    }
    if (amountRaw <= 0n) return false;
    const remaining = BigInt(session.limitRaw) - BigInt(session.spentRaw);
    return amountRaw <= remaining;
  }

  recordAutoApprovedSpend(origin: string, address: string, amountBan: string): void {
    const session = this.getActiveSession(origin, address);
    if (!session) return;
    try {
      const next = BigInt(session.spentRaw) + BigInt(banToRaw(amountBan));
      session.spentRaw = next.toString();
      this.spendSessions.set(origin, session);
      void this.persistSpendSessions();
      this.broadcastSpendingSession(origin); // keep the dApp's remaining balance live
    } catch {
      /* ignore */
    }
  }

  /**
   * Push the current spending-session state for `origin` to that origin's tabs so
   * a connected dApp updates reactively (e.g. after the user revokes the session
   * from the wallet, or the allowance is debited by an auto-approved send).
   */
  private broadcastSpendingSession(origin: string): void {
    const session = this.getActiveSession(origin);
    this.emitProviderEvent(
      'spendingSessionChanged',
      { session: session ? this.sessionInfo(session) : null },
      origin,
    );
  }

  async handleRequestSpendingSession(
    request: { limit?: string; durationMs?: number; address?: string },
    origin: string,
    sendResponse: (response: any) => void,
  ): Promise<void> {
    try {
      await this.loadSpendSessions();
      const address = request.address || (await this.getCurrentAccountAddress());
      if (!address) {
        sendResponse(this.createStandardError('No account available', PROVIDER_ERRORS.INVALID_PARAMS.code));
        return;
      }
      if (!this.isAccountAuthorizedForOrigin(address, origin)) {
        sendResponse(this.createStandardError('Unauthorized', PROVIDER_ERRORS.UNAUTHORIZED.code));
        return;
      }
      if (!request.limit) {
        sendResponse(this.createStandardError('A spending limit is required', PROVIDER_ERRORS.INVALID_PARAMS.code));
        return;
      }
      let limitRaw: string;
      try {
        limitRaw = banToRaw(request.limit);
      } catch {
        sendResponse(this.createStandardError('Invalid limit amount', PROVIDER_ERRORS.INVALID_PARAMS.code));
        return;
      }
      if (BigInt(limitRaw) <= 0n) {
        sendResponse(this.createStandardError('Limit must be greater than zero', PROVIDER_ERRORS.INVALID_PARAMS.code));
        return;
      }
      const durationMs = Math.min(
        Math.max(request.durationMs ?? BackgroundService.DEFAULT_SESSION_MS, 60_000),
        BackgroundService.MAX_SESSION_MS,
      );

      const approval = await this.queueApproval('spendingSession', origin, {
        address,
        limit: request.limit,
        durationMs,
        autoConfirmEnabled: this.autoConfirmEnabled,
      });
      if (!approval.approved) {
        sendResponse(this.createStandardError('User rejected the request', PROVIDER_ERRORS.USER_REJECTED.code));
        return;
      }

      // Defense in depth: only mint a session if auto-confirmation is enabled.
      // The approval UI won't let the user approve without turning it on, but we
      // re-check the persisted flag here so a session can never exist otherwise.
      await this.loadSpendSessions();
      const freshFlag = await chrome.storage.local.get(BackgroundService.AUTO_CONFIRM_KEY);
      this.autoConfirmEnabled = freshFlag[BackgroundService.AUTO_CONFIRM_KEY] === true;
      if (!this.autoConfirmEnabled) {
        sendResponse(
          this.createStandardError(
            'Auto-confirmation is disabled in the wallet',
            PROVIDER_ERRORS.USER_REJECTED.code,
          ),
        );
        return;
      }

      const session: SpendSession = {
        address,
        limitRaw,
        spentRaw: '0',
        expiresAt: Date.now() + durationMs,
      };
      this.spendSessions.set(origin, session);
      await this.persistSpendSessions();
      this.broadcastSpendingSession(origin);
      this.storeOperationResult(approval.requestId, { success: true, type: 'spendingSession' });
      sendResponse({ success: true, data: this.sessionInfo(session) });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to grant spending session';
      const code = message.includes('reject')
        ? PROVIDER_ERRORS.USER_REJECTED.code
        : PROVIDER_ERRORS.INTERNAL_ERROR.code;
      sendResponse(this.createStandardError(message, code));
    }
  }

  async handleGetSpendingSession(origin: string, sendResponse: (response: any) => void): Promise<void> {
    await this.loadSpendSessions();
    const session = this.getActiveSession(origin);
    sendResponse({ success: true, data: { session: session ? this.sessionInfo(session) : null } });
  }

  /**
   * List every active auto-approve allowance across all origins, for the
   * extension's own UI. This is what lets a user revoke an allowance from the
   * wallet even when the granting dApp exposes no revoke control of its own.
   */
  async handleListSpendingSessions(sendResponse: (response: any) => void): Promise<void> {
    await this.loadSpendSessions();
    const now = Date.now();
    let changed = false;
    const sessions: Array<{ origin: string } & ReturnType<BackgroundService['sessionInfo']>> = [];
    for (const [origin, session] of this.spendSessions.entries()) {
      if (session.expiresAt <= now) {
        this.spendSessions.delete(origin); // opportunistically prune expired
        changed = true;
        continue;
      }
      sessions.push({ origin, ...this.sessionInfo(session) });
    }
    if (changed) await this.persistSpendSessions();
    sessions.sort((a, b) => a.expiresAt - b.expiresAt);
    sendResponse({ success: true, data: { sessions } });
  }

  async handleRevokeSpendingSession(origin: string, sendResponse: (response: any) => void): Promise<void> {
    await this.loadSpendSessions();
    this.spendSessions.delete(origin);
    await this.persistSpendSessions();
    this.broadcastSpendingSession(origin); // tell the dApp its session is gone
    sendResponse({ success: true, data: { revoked: true } });
  }

  private async handleGetNFTs(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      let { address } = request;
      if (!address) {
        address = await this.getCurrentAccountAddress();
      }
      if (!address) {
        sendResponse({ success: false, error: 'No accounts available' });
        return;
      }

      const { fetchAllNFTsForAddress } = await import('../utils/nft');
      const result = await fetchAllNFTsForAddress(address);

      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('Background: Error fetching NFTs:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs',
      });
    }
  }

  private async handleGetExplore(sendResponse: (response: any) => void): Promise<void> {
    try {
      const { fetchExploreCatalog } = await import('../utils/explore');
      const catalog = await fetchExploreCatalog();
      sendResponse({ success: true, data: catalog });
    } catch (error) {
      console.error('Background: Error fetching explore catalog:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch explore catalog',
      });
    }
  }

  // hexToAccount method removed - no longer needed since bananojs.getAccountHistory() 
  // already resolves account addresses for us

  private async handleGetReceivable(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      let { address, count = 20 } = request;
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No accounts available' });
          return;
        }
        address = currentAddress;
      }

      const pendingResult = await this.rpc.getPending(address, count);
      if (!pendingResult.success) {
        sendResponse({ success: false, error: 'Failed to fetch receivables' });
        return;
      }

      const blocks = (pendingResult.data as { blocks?: unknown })?.blocks;
      const receivables =
        blocks != null && typeof blocks === 'object' && !Array.isArray(blocks)
          ? Object.entries(blocks as Record<string, unknown>).map(([hash, info]) => {
              const amountRaw =
                typeof info === 'string'
                  ? info
                  : ((info as { amount?: string })?.amount ?? '0');
              return {
                hash,
                amountRaw,
                amount: BananoRPC.rawToBan(amountRaw),
                source: typeof info === 'object' ? (info as { source?: string })?.source : undefined,
              };
            })
          : [];

      sendResponse({ success: true, data: { receivables } });
    } catch (error) {
      console.error('Background: Error getting receivables:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch receivables',
      });
    }
  }

  private async handleGetAccountHistory(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Get account history request for:', request.address);

      let { address, count = 10, head } = request;

      // If no address provided, default to current account
      if (!address) {
        const currentAddress = await this.getCurrentAccountAddress();
        if (!currentAddress) {
          sendResponse({ success: false, error: 'No accounts available' });
          return;
        }
        address = currentAddress;
        console.log('Background: Using current account for account history request:', address);
      }

      // Use bananojs getAccountHistory method with optional head parameter for pagination
      const historyResult = await bananojs.getAccountHistory(address, count, head);
      console.log('Background: bananojs getAccountHistory result:', JSON.stringify(historyResult, null, 2));
      
      // bananojs methods return data directly, not wrapped in success/data structure
      if (!historyResult || historyResult.error) {
        sendResponse({ success: false, error: historyResult?.error || 'Failed to fetch history' });
        return;
      }

      // Process and format the transaction history
      const history = historyResult.history || [];
      console.log('Background: Raw history data:', JSON.stringify(history, null, 2));
      const transactions = history.map((block: any) => {
        // bananojs already provides clean transaction types and resolved account addresses
        const transactionType = block.type || 'unknown';
        const counterpartyAccount = block.account || 'Unknown';
        
        // Use the decimal amount if available, otherwise convert from raw
        const amount = block.amount_decimal || BananoRPC.rawToBan(block.amount || '0');

        return {
          hash: block.hash,
          type: transactionType,
          amount: amount,
          account: counterpartyAccount,
          timestamp: block.local_timestamp || '0',
          local_timestamp: block.local_timestamp || '0'
        };
      });

      // Get the previous hash (head for next page) from the last transaction
      const previousHash = transactions.length > 0 ? transactions[transactions.length - 1].hash : null;
      
      sendResponse({ 
        success: true, 
        data: { 
          transactions,
          previousHash,
          hasMore: transactions.length === count // If we got exactly the requested count, there might be more
        } 
      });
      
    } catch (error) {
      console.error('Background: Error getting account history:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get account history'
      });
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

      // Validate account exists - use stored accounts if wallet is locked
      const requestPublicKey = request.publicKey;
      if (requestPublicKey) {
        let accounts;
        if (walletIsLocked) {
          // Wallet is locked, use stored accounts for validation
          accounts = await this.walletManager.getStoredAccounts();
        } else {
          accounts = this.walletManager.getAccounts();
        }
        
        const account = accounts.find(acc => acc.address === requestPublicKey || acc.publicKey === requestPublicKey);
        if (!account) {
          console.log('Background: Account not found for signing:', requestPublicKey);
          sendResponse(this.createStandardError(
            'Account not found',
            PROVIDER_ERRORS.UNAUTHORIZED.code
          ));
          return;
        }
        console.log('Background: Account validated for signing:', account.address);
      }
      
      // Check for existing pending requests from the same origin (but allow different messages)
      const existingRequests = Array.from(this.pendingApprovals.values())
        .filter(req => req.origin === request.origin && req.type === 'signMessage');
      
      // Only prevent if there are too many pending requests (more than 2)
      if (existingRequests.length >= 2) {
        console.log('Background: Too many pending sign message requests from same origin:', existingRequests.map(r => r.id));
        // Still open popup to show existing requests
        try {
          await chrome.action.openPopup();
        } catch (error) {
          console.log('Popup might already be open');
        }
        
        sendResponse(this.createStandardError(
          'Too many pending signing requests. Please complete or reject existing requests first.',
          PROVIDER_ERRORS.USER_REJECTED.code
        ));
        return;
      }
      
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
      console.log('Background: Request publicKey:', publicKey);
      console.log('Background: Request message:', message);
      console.log('Background: Request display:', display);
      
      if (!message || !publicKey) {
        sendResponse(this.createStandardError(
          'Message and publicKey are required',
          PROVIDER_ERRORS.INVALID_PARAMS.code
        ));
        return;
      }

      // Check if origin is authorized for this account
      if (!this.isAccountAuthorizedForOrigin(publicKey, origin)) {
        sendResponse(this.createStandardError(
          'Origin not authorized for this account',
          PROVIDER_ERRORS.UNAUTHORIZED.code
        ));
        return;
      }

      // At this point, approval was already handled above, so proceed with signing
      console.log('Background: Message signing approved, performing signature');

      try {
        // Allow both address and publicKey here; WalletManager resolves internally
        const signatureHex = await this.walletManager.signMessage(publicKey, message, display, origin);
        sendResponse({
          success: true,
          data: {
            signature: signatureHex,
            publicKey
          }
        });
        console.log('Background: Message signed successfully');
      } catch (signError) {
        console.error('Background: Real message signing failed:', signError);
        sendResponse(this.createStandardError(
          'Failed to sign message',
          PROVIDER_ERRORS.INTERNAL_ERROR.code
        ));
      }
      
    } catch (error) {
      console.error('Background: Error signing message:', error);
      sendResponse(this.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign message',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private handleGetPendingApproval(sendResponse: (response: any) => void, sender?: chrome.runtime.MessageSender): void {
    // Rate limiting to prevent spam calls
    const origin = sender?.tab?.url || sender?.url || 'extension';
    const now = Date.now();
    const lastCheck = this.lastPendingApprovalCheck.get(origin) || 0;
    
    if (now - lastCheck < BackgroundService.PENDING_APPROVAL_RATE_LIMIT_MS) {
      console.log('Background: Rate limiting GET_PENDING_APPROVAL from:', origin);
      // Return the same result as last time to avoid breaking the flow
      const pendingRequests = Array.from(this.pendingApprovals.values());
      const nextRequest = pendingRequests[0] || null;
      sendResponse({
        success: true,
        data: nextRequest
      });
      return;
    }
    
    this.lastPendingApprovalCheck.set(origin, now);
    
    const pendingRequests = Array.from(this.pendingApprovals.values());
    
    // Clean up any stale requests first (older than 10 minutes)
    const staleRequests = pendingRequests.filter(request => {
      const requestTime = parseInt(request.id.split('_')[1]) || 0;
      return now - requestTime > 10 * 60 * 1000; // 10 minutes
    });
    
    // Remove stale requests
    staleRequests.forEach(request => {
      console.log('Background: Cleaning up stale request:', request.id);
      this.pendingApprovals.delete(request.id);
      const resolver = this.approvalResolvers.get(request.id);
      if (resolver) {
        this.approvalResolvers.delete(request.id);
        resolver.reject(new Error('Request expired'));
      }
    });
    
    // Get fresh list after cleanup
    const freshRequests = Array.from(this.pendingApprovals.values());
    // Get the oldest request (first in queue) - FIFO processing
    const nextRequest = freshRequests[0] || null;
    
    console.log('Background: Get pending approval, total pending:', freshRequests.length);
    console.log('Background: Returning request:', nextRequest?.id || 'none');
    console.log('Background: All pending IDs:', freshRequests.map(r => r.id));
    
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

      // Check if origin has any authorized accounts
      const authorizedAccounts = this.getAuthorizedAccountsForOrigin(origin);
      if (authorizedAccounts.length > 0) {
        // Get the currently selected account from storage
        let currentAccountIndex = 0;
        try {
          const result = await chrome.storage.local.get(['currentAccountIndex']);
          currentAccountIndex = result.currentAccountIndex || 0;
        } catch (error) {
          console.log('Background: Could not get current account index, using 0');
        }
        
        // Ensure the index is valid
        if (currentAccountIndex >= accounts.length) {
          currentAccountIndex = 0;
        }
        
        const currentAccount = accounts[currentAccountIndex];
        
        // If the currently selected account is authorized for this origin, use it
        // Otherwise, fall back to the first authorized account
        const primaryAccount = authorizedAccounts.includes(currentAccount.address) 
          ? currentAccount 
          : accounts.find(acc => authorizedAccounts.includes(acc.address)) || accounts[0];
        
        console.log('Background: Origin is connected, returning connection info for currently selected account:', primaryAccount.address);
        
        sendResponse({
          success: true,
          data: {
            publicKey: primaryAccount.address,
            address: primaryAccount.address, // For backward compatibility
            accounts: authorizedAccounts,
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
      console.log('Background: Stored timeout value:', timeout, 'ms');
      
      // Reset the timer with the new timeout value if wallet is unlocked
      if (this.resetLockTimer && this.walletManager.isWalletUnlocked()) {
        console.log('Background: Resetting lock timer with new timeout value');
        
        // Verify the value was stored correctly
        const verifyResult = await chrome.storage.local.get(['autoLockTimeout']);
        console.log('Background: Verification - stored value:', verifyResult.autoLockTimeout, 'ms');
        
        this.resetLockTimer();
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('Background: Error setting auto-lock timeout:', error);
      sendResponse(this.createStandardError(
        'Failed to set auto-lock timeout',
        PROVIDER_ERRORS.INTERNAL_ERROR.code
      ));
    }
  }

  private async handleGetAutoConfirmEnabled(sendResponse: (response: any) => void): Promise<void> {
    try {
      const result = await chrome.storage.local.get([BackgroundService.AUTO_CONFIRM_KEY]);
      this.autoConfirmEnabled = result[BackgroundService.AUTO_CONFIRM_KEY] === true;
      sendResponse({ success: true, data: { enabled: this.autoConfirmEnabled } });
    } catch (error) {
      console.error('Background: Error getting auto-confirm setting:', error);
      sendResponse(this.createStandardError(
        'Failed to get auto-confirmation setting',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ));
    }
  }

  private async handleSetAutoConfirmEnabled(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const enabled = request.enabled === true;
      await chrome.storage.local.set({ [BackgroundService.AUTO_CONFIRM_KEY]: enabled });
      this.autoConfirmEnabled = enabled;

      // Turning the feature off is also a global kill switch: drop every active
      // allowance so nothing keeps auto-approving.
      if (!enabled) {
        await this.loadSpendSessions();
        if (this.spendSessions.size > 0) {
          const affectedOrigins = [...this.spendSessions.keys()];
          this.spendSessions.clear();
          await this.persistSpendSessions();
          // Notify every affected dApp so its session UI clears immediately.
          for (const origin of affectedOrigins) this.broadcastSpendingSession(origin);
        }
      }

      console.log('Background: Auto-confirmation set to', enabled);
      sendResponse({ success: true, data: { enabled } });
    } catch (error) {
      console.error('Background: Error setting auto-confirm setting:', error);
      sendResponse(this.createStandardError(
        'Failed to set auto-confirmation setting',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ));
    }
  }

  private async handleCreateNewAccount(sendResponse: (response: any) => void): Promise<void> {
    try {
      console.log('Background: Creating new account...');
      
      if (!this.walletManager.isWalletUnlocked()) {
        sendResponse({
          success: false,
          error: 'Wallet must be unlocked to create new accounts'
        });
        return;
      }

      // Create new account using the next available index (auto-determined)
      const newAccount = await this.walletManager.createNewAccount();

      // Keep the MV3 session snapshot and auto-lock timer in sync with the new
      // account list so a service-worker restart doesn't drop the extra account.
      await this.persistUnlockedSession();
      
      console.log('Background: Created new account:', newAccount.address);
      
      sendResponse({
        success: true,
        data: {
          address: newAccount.address,
          name: newAccount.name,
          balance: newAccount.balance
        }
      });
    } catch (error) {
      console.error('Background: Error creating new account:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create new account'
      });
    }
  }

  async revokeOriginPermissions(origin: string): Promise<void> {
    await this.revokeOriginPermission(origin);
  }

  async queueApproval(
    type: string,
    origin: string,
    data: Record<string, unknown>,
  ): Promise<{ approved: boolean; accounts?: string[]; requestId: string }> {
    const requestId = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const approvalRequest = { id: requestId, origin, type, data };
    this.pendingApprovals.set(requestId, approvalRequest);

    const approvalPromise = new Promise<ApprovalResult>((resolve, reject) => {
      this.approvalResolvers.set(requestId, { resolve, reject });
      setTimeout(() => {
        if (this.approvalResolvers.has(requestId)) {
          this.approvalResolvers.delete(requestId);
          this.pendingApprovals.delete(requestId);
          reject(new Error('User approval timeout'));
        }
      }, 15 * 60 * 1000);
    });

    try {
      await chrome.action.openPopup();
    } catch {
      // Popup may already be open.
    }

    const result = await approvalPromise;
    return { ...result, requestId };
  }

  storeOperationResult(requestId: string, result: Record<string, unknown>): void {
    this.transactionResults.set(requestId, result);
  }

  private async handleAccountChanged(request: any, sendResponse: (response: any) => void): Promise<void> {
    try {
      const { newAccount } = request;
      if (!newAccount) {
        sendResponse({ success: false, error: 'Missing account information' });
        return;
      }

      const allAccounts = this.walletManager.getAccounts();
      const metaFor = (address: string) => allAccounts.find((a) => a.address === address);

      // A dApp follows the wallet's selected account. If we broadcast the
      // newly-selected account globally, a site that never authorized it would
      // show it as active and then fail every signing request with
      // "Unauthorized". So scope this per origin: if the site has authorized the
      // selected account, expose it; otherwise disconnect the site so it falls
      // back to a Connect button instead of showing an account it can't use.
      const origins = new Set<string>();
      this.connectedTabs.forEach((origin) => origins.add(origin));
      this.permissions.forEach((permission) => origins.add(permission.origin));

      origins.forEach((origin) => {
        if (!this.isAccountAuthorizedForOrigin(newAccount, origin)) {
          this.emitProviderEvent('disconnect', null, origin);
          return;
        }
        const meta = metaFor(newAccount);
        this.emitProviderEvent(
          'change',
          {
            accounts: [
              { address: newAccount, publicKeyHex: meta?.publicKey ?? '', label: meta?.name },
            ],
          },
          origin,
        );
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle account change',
      });
    }
  }

  private async getAutoLockTimeout(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(['autoLockTimeout']);
      return result.autoLockTimeout || (15 * 60 * 1000); // 15 minutes default
    } catch (error) {
      console.error('Background: Error retrieving auto-lock timeout, using default:', error);
      return 15 * 60 * 1000;
    }
  }

  /**
   * Persist the freshly-unlocked session and arm the auto-lock alarm.
   * Called after create/import/unlock.
   */
  private async persistUnlockedSession(): Promise<void> {
    const timeout = await this.getAutoLockTimeout();
    const expiresAt = Date.now() + timeout;
    await this.walletManager.persistSession(expiresAt);
    await chrome.alarms.clear(BackgroundService.LOCK_ALARM_NAME);
    chrome.alarms.create(BackgroundService.LOCK_ALARM_NAME, { when: expiresAt });
    console.log(`Background: Auto-lock armed for ${timeout / 1000 / 60} minutes`);
  }

  /**
   * MV3-safe auto-lock. The service worker can be killed at any time, so we:
   *  - persist the unlocked session (and its deadline) in chrome.storage.session
   *  - use chrome.alarms (which wake the worker) instead of setTimeout
   *  - restore the session on startup if the deadline has not passed
   */
  private setupAutoLock(): void {
    // Activity resets extend the deadline and re-arm the alarm.
    this.resetLockTimer = async () => {
      if (!this.walletManager.isWalletUnlocked()) {
        await chrome.alarms.clear(BackgroundService.LOCK_ALARM_NAME);
        return;
      }
      const timeout = await this.getAutoLockTimeout();
      const expiresAt = Date.now() + timeout;
      await this.walletManager.updateSessionExpiry(expiresAt);
      await chrome.alarms.clear(BackgroundService.LOCK_ALARM_NAME);
      chrome.alarms.create(BackgroundService.LOCK_ALARM_NAME, { when: expiresAt });
    };

    chrome.alarms.onAlarm.addListener(async (alarm) => {
      if (alarm.name !== BackgroundService.LOCK_ALARM_NAME) return;

      // Activity may have extended the deadline after this alarm was scheduled.
      const expiry = await this.walletManager.getSessionExpiry();
      if (expiry && Date.now() < expiry) {
        chrome.alarms.create(BackgroundService.LOCK_ALARM_NAME, { when: expiry });
        return;
      }

      this.walletManager.lockWallet();
      console.log('Background: Wallet auto-locked due to inactivity');
      this.emitProviderEvent('disconnect', null);
    });

    // Reset timer when the toolbar icon is clicked (user activity).
    chrome.action.onClicked.addListener(() => {
      void this.resetLockTimer?.();
    });
  }

  /**
   * Restore any valid unlocked session left behind by a previous worker
   * instance, and re-arm the alarm for the remaining time.
   */
  private async restoreSessionOnStartup(): Promise<void> {
    try {
      const restored = await this.walletManager.restoreSession();
      if (!restored) return;

      const expiry = await this.walletManager.getSessionExpiry();
      if (expiry && Date.now() < expiry) {
        await chrome.alarms.clear(BackgroundService.LOCK_ALARM_NAME);
        chrome.alarms.create(BackgroundService.LOCK_ALARM_NAME, { when: expiry });
        console.log('Background: Restored session, auto-lock re-armed');
      } else {
        this.walletManager.lockWallet();
      }
    } catch (error) {
      console.error('Background: Failed to restore session on startup:', error);
    }
  }
}

// Initialize the background service
new BackgroundService();
