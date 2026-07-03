import { bananojs, withBananoNodeFallback } from './bananoNode';
import {
  createSignInMessageText,
  isSupplyRepresentative,
  maxSupplyFromRepresentative,
  isBurnAccount,
  isFinishSupplyRepresentative,
  finishSupplyHeightFromRepresentative,
  CANONICAL_BURN_ACCOUNT,
  SEND_ALL_NFTS_REPRESENTATIVE,
  KALIUM_DEFAULT_REPRESENTATIVE,
  assessRepresentativeForDelegationChange,
  type BananoBatchLegResult,
  type BananoOperation,
  type BananoSignInInput,
} from '@monkeymask/wallet-standard';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import { Account, StoredWallet } from '../types/wallet';
import { BananoRPC } from './rpc';
import { bnsResolver } from './bns';
import { decryptString, encryptString, isEncryptedPayload, type EncryptedPayload } from './keystore';
import {
  assetRepresentativeAccount,
  metadataRepresentativeFromCidV0,
  supplyRepresentative,
  finishSupplyRepresentative,
} from './nftMint';

export interface MintNFTResult {
  assetRepresentative: string;
  supplyBlockHash: string;
  /** Hashes of the fee sends published after the mint (empty if none). */
  feeHashes?: string[];
}

/**
 * A neutral representative to restore an issuer's account to after minting.
 *
 * The metaprotocol footgun: a `send#mint` sets the account's representative to
 * the metadata rep, and EVERY later block reusing that rep (fees, normal sends)
 * counts as another edition. After minting we always change the rep back to a
 * clean value so ordinary activity never accidentally mints phantom editions.
 */
const CLEAN_REPRESENTATIVE = KALIUM_DEFAULT_REPRESENTATIVE;

interface MintFee {
  to: string;
  amount: string;
  label?: string;
}

/** One state block in a locally-chained publish sequence (see publishStateChain). */
interface EngineLeg {
  /** `send` debits the balance; `change` (rep restore) keeps it. */
  subtype: 'send' | 'change';
  /** Amount to debit, in raw (0 for change). */
  amountRaw: bigint;
  /** Block link: destination public key (send) or zeros (change). */
  link: string;
  /** Representative override for this block (defaults to the account's current rep). */
  representative?: string;
  /** Internal legs (e.g. rep restore) are published but excluded from results. */
  internal?: boolean;
  /** User-facing metadata copied into the per-leg result. */
  report: BananoBatchLegResult;
}

export class WalletManager {
  private static instance: WalletManager;
  private static readonly SESSION_DATA_KEY = 'mm_session_data';
  private static readonly SESSION_EXPIRY_KEY = 'mm_session_expiry';
  private accounts: Account[] = [];
  private isUnlocked = false;
  private currentSeed: string | null = null;
  private currentPasswordHash: string | null = null;
  /** In-memory only (cleared on lock). Used to re-encrypt accounts after add/remove. */
  private currentUnlockPassword: string | null = null;
  private currentSalt: string | null = null;
  private rpc: BananoRPC;
  /** Blocks user rep changes while NFT/metaprotocol state chains publish. */
  private stateChainDepth = 0;

  constructor() {
    this.rpc = new BananoRPC();
  }

  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  /**
   * Generate a new hex seed for Banano (64-character hex string)
   */
  generateSeed(): string {
    // Generate 32 random bytes and convert to hex
    const randomBytes = new Uint8Array(32);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for Node.js environment
      const crypto = require('crypto');
      const buffer = crypto.randomBytes(32);
      return buffer.toString('hex').toUpperCase();
    }
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /**
   * Generate a BIP39 mnemonic for user-friendly backup
   */
  generateMnemonic(): string {
    // 24-word mnemonic representing 256 bits of entropy
    return bip39.generateMnemonic(256);
  }

  /**
   * Convert BIP39 mnemonic to Banano hex seed
   */
  async mnemonicToSeed(mnemonic: string): Promise<string> {
    // Normalize spacing/casing per BIP39 expectations
    const normalized = mnemonic.trim().toLowerCase().split(/\s+/).join(' ');
    if (!bip39.validateMnemonic(normalized)) {
      throw new Error('Invalid mnemonic seed');
    }

    try {
      // For Banano/Nano, seeds are 32-byte hex. When using BIP39 to represent a seed,
      // use the mnemonic's entropy directly, not PBKDF2. This returns 64 hex chars (32 bytes).
      const entropyHex = bip39.mnemonicToEntropy(normalized);
      const result = entropyHex.toUpperCase();
      console.log('WalletManager: Converted mnemonic entropy to hex seed:', result.substring(0, 16) + '...');
      console.log('WalletManager: Hex seed length:', result.length);
      return result;
    } catch (error) {
      console.error('Error converting mnemonic to seed:', error);
      throw new Error('Failed to convert mnemonic to seed');
    }
  }

  /**
   * Create a new wallet from a hex seed or mnemonic
   */
  async createWalletFromSeed(seedInput: string): Promise<Account[]> {
    let hexSeed: string;
    
    // Check if input is a mnemonic (contains spaces) or hex seed
    if (seedInput.includes(' ')) {
      // It's a mnemonic
      hexSeed = await this.mnemonicToSeed(seedInput);
    } else {
      // It's a hex seed - validate format
      if (!/^[0-9A-Fa-f]{64}$/.test(seedInput)) {
        throw new Error('Invalid seed format. Expected 64-character hex string or BIP39 mnemonic.');
      }
      hexSeed = seedInput.toUpperCase();
    }

    const accounts: Account[] = [];
    
    // Generate first account (index 0)
    const account = await this.deriveAccountFromSeed(hexSeed, 0);
    accounts.push(account);

    // Set wallet as unlocked and store accounts
    this.accounts = accounts;
    this.currentSeed = hexSeed;
    this.isUnlocked = true;
    
    console.log('WalletManager: Created wallet with', accounts.length, 'accounts, unlocked:', this.isUnlocked);
    return accounts;
  }

  /**
   * Derive an account from hex seed at specific index
   */
  async deriveAccountFromSeed(hexSeed: string, index: number): Promise<Account> {
    try {
      console.log('WalletManager: Deriving account from seed:', hexSeed.substring(0, 8) + '...', 'index:', index);
      
      // Validate hex seed format
      if (!/^[0-9A-F]{64}$/i.test(hexSeed)) {
        throw new Error(`Invalid hex seed format: ${hexSeed.substring(0, 16)}...`);
      }
      
      // Use bananojs with hex seed - await the promises
      const address = await bananojs.getBananoAccountFromSeed(hexSeed, index);
      console.log('WalletManager: Generated address:', address, 'type:', typeof address);
      
      const privateKey = bananojs.getPrivateKey(hexSeed, index);
      console.log('WalletManager: Generated private key:', privateKey, 'type:', typeof privateKey, 'length:', privateKey?.length);
      
      const publicKey = await bananojs.getPublicKey(privateKey);
      console.log('WalletManager: Generated public key:', publicKey, 'type:', typeof publicKey, 'length:', publicKey?.length);

      return {
        address,
        privateKey,
        publicKey,
        balance: '0',
        name: `Account ${index + 1}`
      };
    } catch (error) {
      console.error('WalletManager: Error deriving account:', error);
      throw error;
    }
  }

  /**
   * Find the next available account index (fills gaps from removed accounts)
   */
  getNextAvailableAccountIndex(): number {
    // Get all existing account indices by parsing the account names
    const existingIndices = new Set<number>();
    
    this.accounts.forEach((account, arrayIndex) => {
      // For the first account, it's always index 0
      if (arrayIndex === 0) {
        existingIndices.add(0);
        return;
      }
      
      // Try to extract index from account name (e.g., "Account 2" -> index 1)
      const match = account.name.match(/Account (\d+)/);
      if (match) {
        const accountNumber = parseInt(match[1]);
        const accountIndex = accountNumber - 1; // Account 1 = index 0, Account 2 = index 1, etc.
        existingIndices.add(accountIndex);
      } else {
        // If we can't parse the name, assume it's the next sequential index
        existingIndices.add(arrayIndex);
      }
    });
    
    // Find the lowest available index starting from 1 (since 0 is always the primary account)
    for (let i = 1; i < 1000; i++) { // Reasonable upper limit
      if (!existingIndices.has(i)) {
        return i;
      }
    }
    
    // Fallback to the next sequential index
    return this.accounts.length;
  }

  /**
   * Sort accounts by their index (Account 1, Account 2, Account 3, etc.)
   */
  private sortAccountsByIndex(): void {
    this.accounts.sort((a, b) => {
      // Extract account numbers from names
      const getAccountNumber = (account: Account): number => {
        const match = account.name.match(/Account (\d+)/);
        return match ? parseInt(match[1]) : 999; // Put accounts without numbers at the end
      };
      
      const aNum = getAccountNumber(a);
      const bNum = getAccountNumber(b);
      
      return aNum - bNum;
    });
  }

  /**
   * Create a new account using the current seed at the specified index
   */
  async createNewAccount(index?: number): Promise<Account> {
    if (!this.isUnlocked || !this.currentSeed) {
      throw new Error('Wallet must be unlocked to create new accounts');
    }

    try {
      // Use provided index or find the next available one
      const accountIndex = index !== undefined ? index : this.getNextAvailableAccountIndex();
      console.log('WalletManager: Creating new account at index:', accountIndex);
      
      // Check if account already exists at this index
      const existingAccount = this.accounts.find(acc => {
        const match = acc.name.match(/Account (\d+)/);
        if (match) {
          const accountNumber = parseInt(match[1]);
          return (accountNumber - 1) === accountIndex;
        }
        return false;
      });
      
      if (existingAccount) {
        throw new Error(`Account at index ${accountIndex} already exists`);
      }
      
      // Derive the new account from the current seed
      const newAccount = await this.deriveAccountFromSeed(this.currentSeed, accountIndex);
      
      // Add to accounts array and sort by account index
      this.accounts.push(newAccount);
      this.sortAccountsByIndex();
      
      // Try to automatically save the updated accounts to storage
      try {
        await this.saveAccountsToStorage();
        console.log('WalletManager: Created and saved new account:', newAccount.address);
      } catch (saveError) {
        console.warn('WalletManager: Failed to auto-save account, but account created in memory:', saveError);
        // Don't throw the error - the account is still created and will be saved on next wallet operation
      }
      
      return newAccount;
    } catch (error) {
      console.error('WalletManager: Error creating new account:', error);
      throw error;
    }
  }

