import React from 'react';
import { useRouter, useNavigation } from '../hooks/useRouter';

// Import all screen components
import { WelcomeScreen } from './WelcomeScreen';
import { CreateWalletScreen } from './CreateWalletScreen';
import { ImportWalletScreen } from './ImportWalletScreen';
import { UnlockScreen } from './UnlockScreen';
import { DashboardScreen } from './DashboardScreen';
import { SendScreen } from './SendScreen';
import { TransactionApprovalScreen } from './TransactionApprovalScreen';
import { TransactionConfirmationScreen } from './TransactionConfirmationScreen';
import { ConnectionApprovalScreen } from './ConnectionApprovalScreen';
import { SigningApprovalScreen } from './SigningApprovalScreen';
import { ConnectedSitesScreen } from './ConnectedSitesScreen';
import { SettingsScreen } from './SettingsScreen';
import { QRScreen } from './QRScreen';
import { HistoryScreen } from './HistoryScreen';

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

export const Router: React.FC<RouterProps> = ({
  walletState,
  onWalletCreated,
  onWalletImported,
  onWalletUnlocked,
  onWalletLocked,
  onSendComplete,
  onApproveTransaction,
  onRejectTransaction,
  onApproveConnection
}) => {
  const router = useRouter();
  const { currentRoute, params } = router;
  const navigation = useNavigation();

  // Route components mapping
  const routes = {
    welcome: () => (
      <WelcomeScreen 
        onCreateWallet={() => router.push('create')}
        onImportWallet={() => router.push('import')}
      />
    ),
    
    create: () => (
      <CreateWalletScreen
        onWalletCreated={onWalletCreated}
        onBack={() => navigation.goBack()}
      />
    ),
    
    import: () => (
      <ImportWalletScreen
        onWalletImported={onWalletImported}
        onBack={() => navigation.goBack()}
      />
    ),
    
    unlock: () => (
      <UnlockScreen
        onWalletUnlocked={onWalletUnlocked}
        showPendingRequest={!!params.pendingRequest}
        pendingRequestType={params.pendingRequest?.type}
        onReject={() => params.pendingRequest && onRejectTransaction(params.pendingRequest.id)}
      />
    ),
    
    dashboard: () => (
      <DashboardScreen />
    ),
    
    send: () => {
      if (!params.account) {
        console.error('Send route requires account parameter');
        return <div>Error: No account selected</div>;
      }
      return (
        <SendScreen
          account={params.account}
          onSendComplete={onSendComplete}
        />
      );
    },
    
    qr: () => {
      if (!params.account) {
        console.error('QR route requires account parameter');
        return <div>Error: No account selected</div>;
      }
      return (
        <QRScreen
          account={params.account}
        />
      );
    },
    
    history: () => (
      <HistoryScreen />
    ),
    
    settings: () => (
      <SettingsScreen />
    ),
    
    'connected-sites': () => (
      <ConnectedSitesScreen />
    ),
    
    approval: () => {
      console.log('Router: Rendering approval route');
      console.log('Router: Params:', params);
      console.log('Router: Wallet state:', walletState);
      
      if (!params.pendingRequest) {
        console.error('Approval route requires pendingRequest parameter');
        return <div>Error: No pending request</div>;
      }

      const { pendingRequest } = params;
      console.log('Router: Processing pending request:', pendingRequest);
      
      // Show unlock screen first if wallet is locked
      if (!walletState.isUnlocked) {
        console.log('Router: Wallet is locked, showing unlock screen');
        return (
          <UnlockScreen
            onWalletUnlocked={onWalletUnlocked}
            showPendingRequest={true}
            pendingRequestType={pendingRequest.type}
            onReject={() => onRejectTransaction(pendingRequest.id)}
          />
        );
      }

      // Show appropriate approval screen based on request type
      console.log('Router: Wallet is unlocked, showing approval screen for type:', pendingRequest.type);
      switch (pendingRequest.type) {
        case 'connect':
          console.log('Router: Rendering ConnectionApprovalScreen');
          return (
            <ConnectionApprovalScreen
              request={pendingRequest}
              onApprove={onApproveConnection}
              onReject={onRejectTransaction}
            />
          );
          
        case 'signMessage':
        case 'signBlock':
          console.log('Router: Rendering SigningApprovalScreen');
          return (
            <SigningApprovalScreen
              request={pendingRequest}
              onApprove={onApproveTransaction}
              onReject={onRejectTransaction}
            />
          );
          
        case 'sendTransaction':
          console.log('Router: Rendering TransactionApprovalScreen');
          return (
            <TransactionApprovalScreen
              request={pendingRequest}
              onApprove={onApproveTransaction}
              onReject={onRejectTransaction}
            />
          );
          
        default:
          console.error('Router: Unknown request type:', pendingRequest.type);
          return <div>Error: Unknown request type: {pendingRequest.type}</div>;
      }
    },
    
    confirmation: () => {
      console.log('Router: Rendering confirmation route with params:', params);
      if (!params.transactionResult) {
        console.error('Confirmation route requires transactionResult parameter');
        return <div>Error: No transaction result</div>;
      }
      return (
        <TransactionConfirmationScreen
          result={params.transactionResult}
          onClose={() => navigation.goToDashboard()}
        />
      );
    }
  };

  const RouteComponent = routes[currentRoute];
  
  if (!RouteComponent) {
    console.error(`Unknown route: ${currentRoute}`);
    return <div>Error: Route not found</div>;
  }

  return <RouteComponent />;
};
