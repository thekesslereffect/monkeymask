const bananojs = require('@bananocoin/bananojs');
// Configure bananojs once at module load
try {
  bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api');
  if (bananojs.BananodeApi && typeof bananojs.BananodeApi.setUseRateLimit === 'function') {
    bananojs.BananodeApi.setUseRateLimit(true);
  }
} catch {}
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import { blake2b } from 'blakejs';
import { Account, StoredWallet } from '../types/wallet';
import { BananoRPC } from './rpc';

export class WalletManager {
  private static instance: WalletManager;
  private accounts: Account[] = [];
  private isUnlocked = false;
  private currentSeed: string | null = null;
  private currentPasswordHash: string | null = null;
  private currentSalt: string | null = null;
  private rpc: BananoRPC;

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
   * Encrypt accounts with password
   */
  encryptAccounts(accounts: Account[], password: string): { encryptedData: string; salt: string } {
    const salt = CryptoJS.lib.WordArray.random(128/8).toString();
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 10000
    });

    const accountsJson = JSON.stringify(accounts);
    const encryptedData = CryptoJS.AES.encrypt(accountsJson, key.toString()).toString();

    return { encryptedData, salt };
  }

  /**
   * Decrypt accounts with password
   */
  decryptAccounts(encryptedData: string, salt: string, password: string): Account[] {
    try {
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      });

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, key.toString());
      const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedData) {
        throw new Error('Invalid password');
      }

      return JSON.parse(decryptedData);
    } catch (error) {
      throw new Error('Invalid password or corrupted data');
    }
  }

  /**
   * Save wallet to browser storage
   */
  async saveWallet(accounts: Account[], password: string): Promise<void> {
    const { encryptedData, salt } = this.encryptAccounts(accounts, password);
    
    // Encrypt the seed if we have one
    let encryptedSeed = '';
    if (this.currentSeed) {
      const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 });
      encryptedSeed = CryptoJS.AES.encrypt(this.currentSeed, key.toString()).toString();
    }
    
    const walletData: StoredWallet = {
      encryptedAccounts: encryptedData,
      encryptedSeed,
      salt,
      isInitialized: true
    };

    // Also store account addresses separately for connection purposes (non-sensitive data)
    const accountAddresses = accounts.map(acc => acc.address);

    await chrome.storage.local.set({ 
      wallet: walletData,
      accountAddresses: accountAddresses 
    });
    
    // Keep the wallet unlocked after saving (important for new wallet creation)
    this.accounts = accounts;
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
      const { encryptedData, salt } = this.encryptAccounts(this.accounts, password);
      
      // Encrypt the seed if we have one
      let encryptedSeed = '';
      if (this.currentSeed) {
        const key = CryptoJS.PBKDF2(password, salt, { keySize: 256/32, iterations: 10000 });
        encryptedSeed = CryptoJS.AES.encrypt(this.currentSeed, key.toString()).toString();
      }
      
      const updatedWalletData: StoredWallet = {
        encryptedAccounts: encryptedData,
        encryptedSeed,
        salt,
        isInitialized: true
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
   * Save accounts to storage using stored password hash (for automatic saves)
   */
  private async saveAccountsToStorage(): Promise<void> {
    if (!this.isUnlocked) {
      throw new Error('Wallet must be unlocked to save accounts');
    }

    // If we don't have stored credentials, use a temporary storage approach
    if (!this.currentPasswordHash || !this.currentSalt) {
      console.warn('WalletManager: No stored credentials, using temporary account storage');
      await this.saveAccountsTemporarily();
      return;
    }

    try {
      console.log('WalletManager: Auto-saving accounts to storage...');
      
      // Encrypt accounts using the stored password hash
      const accountsJson = JSON.stringify(this.accounts);
      const encryptedData = CryptoJS.AES.encrypt(accountsJson, this.currentPasswordHash).toString();
      
      // Encrypt the seed if we have one
      let encryptedSeed = '';
      if (this.currentSeed) {
        encryptedSeed = CryptoJS.AES.encrypt(this.currentSeed, this.currentPasswordHash).toString();
      }
      
      const updatedWalletData: StoredWallet = {
        encryptedAccounts: encryptedData,
        encryptedSeed,
        salt: this.currentSalt,
        isInitialized: true
      };

      // Also store account addresses separately for connection purposes
      const accountAddresses = this.accounts.map(acc => acc.address);

      await chrome.storage.local.set({ 
        wallet: updatedWalletData,
        accountAddresses: accountAddresses 
      });
      
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

    const accounts = this.decryptAccounts(
      walletData.encryptedAccounts,
      walletData.salt,
      password
    );

    // Store password hash and salt for later use when saving accounts
    const key = CryptoJS.PBKDF2(password, walletData.salt, { keySize: 256/32, iterations: 10000 });
    this.currentPasswordHash = key.toString();
    this.currentSalt = walletData.salt;

    // Decrypt the seed if it exists
    if (walletData.encryptedSeed) {
      try {
        const decryptedSeed = CryptoJS.AES.decrypt(walletData.encryptedSeed, key.toString()).toString(CryptoJS.enc.Utf8);
        this.currentSeed = decryptedSeed;
        console.log('WalletManager: Decrypted seed for receive operations');
      } catch (error) {
        console.warn('WalletManager: Failed to decrypt seed:', error);
      }
    }

    // Check for temporarily stored accounts and merge them
    try {
      const tempResult = await chrome.storage.local.get(['tempAccounts']);
      if (tempResult.tempAccounts && tempResult.tempAccounts.accounts) {
        console.log('WalletManager: Found temporarily stored accounts, merging...');
        const tempAccounts = tempResult.tempAccounts.accounts;
        
        // Merge temp accounts with loaded accounts (avoid duplicates)
        const existingAddresses = new Set(accounts.map(acc => acc.address));
        const newAccounts = tempAccounts.filter((acc: Account) => !existingAddresses.has(acc.address));
        
        if (newAccounts.length > 0) {
          accounts.push(...newAccounts);
          console.log('WalletManager: Merged', newAccounts.length, 'temporarily stored accounts');
          
          // Clear the temporary storage
          await chrome.storage.local.remove(['tempAccounts']);
        }
      }
    } catch (error) {
      console.warn('WalletManager: Error merging temporary accounts:', error);
    }

    this.accounts = accounts;
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
    this.currentSalt = null;
    this.isUnlocked = false;
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
      const signature = await bananojs.BananoUtil.getSignature(account.privateKey, block);
      
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
      console.log('WalletManager: Sending', amount, 'BAN from', fromAddress, 'to', toAddress);
      
      // Get the account index for seed derivation
      const accountIndex = this.accounts.indexOf(account);
      
      // Use bananojs to send the withdrawal
      const result = await bananojs.sendBananoWithdrawalFromSeed(
        this.currentSeed,
        accountIndex,
        toAddress,
        amount
      );
      
      console.log('WalletManager: Send result:', result);
      
      // Update the account balance locally (subtract sent amount)
      const currentBalance = parseFloat(account.balance) || 0;
      const sentAmount = parseFloat(amount) || 0;
      const newBalance = Math.max(0, currentBalance - sentAmount);
      account.balance = newBalance.toString();
      
      console.log('WalletManager: Updated local balance from', currentBalance, 'to', newBalance);
      
      // Return the transaction hash
      return result;
      
    } catch (error) {
      console.error('WalletManager: Error sending Banano:', error);
      throw error;
    }
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
   * Sign an arbitrary message (currently supports UTF-8 messages)
   * Returns signature as hex string
   */
  async signMessage(publicKeyOrAddress: string, message: string, display: 'utf8' | 'hex' = 'utf8', origin?: string): Promise<string> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    console.log('WalletManager: Signing message for publicKeyOrAddress:', publicKeyOrAddress);
    console.log('WalletManager: Available accounts:', this.accounts.map(acc => ({ address: acc.address, publicKey: acc.publicKey })));

    // Find account by public key or address
    const account = this.getAccountByIdentifier(publicKeyOrAddress);
    console.log('WalletManager: Found account:', account ? { address: account.address, publicKey: account.publicKey } : 'null');
    
    if (!account) {
      throw new Error('Account not found for provided public key');
    }

    // Build domain-separated message bytes (must match verification format)
    const enc = new TextEncoder();
    const prefix = enc.encode(`MonkeyMask Signed Message:\nOrigin: ${origin || ''}\nMessage: `);
    const messageBytes = display === 'hex' ? hexToUint8(message) : enc.encode(message);
    const bytes = concatUint8(prefix, messageBytes);
    
    console.log('WalletManager: Signing with prefix string:', `MonkeyMask Signed Message:\nOrigin: ${origin || ''}\nMessage: ${message}`);
    console.log('WalletManager: Signing bytes length:', bytes.length);
    console.log('WalletManager: Signing bytes hex:', uint8ToHex(bytes));

    // Use BananoUtil.signMessage for UTF-8 messages
    if (display === 'utf8' && bananojs.BananoUtil && typeof bananojs.BananoUtil.signMessage === 'function') {
      console.log('WalletManager: Using BananoUtil.signMessage');
      try {
        // Use the domain-separated message string
        const messageToSign = `MonkeyMask Signed Message:\nOrigin: ${origin || ''}\nMessage: ${message}`;
        console.log('WalletManager: Signing message string:', messageToSign);
        
        const signature = await bananojs.BananoUtil.signMessage(account!.privateKey, messageToSign);
        console.log('WalletManager: BananoUtil signature result type:', typeof signature);
        console.log('WalletManager: BananoUtil signature result:', signature);
        
        // Convert to string if it's not already
        const signatureStr = typeof signature === 'string' ? signature : String(signature);
        console.log('WalletManager: Final signature string:', signatureStr.substring(0, 20) + '...');
        return signatureStr;
      } catch (error) {
        console.error('WalletManager: BananoUtil.signMessage error:', error);
        throw error; // Don't fall back, we want to see the error
      }
    }

    // Local Ed25519 signing (tweetnacl)
    const priv = hexToUint8(account.privateKey);
    const pub = hexToUint8(account.publicKey);
    
    console.log('WalletManager: Signing with private key length:', priv.length);
    console.log('WalletManager: Signing with public key hex:', account.publicKey);
    console.log('WalletManager: Signing with public key length:', pub.length);
    
    if (priv.length !== 32 || pub.length !== 32) {
      throw new Error('Invalid key lengths for Ed25519');
    }
    
    // For tweetnacl, we need to use the private key seed directly
    // Let's try using blake2b hash of the message instead of raw bytes
    const hashedMessage = blake2b(bytes, undefined, 32);
    console.log('WalletManager: Hashed message bytes:', uint8ToHex(hashedMessage));
    
    // Try using the correct tweetnacl format
    // tweetnacl.sign.detached expects a 64-byte secret key (seed + public key)
    try {
      const secretKey = new Uint8Array(64);
      secretKey.set(priv, 0);
      secretKey.set(pub, 32);
      
      console.log('WalletManager: About to sign with nacl.sign.detached');
      const sig = nacl.sign.detached(hashedMessage, secretKey);
      const sigHex = uint8ToHex(sig);
      console.log('WalletManager: Generated signature hex:', sigHex.substring(0, 20) + '...');
      return sigHex;
    } catch (error) {
      console.error('WalletManager: Signing error:', error);
      throw error;
    }
  }

  /**
   * Verify a signed message using Ed25519
   */
  async verifySignedMessage(publicKeyOrAddress: string, messageBytes: Uint8Array, signatureHex: string, message?: string, origin?: string): Promise<boolean> {
    console.log('WalletManager: Verifying signature for publicKeyOrAddress:', publicKeyOrAddress);
    
    // Find account by public key or address
    const account = this.getAccountByIdentifier(publicKeyOrAddress);
    if (!account) {
      console.log('WalletManager: Account not found for verification');
      return false;
    }

    try {
      console.log('WalletManager: Using public key hex:', account.publicKey);
      console.log('WalletManager: Signature hex:', signatureHex.substring(0, 20) + '...');
      
      // Use BananoUtil.verifyMessage if available
      if (bananojs.BananoUtil && typeof bananojs.BananoUtil.verifyMessage === 'function') {
        console.log('WalletManager: Using BananoUtil.verifyMessage');
        
        // Build the same domain-separated message string as in signing
        const messageToVerify = `MonkeyMask Signed Message:\nOrigin: ${origin || 'unknown'}\nMessage: ${message}`;
        console.log('WalletManager: Verifying message string:', messageToVerify);
        
        const isValid = bananojs.BananoUtil.verifyMessage(account.publicKey, messageToVerify, signatureHex);
        console.log('WalletManager: BananoUtil verification result:', isValid);
        return isValid;
      }
      
      // Fallback to tweetnacl verification
      const publicKeyBytes = hexToUint8(account.publicKey);
      const signatureBytes = hexToUint8(signatureHex);
      
      console.log('WalletManager: Using tweetnacl fallback verification');
      console.log('WalletManager: Public key bytes length:', publicKeyBytes.length);
      console.log('WalletManager: Signature bytes length:', signatureBytes.length);
      
      if (publicKeyBytes.length !== 32 || signatureBytes.length !== 64) {
        console.log('WalletManager: Invalid key or signature length');
        return false;
      }

      // Hash the message bytes the same way as in signing
      const hashedMessage = blake2b(messageBytes, undefined, 32);
      console.log('WalletManager: Verification hashed message bytes:', uint8ToHex(hashedMessage));
      
      const isValid = nacl.sign.detached.verify(hashedMessage, signatureBytes, publicKeyBytes);
      console.log('WalletManager: tweetnacl verification result:', isValid);
      return isValid;
    } catch (error) {
      console.error('WalletManager: Verification error:', error);
      return false;
    }
  }

  /**
   * Auto-receive pending transactions for an account using real bananojs
   */
  async autoReceivePending(accountAddress: string, pendingAmount?: string): Promise<string[]> {
    if (!this.isUnlocked) {
      throw new Error('Wallet is locked');
    }

    try {
      console.log('WalletManager: Auto-receiving pending for', accountAddress, 'amount:', pendingAmount);
      
      // Find the account
      const account = this.accounts.find(acc => acc.address === accountAddress);
      if (!account) {
        throw new Error('Account not found');
      }

      // Get the account's seed and index
      const accountIndex = this.accounts.indexOf(account);
      
      // Use bananojs to receive pending deposits
      console.log('WalletManager: Calling receiveBananoDepositsForSeed for account index:', accountIndex);
      
      // Determine representative for receive (required by bananojs DepositUtil)
      let representative = 'ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs';
      try {
        const info = await this.rpc.getAccountInfo(accountAddress);
        if (info.success && (info.data as any)?.representative) {
          representative = (info.data as any).representative;
        }
      } catch {}

      const receivedHashes = await bananojs.receiveBananoDepositsForSeed(
        this.currentSeed!,
        accountIndex,
        representative
      );
      
      console.log('WalletManager: Received deposits result:', receivedHashes);
      
      // Return array of hashes (or empty array if no deposits)
      const hashArray = Array.isArray(receivedHashes) ? receivedHashes : 
                       receivedHashes ? [receivedHashes] : [];
      
      console.log('WalletManager: Auto-received', hashArray.length, 'pending transactions');
      return hashArray;
      
    } catch (error) {
      console.error('WalletManager: Error auto-receiving pending:', error);
      // If real receive fails, don't throw - just return empty array
      console.warn('WalletManager: Real receive failed, returning empty array');
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
}

// --------- local utils ---------
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