  /**
   * Remove an account by address
   * Note: Cannot remove the first account (index 0) as it's the primary account
   */
  async removeAccount(address: string): Promise<void> {
    if (!this.isUnlocked) {
      throw new Error('Wallet must be unlocked to remove accounts');
    }

    try {
      console.log('WalletManager: Removing account:', address);
      
      // Find the account index
      const accountIndex = this.accounts.findIndex(acc => acc.address === address);
      
      if (accountIndex === -1) {
        throw new Error('Account not found');
      }
      
      // Prevent removing the first account (primary account)
      if (accountIndex === 0) {
        throw new Error('Cannot remove the primary account');
      }
      
      // Remove the account from the array
      const removedAccount = this.accounts.splice(accountIndex, 1)[0];
      
      // Try to automatically save the updated accounts to storage
      try {
        await this.saveAccountsToStorage();
        console.log('WalletManager: Removed and saved account removal:', removedAccount.address);
      } catch (saveError) {
        console.warn('WalletManager: Failed to auto-save after account removal:', saveError);
        // Re-add the account back since save failed
        this.accounts.splice(accountIndex, 0, removedAccount);
        throw new Error('Failed to save account removal');
      }
      
    } catch (error) {
      console.error('WalletManager: Error removing account:', error);
      throw error;
    }
  }

  /**
   * Import wallet from private key
   */
  async importFromPrivateKey(privateKey: string, name: string = 'Imported Account'): Promise<Account> {
    try {
      const publicKey = await bananojs.getPublicKey(privateKey);
      const address = bananojs.getBananoAccount(publicKey);

      return {
        address,
        privateKey,
        publicKey,
        balance: '0',
        name
      };
    } catch (error) {
      throw new Error('Invalid private key');
    }
  }

  /**
   * Encrypt accounts with password (WebCrypto AES-GCM + PBKDF2 600k)
   */
  async encryptAccounts(accounts: Account[], password: string): Promise<{ encryptedData: string; salt: string }> {
    const payload = await encryptString(JSON.stringify(accounts), password);
    return {
      encryptedData: JSON.stringify(payload),
      salt: payload.salt,
    };
  }

