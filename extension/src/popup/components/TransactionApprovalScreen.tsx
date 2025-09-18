import React, { useState } from 'react';
import { ContentContainer } from './ui';
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

  const renderTransactionDetails = () => {
    if (request.type === 'sendTransaction') {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-800">Transaction Request</span>
            </div>
            <p className="text-sm text-yellow-700">
              <strong>{request.origin}</strong> wants to send Banano from your wallet.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">From</span>
              <span className="text-sm font-mono text-gray-800">
                {formatAddress(request.data.fromAddress || '')}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">To</span>
              <span className="text-sm font-mono text-gray-800">
                {formatAddress(request.data.toAddress || '')}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-gray-600">Amount</span>
              <span className="text-lg font-semibold text-banano-600">
                {formatBalance(request.data.amount || '0')} BAN
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (request.type === 'signBlock') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Block Signing Request</span>
            </div>
            <p className="text-sm text-blue-700">
              <strong>{request.origin}</strong> wants to sign a block with your wallet.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-mono text-gray-600 break-all">
              {JSON.stringify(request.data.block, null, 2)}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-banano-400 to-banano-600 text-white p-4">
        <h1 className="text-lg font-bold">🔐 Transaction Approval</h1>
        <p className="text-sm opacity-90">Review and approve this request</p>
      </div>

      {/* Content */}
      <ContentContainer>
        {renderTransactionDetails()}
      </ContentContainer>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            ❌ Reject
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-banano-500 text-white rounded-lg font-medium hover:bg-banano-600 transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Approving...' : '✅ Approve'}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Only approve transactions you trust and understand
        </p>
      </div>
    </div>
  );
};
