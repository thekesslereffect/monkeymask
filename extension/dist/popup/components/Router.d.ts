import React from 'react';
interface RouterProps {
    walletState: {
        isInitialized: boolean;
        isUnlocked: boolean;
    };
    onWalletCreated: () => void;
    onWalletImported: () => void;
    onWalletUnlocked: () => void;
    onWalletLocked: () => void;
    onSendComplete: (result: any) => void;
    onApproveTransaction: (requestId: string) => void;
    onRejectTransaction: (requestId: string) => void;
    onApproveConnection: (requestId: string, accounts: string[]) => void;
}
export declare const Router: React.FC<RouterProps>;
export {};