  /**
   * Decrypt accounts with password (v2 WebCrypto or legacy CryptoJS)
   */
  async decryptAccounts(encryptedData: string, salt: string, password: string): Promise<Account[]> {
    try {
      const parsed = JSON.parse(encryptedData);
      if (isEncryptedPayload(parsed)) {
        const decrypted = await decryptString(parsed as EncryptedPayload, password);
        return JSON.parse(decrypted) as Account[];
      }
    } catch {
      // Fall through to legacy decryption.
    }

    try {
      const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 10000 });
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, key.toString());
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedData) throw new Error('Invalid password');
      return JSON.parse(decryptedData) as Account[];
    } catch {
      throw new Error('Invalid password or corrupted data');
    }
  }

  /**
   * Save wallet to browser storage
   */
  async saveWallet(accounts: Account[], password: string): Promise<void> {
    const { encryptedData, salt } = await this.encryptAccounts(accounts, password);

    let encryptedSeed = '';
    if (this.currentSeed) {
      const seedPayload = await encryptString(this.currentSeed, password);
      encryptedSeed = JSON.stringify(seedPayload);
    }

    const walletData: StoredWallet = {
      encryptedAccounts: encryptedData,
      encryptedSeed,
      salt,
      isInitialized: true,
      keystoreVersion: 2,
    };

    // Also store account addresses separately for connection purposes (non-sensitive data)
    const accountAddresses = accounts.map(acc => acc.address);

    await chrome.storage.local.set({ 
      wallet: walletData,
      accountAddresses: accountAddresses 
    });
    
    // Keep the wallet unlocked after saving (important for new wallet creation)
    this.accounts = accounts;
    this.currentUnlockPassword = password;
    this.isUnlocked = true;
    console.log('WalletManager: Saved wallet and kept unlocked state');
  }

  /**
   * Save current accounts to storage (used when adding new accounts)
   */
  async saveAccounts(password: string): Promise<void> {
    if (!this.isUnlocked) {
      throw new Error('Wallet must be unlocked to save accounts');
    }

    try {
      console.log('WalletManager: Saving updated accounts...');
      
      // Get the current wallet data to preserve the salt
      const walletData = await this.loadWallet();
      if (!walletData) {
        throw new Error('No wallet data found');
      }

      // Re-encrypt accounts with the same password and salt
      const { encryptedData, salt } = await this.encryptAccounts(this.accounts, password);

      let encryptedSeed = '';
      if (this.currentSeed) {
        encryptedSeed = JSON.stringify(await encryptString(this.currentSeed, password));
      }

      const updatedWalletData: StoredWallet = {
        encryptedAccounts: encryptedData,
        encryptedSeed,
        salt,
        isInitialized: true,
        keystoreVersion: 2,
      };

      // Also store account addresses separately for connection purposes
      const accountAddresses = this.accounts.map(acc => acc.address);

      await chrome.storage.local.set({ 
        wallet: updatedWalletData,
        accountAddresses: accountAddresses 
      });
      
      console.log('WalletManager: Successfully saved updated accounts');
    } catch (error) {
      console.error('WalletManager: Error saving accounts:', error);
      throw error;
    }
  }

  /**
   * Merge any accounts stored in tempAccounts (fallback from saves without a
   * password) into `accounts`, then clear temp storage.
   */
  private async mergeTempAccounts(accounts: Account[]): Promise<Account[]> {
    try {
      const tempResult = await chrome.storage.local.get(['tempAccounts']);
      const tempAccounts = tempResult.tempAccounts?.accounts as Account[] | undefined;
      if (!tempAccounts?.length) return accounts;

      const existingAddresses = new Set(accounts.map((acc) => acc.address));
      const newAccounts = tempAccounts.filter((acc) => !existingAddresses.has(acc.address));
      if (newAccounts.length > 0) {
        accounts.push(...newAccounts);
        console.log('WalletManager: Merged', newAccounts.length, 'temporarily stored accounts');
      }
      await chrome.storage.local.remove(['tempAccounts']);
    } catch (error) {
      console.warn('WalletManager: Error merging temporary accounts:', error);
    }
    return accounts;
  }

  /**
   * Save accounts to storage using stored password hash (for automatic saves)
   */
  private async saveAccountsToStorage(): Promise<void> {
    if (!this.isUnlocked) {
      throw new Error('Wallet must be unlocked to save accounts');
    }

    // Without the unlock password we can only stash accounts temporarily and in
    // the in-memory session (see persistSession). Proper encrypted persistence
    // requires the password from unlock.
    if (!this.currentUnlockPassword) {
      console.warn('WalletManager: No unlock password in memory, using temporary account storage');
      await this.saveAccountsTemporarily();
      await this.refreshPersistedSession();
      return;
    }

    try {
      console.log('WalletManager: Auto-saving accounts to storage...');

      const walletData = await this.loadWallet();
      const { encryptedData, salt } = await this.encryptAccounts(
        this.accounts,
        this.currentUnlockPassword,
      );

      let encryptedSeed = walletData?.encryptedSeed ?? '';
      if (this.currentSeed) {
        encryptedSeed = JSON.stringify(
          await encryptString(this.currentSeed, this.currentUnlockPassword),
        );
      }

      const updatedWalletData: StoredWallet = {
        encryptedAccounts: encryptedData,
        encryptedSeed,
        salt: walletData?.salt ?? salt,
        isInitialized: true,
        keystoreVersion: 2,
      };

      const accountAddresses = this.accounts.map((acc) => acc.address);

      await chrome.storage.local.set({
        wallet: updatedWalletData,
        accountAddresses,
      });

      await this.refreshPersistedSession();
      console.log('WalletManager: Successfully auto-saved accounts to storage');
    } catch (error) {
      console.error('WalletManager: Error auto-saving accounts:', error);
      throw error;
    }
  }

  /**
   * Temporarily store accounts in memory-based storage (fallback when credentials not available)
   */
  private async saveAccountsTemporarily(): Promise<void> {
    try {
      console.log('WalletManager: Temporarily storing accounts...');
      
      // Store accounts in a temporary location that will be merged on next unlock
      const tempAccountsData = {
        accounts: this.accounts,
        timestamp: Date.now()
      };
      
      // Also update accountAddresses so getStoredAccounts() can find new accounts when wallet is locked
      const accountAddresses = this.accounts.map(acc => acc.address);
      
      await chrome.storage.local.set({ 
        tempAccounts: tempAccountsData,
        accountAddresses: accountAddresses 
      });
      console.log('WalletManager: Accounts and addresses stored temporarily');
    } catch (error) {
      console.error('WalletManager: Error storing accounts temporarily:', error);
      throw error;
    }
  }

  /**
   * Load wallet from browser storage
   */
  async loadWallet(): Promise<StoredWallet | null> {
    const result = await chrome.storage.local.get(['wallet']);
    return result.wallet || null;
  }

  /**
   * Unlock wallet with password
   */
  async unlockWallet(password: string): Promise<Account[]> {
    const walletData = await this.loadWallet();
    if (!walletData) {
      throw new Error('No wallet found');
    }

    const accounts = await this.decryptAccounts(
      walletData.encryptedAccounts,
      walletData.salt,
      password
    );

    this.currentSalt = walletData.salt;

    if (walletData.encryptedSeed) {
      try {
        const parsedSeed = JSON.parse(walletData.encryptedSeed);
        if (isEncryptedPayload(parsedSeed)) {
          this.currentSeed = await decryptString(parsedSeed as EncryptedPayload, password);
        } else {
          const key = CryptoJS.PBKDF2(password, walletData.salt, { keySize: 256 / 32, iterations: 10000 });
          this.currentSeed = CryptoJS.AES.decrypt(walletData.encryptedSeed, key.toString()).toString(
            CryptoJS.enc.Utf8,
          );
        }
      } catch (error) {
        console.warn('WalletManager: Failed to decrypt seed:', error);
      }
    }

    // Check for temporarily stored accounts and merge them
    await this.mergeTempAccounts(accounts);

    this.accounts = accounts;
    this.currentUnlockPassword = password;
    this.isUnlocked = true;
    return accounts;
  }

  /**
   * Lock wallet
   */
  lockWallet(): void {
    this.accounts = [];
    this.currentSeed = null;
    this.currentPasswordHash = null;
    this.currentUnlockPassword = null;
    this.currentSalt = null;
    this.isUnlocked = false;
    // Clear the in-memory session so a restarted service worker stays locked.
    void this.clearSession();
  }

  /**
   * Refresh the in-memory session snapshot after accounts change (add/remove).
   * Keeps chrome.storage.session in sync so MV3 service-worker restarts don't
   * restore a stale single-account list.
   */
  async refreshPersistedSession(): Promise<void> {
    if (!this.isUnlocked) return;
    const expiry = await this.getSessionExpiry();
    if (expiry && Date.now() < expiry) {
      await this.persistSession(expiry);
    }
  }

  /**
   * Persist the unlocked session to chrome.storage.session so that the wallet
   * survives MV3 service-worker restarts until the auto-lock deadline.
   *
   * chrome.storage.session is in-memory only (never written to disk), cleared on
   * browser close, and only readable by trusted extension contexts — the same
   * security posture as holding the seed in service-worker memory.
   */
  async persistSession(expiresAt: number): Promise<void> {
    if (!this.isUnlocked || !this.currentSeed) return;
    try {
      await chrome.storage.session.set({
        [WalletManager.SESSION_DATA_KEY]: {
          seed: this.currentSeed,
          accounts: this.accounts,
          salt: this.currentSalt,
        },
        [WalletManager.SESSION_EXPIRY_KEY]: expiresAt,
      });
    } catch (error) {
      console.warn('WalletManager: Failed to persist session:', error);
    }
  }

  /**
   * Update only the auto-lock deadline for the current session (activity reset).
   */
  async updateSessionExpiry(expiresAt: number): Promise<void> {
    if (!this.isUnlocked) return;
    try {
      await chrome.storage.session.set({ [WalletManager.SESSION_EXPIRY_KEY]: expiresAt });
    } catch (error) {
      console.warn('WalletManager: Failed to update session expiry:', error);
    }
  }

  /**
   * Restore an unlocked session after a service-worker restart, if one exists
   * and has not passed its auto-lock deadline.
   */
  async restoreSession(): Promise<boolean> {
    try {
      const result = await chrome.storage.session.get([
        WalletManager.SESSION_DATA_KEY,
        WalletManager.SESSION_EXPIRY_KEY,
      ]);
      const data = result[WalletManager.SESSION_DATA_KEY] as
        | { seed: string; accounts: Account[]; salt: string | null }
        | undefined;
      const expiry = result[WalletManager.SESSION_EXPIRY_KEY] as number | undefined;

      if (!data || typeof expiry !== 'number') return false;
      if (Date.now() >= expiry) {
        await this.clearSession();
        return false;
      }

      this.currentSeed = data.seed;
      this.accounts = data.accounts ?? [];
      this.currentSalt = data.salt ?? null;
      this.isUnlocked = true;

      // Merge any temp accounts saved while the worker was down, then refresh session.
      this.accounts = await this.mergeTempAccounts(this.accounts);
      await this.refreshPersistedSession();

      console.log('WalletManager: Restored unlocked session from storage');
      return true;
    } catch (error) {
      console.warn('WalletManager: Failed to restore session:', error);
      return false;
    }
  }

  /**
   * Read the current session auto-lock deadline (ms epoch), if any.
   */
  async getSessionExpiry(): Promise<number | null> {
    try {
      const result = await chrome.storage.session.get([WalletManager.SESSION_EXPIRY_KEY]);
      const expiry = result[WalletManager.SESSION_EXPIRY_KEY];
      return typeof expiry === 'number' ? expiry : null;
    } catch {
      return null;
    }
  }

  /**
   * Remove the persisted session.
   */
  async clearSession(): Promise<void> {
    try {
      await chrome.storage.session.remove([
        WalletManager.SESSION_DATA_KEY,
        WalletManager.SESSION_EXPIRY_KEY,
      ]);
    } catch (error) {
      console.warn('WalletManager: Failed to clear session:', error);
    }
  }

  /**
   * Check if wallet is initialized
   */
  async isWalletInitialized(): Promise<boolean> {
    const walletData = await this.loadWallet();
    return walletData?.isInitialized || false;
  }

  /**
   * Get current accounts
   */
  getAccounts(): Account[] {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    return this.accounts;
  }

  /**
   * Get stored account addresses without unlocking (for connection purposes)
   */
  async getStoredAccounts(): Promise<Account[]> {
    const walletData = await this.loadWallet();
    if (!walletData || !walletData.isInitialized) {
      return [];
    }

    try {
      // We need to decrypt just enough to get addresses, but not private keys
      // For now, let's store addresses separately in a non-sensitive way
      // This is a simplified approach - in production you might want to derive addresses from public keys
      const result = await chrome.storage.local.get(['accountAddresses']);
      const storedAddresses = result.accountAddresses || [];
      
      // Return basic account objects with just addresses (no sensitive data)
      return storedAddresses.map((address: string, index: number) => ({
        address,
        privateKey: '', // Empty for security
        publicKey: '', // Empty for security  
        balance: '0',
        name: `Account ${index + 1}`
      }));
    } catch (error) {
      console.error('Failed to get stored accounts:', error);
      return [];
    }
  }

  /**
   * Check if wallet is unlocked
   */
  isWalletUnlocked(): boolean {
    return this.isUnlocked;
  }

  /** True when the in-memory seed is available (required for receive / send). */
  hasSeed(): boolean {
    return Boolean(this.currentSeed);
  }

  /**
   * Sign a Banano block with the account's private key
   */
  async signBlock(block: any, accountAddress: string): Promise<any> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    // Find the account that matches the address
    const account = this.accounts.find(acc => acc.address === accountAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }

    try {
      console.log('WalletManager: Signing block for account:', accountAddress);
      
      // Use BananoUtil to sign the block structure
      const signature = await bananojs.getSignature(account.privateKey, block);
      
      // Add work (proof of work). For now, use zeroed work bytes placeholder.
      // Consider integrating a remote work server for production.
      const work = '0000000000000000';
      
      const signedBlock = {
        ...block,
        signature,
        work
      };
      
      console.log('WalletManager: Block signed successfully');
      return signedBlock;
    } catch (error) {
      console.error('WalletManager: Error signing block:', error);
      throw new Error('Failed to sign block: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Resolve a recipient to a ban_ address (supports BNS names like user.ban).
   */
  private async resolveRecipientAddress(toAddress: string): Promise<string> {
    const trimmed = toAddress.trim();
    if (trimmed.startsWith('ban_')) {
      return trimmed;
    }
    if (bnsResolver.isBNSName(trimmed)) {
      return bnsResolver.resolveBNS(trimmed);
    }
    throw new Error(`Invalid recipient "${trimmed}". Use a ban_ address or BNS name (e.g. username.ban).`);
  }

  /**
   * Send Banano using bananojs
   */
  async sendBanano(fromAddress: string, toAddress: string, amount: string): Promise<string> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    if (!this.currentSeed) {
      throw new Error('Seed not available for sending');
    }

    const account = this.accounts.find(acc => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }

    try {
      const resolvedTo = await this.resolveRecipientAddress(toAddress);
      console.log('WalletManager: Sending', amount, 'BAN from', fromAddress, 'to', resolvedTo);
      
      // Get the account index for seed derivation
      const accountIndex = this.accounts.indexOf(account);
      
      // Use bananojs to send the withdrawal
      const result = await bananojs.sendBananoWithdrawalFromSeed(
        this.currentSeed,
        accountIndex,
        resolvedTo,
        amount,
      );
      
      console.log('WalletManager: Send result:', result);

      const transactionHash =
        typeof result === 'string'
          ? result
          : typeof result?.hash === 'string'
            ? result.hash
            : null;
      if (!transactionHash) {
        throw new Error('Invalid send result: missing transaction hash');
      }
      
      // Update the account balance locally (subtract sent amount)
      const currentBalance = parseFloat(account.balance) || 0;
      const sentAmount = parseFloat(amount) || 0;
      const newBalance = Math.max(0, currentBalance - sentAmount);
      account.balance = newBalance.toString();
      
      console.log('WalletManager: Updated local balance from', currentBalance, 'to', newBalance);
      
      // Return the transaction hash
      return transactionHash;
      
    } catch (error) {
      console.error('WalletManager: Error sending Banano:', error);
      throw error;
    }
  }

  /**
   * Mint a Banano NFT (73-meta-tokens) and send it to a recipient.
   *
   * Publishes two consecutive blocks on the issuer's chain:
   *   1. `change#supply` — representative encodes protocol header + version + max supply.
   *   2. `send#mint`     — representative = metadata_representative (IPFS CID);
   *                        `previous` is pinned to the supply block hash so the
   *                        mint provably immediately follows the supply block.
   *
   * The `send#mint` block hash is the NFT's asset representative. The recipient
   * takes ownership by receiving the send (a normal Banano receive).
   */
  async mintNFT(
    fromAddress: string,
    params: {
      metadataCid: string;
      to: string;
      amount?: string;
      maxSupply?: number;
      fees?: MintFee[];
    },
  ): Promise<MintNFTResult> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for minting');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }

    const supplyRep = supplyRepresentative(params.maxSupply ?? 1);
    const metadataRep = metadataRepresentativeFromCidV0(params.metadataCid);
    const resolvedTo = await this.resolveRecipientAddress(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';
    const accountIndex = this.accounts.indexOf(account);

    // Capture a clean rep to restore after minting (see CLEAN_REPRESENTATIVE).
    let baseRep: string | undefined;
    try {
      baseRep = await bananojs.bananodeApi.getAccountRepresentative(fromAddress);
    } catch {
      /* fall back to the neutral rep below */
    }
    const cleanRep =
      baseRep && !isSupplyRepresentative(baseRep) && baseRep !== metadataRep
        ? baseRep
        : CLEAN_REPRESENTATIVE;

    // Resolve + validate fees up front so we never mint if the balance can't
    // also cover every fee — a failed fee should never happen after a mint, and
    // a short balance must fail before anything is published.
    const fees = params.fees ?? [];
    const resolvedFees: { to: string; amount: string; raw: number }[] = [];
    let feeTotal = 0;
    for (const fee of fees) {
      const feeAmount = parseFloat(fee.amount);
      if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error(`Invalid fee amount: ${fee.amount}`);
      }
      const feeTo = await this.resolveRecipientAddress(fee.to);
      resolvedFees.push({ to: feeTo, amount: fee.amount, raw: feeAmount });
      feeTotal += feeAmount;
    }
    const mintAmount = parseFloat(amount) || 0;
    const availableBalance = parseFloat(account.balance) || 0;
    if (mintAmount + feeTotal > availableBalance) {
      throw new Error(
        `Insufficient balance: need ${(mintAmount + feeTotal).toString()} BAN ` +
          `(mint + fees) but only ${availableBalance.toString()} BAN available`,
      );
    }

    // 1. change#supply — establishes the collection on the issuer's chain.
    const supplyResult = await bananojs.changeBananoRepresentativeForSeed(
      this.currentSeed,
      accountIndex,
      supplyRep,
    );
    const supplyBlockHash =
      typeof supplyResult === 'string'
        ? supplyResult
        : typeof (supplyResult as { hash?: string })?.hash === 'string'
          ? (supplyResult as { hash: string }).hash
          : null;
    if (!supplyBlockHash) {
      throw new Error('Failed to publish supply block: missing hash');
    }

    // 2. send#mint — pin `previous` to the supply hash so the mint immediately
    //    follows the supply block, and set the representative to the metadata CID.
    const mintResult = await bananojs.sendBananoWithdrawalFromSeed(
      this.currentSeed,
      accountIndex,
      resolvedTo,
      amount,
      metadataRep,
      supplyBlockHash,
    );
    const assetRepresentative =
      typeof mintResult === 'string'
        ? mintResult
        : typeof (mintResult as { hash?: string })?.hash === 'string'
          ? (mintResult as { hash: string }).hash
          : null;
    if (!assetRepresentative) {
      throw new Error('Failed to publish mint block: missing hash');
    }

    const currentBalance = parseFloat(account.balance) || 0;
    const sentAmount = parseFloat(amount) || 0;
    account.balance = Math.max(0, currentBalance - sentAmount).toString();

    // 3. Restore a clean representative so the fees (and any later normal send)
    //    don't inherit the metadata rep and mint phantom editions.
    try {
      await bananojs.changeBananoRepresentativeForSeed(this.currentSeed, accountIndex, cleanRep);
    } catch (error) {
      console.warn('WalletManager: failed to restore representative after mint:', error);
    }

    // 4. Fees — plain sends published only after a successful mint.
    const feeHashes: string[] = [];
    for (const fee of resolvedFees) {
      const feeResult = await bananojs.sendBananoWithdrawalFromSeed(
        this.currentSeed,
        accountIndex,
        fee.to,
        fee.amount,
      );
      const feeHash =
        typeof feeResult === 'string'
          ? feeResult
          : typeof (feeResult as { hash?: string })?.hash === 'string'
            ? (feeResult as { hash: string }).hash
            : null;
      if (feeHash) {
        feeHashes.push(feeHash);
        account.balance = Math.max(0, (parseFloat(account.balance) || 0) - fee.raw).toString();
      }
    }

    return { assetRepresentative, supplyBlockHash, feeHashes };
  }

  /**
   * Look up an existing collection this account issued by its metadata CID, and
   * report the max supply plus how many editions have already been minted.
   *
   * An edition is a self-delimiting `change#supply` → `send#mint` pair (the mint
   * reuses `metadata_representative`). Counting whole pairs — never bare sends —
   * is what keeps ordinary payments from being miscounted as phantom editions.
   */
  private async collectionEditionStats(
    issuer: string,
    metadataRepAccount: string,
  ): Promise<{
    maxSupply: number;
    minted: number;
    supplyHeights: number[];
    finished: boolean;
  } | null> {
    let history: Array<{ height: string; subtype?: string; representative?: string }>;
    try {
      const result = await bananojs.getAccountHistory(issuer, -1, undefined, true);
      history = Array.isArray(result?.history) ? result.history : [];
    } catch {
      return null;
    }
    history.sort((a, b) => Number(a.height) - Number(b.height));

    const byHeight = new Map<number, { subtype?: string; representative?: string }>();
    for (const b of history) byHeight.set(Number(b.height), b);

    let maxSupply: number | null = null;
    let minted = 0;
    const supplyHeights: number[] = [];
    for (const entry of history) {
      if (entry.subtype !== 'change' || !entry.representative) continue;
      if (!isSupplyRepresentative(entry.representative)) continue;

      const mint = byHeight.get(Number(entry.height) + 1);
      if (!mint || mint.subtype !== 'send') continue;
      if (mint.representative !== metadataRepAccount) continue;

      // Each qualifying pair is one edition of this collection.
      if (maxSupply === null) maxSupply = maxSupplyFromRepresentative(entry.representative);
      minted += 1;
      supplyHeights.push(Number(entry.height));
    }
    if (maxSupply === null) return null;

    // The collection is locked if any `#finish_supply` block points at one of
    // its supply-block heights.
    const supplySet = new Set(supplyHeights);
    const finished = history.some(
      (b) =>
        !!b.representative &&
        isFinishSupplyRepresentative(b.representative) &&
        supplySet.has(finishSupplyHeightFromRepresentative(b.representative)),
    );

    return { maxSupply, minted, supplyHeights, finished };
  }

  /**
   * Mint an additional edition of an existing collection (one this account
   * issued with maxSupply > 1 or unlimited). Publishes a fresh `change#supply` →
   * `send#mint` pair (reusing the collection's metadata_representative); the mint
   * block's hash is the new edition's asset representative. Minting whole pairs
   * keeps ordinary sends from ever being miscounted as editions. Rejects if the
   * edition limit is reached.
   */
  async mintEdition(
    fromAddress: string,
    params: { metadataCid: string; to: string; amount?: string; fees?: MintFee[] },
  ): Promise<MintNFTResult> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for minting');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }
    const accountIndex = this.accounts.indexOf(account);

    const metadataRep = metadataRepresentativeFromCidV0(params.metadataCid);
    const resolvedTo = await this.resolveRecipientAddress(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';

    // Pocket any pending first. Editions minted to self return the send as a
    // receivable; without claiming it the locally-tracked balance drifts down
    // until mints start failing with "Insufficient balance". Claiming also
    // guarantees a clean frontier before we publish.
    try {
      await this.autoReceivePending(fromAddress);
    } catch (error) {
      console.warn('WalletManager: auto-receive before edition mint failed (continuing):', error);
    }

    // Verify the collection exists on this issuer and has room for another copy.
    const stats = await this.collectionEditionStats(fromAddress, metadataRep);
    if (!stats) {
      throw new Error(
        'Collection not found for this account — you can only mint editions of a collection you issued',
      );
    }
    if (stats.finished) {
      throw new Error('Collection is finished — no further editions can be minted');
    }
    if (stats.maxSupply > 0 && stats.minted >= stats.maxSupply) {
      throw new Error(
        `Edition limit reached: ${stats.minted}/${stats.maxSupply} already minted`,
      );
    }

    // Resolve + validate fees up front (same guarantees as mintNFT).
    const fees = params.fees ?? [];
    const resolvedFees: { to: string; amount: string; raw: number }[] = [];
    let feeTotal = 0;
    for (const fee of fees) {
      const feeAmount = parseFloat(fee.amount);
      if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error(`Invalid fee amount: ${fee.amount}`);
      }
      const feeTo = await this.resolveRecipientAddress(fee.to);
      resolvedFees.push({ to: feeTo, amount: fee.amount, raw: feeAmount });
      feeTotal += feeAmount;
    }
    const mintAmount = parseFloat(amount) || 0;

    // Read the confirmed balance straight from the node (raw) so the check is
    // never fooled by a stale cached figure after a self-mint loop.
    let availableBalance = parseFloat(account.balance) || 0;
    try {
      const info = await bananojs.BananodeApi.getAccountInfo(fromAddress, true);
      if (info && !info.error && info.balance !== undefined) {
        availableBalance = parseFloat(
          bananojs.getBananoPartsAsDecimal(bananojs.getBananoPartsFromRaw(String(info.balance))),
        );
        account.balance = availableBalance.toString();
      }
    } catch {
      /* fall back to the cached balance */
    }
    if (mintAmount + feeTotal > availableBalance) {
      throw new Error(
        `Insufficient balance: need ${(mintAmount + feeTotal).toString()} BAN ` +
          `(mint + fees) but only ${availableBalance.toString()} BAN available`,
      );
    }

    // Restore a clean rep after minting so fees / future sends don't inherit the
    // metadata rep and mint phantom editions.
    let baseRep: string | undefined;
    try {
      baseRep = await bananojs.bananodeApi.getAccountRepresentative(fromAddress);
    } catch {
      /* fall back to the neutral rep below */
    }
    const cleanRep =
      baseRep && !isSupplyRepresentative(baseRep) && baseRep !== metadataRep
        ? baseRep
        : CLEAN_REPRESENTATIVE;

    // Publish the edition as its own self-delimiting change#supply → send#mint
    // pair (same shape as the first mint). This is what makes an edition a real
    // mint the crawler counts — and, crucially, makes it impossible for an
    // ordinary send to ever be miscounted as an edition, since a mint always
    // requires a preceding supply block.
    const supplyRep = supplyRepresentative(stats.maxSupply);
    const supplyResult = await bananojs.changeBananoRepresentativeForSeed(
      this.currentSeed,
      accountIndex,
      supplyRep,
    );
    const supplyBlockHash =
      typeof supplyResult === 'string'
        ? supplyResult
        : typeof (supplyResult as { hash?: string })?.hash === 'string'
          ? (supplyResult as { hash: string }).hash
          : null;
    if (!supplyBlockHash) {
      throw new Error('Failed to publish edition supply block: missing hash');
    }

    const mintResult = await bananojs.sendBananoWithdrawalFromSeed(
      this.currentSeed,
      accountIndex,
      resolvedTo,
      amount,
      metadataRep,
      supplyBlockHash,
    );
    const assetRepresentative =
      typeof mintResult === 'string'
        ? mintResult
        : typeof (mintResult as { hash?: string })?.hash === 'string'
          ? (mintResult as { hash: string }).hash
          : null;
    if (!assetRepresentative) {
      throw new Error('Failed to publish edition mint block: missing hash');
    }

    account.balance = Math.max(0, availableBalance - mintAmount).toString();

    try {
      await bananojs.changeBananoRepresentativeForSeed(this.currentSeed, accountIndex, cleanRep);
    } catch (error) {
      console.warn('WalletManager: failed to restore representative after edition mint:', error);
    }

    const feeHashes: string[] = [];
    for (const fee of resolvedFees) {
      const feeResult = await bananojs.sendBananoWithdrawalFromSeed(
        this.currentSeed,
        accountIndex,
        fee.to,
        fee.amount,
      );
      const feeHash =
        typeof feeResult === 'string'
          ? feeResult
          : typeof (feeResult as { hash?: string })?.hash === 'string'
            ? (feeResult as { hash: string }).hash
            : null;
      if (feeHash) {
        feeHashes.push(feeHash);
        account.balance = Math.max(0, (parseFloat(account.balance) || 0) - fee.raw).toString();
      }
    }

    return { assetRepresentative, supplyBlockHash, feeHashes };
  }

  /**
   * Transfer an owned Banano NFT (73-meta-tokens) to another account.
   *
   * Publishes a `send#asset` block: a normal send whose `representative` is the
   * asset representative (the mint block hash encoded as an account). Indexers
   * follow that representative to move ownership to the recipient.
   *
   * The asset must be held (received) by the sender first, so any pending
   * balance is pocketed before the send is published.
   *
   * @param assetRepresentative The NFT's asset representative — its mint block hash (64 hex).
   */
  async transferNFT(
    fromAddress: string,
    params: { assetRepresentative: string; to: string; amount?: string },
  ): Promise<string> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for transfer');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }

    const assetRep = assetRepresentativeAccount(params.assetRepresentative);
    const resolvedTo = await this.resolveRecipientAddress(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';
    const accountIndex = this.accounts.indexOf(account);

    // The asset must be pocketed before it can be sent onward.
    try {
      await this.autoReceivePending(fromAddress);
    } catch (error) {
      console.warn('WalletManager: auto-receive before transfer failed (continuing):', error);
    }

    const result = await bananojs.sendBananoWithdrawalFromSeed(
      this.currentSeed,
      accountIndex,
      resolvedTo,
      amount,
      assetRep,
    );
    const hash =
      typeof result === 'string'
        ? result
        : typeof (result as { hash?: string })?.hash === 'string'
          ? (result as { hash: string }).hash
          : null;
    if (!hash) {
      throw new Error('Failed to publish transfer block: missing hash');
    }

    const currentBalance = parseFloat(account.balance) || 0;
    const sentAmount = parseFloat(amount) || 0;
    account.balance = Math.max(0, currentBalance - sentAmount).toString();

    return hash;
  }

  /**
   * Permanently destroy an owned NFT by publishing a `send#burn` — a `send#asset`
   * to a canonical burn account (73-meta-tokens spec). Irreversible: the burn
   * address has no recoverable key, so the asset can never move again. Defaults
   * to the canonical burn account; any override must be a recognized burn
   * account or the send would just be an ordinary transfer.
   */
  async burnNFT(
    fromAddress: string,
    params: { assetRepresentative: string; to?: string; amount?: string },
  ): Promise<string> {
    const to = params.to ?? CANONICAL_BURN_ACCOUNT;
    if (!isBurnAccount(to)) {
      throw new Error('Burn target must be a recognized burn account');
    }
    return this.transferNFT(fromAddress, {
      assetRepresentative: params.assetRepresentative,
      to,
      amount: params.amount,
    });
  }

  /**
   * Lock a collection you issued (73-meta-tokens `#finish_supply`): publish a
   * change block whose representative encodes the collection's supply-block
   * height. Afterwards `mintEdition` for this collection is refused. Returns the
   * finish block hash.
   */
  async finishCollection(
    fromAddress: string,
    params: { metadataCid: string },
  ): Promise<string> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    if (!this.currentSeed) throw new Error('Seed not available');
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) throw new Error('Account not found');
    const accountIndex = this.accounts.indexOf(account);

    const metadataRep = metadataRepresentativeFromCidV0(params.metadataCid);
    const stats = await this.collectionEditionStats(fromAddress, metadataRep);
    if (!stats || stats.supplyHeights.length === 0) {
      throw new Error('Collection not found for this account');
    }
    if (stats.finished) {
      throw new Error('Collection is already finished');
    }

    // Reference the collection's latest supply block; our edition guard refuses
    // new mints once any finish block points at one of the collection's supplies.
    const targetHeight = Math.max(...stats.supplyHeights);
    const finishRep = finishSupplyRepresentative(targetHeight);

    // Capture a clean rep to restore afterwards (a finish rep left on the chain
    // is harmless — change blocks with it are ignored — but keep the account tidy).
    let baseRep: string | undefined;
    try {
      baseRep = await bananojs.bananodeApi.getAccountRepresentative(fromAddress);
    } catch {
      /* fall back below */
    }
    const cleanRep =
      baseRep && !isSupplyRepresentative(baseRep) && !isFinishSupplyRepresentative(baseRep)
        ? baseRep
        : CLEAN_REPRESENTATIVE;

    const result = await bananojs.changeBananoRepresentativeForSeed(
      this.currentSeed,
      accountIndex,
      finishRep,
    );
    const hash =
      typeof result === 'string'
        ? result
        : typeof (result as { hash?: string })?.hash === 'string'
          ? (result as { hash: string }).hash
          : null;
    if (!hash) throw new Error('Failed to publish finish block: missing hash');

    try {
      await bananojs.changeBananoRepresentativeForSeed(this.currentSeed, accountIndex, cleanRep);
    } catch (error) {
      console.warn('WalletManager: failed to restore representative after finish:', error);
    }
    return hash;
  }

  /**
   * Transfer every NFT the account holds to one recipient in a single block
   * (73-meta-tokens `send#all_nfts`). Pockets pending assets first, publishes one
   * send whose representative is the "send all NFTs" marker, then restores a
   * clean representative so subsequent ordinary sends aren't treated as send-all.
   * Returns the marker send hash.
   */
  async sendAllNfts(
    fromAddress: string,
    params: { to: string; amount?: string },
  ): Promise<string> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    if (!this.currentSeed) throw new Error('Seed not available');
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) throw new Error('Account not found');
    const accountIndex = this.accounts.indexOf(account);

    const resolvedTo = await this.resolveRecipientAddress(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';

    // Pocket pending assets so they're owned (and therefore transferable) before
    // the marker send moves everything.
    try {
      await this.autoReceivePending(fromAddress);
    } catch (error) {
      console.warn('WalletManager: auto-receive before send-all failed (continuing):', error);
    }

    let baseRep: string | undefined;
    try {
      baseRep = await bananojs.bananodeApi.getAccountRepresentative(fromAddress);
    } catch {
      /* fall back below */
    }
    const cleanRep =
      baseRep && baseRep !== SEND_ALL_NFTS_REPRESENTATIVE ? baseRep : CLEAN_REPRESENTATIVE;

    const result = await bananojs.sendBananoWithdrawalFromSeed(
      this.currentSeed,
      accountIndex,
      resolvedTo,
      amount,
      SEND_ALL_NFTS_REPRESENTATIVE,
    );
    const hash =
      typeof result === 'string'
        ? result
        : typeof (result as { hash?: string })?.hash === 'string'
          ? (result as { hash: string }).hash
          : null;
    if (!hash) throw new Error('Failed to publish send-all block: missing hash');

    account.balance = Math.max(0, (parseFloat(account.balance) || 0) - (parseFloat(amount) || 0)).toString();

    // Critical: restore a clean rep so the NEXT ordinary send isn't itself
    // interpreted as another send#all_nfts.
    try {
      await bananojs.changeBananoRepresentativeForSeed(this.currentSeed, accountIndex, cleanRep);
    } catch (error) {
      console.warn('WalletManager: failed to restore representative after send-all:', error);
    }
    return hash;
  }

  /**
   * Sweep an account: claim any pending, then send the entire confirmed balance
   * (in raw, so no dust is left) to one recipient. Returns the send hash and the
   * BAN amount swept.
   */
  async sweep(fromAddress: string, to: string): Promise<{ hash: string; amount: string }> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for sweep');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }
    const accountIndex = this.accounts.indexOf(account);
    const resolvedTo = await this.resolveRecipientAddress(to);

    // Pocket pending so the full balance is spendable.
    try {
      await this.autoReceivePending(fromAddress);
    } catch (error) {
      console.warn('WalletManager: auto-receive before sweep failed (continuing):', error);
    }

    const info = await bananojs.BananodeApi.getAccountInfo(fromAddress, true);
    if (!info || info.error || info.balance === undefined) {
      throw new Error(`Unable to load balance for sweep: ${info?.error ?? 'no data'}`);
    }
    const balanceRaw = BigInt(info.balance);
    if (balanceRaw <= 0n) {
      throw new Error('Nothing to sweep: balance is zero');
    }

    const amount = bananojs.getBananoPartsAsDecimal(
      bananojs.getBananoPartsFromRaw(balanceRaw.toString(10)),
    );
    const result = await bananojs.sendBananoWithdrawalFromSeed(
      this.currentSeed,
      accountIndex,
      resolvedTo,
      amount,
    );
    const hash =
      typeof result === 'string'
        ? result
        : typeof (result as { hash?: string })?.hash === 'string'
          ? (result as { hash: string }).hash
          : null;
    if (!hash) {
      throw new Error('Failed to publish sweep block: missing hash');
    }

    account.balance = '0';
    return { hash, amount };
  }

  /**
   * Publish a chain of state blocks from one account in a single pass.
   *
   * This is the executor behind multi-send / airdrop and multi-NFT transfer. It
   * embraces how Banano's block-lattice actually works:
   *  - Fetches account_info ONCE, then tracks the frontier + balance locally,
   *    building each block off the previous one's (locally computed) hash. This
   *    avoids the per-block `account_info` round-trip and the frontier race that
   *    a naive loop hits when the node's view lags a just-published block.
   *  - Pipelines proof-of-work: the block hash is computed locally (blake2b), so
   *    work for block N+1 is requested *while* block N is being broadcast.
   *  - Runs best-effort: a leg that fails to publish is recorded and skipped
   *    (the chain continues from the last good frontier), so one bad recipient
   *    doesn't sink the whole airdrop. Per-leg results are returned.
   *
   * @returns the published hashes (in order) and a per-leg result list.
   */
  private async publishStateChain(
    account: Account,
    legs: EngineLeg[],
    opts?: { minBalanceRaw?: bigint; restoreRepresentative?: boolean },
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    this.stateChainDepth += 1;
    try {
    const info = await bananojs.BananodeApi.getAccountInfo(account.address, true);
    if (!info || info.error || !info.frontier || info.balance === undefined) {
      throw new Error(
        `Unable to load account frontier (account may be unopened): ${info?.error ?? 'no data'}`,
      );
    }

    let frontier: string = info.frontier;
    let balance = BigInt(info.balance);
    const baseRep: string =
      info.representative || (await bananojs.bananodeApi.getAccountRepresentative(account.address));
    let lastRep = baseRep;

    if (opts?.minBalanceRaw !== undefined && balance < opts.minBalanceRaw) {
      throw new Error(
        `Insufficient balance: need ${opts.minBalanceRaw.toString()} raw but only ${balance.toString()} raw available`,
      );
    }

    const safeWork = (hash: string): Promise<string | null> =>
      bananojs.bananodeApi.getGeneratedWork(hash).catch(() => null);

    const hashes: string[] = [];
    const results: BananoBatchLegResult[] = [];
    let workPromise = safeWork(frontier);

    for (const leg of legs) {
      const newBalance = leg.subtype === 'send' ? balance - leg.amountRaw : balance;
      if (newBalance < 0n) {
        if (!leg.internal) results.push({ ...leg.report, error: 'Insufficient balance' });
        continue;
      }

      const representative = leg.representative ?? baseRep;
      let work = await workPromise;
      try {
        if (!work) work = await bananojs.bananodeApi.getGeneratedWork(frontier);

        const block: Record<string, unknown> = {
          type: 'state',
          account: account.address,
          previous: frontier,
          representative,
          balance: newBalance.toString(10),
          link: leg.link,
          work,
        };
        block.signature = await bananojs.getSignature(account.privateKey, block);

        // Hash is deterministic from the block, so we can start the next block's
        // work now, overlapping it with this block's broadcast round-trip.
        const localHash: string = bananojs.BananoUtil.hash(block);
        const nextWorkPromise = safeWork(localHash);

        const processedHash: string = await bananojs.bananodeApi.process(block, leg.subtype);
        const finalHash = processedHash || localHash;

        frontier = finalHash;
        balance = newBalance;
        lastRep = representative;
        workPromise = nextWorkPromise;

        hashes.push(finalHash);
        if (!leg.internal) results.push({ ...leg.report, hash: finalHash });
      } catch (error) {
        // Publish failed: the chain is unchanged, so rebuild the next leg from
        // the same frontier. Reset the pipelined work to the current frontier.
        workPromise = safeWork(frontier);
        const message = error instanceof Error ? error.message : 'Failed to publish block';
        if (!leg.internal) results.push({ ...leg.report, error: message });
      }
    }

    // Restore the account's original representative if a transfer left it
    // pointing at an asset representative.
    if (opts?.restoreRepresentative && hashes.length > 0 && lastRep !== baseRep) {
      try {
        let work = await workPromise;
        if (!work) work = await bananojs.bananodeApi.getGeneratedWork(frontier);
        const block: Record<string, unknown> = {
          type: 'state',
          account: account.address,
          previous: frontier,
          representative: baseRep,
          balance: balance.toString(10),
          link: '0000000000000000000000000000000000000000000000000000000000000000',
          work,
        };
        block.signature = await bananojs.getSignature(account.privateKey, block);
        const processedHash: string = await bananojs.bananodeApi.process(block, 'change');
        frontier = processedHash || frontier;
      } catch (error) {
        console.warn('WalletManager: failed to restore representative after transfer:', error);
      }
    }

    // Reconcile the cached display balance from the final raw balance.
    try {
      account.balance = bananojs.getBananoPartsAsDecimal(
        bananojs.getBananoPartsFromRaw(balance.toString(10)),
      );
    } catch {
      /* display-only; ignore */
    }

    return { hashes, results };
    } finally {
      this.stateChainDepth = Math.max(0, this.stateChainDepth - 1);
    }
  }

  private toRaw(amountBan: string): bigint {
    return BigInt(
      bananojs.BananoUtil.getRawStrFromMajorAmountStr(amountBan, bananojs.BANANO_PREFIX),
    );
  }

  /**
   * Publish several plain sends in one approval (multi-send / airdrop). Resolves
   * every recipient (BNS supported), verifies the balance covers the total up
   * front, then publishes a locally-chained block sequence with pipelined work.
   * Best-effort: returns per-recipient results; throws only if nothing sent.
   */
  async batchSend(
    fromAddress: string,
    sends: { to: string; amount: string }[],
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for sending');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }
    if (!sends.length) {
      throw new Error('Batch send requires at least one recipient');
    }

    const legs: EngineLeg[] = [];
    let total = 0n;
    for (const send of sends) {
      const raw = this.toRaw(send.amount);
      if (raw <= 0n) {
        throw new Error(`Invalid amount: ${send.amount}`);
      }
      const to = await this.resolveRecipientAddress(send.to);
      total += raw;
      legs.push({
        subtype: 'send',
        amountRaw: raw,
        link: bananojs.BananoUtil.getAccountPublicKey(to),
        report: { to, amount: send.amount },
      });
    }

    const { hashes, results } = await this.publishStateChain(account, legs, {
      minBalanceRaw: total,
    });
    if (hashes.length === 0) {
      throw new Error(results[0]?.error || 'Batch send failed');
    }
    return { hashes, results };
  }

  /**
   * Transfer several owned NFTs in one approval. Pockets any pending balance
   * once up front, then publishes one `send#asset` block per NFT as a locally-
   * chained sequence (pipelined work), and finally restores the account's
   * representative. Best-effort: returns per-NFT results; throws only if none
   * transferred.
   */
  async transferNFTs(
    fromAddress: string,
    transfers: { assetRepresentative: string; to: string; amount?: string }[],
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for transfer');
    }
    const account = this.accounts.find((acc) => acc.address === fromAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }
    if (!transfers.length) {
      throw new Error('Transfer requires at least one NFT');
    }

    // Pocket every pending block once so all assets are held before sending.
    try {
      await this.autoReceivePending(fromAddress);
    } catch (error) {
      console.warn('WalletManager: auto-receive before multi-transfer failed (continuing):', error);
    }

    const legs: EngineLeg[] = [];
    let total = 0n;
    for (const t of transfers) {
      const assetRep = assetRepresentativeAccount(t.assetRepresentative);
      const to = await this.resolveRecipientAddress(t.to);
      const amount = t.amount && t.amount.trim() !== '' ? t.amount : '0.0001';
      const raw = this.toRaw(amount);
      total += raw;
      legs.push({
        subtype: 'send',
        amountRaw: raw,
        link: bananojs.BananoUtil.getAccountPublicKey(to),
        representative: assetRep,
        report: { assetRepresentative: t.assetRepresentative, to, amount },
      });
    }

    const { hashes, results } = await this.publishStateChain(account, legs, {
      minBalanceRaw: total,
      restoreRepresentative: true,
    });
    if (hashes.length === 0) {
      throw new Error(results[0]?.error || 'NFT transfer failed');
    }
    return { hashes, results };
  }

  /**
   * Create and sign a send block (legacy method for compatibility)
   */
  async createSendBlock(fromAddress: string, toAddress: string, amount: string): Promise<any> {
    // For now, just call the real send function
    const hash = await this.sendBanano(fromAddress, toAddress, amount);
    return { hash, type: 'send', fromAddress, toAddress, amount };
  }

  /**
   * Create and sign a receive block
   */
  async createReceiveBlock(accountAddress: string, pendingHash: string, amount: string): Promise<any> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    const account = this.accounts.find(acc => acc.address === accountAddress);
    if (!account) {
      throw new Error('Account not found in wallet');
    }

    try {
      console.log('WalletManager: Creating receive block for', accountAddress, 'hash:', pendingHash);
      
      // This is a simplified version - a real implementation would:
      // 1. Get account info from RPC to get current balance and frontier
      // 2. Calculate new balance after receive
      // 3. Get representative
      // 4. Generate proper work
      
      const receiveBlock = {
        type: 'receive',
        account: accountAddress,
        previous: '0000000000000000000000000000000000000000000000000000000000000000', // Would get from RPC
        representative: 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs', // Default rep
        balance: amount, // Would calculate: current_balance + amount
        link: pendingHash // For receive blocks, link is the pending block hash
      };
      
      return await this.signBlock(receiveBlock, accountAddress);
    } catch (error) {
      console.error('WalletManager: Error creating receive block:', error);
      throw error;
    }
  }

  /**
   * Sign an arbitrary message (legacy helper — uses BananoUtil only)
   */
  async signMessage(publicKeyOrAddress: string, message: string, display: 'utf8' | 'hex' = 'utf8', origin?: string): Promise<string> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    const account = this.getAccountByIdentifier(publicKeyOrAddress);
    if (!account) {
      throw new Error('Account not found for provided public key');
    }

    if (display === 'hex') {
      const bytes = hexToUint8(message);
      return this.signMessageBytes(account.address, bytes);
    }

    const messageToSign = origin
      ? `MonkeyMask Signed Message:\nOrigin: ${origin}\nMessage: ${message}`
      : message;
    return bananojs.BananoUtil.signMessage(account.privateKey, messageToSign);
  }

  /**
   * Verify a signed message using BananoUtil
   */
  async verifySignedMessage(publicKeyOrAddress: string, _messageBytes: Uint8Array, signatureHex: string, message?: string, origin?: string): Promise<boolean> {
    const account = this.getAccountByIdentifier(publicKeyOrAddress);
    if (!account) {
      return false;
    }

    try {
      const messageToVerify = origin
        ? `MonkeyMask Signed Message:\nOrigin: ${origin}\nMessage: ${message ?? ''}`
        : (message ?? new TextDecoder().decode(_messageBytes));
      return bananojs.BananoUtil.verifyMessage(account.publicKey, messageToVerify, signatureHex);
    } catch {
      return false;
    }
  }

  /**
   * Auto-receive pending transactions for an account using real bananojs
   */
  /**
   * Claim receivable (pending) blocks. With no `blockHash`, claims all pending;
   * with `blockHash`, claims only that specific receivable. Unlike
   * `autoReceivePending` (best-effort, swallows errors), this surfaces failures
   * so a dApp-triggered receive reports why it failed. Returns published hashes.
   */
  async receivePending(accountAddress: string, blockHash?: string): Promise<string[]> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }
    if (!this.currentSeed) {
      throw new Error('Seed not available for receiving');
    }
    const account = this.accounts.find((acc) => acc.address === accountAddress);
    if (!account) {
      throw new Error('Account not found');
    }
    const accountIndex = this.accounts.indexOf(account);

    let representative = 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs';
    try {
      const info = await this.rpc.getAccountInfo(accountAddress);
      if (info.success && (info.data as { representative?: string })?.representative) {
        representative = (info.data as { representative: string }).representative;
      }
    } catch {
      /* fall back to default representative */
    }

    const received = await bananojs.receiveBananoDepositsForSeed(
      this.currentSeed,
      accountIndex,
      representative,
      blockHash,
    );
    // bananojs' DepositUtil returns a summary object, not a hash/array:
    //   { pendingBlocks, receiveBlocks, receiveCount, ... }
    // The freshly-published receive/open block hashes are in `receiveBlocks`.
    return extractReceiveBlockHashes(received);
  }

  async autoReceivePending(accountAddress: string, pendingAmount?: string): Promise<string[]> {
    if (!this.isUnlocked) {
      return [];
    }
    if (!this.currentSeed) {
      console.debug(
        'WalletManager: Skipping auto-receive — seed not in memory (unlock may have failed to decrypt seed)',
      );
      return [];
    }

    try {
      console.log('WalletManager: Auto-receiving pending for', accountAddress, 'amount:', pendingAmount);

      const account = this.accounts.find((acc) => acc.address === accountAddress);
      if (!account) {
        return [];
      }

      // Confirm receivable blocks exist before calling bananojs (avoids RPC 400s when
      // balance.pending is stale or the node has no matching pending entries).
      const pendingResult = await this.rpc.getPending(accountAddress, 1);
      const blocks = pendingResult.success
        ? (pendingResult.data as { blocks?: Record<string, unknown> | null })?.blocks
        : null;
      if (!blocks || typeof blocks !== 'object' || Array.isArray(blocks) || !Object.keys(blocks).length) {
        console.debug('WalletManager: No receivable blocks to auto-claim for', accountAddress);
        return [];
      }

      const accountIndex = this.accounts.indexOf(account);

      let representative = 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs';
      try {
        const info = await this.rpc.getAccountInfo(accountAddress);
        if (info.success && (info.data as { representative?: string })?.representative) {
          representative = (info.data as { representative: string }).representative;
        }
      } catch {
        /* fall back to default representative */
      }

      const receivedHashes = await withBananoNodeFallback(() =>
        bananojs.receiveBananoDepositsForSeed(
          this.currentSeed,
          accountIndex,
          representative,
        ),
      );

      const hashArray = extractReceiveBlockHashes(receivedHashes);
      console.log('WalletManager: Auto-received', hashArray.length, 'pending block(s)');
      return hashArray;
    } catch (error) {
      console.warn('WalletManager: Auto-receive skipped:', error);
      return [];
    }
  }

  /**
   * Clear all wallet data (for testing/reset)
   */
  async clearWallet(): Promise<void> {
    await chrome.storage.local.remove(['wallet']);
    this.lockWallet();
  }

  /**
   * Find an account by address or public key (identifier may be ban_... or hex pubkey)
   */
  getAccountByIdentifier(identifier: string): Account | undefined {
    return this.accounts.find(acc => acc.address === identifier || acc.publicKey === identifier);
  }

  async signMessageBytes(accountAddress: string, messageBytes: Uint8Array): Promise<string> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    const account = this.getAccountByIdentifier(accountAddress);
    if (!account) throw new Error('Account not found');
    const messageText = new TextDecoder().decode(messageBytes);
    return bananojs.BananoUtil.signMessage(account.privateKey, messageText);
  }

  async signIn(
    accountAddress: string,
    input: BananoSignInInput,
    _origin: string,
  ): Promise<{ signedMessage: Uint8Array; signature: Uint8Array }> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    const account = this.getAccountByIdentifier(accountAddress);
    if (!account) throw new Error('Account not found');
    const messageText = createSignInMessageText({
      ...input,
      domain: input.domain!,
      address: input.address ?? account.address,
    });
    const signatureHex = await bananojs.BananoUtil.signMessage(account.privateKey, messageText);
    const signatureBytes = hexToUint8(signatureHex);
    return {
      signedMessage: new TextEncoder().encode(messageText),
      signature: signatureBytes,
    };
  }

  async signOperation(accountAddress: string, operation: BananoOperation): Promise<string> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    const account = this.accounts.find((acc) => acc.address === accountAddress);
    if (!account) throw new Error('Account not found');

    if (operation.type === 'send') {
      if ('sends' in operation) {
        throw new Error('Multi-send requires publishing; use signAndSendTransaction');
      }
      const block = await this.buildSignedSendBlock(account, operation.to, operation.amount);
      return JSON.stringify(block);
    }
    if (operation.type === 'change') {
      const block = await this.buildSignedChangeBlock(account, operation.representative);
      return JSON.stringify(block);
    }
    if (operation.type === 'receive') {
      throw new Error('Receiving requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'sweep') {
      throw new Error('Sweep requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'mint' || operation.type === 'mintEdition') {
      throw new Error('Minting requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'transfer') {
      throw new Error('NFT transfer requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'burn') {
      throw new Error('NFT burn requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'finishSupply') {
      throw new Error('Finishing a collection requires publishing; use signAndSendTransaction');
    }
    if (operation.type === 'sendAllNfts') {
      throw new Error('Send-all-NFTs requires publishing; use signAndSendTransaction');
    }
    throw new Error('Unsupported operation type');
  }

  /**
   * Build, sign, and publish an operation. Returns every block hash produced, in
   * publish order (a single op returns one hash; multi-send/transfer returns all;
   * a mint returns the mint hash followed by any fee-send hashes), plus per-leg
   * `results` for the array forms of send/transfer.
   */
  async sendOperation(
    accountAddress: string,
    operation: BananoOperation,
  ): Promise<{ hashes: string[]; results?: BananoBatchLegResult[] }> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    return withBananoNodeFallback(() => this.publishOperation(accountAddress, operation));
  }

  private async publishOperation(
    accountAddress: string,
    operation: BananoOperation,
  ): Promise<{ hashes: string[]; results?: BananoBatchLegResult[] }> {
    if (operation.type === 'send') {
      if ('sends' in operation) {
        if (operation.sends.length === 0) {
          throw new Error('send requires a non-empty `sends` array');
        }
        return this.batchSend(
          accountAddress,
          operation.sends.map((s) => ({ to: s.to, amount: s.amount })),
        );
      }
      const hash = await this.sendBanano(accountAddress, operation.to, operation.amount);
      return { hashes: [hash] };
    }
    if (operation.type === 'change') {
      const hash = await this.changeRepresentative(accountAddress, operation.representative);
      return { hashes: [hash] };
    }
    if (operation.type === 'receive') {
      const hashes = await this.receivePending(accountAddress, operation.blockHash);
      return { hashes };
    }
    if (operation.type === 'sweep') {
      const { hash } = await this.sweep(accountAddress, operation.to);
      return { hashes: [hash] };
    }
    if (operation.type === 'mint') {
      const result = await this.mintNFT(accountAddress, {
        metadataCid: operation.metadataCid,
        to: operation.to,
        amount: operation.amount,
        maxSupply: operation.maxSupply,
        fees: operation.fees ? [...operation.fees] : undefined,
      });
      return { hashes: [result.assetRepresentative, ...(result.feeHashes ?? [])] };
    }
    if (operation.type === 'mintEdition') {
      const result = await this.mintEdition(accountAddress, {
        metadataCid: operation.metadataCid,
        to: operation.to,
        amount: operation.amount,
        fees: operation.fees ? [...operation.fees] : undefined,
      });
      return { hashes: [result.assetRepresentative, ...(result.feeHashes ?? [])] };
    }
    if (operation.type === 'transfer') {
      if ('transfers' in operation) {
        if (operation.transfers.length === 0) {
          throw new Error('transfer requires a non-empty `transfers` array');
        }
        return this.transferNFTs(
          accountAddress,
          operation.transfers.map((t) => ({
            assetRepresentative: t.assetRepresentative,
            to: t.to,
            amount: t.amount,
          })),
        );
      }
      const hash = await this.transferNFT(accountAddress, {
        assetRepresentative: operation.assetRepresentative,
        to: operation.to,
        amount: operation.amount,
      });
      return { hashes: [hash] };
    }
    if (operation.type === 'burn') {
      const hash = await this.burnNFT(accountAddress, {
        assetRepresentative: operation.assetRepresentative,
        to: operation.to,
        amount: operation.amount,
      });
      return { hashes: [hash] };
    }
    if (operation.type === 'finishSupply') {
      const hash = await this.finishCollection(accountAddress, {
        metadataCid: operation.metadataCid,
      });
      return { hashes: [hash] };
    }
    if (operation.type === 'sendAllNfts') {
      const hash = await this.sendAllNfts(accountAddress, {
        to: operation.to,
        amount: operation.amount,
      });
      return { hashes: [hash] };
    }
    throw new Error('Unsupported operation type');
  }

  private async changeRepresentative(accountAddress: string, representative: string): Promise<string> {
    if (!this.currentSeed) throw new Error('Seed not available');
    if (this.stateChainDepth > 0) {
      throw new Error(
        'Cannot change representative while an NFT or batch transaction is in progress. Try again in a moment.',
      );
    }

    const account = this.accounts.find((acc) => acc.address === accountAddress);
    if (!account) throw new Error('Account not found');

    const currentRep =
      (await bananojs.bananodeApi.getAccountRepresentative(account.address)) ?? null;
    const assessment = assessRepresentativeForDelegationChange(currentRep);
    if (!assessment.allowed) {
      throw new Error(assessment.message ?? 'Representative change is blocked for this account');
    }
    if (representative === currentRep) {
      throw new Error('Account already delegates to this representative');
    }
    if (assessRepresentativeForDelegationChange(representative).severity === 'block') {
      throw new Error('That address is not a valid node representative for delegation');
    }

    const accountIndex = this.accounts.indexOf(account);
    const result = await bananojs.changeBananoRepresentativeForSeed(
      this.currentSeed,
      accountIndex,
      representative,
    );
    const hash =
      typeof result === 'string'
        ? result
        : typeof (result as { hash?: string })?.hash === 'string'
          ? (result as { hash: string }).hash
          : null;
    if (!hash) throw new Error('Invalid change result: missing transaction hash');
    return hash;
  }

  /** Whether a metaprotocol publish chain is running (mint, transfer, etc.). */
  isMetaprotocolBusy(): boolean {
    return this.stateChainDepth > 0;
  }

  /**
   * Change voting delegate for one account. Does not move funds—only ORV weight.
   */
  async changeAccountRepresentative(accountAddress: string, representative: string): Promise<string> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    return this.changeRepresentative(accountAddress, representative);
  }

  /**
   * Apply the same node representative to every account that allows delegation.
   * Skips accounts blocked by NFT protocol reps or in-flight operations.
   */
  async changeAllAccountsRepresentative(representative: string): Promise<{
    changed: string[];
    skipped: { address: string; reason: string }[];
  }> {
    if (!this.isUnlocked) throw new Error('Wallet is locked');
    if (this.stateChainDepth > 0) {
      throw new Error(
        'Cannot change representatives while an NFT or batch transaction is in progress.',
      );
    }

    const changed: string[] = [];
    const skipped: { address: string; reason: string }[] = [];

    for (const account of this.accounts) {
      try {
        const currentRep =
          (await bananojs.bananodeApi.getAccountRepresentative(account.address)) ?? null;
        const assessment = assessRepresentativeForDelegationChange(currentRep);
        if (!assessment.allowed) {
          skipped.push({
            address: account.address,
            reason: assessment.message ?? 'NFT protocol representative active',
          });
          continue;
        }
        if (currentRep === representative) {
          skipped.push({ address: account.address, reason: 'Already using this representative' });
          continue;
        }
        await this.changeRepresentative(account.address, representative);
        changed.push(account.address);
      } catch (error) {
        skipped.push({
          address: account.address,
          reason: error instanceof Error ? error.message : 'Change failed',
        });
      }
    }

    return { changed, skipped };
  }

  private async buildSignedSendBlock(
    account: Account,
    toAddress: string,
    amount: string,
  ): Promise<Record<string, unknown>> {
    const resolvedTo = await this.resolveRecipientAddress(toAddress);
    const accountInfo = await bananojs.getAccountInfo(account.address);
    if (!accountInfo?.balance || !accountInfo?.frontier) {
      throw new Error('Unable to load account frontier for signing');
    }

    const amountRaw = bananojs.BananoUtil.getRawStrFromMajorAmountStr(
      amount.toString(),
      bananojs.BANANO_PREFIX,
    );
    const balanceRaw = accountInfo.balance as string;
    if (BigInt(balanceRaw) < BigInt(amountRaw)) {
      throw new Error('Insufficient balance');
    }

    const remaining = (BigInt(balanceRaw) - BigInt(amountRaw)).toString(10);
    const representative =
      (accountInfo.representative as string | undefined) ??
      (await bananojs.bananodeApi.getAccountRepresentative(account.address));
    const previous = accountInfo.frontier as string;
    const work = await bananojs.bananodeApi.getGeneratedWork(previous);

    const block: Record<string, unknown> = {
      type: 'state',
      account: account.address,
      previous,
      representative,
      balance: remaining,
      link: bananojs.BananoUtil.getAccountPublicKey(resolvedTo),
      work,
    };
    block.signature = await bananojs.getSignature(account.privateKey, block);
    return block;
  }

  private async buildSignedChangeBlock(
    account: Account,
    representative: string,
  ): Promise<Record<string, unknown>> {
    const accountInfo = await bananojs.getAccountInfo(account.address);
    if (!accountInfo?.balance || !accountInfo?.frontier) {
      throw new Error('Unable to load account info for change block');
    }

    const previous = accountInfo.frontier as string;
    const work = await bananojs.bananodeApi.getGeneratedWork(previous);
    const block: Record<string, unknown> = {
      type: 'state',
      account: account.address,
      previous,
      representative,
      balance: accountInfo.balance as string,
      link: '0000000000000000000000000000000000000000000000000000000000000000',
      work,
    };
    block.signature = await bananojs.getSignature(account.privateKey, block);
    return block;
  }
}

// --------- local utils ---------

/**
 * Normalize the value returned by bananojs' `receiveBananoDepositsForSeed`.
 * DepositUtil resolves to a summary object shaped like
 * `{ pendingBlocks, receiveBlocks, receiveCount, ... }` (not a hash or array),
 * so we pull the freshly-published receive/open block hashes out of
 * `receiveBlocks`. Older/edge return shapes (a bare string or array) are handled
 * defensively so callers always get a clean `string[]`.
 */
function extractReceiveBlockHashes(received: unknown): string[] {
  if (!received) return [];
  if (typeof received === 'string') return [received];
  if (Array.isArray(received)) return received.filter((h): h is string => typeof h === 'string');
  const blocks = (received as { receiveBlocks?: unknown }).receiveBlocks;
  if (Array.isArray(blocks)) return blocks.filter((h): h is string => typeof h === 'string');
  return [];
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}
function uint8ToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
function concatUint8(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
