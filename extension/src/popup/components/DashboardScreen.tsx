import React, { useState, useEffect } from 'react';
import { bnsResolver } from '../../utils/bns';
import { Header, Card, Button, IconButton, ContentContainer, Footer, Separator, Drawer } from './ui';
import { Icon } from '@iconify/react';

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
}

interface DashboardScreenProps {
  onSendRequest: (account: Account) => void;
  onNavigate?: (screen: string) => void;
}

// Format balance to show up to 4 decimal places, removing trailing zeros
// if balance is greater than 100,000 add K, if greater than 1,000,000 add M, if greater than 1,000,000,000 add B
// add commas to the balance
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 100000) return (num / 100000).toFixed(2) + 'K';
  return num.toFixed(4).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onSendRequest,  onNavigate }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resolvingBNS, setResolvingBNS] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Resolve BNS names for all accounts
  const resolveBNSNames = async (accountsToResolve: Account[]) => {
    setResolvingBNS(true);
    try {
      const updatedAccounts = await Promise.all(
        accountsToResolve.map(async (account) => {
          try {
            const bnsNames = await bnsResolver.reverseResolve(account.address);
            return { ...account, bnsNames };
          } catch (error) {
            console.log('Failed to resolve BNS for', account.address, ':', error);
            return { ...account, bnsNames: [] };
          }
        })
      );
      
      // Only update accounts if we have valid data and preserve existing balance information
      setAccounts(prevAccounts => {
        // Merge BNS names with existing account data to preserve balances
        return prevAccounts.map(prevAccount => {
          const updatedAccount = updatedAccounts.find(acc => acc.address === prevAccount.address);
          if (updatedAccount) {
            // Preserve the existing balance and pending data, only update BNS names
            return {
              ...prevAccount,
              bnsNames: updatedAccount.bnsNames
            };
          }
          return prevAccount;
        });
      });
    } catch (error) {
      console.error('Failed to resolve BNS names:', error);
    } finally {
      setResolvingBNS(false);
    }
  };

  const loadAccounts = async () => {
    try {
      console.log('Loading accounts...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' });
      console.log('GET_ACCOUNTS response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        setLoading(false); // Set loading to false here first
        
        // Try to resolve BNS names in the background (non-blocking)
        setTimeout(() => {
          resolveBNSNames(response.data);
        }, 100);
        
        // Try to refresh balances, but don't block the UI if it fails
        try {
          console.log('Refreshing balances...');
          await refreshBalances();
        } catch (balanceError) {
          console.warn('Failed to refresh balances, but showing accounts anyway:', balanceError);
        }
      } else {
        setError(response.error || 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      console.log('Dashboard: Requesting balance update...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Balance refresh timeout')), 15000);
      });
      
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'UPDATE_BALANCES' }),
        timeoutPromise
      ]) as any;

      
      console.log('Dashboard: Balance update response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        console.log('Dashboard: Balances updated successfully');
      } else {
        console.warn('Dashboard: Balance update failed:', response.error);
      }
    } catch (error) {
      console.error('Dashboard: Failed to refresh balances:', error);
      // Don't show error to user, just log it
    } finally {
      setRefreshing(false);
    }
  };

  const handleReceivePending = async () => {
    if (accounts.length === 0) return;
    
    setRefreshing(true);
    try {
      console.log('Dashboard: Receiving pending transactions...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'RECEIVE_PENDING',
        address: accounts[0].address
      });
      
      if (response.success) {
        console.log('Dashboard: Received', response.data.received, 'pending transactions');
        
        // Refresh balances after receiving
        await refreshBalances();
      } else {
        console.warn('Dashboard: Failed to receive pending:', response.error);
      }
    } catch (error) {
      console.error('Dashboard: Error receiving pending:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewOnCreeper = (hash: string) => {
    window.open(`https://creeper.banano.cc/hash/${hash}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text-secondary">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-semibold">
      {/* Header */}
      <Header 
        title=""
        leftElement={<Drawer onNavigate={onNavigate} />}
        rightElement={
          <div className="">
            <IconButton
              onClick={refreshBalances}
              disabled={refreshing}
              icon={
                <span className={`text-2xl ${refreshing ? 'animate-spin' : ''}`}>
                  <Icon icon="lucide:refresh-cw" />
                </span>
              }
              title="Refresh balances"
            />
          </div>
        }
      />

    <ContentContainer className="!justify-start !overflow-y-auto">

      {/* Balance */}
        <div className="flex flex-col items-center gap-2 h-full min-h-36 justify-center">
          <div className="text-5xl text-primary">
            {formatBalance(accounts[0].balance)}
            {/* {formatBalance("19420.69")} */}
          </div>
          <div className="text-xl text-tertiary">
            {/* convert balance to fiat selection */}
            {/* implement fiat conversion */}
            ${formatBalance("1919.19")}
          </div>
        </div>

        {/* Core Buttons */}
        
          <div className="grid grid-cols-4 gap-4 w-full">
            {/* QR Code */}
            <Button 
                variant="secondary"
                size="lg"
                className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
                onClick={() => {console.log('Receive')}}
                disabled={refreshing || accounts.length === 0}
              >
                <Icon icon="lucide:qr-code" className="text-2xl mb-1" />
                <span className="text-xs">Receive</span>
            </Button>
            {/* Send */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
              onClick={() => accounts.length > 0 && onSendRequest(accounts[0])}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:send" className="text-2xl mb-1" />
              <span className="text-xs">Send</span>
            </Button>
            {/* Faucet */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
              onClick={() => {console.log('Faucet')}}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:droplet" className="text-2xl mb-1" />
              <span className="text-xs">Faucet</span>
            </Button>
            {/* Buy */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
              onClick={() => {console.log('Buy')}}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:dollar-sign" className="text-2xl mb-1" />
              <span className="text-xs">Buy</span>
            </Button>
            
          </div>


          {/* History */}
          <Card label="History" hintText="See More" hintOnClick={() => console.log('See More')} className="w-full">
           
              {/* list of transactions. use mock data array for now */}
              {[...Array(10)].map((_, i) => (
                <>
                <button key={i} className="flex justify-between items-center w-full hover:bg-tertiary/10 cursor-pointer transition-colors rounded-lg p-2 text-tertiary" onClick={() => handleViewOnCreeper('1234567890')}>
                  <div className="flex items-center gap-2">
                    <Icon icon={i % 2 === 0 ? "lucide:arrow-up-right" : "lucide:arrow-down-left"} 
                          className={i % 2 === 0 ? "text-destructive" : "text-primary"} />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{i % 2 === 0 ? "Sent" : "Received"}</span>
                      <span className="text-xs">ban_1abc...xyz</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm">{(Math.random() * 100).toFixed(2)} BAN</span>
                    <span className="text-xs">2 hours ago</span>
                  </div>
                </button>
                {i !== 9 && (
                <Separator className="w-full my-2" />
                )}
                </>
              ))}
              
          
          </Card>
      
      </ContentContainer>
      <Footer element={
          <div className="flex items-center w-full h-full justify-between">
            <button onClick={() => console.log('Home')} className="text-text-primary hover:text-primary transition-colors">
              <Icon icon="lucide:home" className="text-2xl" />
            </button>
            <button onClick={() => console.log('NFTs')} className="text-text-primary hover:text-primary transition-colors">
              <Icon icon="lucide:layout-grid" className="text-2xl" />
            </button>
            <button onClick={() => console.log('History')} className="text-text-primary hover:text-primary transition-colors">
              <Icon icon="lucide:clock" className="text-2xl" />
            </button>
            <button onClick={() => console.log('Explore')} className="text-text-primary hover:text-primary transition-colors">
              <Icon icon="lucide:compass" className="text-2xl" />
            </button>
          </div>
        }/>
    </div>
  );
};
