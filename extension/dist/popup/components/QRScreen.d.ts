import React from 'react';
interface Account {
    address: string;
    name: string;
    balance: string;
    pending?: string;
    bnsNames?: string[];
}
interface QRScreenProps {
    account: Account;
}
export declare const QRScreen: React.FC<QRScreenProps>;
export {};
