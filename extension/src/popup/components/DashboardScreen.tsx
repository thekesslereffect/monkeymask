import React from 'react';
import { Header, Card, Button, ContentContainer, Footer, Separator, BalanceSkeleton, TransactionSkeleton } from './ui';
import { Icon } from '@iconify/react';
import { useNavigation } from '../hooks/useRouter';
import { useAccounts } from '../hooks/useAccounts';
import { formatBalance } from '../../utils/format';
import { TransactionRow } from './TransactionRow';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { accounts, currentAccount, loading, getUsdBalance, priceLoading } = useAccounts();

  if (loading) {
    return (
      <div className="h-full flex flex-col font-semibold">
        <Header active />
        <ContentContainer>
          {/* Balance Skeleton */}
          <div className="text-center mb-8">
            <BalanceSkeleton />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-3 mb-8">
            <div className="flex-1 h-12 bg-muted/30 rounded-lg animate-pulse" />
            <div className="flex-1 h-12 bg-muted/30 rounded-lg animate-pulse" />
            <div className="flex-1 h-12 bg-muted/30 rounded-lg animate-pulse" />
          </div>

          {/* Recent Transactions Skeleton */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-muted/30 rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted/30 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <TransactionSkeleton key={index} />
              ))}
            </div>
          </div>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  // Check if accounts exist and have data (but not while loading)
  if (!loading && (!accounts || accounts.length === 0)) {
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
            {formatBalance(currentAccount?.balance || '0')}
            {/* {formatBalance("19420.69")} */}
          </div>
          <div className="text-xl text-tertiary">
            {priceLoading ? (
              <span className="animate-pulse">Loading price...</span>
            ) : (
              `$${getUsdBalance(currentAccount?.balance || '0')}`
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
                onClick={() => currentAccount && navigation.goToQR(currentAccount)}
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
              onClick={() => currentAccount && navigation.goToSend(currentAccount)}
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
              onClick={() => window.open('https://banano.trade', '_blank')}
              disabled={accounts.length === 0}
            >
              <Icon icon="lucide:dollar-sign" className="text-2xl mb-1" />
              <span className="text-xs">Buy</span>
            </Button>
            
          </div>


          {/* History */}
          <Card label="History" hintText="See More" hintOnClick={() => navigation.goToHistory()} className="w-full">
              {!currentAccount?.transactions ? (
                // Show skeleton while transactions are loading
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <TransactionSkeleton key={index} />
                  ))}
                </div>
              ) : currentAccount.transactions.length > 0 ? (
                currentAccount.transactions.map((transaction, i) => (
                  <React.Fragment key={transaction.hash}>
                    <TransactionRow transaction={transaction} timestampFormat="date" />
                    {i !== (currentAccount?.transactions?.length || 0) - 1 && (
                      <Separator className="w-full my-2" />
                    )}
                  </React.Fragment>
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
