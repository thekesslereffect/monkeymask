import React from 'react';
interface Account {
    address: string;
    name: string;
    balance: string;
}
interface SendScreenProps {
    account: Account;
    onSendComplete: (result: {
        success: boolean;
        hash?: string;
        error?: string;
        block?: any;
    }) => void;
}
export declare const SendScreen: React.FC<SendScreenProps>;
export {};
