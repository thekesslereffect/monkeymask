import React, { useState } from 'react';
import { bnsResolver } from '../../utils/bns';

interface Account {
  address: string;
  name: string;
  balance: string;
}

interface SendScreenProps {
  account: Account;
  onBack: () => void;
  onSendComplete: (result: { success: boolean; hash?: string; error?: string; block?: any }) => void;
}

// Format balance to show up to 4 decimal places, removing trailing zeros
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  return num.toFixed(4).replace(/\.?0+$/, '');
};

export const SendScreen: React.FC<SendScreenProps> = ({ account, onBack, onSendComplete }) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Handle address input changes and BNS resolution
  const handleAddressChange = async (value: string) => {
    setToAddress(value);
    setResolvedAddress('');
    setError('');

    if (!value.trim()) return;

    // Check if it's a BNS name
    if (bnsResolver.isBNSName(value.trim())) {
      setIsResolving(true);
      try {
        const resolved = await bnsResolver.resolveBNS(value.trim());
        setResolvedAddress(resolved);
        console.log('SendScreen: Resolved BNS', value, 'to', resolved);
      } catch (error) {
        console.error('SendScreen: BNS resolution failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to resolve BNS name');
      } finally {
        setIsResolving(false);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!toAddress.trim()) {
      setError('Please enter a destination address');
      return;
    }

    // Use resolved address if available, otherwise use the input
    const finalAddress = resolvedAddress || toAddress.trim();

    if (!finalAddress.startsWith('ban_')) {
      setError('Please enter a valid Banano address or BNS name (e.g., username.ban)');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const numAmount = parseFloat(amount);
    const currentBalance = parseFloat(account.balance);

    if (numAmount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);

    try {
      console.log('SendScreen: Sending transaction...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_TRANSACTION',
        fromAddress: account.address,
        toAddress: finalAddress,
        amount: amount
      });

      if (response.success) {
        console.log('SendScreen: Transaction sent successfully!');
        console.log('SendScreen: Transaction hash:', response.data.hash);
        
        // Clear form
        setToAddress('');
        setAmount('');
        
        // Pass the full result to the parent component
        onSendComplete({
          success: true,
          hash: response.data.hash,
          block: response.data.block
        });
        
      } else {
        console.error('SendScreen: Transaction failed:', response.error);
        
        // Pass the error result to the parent component
        onSendComplete({
          success: false,
          error: response.error || 'Failed to send transaction'
        });
      }
    } catch (error) {
      console.error('SendScreen: Send failed:', error);
      
      // Pass the error result to the parent component
      onSendComplete({
        success: false,
        error: 'Network error: Failed to send transaction'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-banano-500 p-4 text-white">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 text-white hover:text-banano-100">
            ←
          </button>
          <h2 className="text-lg font-semibold">Send BAN</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">From Account</h3>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="font-medium">{account.name}</div>
            <div className="text-sm text-gray-600 font-mono">{account.address}</div>
            <div className="text-lg font-semibold text-banano-600 mt-2">
              {formatBalance(account.balance)} BAN
            </div>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="input font-mono text-sm"
              placeholder="ban_1... or username.ban"
              required
            />
            
            {/* BNS Resolution Status */}
            {isResolving && (
              <div className="text-blue-600 text-xs mt-1 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Resolving BNS name...
              </div>
            )}
            
            {resolvedAddress && (
              <div className="text-green-600 text-xs mt-1 bg-green-50 p-2 rounded">
                <div className="font-medium">✅ Resolved to:</div>
                <div className="font-mono text-xs break-all">{resolvedAddress}</div>
              </div>
            )}
            
            {/* Supported TLDs hint */}
            <div className="text-xs text-gray-500 mt-1">
              Supported BNS TLDs: {bnsResolver.getSupportedTLDs().join(', ')}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (BAN)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="0.01"
              step="0.000001"
              min="0"
              max={account.balance}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              Available: {formatBalance(account.balance)} BAN
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              {success}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send BAN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
