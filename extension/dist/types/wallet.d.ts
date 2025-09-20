export interface Account {
    address: string;
    privateKey: string;
    publicKey: string;
    balance: string;
    name: string;
}
export interface WalletState {
    isLocked: boolean;
    accounts: Account[];
    activeAccountIndex: number;
    isInitialized: boolean;
}
export interface StoredWallet {
    encryptedAccounts: string;
    encryptedSeed: string;
    salt: string;
    isInitialized: boolean;
}
export interface BananoBlock {
    type: 'send' | 'receive' | 'change';
    account: string;
    previous: string;
    representative: string;
    balance: string;
    link?: string;
    destination?: string;
    amount?: string;
}
export interface SignedBlock extends BananoBlock {
    signature: string;
    work: string;
}
export interface BananoProvider {
    connect(): Promise<{
        address: string;
    }>;
    disconnect(): Promise<void>;
    getAccounts(): Promise<string[]>;
    signBlock(block: BananoBlock): Promise<SignedBlock>;
    sendBlock(block: SignedBlock): Promise<string>;
}
export interface CreateWalletRequest {
    type: 'CREATE_WALLET';
    password: string;
}
export interface ImportWalletRequest {
    type: 'IMPORT_WALLET';
    password: string;
    seed: string;
}
export interface UnlockWalletRequest {
    type: 'UNLOCK_WALLET';
    password: string;
}
export interface GetAccountsRequest {
    type: 'GET_ACCOUNTS';
}
export interface GetBalanceRequest {
    type: 'GET_BALANCE';
    address: string;
}
export type WalletRequest = CreateWalletRequest | ImportWalletRequest | UnlockWalletRequest | GetAccountsRequest | GetBalanceRequest;
