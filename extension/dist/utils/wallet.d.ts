import { Account, StoredWallet } from '../types/wallet';
export declare class WalletManager {
    private static instance;
    private accounts;
    private isUnlocked;
    private currentSeed;
    private currentPasswordHash;
    private currentSalt;
    private rpc;
    constructor();
    static getInstance(): WalletManager;
    /**
     * Generate a new hex seed for Banano (64-character hex string)
     */
    generateSeed(): string;
    /**
     * Generate a BIP39 mnemonic for user-friendly backup
     */
    generateMnemonic(): string;
    /**
     * Convert BIP39 mnemonic to Banano hex seed
     */
    mnemonicToSeed(mnemonic: string): Promise<string>;
    /**
     * Create a new wallet from a hex seed or mnemonic
     */
    createWalletFromSeed(seedInput: string): Promise<Account[]>;
    /**
     * Derive an account from hex seed at specific index
     */
    deriveAccountFromSeed(hexSeed: string, index: number): Promise<Account>;
    /**
     * Find the next available account index (fills gaps from removed accounts)
     */
    getNextAvailableAccountIndex(): number;
    /**
     * Sort accounts by their index (Account 1, Account 2, Account 3, etc.)
     */
    private sortAccountsByIndex;
    /**
     * Create a new account using the current seed at the specified index
     */
    createNewAccount(index?: number): Promise<Account>;
    /**
     * Remove an account by address
     * Note: Cannot remove the first account (index 0) as it's the primary account
     */
    removeAccount(address: string): Promise<void>;
    /**
     * Import wallet from private key
     */
    importFromPrivateKey(privateKey: string, name?: string): Promise<Account>;
    /**
     * Encrypt accounts with password
     */
    encryptAccounts(accounts: Account[], password: string): {
        encryptedData: string;
        salt: string;
    };
    /**
     * Decrypt accounts with password
     */
    decryptAccounts(encryptedData: string, salt: string, password: string): Account[];
    /**
     * Save wallet to browser storage
     */
    saveWallet(accounts: Account[], password: string): Promise<void>;
    /**
     * Save current accounts to storage (used when adding new accounts)
     */
    saveAccounts(password: string): Promise<void>;
    /**
     * Save accounts to storage using stored password hash (for automatic saves)
     */
    private saveAccountsToStorage;
    /**
     * Temporarily store accounts in memory-based storage (fallback when credentials not available)
     */
    private saveAccountsTemporarily;
    /**
     * Load wallet from browser storage
     */
    loadWallet(): Promise<StoredWallet | null>;
    /**
     * Unlock wallet with password
     */
    unlockWallet(password: string): Promise<Account[]>;
    /**
     * Lock wallet
     */
    lockWallet(): void;
    /**
     * Check if wallet is initialized
     */
    isWalletInitialized(): Promise<boolean>;
    /**
     * Get current accounts
     */
    getAccounts(): Account[];
    /**
     * Get stored account addresses without unlocking (for connection purposes)
     */
    getStoredAccounts(): Promise<Account[]>;
    /**
     * Check if wallet is unlocked
     */
    isWalletUnlocked(): boolean;
    /**
     * Sign a Banano block with the account's private key
     */
    signBlock(block: any, accountAddress: string): Promise<any>;
    /**
     * Send Banano using bananojs
     */
    sendBanano(fromAddress: string, toAddress: string, amount: string): Promise<string>;
    /**
     * Create and sign a send block (legacy method for compatibility)
     */
    createSendBlock(fromAddress: string, toAddress: string, amount: string): Promise<any>;
    /**
     * Create and sign a receive block
     */
    createReceiveBlock(accountAddress: string, pendingHash: string, amount: string): Promise<any>;
    /**
     * Sign an arbitrary message (currently supports UTF-8 messages)
     * Returns signature as hex string
     */
    signMessage(publicKeyOrAddress: string, message: string, display?: 'utf8' | 'hex', origin?: string): Promise<string>;
    /**
     * Verify a signed message using Ed25519
     */
    verifySignedMessage(publicKeyOrAddress: string, messageBytes: Uint8Array, signatureHex: string, message?: string, origin?: string): Promise<boolean>;
    /**
     * Auto-receive pending transactions for an account using real bananojs
     */
    autoReceivePending(accountAddress: string, pendingAmount?: string): Promise<string[]>;
    /**
     * Clear all wallet data (for testing/reset)
     */
    clearWallet(): Promise<void>;
    /**
     * Find an account by address or public key (identifier may be ban_... or hex pubkey)
     */
    getAccountByIdentifier(identifier: string): Account | undefined;
}
