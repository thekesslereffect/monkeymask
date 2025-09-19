import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define all possible routes
export type Route = 
  | 'welcome'
  | 'create'
  | 'import' 
  | 'unlock'
  | 'dashboard'
  | 'send'
  | 'qr'
  | 'history'
  | 'nfts'
  | 'explore'
  | 'faucet'
  | 'buy'
  | 'settings'
  | 'connected-sites'
  | 'approval'
  | 'confirmation';

// Route parameters for dynamic routes
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

const RouterContext = createContext<RouterContextType | null>(null);

interface RouterProviderProps {
  children: ReactNode;
  initialRoute?: Route;
  initialParams?: RouteParams;
}

export const RouterProvider: React.FC<RouterProviderProps> = ({ 
  children, 
  initialRoute = 'welcome',
  initialParams = {}
}) => {
  const [routeStack, setRouteStack] = useState<Array<{ route: Route; params: RouteParams }>>([
    { route: initialRoute, params: initialParams }
  ]);

  const currentRoute = routeStack[routeStack.length - 1]?.route || 'welcome';
  const params = routeStack[routeStack.length - 1]?.params || {};
  const canGoBack = routeStack.length > 1;

  const push = useCallback((route: Route, params: RouteParams = {}) => {
    console.log(`Router: Navigating to ${route}`, params);
    setRouteStack(prev => [...prev, { route, params }]);
  }, []);

  const replace = useCallback((route: Route, params: RouteParams = {}) => {
    console.log(`Router: Replacing current route with ${route}`, params);
    setRouteStack(prev => [...prev.slice(0, -1), { route, params }]);
  }, []);

  const back = useCallback(() => {
    if (canGoBack) {
      console.log('Router: Going back');
      setRouteStack(prev => prev.slice(0, -1));
    }
  }, [canGoBack]);

  const value: RouterContextType = {
    currentRoute,
    params,
    push,
    replace,
    back,
    canGoBack
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

// Convenience hooks for common navigation patterns
export const useNavigation = () => {
  const router = useRouter();
  
  return {
    goToDashboard: () => router.replace('dashboard'),
    goToSend: (account: RouteParams['account']) => router.push('send', { account }),
    goToQR: (account: RouteParams['account']) => router.push('qr', { account }),
    goToHistory: () => router.push('history'),
    goToNFTs: () => router.push('nfts'),
    goToExplore: () => router.push('explore'),
    goToFaucet: () => router.push('faucet'),
    goToBuy: () => router.push('buy'),
    goToSettings: () => router.push('settings'),
    goToConnectedSites: () => router.push('connected-sites'),
    goToConfirmation: (transactionResult: RouteParams['transactionResult']) => 
      router.push('confirmation', { transactionResult }),
    goBack: router.back,
    canGoBack: router.canGoBack,
    // Direct router access for flexibility
    push: router.push,
    replace: router.replace,
    back: router.back
  };
};
