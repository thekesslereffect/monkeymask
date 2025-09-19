import React, { useState } from 'react';
import { Header, ContentContainer, Footer, Button, Card, Input } from './ui';
import { PageName } from './ui/PageName';
import { Icon } from '@iconify/react';
import { useAccounts } from '../hooks/useAccounts';

interface FaucetScreenProps {
  account: {
    address: string;
    name: string;
    balance: string;
  };
}

export const FaucetScreen: React.FC<FaucetScreenProps> = ({ account }) => {
  const { getUsdBalance, priceLoading } = useAccounts();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleClaim = async () => {
    setMessage('');
    setLoading(true);
    try {
      // Placeholder: in future, call background or external faucet API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Faucet claim requested. Check your account shortly.');
    } catch (e) {
      setMessage('Failed to request faucet. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active={true} />
      <ContentContainer>
        <PageName name="Faucet" back />

        <div className="flex flex-col items-center gap-2 h-full min-h-36 justify-center">
          <div className="text-5xl text-primary">69,696,969</div>
          <div className="text-xl text-tertiary">
            {priceLoading ? (
              <span className="animate-pulse">Loading price...</span>
            ) : (
              `$${getUsdBalance('69696969')}`
            )}
          </div>
        </div>

        <Card hintText="Donate" hintOnClick={() => console.log('Donate')} className="w-full px-6 py-4 h-full">
          <div className="flex items-center justify-center text-sm text-tertiary">
            Daily Claim Limit = 0.1 BAN
          </div>
        </Card>
        <Button variant="primary" size="lg" onClick={handleClaim} disabled={loading}>
          {loading ? 'Requesting…' : 'Claim'}
        </Button>

        {message && (
          <div className="text-center text-xs text-tertiary mt-3">{message}</div>
        )}
      </ContentContainer>
      <Footer />
    </div>
  );
};


