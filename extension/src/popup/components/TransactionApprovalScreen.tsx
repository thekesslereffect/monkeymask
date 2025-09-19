import React, { useState } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
import { Icon } from '@iconify/react';
import { formatBalance } from '../../utils/format';

interface TransactionRequest {
  id: string;
  origin: string;
  type: 'sendTransaction' | 'signBlock';
  data: {
    fromAddress?: string;
    toAddress?: string;
    amount?: string;
    block?: any;
  };
}

interface TransactionApprovalScreenProps {
  request: TransactionRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}


// Format address for display
const formatAddress = (address: string): string => {
  if (address.length <= 20) return address;
  return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
};

export const TransactionApprovalScreen: React.FC<TransactionApprovalScreenProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      onApprove(request.id);
    } catch (error) {
      console.error('Error approving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    onReject(request.id);
  };

  // Extract domain from origin for display
  const domain = request.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  const renderTransactionContent = () => {
    if (request.type === 'sendTransaction') {
      return (
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
                  This site wants to send Banano from your wallet.
                </div>
              </div>
            </div>
          </Card>

          {/* Transaction Details Card */}
          <Card label="Transaction Details" className="w-full">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                <span className="text-sm text-tertiary">From</span>
                <span className="text-sm font-mono text-tertiary">
                  {formatAddress(request.data.fromAddress || '')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                <span className="text-sm text-tertiary">To</span>
                <span className="text-sm font-mono text-tertiary">
                  {formatAddress(request.data.toAddress || '')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-tertiary">Amount</span>
                <span className="text-lg font-semibold text-primary">
                  {formatBalance(request.data.amount || '0')} BAN
                </span>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    if (request.type === 'signBlock') {
      return (
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
                  This site wants to sign a block with your wallet.
                </div>
              </div>
            </div>
          </Card>

          {/* Block Details Card */}
          <Card label="Block to Sign" className="w-full">
            <div className="font-mono text-xs bg-tertiary/10 border border-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
              {JSON.stringify(request.data.block, null, 2)}
            </div>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />

      <ContentContainer>
        <PageName name="Transaction Approval" back={false} />
        
        {renderTransactionContent()}

        {/* Warning Alert */}
        <Alert variant="warning" className="w-full mt-4">
          <Icon icon="lucide:shield-alert" className="text-lg" />
          <div>
            <div className="font-semibold mb-1">Review carefully</div>
            <div className="text-sm">
              Only approve transactions you trust and understand. This action cannot be undone.
            </div>
          </div>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3 w-full mt-4">
          <Button
            variant="secondary"
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Icon icon="lucide:loader-2" className="animate-spin mr-2" /> : null}
            Reject
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={loading}
            className="flex-1"
          >
            {loading ? <Icon icon="lucide:loader-2" className="animate-spin mr-2" /> : null}
            {loading ? 'Approving...' : 'Approve'}
          </Button>
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
