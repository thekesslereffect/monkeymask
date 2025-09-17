const bananojs = require('@bananocoin/bananojs');
import * as bip39 from 'bip39';
import CryptoJS from 'crypto-js';
import { Account, StoredWallet } from '../types/wallet';

export class WalletManager {
  private static instance: WalletManager;
  private accounts: Account[] = [];
  private isUnlocked = false;
  private currentSeed: string | null = null;

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
    return bip39.generateMnemonic(256); // 24 words
  }

  /**
   * Convert BIP39 mnemonic to Banano hex seed
   */
  async mnemonicToSeed(mnemonic: string): Promise<string> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic seed');
    }
    
    try {
      // Convert mnemonic to seed buffer and take first 32 bytes as hex
      const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
      
      // Convert to Uint8Array first, then to hex
      const uint8Array = new Uint8Array(seedBuffer);
      const first32Bytes = uint8Array.subarray(0, 32);
      
      // Convert to hex string
      const hexSeed = Array.from(first32Bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const result = hexSeed.toUpperCase();
      console.log('WalletManager: Converted mnemonic to hex seed:', result.substring(0, 16) + '...');
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

    await chrome.storage.local.set({ wallet: walletData });
    
    // Keep the wallet unlocked after saving (important for new wallet creation)
    this.accounts = accounts;
    this.isUnlocked = true;
    console.log('WalletManager: Saved wallet and kept unlocked state');
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

    // Decrypt the seed if it exists
    if (walletData.encryptedSeed) {
      try {
        const key = CryptoJS.PBKDF2(password, walletData.salt, { keySize: 256/32, iterations: 10000 });
        const decryptedSeed = CryptoJS.AES.decrypt(walletData.encryptedSeed, key.toString()).toString(CryptoJS.enc.Utf8);
        this.currentSeed = decryptedSeed;
        console.log('WalletManager: Decrypted seed for receive operations');
      } catch (error) {
        console.warn('WalletManager: Failed to decrypt seed:', error);
      }
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
      
      // Use bananojs to sign the block
      const signature = await bananojs.signHash(account.privateKey, block);
      
      // Add work (proof of work) - for now use a placeholder
      // In a real implementation, this would be computed or fetched from a work server
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
      
      // Set the API URL for bananojs
      bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api');
      
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
      
      // Set the API URL for bananojs
      bananojs.setBananodeApiUrl('https://kaliumapi.appditto.com/api');
      
      const receivedHashes = await bananojs.receiveBananoDepositsForSeed(
        this.currentSeed!,
        accountIndex,
        accountAddress
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
}
