import React from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
import { Icon } from '@iconify/react';

interface SigningApprovalScreenProps {
  request: {
    id: string;
    origin: string;
    type: 'signMessage' | 'signBlock';
    data: {
      message?: string;
      display?: string;
      block?: any;
      account?: string;
      publicKey?: string;
      origin: string;
    };
  };
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const SigningApprovalScreen: React.FC<SigningApprovalScreenProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const handleApprove = () => {
    onApprove(request.id);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  // Extract domain from origin for display
  const domain = request.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const isMessageSigning = request.type === 'signMessage';

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />

      <ContentContainer>
        <PageName name={isMessageSigning ? 'Sign Message' : 'Sign Block'} back={false} />
        
        <div className="w-full space-y-4">
          {/* Site Info Card */}
          <Card label="Site Details" className="w-full">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {domain.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm text-tertiary font-semibold">{domain}</div>
                <div className="text-xs text-tertiary/70">{request.origin}</div>
                <div className="text-xs text-tertiary/70 mt-2">
                  {isMessageSigning ? 'A website wants you to sign a message' : 'A website wants you to sign a block'}
                </div>
              </div>
            </div>
          </Card>

          {/* Account Info Card */}
          <Card label="Signing Account" className="w-full">
            <div className="text-xs font-mono text-tertiary bg-tertiary/10 rounded px-3 py-2">
              {(request.data.publicKey || request.data.account || 'Unknown').slice(0, 12)}...
              {(request.data.publicKey || request.data.account || 'Unknown').slice(-8)}
            </div>
          </Card>

          {/* Content to Sign Card */}
          <Card label={isMessageSigning ? 'Message to Sign' : 'Block to Sign'} className="w-full">
            {isMessageSigning ? (
              <div>
                <div className="text-xs text-tertiary/70 mb-2">
                  Display format: {request.data.display || 'utf8'}
                </div>
                <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
                  {request.data.message || 'No message provided'}
                </div>
              </div>
            ) : (
              <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
                <pre>{JSON.stringify(request.data.block || {}, null, 2)}</pre>
              </div>
            )}
          </Card>

          {/* Warning Alert */}
          <Alert variant="warning" className="w-full">
            <Icon icon="lucide:alert-triangle" className="text-lg" />
            <div>
              <div className="font-semibold mb-1">Verify before signing</div>
              <div className="text-sm">
                {isMessageSigning 
                  ? 'Signing this message proves you own this account. Only sign messages you understand and trust.'
                  : 'Signing this block will authorize a blockchain transaction. Make sure you understand what this block does.'
                }
              </div>
            </div>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={handleReject}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              className="flex-1"
            >
              Sign
            </Button>
          </div>
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
