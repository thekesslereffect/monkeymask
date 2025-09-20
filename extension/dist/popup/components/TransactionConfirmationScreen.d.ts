import React from 'react';
interface TransactionResult {
    success: boolean;
    hash?: string;
    error?: string;
    block?: {
        type: string;
        fromAddress: string;
        toAddress: string;
        amount: string;
    };
}
interface TransactionConfirmationScreenProps {
    result: TransactionResult;
    onClose: () => void;
}
export declare const TransactionConfirmationScreen: React.FC<TransactionConfirmationScreenProps>;
export {};
