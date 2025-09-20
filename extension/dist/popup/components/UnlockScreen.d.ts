import React from 'react';
interface UnlockScreenProps {
    onWalletUnlocked: () => void;
    showPendingRequest?: boolean;
    pendingRequestType?: string;
    onReject?: () => void;
}
export declare const UnlockScreen: React.FC<UnlockScreenProps>;
export {};
