import React from 'react';
type ApprovalType = 'connect' | 'signMessage' | 'signBlock' | 'sendTransaction';
interface UnifiedApprovalRequest {
    id: string;
    origin: string;
    type: ApprovalType;
    data: any;
}
interface UnifiedApprovalScreenProps {
    request: UnifiedApprovalRequest;
    onApproveTx: (requestId: string) => void;
    onApproveConnect: (requestId: string, selectedAccounts: string[]) => void;
    onReject: (requestId: string) => void;
}
export declare const ApprovalScreen: React.FC<UnifiedApprovalScreenProps>;
export {};
