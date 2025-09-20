import React from 'react';
interface ConnectionApprovalScreenProps {
    request: {
        id: string;
        origin: string;
        data: {
            origin: string;
            accounts: Array<{
                address: string;
                name: string;
                balance: string;
            }>;
        };
    };
    onApprove: (requestId: string, selectedAccounts: string[]) => void;
    onReject: (requestId: string) => void;
}
export declare const ConnectionApprovalScreen: React.FC<ConnectionApprovalScreenProps>;
export {};
