import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter, useNavigation } from './hooks/useRouter';
import { AccountsProvider, useAccounts } from './hooks/useAccounts';
import { Router } from './components/Router';
import './styles.css';

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

// Main App wrapper with router and accounts providers
export const App: React.FC = () => {
  return (
    <RouterProvider initialRoute="welcome">
      <AccountsProvider>
        <AppContent />
      </AccountsProvider>
    </RouterProvider>
  );
};

// App content that uses the router
const AppContent: React.FC = () => {
  console.log('🚀 AppContent component loaded');
  const router = useRouter();
  const navigation = useNavigation();
  const { reloadAccounts } = useAccounts();
  
  const [walletState, setWalletState] = useState<WalletState>({
    isInitialized: false,
    isUnlocked: false
  });
  const [loading, setLoading] = useState(true);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    console.log('App: useEffect triggered - initializing...');
    
    // Check for pending requests first, then wallet state
    const initializeApp = async () => {
      console.log('App: Starting app initialization...');
      try {
        // Check for pending requests first
        console.log('App: Step 1 - Checking for pending requests...');
        await checkPendingRequests();
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then check wallet state (but respect any pending request that was found)
        console.log('App: Step 2 - Checking wallet state...');
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
      console.log('App: Visibility changed, document.hidden:', document.hidden);
      console.log('App: Current route:', router.currentRoute);
      console.log('App: Pending request state:', !!pendingRequest);
      
      if (!document.hidden) {
        console.log('App: Popup became visible, checking for pending requests...');
        checkPendingRequests();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check when window gains focus (for popup opening)
    const handleFocus = () => {
      console.log('App: Window gained focus, checking for pending requests...');
      checkPendingRequests();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Check immediately after a short delay (popup might be opening)
    const delayedCheck = setTimeout(() => {
      console.log('App: Delayed check for pending requests...');
      checkPendingRequests();
    }, 500);
    
    // Disable all polling - only check on initialization and visibility changes
    // This prevents the continuous GET_PENDING_APPROVAL calls that interfere with password input
    console.log('App: Polling disabled to prevent interference with unlock screen');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(delayedCheck);
    };
  }, []);

  // Track route changes for debugging
  useEffect(() => {
    console.log('App: Route changed to:', router.currentRoute);
  }, [router.currentRoute]);

  const checkPendingRequests = async () => {
    try {
      console.log('App: Checking for pending requests...');
      console.log('App: Current route before check:', router.currentRoute);
      console.log('App: Current pending request state:', pendingRequest);
      
      const response = await chrome.runtime.sendMessage({ type: 'GET_PENDING_APPROVAL' });
      console.log('App: Pending approval response:', response);
      
      if (response.success && response.data) {
        console.log('App: Found pending request:', response.data);
        console.log('App: Request type:', response.data.type);
        console.log('App: Request origin:', response.data.origin);
        
        // Only update state and navigate if we don't already have this request
        if (!pendingRequest || pendingRequest.id !== response.data.id) {
          console.log('App: Setting pending request and navigating to approval');
          setPendingRequest(response.data);
          router.push('approval', { pendingRequest: response.data });
          console.log('App: Navigation command sent - route should change to approval');
        } else {
          console.log('App: Already handling this pending request, skipping navigation');
        }
      } else {
        console.log('App: No pending requests found - response data:', response.data);
        // Clear pending request if none found
        if (pendingRequest) {
          console.log('App: Clearing existing pending request');
          setPendingRequest(null);
        }
      }
    } catch (error) {
      console.log('App: Error checking pending requests:', error);
    }
  };

  const checkWalletState = async () => {
    try {
      console.log('App: Checking wallet state...');
      console.log('App: Current route before wallet state check:', router.currentRoute);
      const response = await chrome.runtime.sendMessage({ type: 'GET_WALLET_STATE' });
      console.log('App: Wallet state response:', response);
      
      if (response.success) {
        setWalletState(response.data);
        
        // Only set the route if we don't have a pending approval request
        const hasApprovalRequest = router.currentRoute === 'approval' || pendingRequest !== null;
        if (!hasApprovalRequest) {
          if (response.data.isUnlocked) {
            console.log('App: Wallet is unlocked, going to dashboard');
            router.replace('dashboard');
          } else if (response.data.isInitialized) {
            console.log('App: Wallet is initialized but locked, going to unlock');
            router.replace('unlock');
          } else {
            console.log('App: Wallet not initialized, going to welcome');
            router.replace('welcome');
          }
        } else {
          console.log('App: Keeping approval screen active, not overriding. Current route:', router.currentRoute, 'Pending request:', !!pendingRequest);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletCreated = async () => {
    console.log('App: Wallet created, setting state and going to dashboard');
    setWalletState(prev => ({ ...prev, isInitialized: true, isUnlocked: true }));
    // Reload accounts to ensure they're available when dashboard loads
    await reloadAccounts();
    navigation.goToDashboard();
  };

  const handleWalletImported = async () => {
    console.log('App: Wallet imported, setting state and going to dashboard');
    setWalletState(prev => ({ ...prev, isInitialized: true, isUnlocked: true }));
    // Reload accounts to ensure they're available when dashboard loads
    await reloadAccounts();
    navigation.goToDashboard();
  };

  const handleWalletUnlocked = async () => {
    console.log('App: Wallet unlocked');
    setWalletState(prev => ({ ...prev, isUnlocked: true }));
    
    // Reload accounts to ensure they're fresh when dashboard loads
    await reloadAccounts();
    
    // If we have a pending request, go to approval screen, otherwise go to dashboard
    if (pendingRequest) {
      console.log('App: Wallet unlocked with pending request, going to approval screen');
      router.push('approval', { pendingRequest });
    } else {
      console.log('App: Wallet unlocked, going to dashboard');
      navigation.goToDashboard();
    }
  };

  const handleWalletLocked = () => {
    setWalletState(prev => ({ ...prev, isUnlocked: false }));
    router.replace('unlock');
  };

  const handleSendComplete = (result: { success: boolean; hash?: string; error?: string; block?: any }) => {
    console.log('Transaction result:', result);
    navigation.goToConfirmation(result);
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
        setPendingRequest(null);
        navigation.goToConfirmation(resultResponse.data);
      } else {
        console.log('App: No transaction result found, going to dashboard');
        setPendingRequest(null);
        navigation.goToDashboard();
      }
    } catch (error) {
      console.error('Failed to approve transaction:', error);
      setPendingRequest(null);
      navigation.goToDashboard();
    }
  };

  const handleRejectTransaction = async (requestId: string) => {
    try {
      await chrome.runtime.sendMessage({ 
        type: 'REJECT_TRANSACTION', 
        requestId 
      });
      setPendingRequest(null);
      navigation.goToDashboard();
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
      navigation.goToDashboard();
    } catch (error) {
      console.error('Failed to approve connection:', error);
      setPendingRequest(null);
      navigation.goToDashboard();
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
      <Router
        walletState={walletState}
        onWalletCreated={handleWalletCreated}
        onWalletImported={handleWalletImported}
        onWalletUnlocked={handleWalletUnlocked}
        onWalletLocked={handleWalletLocked}
        onSendComplete={handleSendComplete}
        onApproveTransaction={handleApproveTransaction}
        onRejectTransaction={handleRejectTransaction}
        onApproveConnection={handleApproveConnection}
      />
    </div>
  );
};
