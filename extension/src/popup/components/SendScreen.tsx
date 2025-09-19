import React, { useState } from 'react';
import { bnsResolver } from '../../utils/bns';
import { ContentContainer, Header, Input, Button, Alert, Footer } from './ui';
import { Icon } from '@iconify/react';
import { formatBalance } from '../../utils/format';
import { PageName } from './ui/PageName';
import { useAccounts } from '../hooks/useAccounts';

interface Account {
  address: string;
  name: string;
  balance: string;
}

interface SendScreenProps {
  account: Account;
  onSendComplete: (result: { success: boolean; hash?: string; error?: string; block?: any }) => void;
}


export const SendScreen: React.FC<SendScreenProps> = ({ account, onSendComplete }) => {
  const { getUsdBalance, priceLoading } = useAccounts();
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
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <Header active={true}/>

      {/* Content */}
      <ContentContainer>
        <PageName name="Send" back />
        {/* Balance */}
        <div className="flex flex-col items-center gap-2 h-full min-h-36 justify-center">
          <div className="text-5xl text-primary">
            {formatBalance(account.balance)}
          </div>
          <div className="text-xl text-tertiary">
            {priceLoading ? (
              <span className="animate-pulse">Loading price...</span>
            ) : (
              `$${getUsdBalance(account.balance)}`
            )}
          </div>
        </div>

        <form onSubmit={handleSend} className="w-full space-y-5">
          {/* To */}
          <Input
            label="To"
            variant="secondary"
            size="lg"
            value={toAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="ban_1... or username.ban"
            required
            className="font-mono text-sm text-center"
          />

          {/* BNS Resolution Status */}
          {isResolving && (
            <div className="text-primary text-xs mt-1 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
              Resolving BNS name...
            </div>
          )}

          {resolvedAddress && (
            <div className="text-green-600 text-xs mt-1 bg-green-500/10 p-2 rounded-xl">
              <div className="font-medium">Resolved to:</div>
              <div className="font-mono text-xs break-all">{resolvedAddress}</div>
            </div>
          )}

          <div className="text-xs text-tertiary -mt-3">
            Supported BNS TLDs: {bnsResolver.getSupportedTLDs().join(', ')}
          </div>

          {/* Amount */}
          <div className="w-full">
            <Input
              label="Amount"
              variant="secondary"
              size="lg"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="69.00"
              step="0.0001"
              min="0.0001"
              max={account.balance}
              required
              className="text-center no-spinner"
            />
          </div>

          {error && (
            <Alert variant="warning">
              {error}
            </Alert>
          )}

          {success && (
            <Alert>
              {success}
            </Alert>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </ContentContainer>
      <Footer />
    </div>
  );
};
