import React from 'react';
interface SigningApprovalScreenProps {
    request: {
        id: string;
        origin: string;
        type: 'signMessage' | 'signBlock';
        data: {
            message?: string;
            display?: string;
            block?: any;
            account?: string;
            publicKey?: string;
            origin: string;
        };
    };
    onApprove: (requestId: string) => void;
    onReject: (requestId: string) => void;
}
export declare const SigningApprovalScreen: React.FC<SigningApprovalScreenProps>;
export {};
