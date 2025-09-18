import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CreateWalletScreen } from './components/CreateWalletScreen';
import { ImportWalletScreen } from './components/ImportWalletScreen';
import { UnlockScreen } from './components/UnlockScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { SendScreen } from './components/SendScreen';
import { TransactionApprovalScreen } from './components/TransactionApprovalScreen';
import { TransactionConfirmationScreen } from './components/TransactionConfirmationScreen';
import { ConnectionApprovalScreen } from './components/ConnectionApprovalScreen';
import { SigningApprovalScreen } from './components/SigningApprovalScreen';
import { ConnectedSitesScreen } from './components/ConnectedSitesScreen';
import { SettingsScreen } from './components/SettingsScreen';
import './styles.css';

export type Screen = 'welcome' | 'create' | 'import' | 'unlock' | 'dashboard' | 'send' | 'approval' | 'confirmation' | 'connected-sites' | 'settings';

interface Account {
  address: string;
  name: string;
  balance: string;
}

interface WalletState {
  isInitialized: boolean;
  isUnlocked: boolean;
}

interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  block?: {
    type: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
  };
}

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [walletState, setWalletState] = useState<WalletState>({
    isInitialized: false,
    isUnlocked: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);

  useEffect(() => {
    console.log('App: useEffect triggered - initializing...');
    
    // Check for pending requests first, then wallet state
    const initializeApp = async () => {
      console.log('App: Starting app initialization...');
      try {
        // Check for pending requests once, then check wallet state
        await checkPendingRequests();
        await checkWalletState();
        console.log('App: App initialization complete');
      } catch (error) {
        console.error('App: Error during initialization:', error);
        setLoading(false);
      }
    };
    
    initializeApp();
    
    // Check for pending requests when the popup becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && currentScreen !== 'approval') {
        console.log('App: Popup became visible, checking for pending requests...');
        checkPendingRequests();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set up minimal polling for pending requests (only when not on approval screen)
    const pollForPendingRequests = () => {
      let attempts = 0;
      const maxAttempts = 3; // Reduced to 3 attempts
      
      const poll = () => {
        if (attempts < maxAttempts && currentScreen !== 'approval') {
          console.log(`App: Polling for pending requests (attempt ${attempts + 1}/${maxAttempts})`);
          checkPendingRequests();
          attempts++;
          setTimeout(poll, 1000); // Check every 1 second instead of 500ms
        }
      };
      
      setTimeout(poll, 500); // Start after 500ms
    };
    
    pollForPendingRequests();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Track screen changes for debugging
  useEffect(() => {
    console.log('App: Screen changed to:', currentScreen);
  }, [currentScreen]);

  const checkPendingRequests = async () => {
    try {
      console.log('App: Checking for pending requests...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_APPROVAL' });
      console.log('App: Pending approval response:', response);
      
      if (response.success && response.data) {
        console.log('App: Found pending request:', response.data);
        setPendingRequest(response.data);
        setCurrentScreen('approval');
        console.log('App: Switched to approval screen');
      } else {
        console.log('App: No pending requests found');
      }
    } catch (error) {
      console.log('App: Error checking pending requests:', error);
    }
  };

  const checkWalletState = async () => {
    try {
      console.log('App: Checking wallet state...');
      console.log('App: Current screen before wallet state check:', currentScreen);
      const response = await chrome.runtime.sendMessage({ type: 'GET_WALLET_STATE' });
      console.log('App: Wallet state response:', response);
      
      if (response.success) {
        setWalletState(response.data);
        
        // Only set the screen if we don't have a pending approval request
        if (currentScreen !== 'approval') {
          if (response.data.isUnlocked) {
            console.log('App: Wallet is unlocked, going to dashboard');
            setCurrentScreen('dashboard');
          } else if (response.data.isInitialized) {
            console.log('App: Wallet is initialized but locked, going to unlock');
            setCurrentScreen('unlock');
          } else {
            console.log('App: Wallet not initialized, going to welcome');
            setCurrentScreen('welcome');
          }
        } else {
          console.log('App: Keeping approval screen active, not overriding');
        }
      }
    } catch (error) {
      console.error('Failed to check wallet state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletCreated = () => {
    console.log('App: Wallet created, setting state and going to dashboard');
    setWalletState(prev => ({ ...prev, isInitialized: true, isUnlocked: true }));
    setCurrentScreen('dashboard');
  };

  const handleWalletImported = () => {
    console.log('App: Wallet imported, setting state and going to dashboard');
    setWalletState(prev => ({ ...prev, isInitialized: true, isUnlocked: true }));
    setCurrentScreen('dashboard');
  };

  const handleWalletUnlocked = () => {
    console.log('App: Wallet unlocked');
    setWalletState(prev => ({ ...prev, isUnlocked: true }));
    
    // If we have a pending request, go to approval screen, otherwise go to dashboard
    if (pendingRequest) {
      console.log('App: Wallet unlocked with pending request, going to approval screen');
      setCurrentScreen('approval');
    } else {
      console.log('App: Wallet unlocked, going to dashboard');
      setCurrentScreen('dashboard');
    }
  };

  const handleWalletLocked = () => {
    setWalletState(prev => ({ ...prev, isUnlocked: false }));
    setCurrentScreen('unlock');
  };

  const handleSendRequest = (account: Account) => {
    setSelectedAccount(account);
    setCurrentScreen('send');
  };

  const handleSendComplete = (result: { success: boolean; hash?: string; error?: string; block?: any }) => {
    console.log('Transaction result:', result);
    setTransactionResult(result);
    setCurrentScreen('confirmation');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleCloseConfirmation = () => {
    setTransactionResult(null);
    setCurrentScreen('dashboard');
  };

  const handleApproveTransaction = async (requestId: string) => {
    try {
      console.log('App: Approving transaction:', requestId);
      await chrome.runtime.sendMessage({ 
        type: 'APPROVE_TRANSACTION', 
        requestId 
      });
      
      // Wait a moment for the transaction to process
      console.log('App: Transaction approved, waiting for completion...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get the transaction result
      console.log('App: Getting transaction result...');
      const resultResponse = await chrome.runtime.sendMessage({
        type: 'GET_TRANSACTION_RESULT',
        requestId
      });
      
      if (resultResponse.success && resultResponse.data) {
        console.log('App: Got transaction result:', resultResponse.data);
        setTransactionResult(resultResponse.data);
        setPendingRequest(null);
        setCurrentScreen('confirmation');
      } else {
        console.log('App: No transaction result found, going to dashboard');
        setPendingRequest(null);
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      setPendingRequest(null);
      setCurrentScreen('dashboard');
    }
  };

  const handleRejectTransaction = async (requestId: string) => {
    try {
      await chrome.runtime.sendMessage({ 
        type: 'REJECT_TRANSACTION', 
        requestId 
      });
      setPendingRequest(null);
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Failed to reject transaction:', error);
    }
  };

  const handleApproveConnection = async (requestId: string, selectedAccounts: string[]) => {
    try {
      console.log('App: Approving connection:', requestId, 'accounts:', selectedAccounts);
      await chrome.runtime.sendMessage({ 
        type: 'APPROVE_TRANSACTION', 
        requestId,
        accounts: selectedAccounts
      });
      
      // Connection requests don't need result checking, just go back to dashboard
      setPendingRequest(null);
      setCurrentScreen('dashboard');
    } catch (error) {
      console.error('Failed to approve connection:', error);
      setPendingRequest(null);
      setCurrentScreen('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-white text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {currentScreen === 'welcome' && (
        <WelcomeScreen
          onCreateWallet={() => setCurrentScreen('create')}
          onImportWallet={() => setCurrentScreen('import')}
        />
      )}
      
      {currentScreen === 'create' && (
        <CreateWalletScreen
          onWalletCreated={handleWalletCreated}
          onBack={() => setCurrentScreen('welcome')}
        />
      )}
      
      {currentScreen === 'import' && (
        <ImportWalletScreen
          onWalletImported={handleWalletImported}
          onBack={() => setCurrentScreen('welcome')}
        />
      )}
      
      {currentScreen === 'unlock' && (
        <UnlockScreen
          onWalletUnlocked={handleWalletUnlocked}
        />
      )}
      
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          onSendRequest={handleSendRequest}
          onNavigate={(screen) => {
            if (screen === 'ConnectedSitesScreen') {
              setCurrentScreen('connected-sites');
            } else if (screen === 'SettingsScreen') {
              setCurrentScreen('settings');
            } else if (screen === 'UnlockScreen') {
              handleWalletLocked();
            }
          }}
        />
      )}
      
      {currentScreen === 'send' && selectedAccount && (
        <SendScreen
          account={selectedAccount}
          onBack={handleBackToDashboard}
          onSendComplete={handleSendComplete}
        />
      )}
      
      {currentScreen === 'approval' && pendingRequest && (
        <>
          {/* If wallet is locked, show unlock screen first for all request types */}
          {!walletState.isUnlocked && (
            <UnlockScreen
              onWalletUnlocked={handleWalletUnlocked}
              showPendingRequest={true}
              pendingRequestType={pendingRequest.type}
              onReject={() => handleRejectTransaction(pendingRequest.id)}
            />
          )}
          
          {/* Show approval screens only when wallet is unlocked */}
          {walletState.isUnlocked && (
            <>
              {pendingRequest.type === 'connect' && (
                <ConnectionApprovalScreen
                  request={pendingRequest}
                  onApprove={handleApproveConnection}
                  onReject={handleRejectTransaction}
                />
              )}
              
              {(pendingRequest.type === 'signMessage' || pendingRequest.type === 'signBlock') && (
                <SigningApprovalScreen
                  request={pendingRequest}
                  onApprove={handleApproveTransaction}
                  onReject={handleRejectTransaction}
                />
              )}
              
              {pendingRequest.type === 'sendTransaction' && (
                <TransactionApprovalScreen
                  request={pendingRequest}
                  onApprove={handleApproveTransaction}
                  onReject={handleRejectTransaction}
                />
              )}
            </>
          )}
        </>
      )}
      
      {currentScreen === 'connected-sites' && (
        <ConnectedSitesScreen
          onBack={handleBackToDashboard}
        />
      )}
      
      {currentScreen === 'settings' && (
        <SettingsScreen
          onBack={handleBackToDashboard}
        />
      )}
      
      {currentScreen === 'confirmation' && transactionResult && (
        <TransactionConfirmationScreen
          result={transactionResult}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
};
