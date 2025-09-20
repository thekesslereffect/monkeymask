import React from 'react';
interface FaucetScreenProps {
    account: {
        address: string;
        name: string;
        balance: string;
    };
}
export declare const FaucetScreen: React.FC<FaucetScreenProps>;
export {};
