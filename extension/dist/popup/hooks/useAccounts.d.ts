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
    loading: boolean;
    refreshing: boolean;
    error: string;
    banPrice: number;
    priceLoading: boolean;
    loadAccounts: () => Promise<void>;
    refreshBalances: () => Promise<void>;
    reloadAccounts: () => Promise<void>;
    fetchPrice: () => Promise<void>;
    getUsdBalance: (banBalance: string) => string;
}
interface AccountsProviderProps {
    children: ReactNode;
}
export declare const AccountsProvider: React.FC<AccountsProviderProps>;
export declare const useAccounts: () => AccountsContextType;
export {};
