import React, { ReactNode } from 'react';
interface Transaction {
    hash: string;
    type: string;
    amount: string;
    account: string;
    timestamp: string;
    local_timestamp: string;
}
interface Account {
    address: string;
    name: string;
    balance: string;
    pending?: string;
    bnsNames?: string[];
    transactions?: Transaction[];
}
interface AccountsContextType {
    accounts: Account[];
    currentAccountIndex: number;
    currentAccount: Account | null;
    loading: boolean;
    refreshing: boolean;
    error: string;
    banPrice: number;
    priceLoading: boolean;
    loadAccounts: () => Promise<void>;
    refreshBalances: (skipHistoryFetch?: boolean) => Promise<void>;
    reloadAccounts: () => Promise<void>;
    fetchPrice: () => Promise<void>;
    getUsdBalance: (banBalance: string) => string;
    createNewAccount: () => Promise<void>;
    switchAccount: (index: number) => void;
    removeAccount: (address: string) => Promise<void>;
}
interface AccountsProviderProps {
    children: ReactNode;
}
export declare const AccountsProvider: React.FC<AccountsProviderProps>;
export declare const useAccounts: () => AccountsContextType;
export {};
