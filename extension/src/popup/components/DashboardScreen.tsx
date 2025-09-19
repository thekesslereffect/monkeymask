import React from 'react';
import { Header, Card, Button, ContentContainer, Footer, Separator } from './ui';
import { Icon } from '@iconify/react';
import { useNavigation } from '../hooks/useRouter';
import { useAccounts } from '../hooks/useAccounts';
import { formatBalance } from '../../utils/format';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { accounts, loading, getUsdBalance, priceLoading } = useAccounts();
  

  const handleViewOnCreeper = (hash: string) => {
    window.open(`https://creeper.banano.cc/hash/${hash}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-tertiary">Loading accounts...</div>
      </div>
    );
  }

  // Check if accounts exist and have data
  if (!accounts || accounts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-tertiary">No accounts found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-semibold">
      {/* Header */}
      <Header active={true}/>

    <ContentContainer>

      {/* Balance */}
        <div className="flex flex-col items-center gap-2 h-full min-h-36 justify-center">
          <div className="text-5xl text-primary">
            {formatBalance(accounts[0]?.balance || '0')}
            {/* {formatBalance("19420.69")} */}
          </div>
          <div className="text-xl text-tertiary">
            {priceLoading ? (
              <span className="animate-pulse">Loading price...</span>
            ) : (
              `$${getUsdBalance(accounts[0]?.balance || '0')}`
            )}
          </div>
        </div>

        {/* Core Buttons */}
        
          <div className="grid grid-cols-4 gap-4 w-full">
            {/* QR Code */}
            <Button 
                variant="secondary"
                size="lg"
                className="flex flex-col items-center justify-center text-tertiary hover:text-primary p-2 aspect-square "
                onClick={() => accounts.length > 0 && navigation.goToQR(accounts[0])}
                disabled={accounts.length === 0}
              >
                <Icon icon="lucide:qr-code" className="text-2xl mb-1" />
                <span className="text-xs">Receive</span>
            </Button>
            {/* Send */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary hover:text-primary p-2 aspect-square "
              onClick={() => accounts.length > 0 && navigation.goToSend(accounts[0])}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:send" className="text-2xl mb-1" />
              <span className="text-xs">Send</span>
            </Button>
            {/* Faucet */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary hover:text-primary p-2 aspect-square "
              onClick={() => navigation.goToFaucet()}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:droplet" className="text-2xl mb-1" />
              <span className="text-xs">Faucet</span>
            </Button>
            {/* Buy */}
            <Button 
              variant="secondary"
              size="lg"
              className="flex flex-col items-center justify-center text-tertiary hover:text-primary p-2 aspect-square "
              onClick={() => navigation.goToBuy()}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:dollar-sign" className="text-2xl mb-1" />
              <span className="text-xs">Buy</span>
            </Button>
            
          </div>


          {/* History */}
          <Card label="History" hintText="See More" hintOnClick={() => navigation.goToHistory()} className="w-full">
              {accounts[0]?.transactions && accounts[0].transactions.length > 0 ? (
                accounts[0].transactions.map((transaction, i) => (
                  <>
                  <button key={transaction.hash} className="flex justify-between items-center w-full hover:bg-tertiary/10 cursor-pointer transition-colors rounded-lg p-2 text-tertiary" onClick={() => handleViewOnCreeper(transaction.hash)}>
                    <div className="flex items-center gap-2">
                      <Icon icon={
                        transaction.type === 'send' ? "lucide:arrow-up-right" : 
                        transaction.type === 'receive' ? "lucide:arrow-down-left" :
                        transaction.type === 'open' ? "lucide:arrow-down-left" :
                        transaction.type === 'change' ? "lucide:settings" :
                        "lucide:circle"
                      } 
                      className={
                        transaction.type === 'send' ? "text-destructive" : 
                        transaction.type === 'receive' || transaction.type === 'open' ? "text-primary" :
                        transaction.type === 'change' ? "text-tertiary" :
                        "text-tertiary"
                      } />
                      <div className="flex flex-col items-start">
                        <span className="text-sm">
                          {transaction.type === 'send' ? "Sent" : 
                           transaction.type === 'receive' ? "Received" : 
                           transaction.type === 'open' ? "Opened" :
                           transaction.type === 'change' ? "Changed Rep" :
                           transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                        <span className="text-xs">{transaction.account.slice(0, 10)}...{transaction.account.slice(-6)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm">{parseFloat(transaction.amount).toFixed(2)} BAN</span>
                      <span className="text-xs">{new Date(parseInt(transaction.timestamp) * 1000).toLocaleDateString()}</span>
                    </div>
                  </button>
                  {i !== (accounts[0]?.transactions?.length || 0) - 1 && (
                  <Separator className="w-full my-2" />
                  )}
                  </>
                ))
              ) : (
                <div className="text-center py-4 text-tertiary">
                  <span className="text-sm">No transactions yet</span>
                </div>
              )}
          </Card>
      </ContentContainer>
      <Footer />
    </div>
  );
};
