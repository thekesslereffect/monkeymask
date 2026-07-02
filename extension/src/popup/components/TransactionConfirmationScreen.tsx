import React from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
import { Icon } from '@iconify/react';
import { formatBalance, truncateMiddle, openCreeperHash } from '../../utils/format';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

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

interface TransactionConfirmationScreenProps {
  result: TransactionResult;
  onClose: () => void;
}

export const TransactionConfirmationScreen: React.FC<TransactionConfirmationScreenProps> = ({
  result,
  onClose
}) => {
  console.log('TransactionConfirmationScreen: Rendering with result:', result);
  const { copy, copied } = useCopyToClipboard();

  const handleViewOnCreeper = () => {
    if (result.hash) openCreeperHash(result.hash);
  };

  const handleCopyHash = () => {
    if (result.hash) copy(result.hash);
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />

      <ContentContainer>
        <div className="flex items-center justify-between mb-4">
          <PageName name={result.success ? 'Transaction Successful' : 'Transaction Failed'} back={false} />
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors"
          >
            <Icon icon="lucide:x" className="text-xl" />
          </button>
        </div>
        
        <div className="w-full space-y-4">
          {result.success ? (
            <>
              {/* Success Alert */}
              <Alert variant="success" className="w-full">
                <div className="flex items-start gap-2">
                  <Icon icon="lucide:check-circle" className="text-lg shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">Transaction Completed</div>
                    <div className="text-sm">
                      Your Banano transaction has been successfully processed and added to the blockchain.
                    </div>
                  </div>
                </div>
              </Alert>

              {/* Transaction Details Card */}
              {result.block && (
                <Card label="Transaction Details" className="w-full">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                      <span className="text-sm text-tertiary">From</span>
                      <span className="text-sm font-mono text-tertiary">
                        {truncateMiddle(result.block.fromAddress, 12, 8)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                      <span className="text-sm text-tertiary">To</span>
                      <span className="text-sm font-mono text-tertiary">
                        {truncateMiddle(result.block.toAddress, 12, 8)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-tertiary">Amount</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatBalance(result.block.amount)} BAN
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Transaction Hash Card */}
              {result.hash && (
                <Card label="Transaction Hash" className="w-full">
                  <div className="space-y-3">
                    <div className="bg-tertiary/10 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-tertiary break-all">
                          {truncateMiddle(result.hash, 12, 8)}
                        </span>
                        <button
                          onClick={handleCopyHash}
                          className="ml-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} className="text-sm" />
                        </button>
                      </div>
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={handleViewOnCreeper}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Icon icon="lucide:external-link" />
                      View on Creeper
                    </Button>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <>
              {/* Error Alert */}
              <Alert variant="destructive" className="w-full">
                <div className="flex items-start gap-2">
                  <Icon icon="lucide:x-circle" className="text-lg shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">Transaction Failed</div>
                    <div className="text-sm">
                      {result.error || 'An unknown error occurred while processing your transaction.'}
                    </div>
                  </div>
                </div>
              </Alert>

              {/* Error Details Card */}
              <Card label="Error Details" className="w-full">
                <div className="text-xs text-tertiary/70">
                  Please check your connection and try again. If the problem persists, 
                  ensure you have sufficient balance and the recipient address is valid.
                </div>
              </Card>
            </>
          )}

          {/* Action Button */}
          <Button
            variant="primary"
            onClick={onClose}
            className="w-full"
          >
            {result.success ? 'Done' : 'Try Again'}
          </Button>
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
