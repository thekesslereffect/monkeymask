import React, { useState } from 'react';
import { Header, Input, Button, Alert, Footer, ContentContainer } from './ui';

interface UnlockScreenProps {
  onWalletUnlocked: () => void;
  showPendingRequest?: boolean;
  pendingRequestType?: string;
  onReject?: () => void;
}

const getActionText = (requestType?: string): string => {
  switch (requestType) {
    case 'sendTransaction':
      return 'send a transaction';
    case 'signMessage':
      return 'sign a message';
    case 'signBlock':
      return 'sign a block';
    default:
      return 'continue';
  }
};

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onWalletUnlocked, showPendingRequest, pendingRequestType, onReject }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        password
      });

      if (response.success) {
        onWalletUnlocked();
      } else {
        setError(response.error || 'Invalid password');
      }
    } catch (error) {
      setError('Failed to unlock wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Header />
      

      {/* Main Content */}
      <ContentContainer>
        {/* Monkey Emoji */}
        <div className="flex flex-col items-center h-min min-h-48 justify-center text-center">
          <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp" type="image/webp" />
            <img 
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.gif" 
              alt="🙈" 
              width="128" 
              height="128"
              className="mx-auto"
            />
          </picture>
        </div>
        
        {/* Form */}
        <form onSubmit={handleUnlock} className="w-full space-y-4">
          <Input
            label="Unlock"
            hintText="Forget?"
            hintTooltip="You're out of luck! You'll have to reimport your seed phrase."
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            autoFocus
            variant="secondary"
            size="lg"
            className="text-center"
          />

          {error && (
            <Alert variant="warning">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
          
          {showPendingRequest && onReject && (
            <Button
              type="button"
              onClick={onReject}
              disabled={loading}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Reject Request
            </Button>
          )}
        </form>
      </ContentContainer>
      <Footer active={false} />
    </div>
  );
};
