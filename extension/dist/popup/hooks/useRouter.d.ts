import React, { ReactNode } from 'react';
export type Route = 'welcome' | 'create' | 'import' | 'unlock' | 'dashboard' | 'send' | 'qr' | 'history' | 'nfts' | 'explore' | 'faucet' | 'settings' | 'connected-sites' | 'approval' | 'confirmation';
export interface RouteParams {
    account?: {
        address: string;
        name: string;
        balance: string;
    };
    pendingRequest?: any;
    transactionResult?: any;
}
interface RouterContextType {
    currentRoute: Route;
    params: RouteParams;
    push: (route: Route, params?: RouteParams) => void;
    replace: (route: Route, params?: RouteParams) => void;
    back: () => void;
    canGoBack: boolean;
}
interface RouterProviderProps {
    children: ReactNode;
    initialRoute?: Route;
    initialParams?: RouteParams;
}
export declare const RouterProvider: React.FC<RouterProviderProps>;
export declare const useRouter: () => RouterContextType;
export declare const useNavigation: () => {
    goToDashboard: () => void;
    goToSend: (account: RouteParams["account"]) => void;
    goToQR: (account: RouteParams["account"]) => void;
    goToHistory: () => void;
    goToNFTs: () => void;
    goToExplore: () => void;
    goToFaucet: () => void;
    goToSettings: () => void;
    goToConnectedSites: () => void;
    goToConfirmation: (transactionResult: RouteParams["transactionResult"]) => void;
    goBack: () => void;
    canGoBack: boolean;
    push: (route: Route, params?: RouteParams) => void;
    replace: (route: Route, params?: RouteParams) => void;
    back: () => void;
};
export {};
