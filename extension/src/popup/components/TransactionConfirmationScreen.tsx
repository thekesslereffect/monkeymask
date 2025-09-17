import React from 'react';

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

// Format balance to show up to 4 decimal places, removing trailing zeros
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  return num.toFixed(4).replace(/\.?0+$/, '');
};

// Format address for display
const formatAddress = (address: string): string => {
  if (address.length <= 20) return address;
  return `${address.substring(0, 12)}...${address.substring(address.length - 8)}`;
};

// Format transaction hash for display
const formatHash = (hash: string): string => {
  if (hash.length <= 20) return hash;
  return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
};

export const TransactionConfirmationScreen: React.FC<TransactionConfirmationScreenProps> = ({
  result,
  onClose
}) => {
  const handleViewOnCreeper = () => {
    if (result.hash) {
      window.open(`https://creeper.banano.cc/hash/${result.hash}`, '_blank');
    }
  };

  const handleCopyHash = () => {
    if (result.hash) {
      navigator.clipboard.writeText(result.hash);
      // You could add a toast notification here
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className={`p-4 text-white ${
        result.success 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : 'bg-gradient-to-r from-red-500 to-red-600'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              {result.success ? '✅ Transaction Successful' : '❌ Transaction Failed'}
            </h1>
            <p className="text-sm opacity-90">
              {result.success ? 'Your transaction has been processed' : 'Your transaction could not be completed'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {result.success ? (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Transaction Completed</span>
              </div>
              <p className="text-sm text-green-700">
                Your Banano transaction has been successfully processed and added to the blockchain.
              </p>
            </div>

            {/* Transaction Details */}
            {result.block && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Transaction Details</h3>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">From</span>
                  <span className="text-sm font-mono text-gray-800">
                    {formatAddress(result.block.fromAddress)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">To</span>
                  <span className="text-sm font-mono text-gray-800">
                    {formatAddress(result.block.toAddress)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Amount</span>
                  <span className="text-lg font-semibold text-banano-600">
                    {formatBalance(result.block.amount)} BAN
                  </span>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {result.hash && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Transaction Hash</h3>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-600 break-all">
                      {formatHash(result.hash)}
                    </span>
                    <button
                      onClick={handleCopyHash}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleViewOnCreeper}
                  className="w-full py-2 px-4 bg-banano-500 text-white rounded-lg font-medium hover:bg-banano-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🔍</span>
                  <span>View on Creeper</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-800">Transaction Failed</span>
              </div>
              <p className="text-sm text-red-700">
                {result.error || 'An unknown error occurred while processing your transaction.'}
              </p>
            </div>

            {/* Error Details */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details</h3>
              <p className="text-xs text-gray-600">
                Please check your connection and try again. If the problem persists, 
                ensure you have sufficient balance and the recipient address is valid.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          {result.success ? '✅ Done' : '🔄 Try Again'}
        </button>
      </div>
    </div>
  );
};
