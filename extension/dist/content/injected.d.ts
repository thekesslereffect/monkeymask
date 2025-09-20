export declare const PROVIDER_ERRORS: {
    readonly USER_REJECTED: {
        readonly code: 4001;
        readonly message: "User rejected the request";
    };
    readonly UNAUTHORIZED: {
        readonly code: 4100;
        readonly message: "Unauthorized - not connected to MonkeyMask";
    };
    readonly UNSUPPORTED_METHOD: {
        readonly code: 4200;
        readonly message: "Unsupported method";
    };
    readonly DISCONNECTED: {
        readonly code: 4900;
        readonly message: "Provider is disconnected";
    };
    readonly CHAIN_DISCONNECTED: {
        readonly code: 4901;
        readonly message: "Chain is disconnected";
    };
    readonly INVALID_PARAMS: {
        readonly code: -32602;
        readonly message: "Invalid method parameters";
    };
    readonly INTERNAL_ERROR: {
        readonly code: -32603;
        readonly message: "Internal error";
    };
};
export interface ProviderError extends Error {
    code: number;
    data?: unknown;
}
export interface ConnectOptions {
    onlyIfTrusted?: boolean;
}
export interface BananoProvider {
    connect(options?: ConnectOptions): Promise<{
        publicKey: string;
    }>;
    disconnect(): Promise<void>;
    getAccounts(): Promise<string[]>;
    getBalance(address?: string): Promise<string>;
    getAccountInfo(address?: string): Promise<any>;
    signBlock(block: any): Promise<any>;
    signMessage(message: Uint8Array | string, display?: 'utf8' | 'hex'): Promise<{
        signature: Uint8Array;
        publicKey: string;
    }>;
    sendBlock(block: any): Promise<string>;
    sendTransaction(fromAddress: string, toAddress: string, amount: string): Promise<{
        hash: string;
        block: any;
    }>;
    resolveBNS(bnsName: string): Promise<string>;
    isConnected: boolean;
    publicKey: string | null;
    on(event: string, handler: (...args: any[]) => void): void;
    off(event: string, handler: (...args: any[]) => void): void;
    removeAllListeners(): void;
    isMonkeyMask: boolean;
    isBanano: boolean;
}
