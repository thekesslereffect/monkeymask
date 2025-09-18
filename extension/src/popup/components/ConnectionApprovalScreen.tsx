import React, { useState } from 'react';
import { ContentContainer } from './ui';

interface ConnectionApprovalScreenProps {
  request: {
    id: string;
    origin: string;
    data: {
      origin: string;
      accounts: Array<{
        address: string;
        name: string;
        balance: string;
      }>;
    };
  };
  onApprove: (requestId: string, selectedAccounts: string[]) => void;
  onReject: (requestId: string) => void;
}

export const ConnectionApprovalScreen: React.FC<ConnectionApprovalScreenProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([
    request.data.accounts[0]?.address || ''
  ]);

  const handleAccountToggle = (address: string) => {
    setSelectedAccounts(prev => 
      prev.includes(address)
        ? prev.filter(addr => addr !== address)
        : [...prev, address]
    );
  };

  const handleApprove = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one account to connect');
      return;
    }
    onApprove(request.id, selectedAccounts);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  // Extract domain from origin for display
  const domain = request.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-xl p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl">🔗</div>
          </div>
          <h1 className="text-xl font-bold text-center">Connection Request</h1>
          <p className="text-center text-yellow-100 mt-2">
            A website wants to connect to MonkeyMask
          </p>
        </div>

        {/* Content */}
        <ContentContainer>
          {/* Site Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                {domain.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{domain}</div>
                <div className="text-sm text-gray-500">{request.origin}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              This site is requesting access to view your account addresses, account balance, activity, and suggest transactions to approve.
            </div>
          </div>

          {/* Account Selection */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Select accounts to connect:</h3>
            <div className="space-y-2">
              {request.data.accounts.map((account) => (
                <div
                  key={account.address}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedAccounts.includes(account.address)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAccountToggle(account.address)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.address)}
                        onChange={() => handleAccountToggle(account.address)}
                        className="mr-3 text-orange-500 focus:ring-orange-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500 font-mono">
                          {account.address.slice(0, 12)}...{account.address.slice(-8)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{account.balance} BAN</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div className="text-sm text-yellow-800">
                <div className="font-semibold mb-1">Only connect with sites you trust</div>
                <div>
                  Connecting gives this site permission to view your account addresses and balances, 
                  and request approval for transactions.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={selectedAccounts.length === 0}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect ({selectedAccounts.length})
            </button>
          </div>
        </ContentContainer>
      </div>
    </div>
  );
};
