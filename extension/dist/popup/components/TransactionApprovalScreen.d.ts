import React from 'react';
interface TransactionRequest {
    id: string;
    origin: string;
    type: 'sendTransaction' | 'signBlock';
    data: {
        fromAddress?: string;
        toAddress?: string;
        amount?: string;
        block?: any;
    };
}
interface TransactionApprovalScreenProps {
    request: TransactionRequest;
    onApprove: (requestId: string) => void;
    onReject: (requestId: string) => void;
}
export declare const TransactionApprovalScreen: React.FC<TransactionApprovalScreenProps>;
export {};
