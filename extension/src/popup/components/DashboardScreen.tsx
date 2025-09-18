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
        <div className="text-text-secondary">Loading accounts...</div>
      </div>
    );
  }

  // Check if accounts exist and have data
  if (!accounts || accounts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text-secondary">No accounts found</div>
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
                className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
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
              className="flex flex-col items-center justify-center text-tertiary p-2 aspect-square "
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
      <Footer />
    </div>
  );
};
