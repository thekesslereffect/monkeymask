'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { ConnectButton } from '@/components/ConnectButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Demo card component for better organization
const DemoCard = ({ 
  title, 
  icon, 
  children, 
  className = "" 
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div className={`bg-white rounded-md border border-[var(--border)] p-6 transition-all duration-200 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
        <Icon icon={icon} className={`size-6 text-foreground`} />
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    {children}
  </div>
);

export function FunctionalitySection() {
  const { 
    isConnected, 
    publicKey, 
    getAccountInfo, 
    sendTransaction, 
    signMessage, 
    verifySignedMessage,
    resolveBNS,
    error,
    clearError
  } = useMonkeyMask();

  // State for balance demo
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // State for send transaction demo
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // State for message signing demo
  const [message, setMessage] = useState('Hello from MonkeyMask!');
  const [signature, setSignature] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);

  // State for BNS demo
  const [bnsName, setBnsName] = useState('');
  const [bnsResult, setBnsResult] = useState<string | null>(null);
  const [resolvingBNS, setResolvingBNS] = useState(false);

  const truncatedKey = useMemo(() => {
    if (!publicKey) return null;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`;
  }, [publicKey]);

  const refreshBalance = async () => {
    if (!isConnected) return;
    setLoadingBalance(true);
    try {
      const info = await getAccountInfo();
      setBalance(info?.balance ?? null);
    } catch (err) {
      setBalance(null);
      console.error('Failed to get balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      refreshBalance();
    } else {
      setBalance(null);
      setSendResult(null);
      setSignature(null);
      setVerifyResult(null);
      setBnsResult(null);
    }
  }, [isConnected]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    
    setSending(true);
    setSendResult(null);
    setSendError(null);
    clearError();
    
    try {
      const hash = await sendTransaction(recipient, amount);
      if (hash) {
        setSendResult(hash);
        setRecipient('');
        setAmount('');
        // Refresh balance after successful transaction
        setTimeout(refreshBalance, 1000);
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setSending(false);
    }
  };

  const handleSign = async () => {
    if (!isConnected || !message.trim()) return;
    
    setSigning(true);
    setSignature(null);
    setVerifyResult(null);
    clearError();
    
    try {
      const sig = await signMessage(message.trim());
      if (sig) {
        setSignature(sig);
        // Auto-verify the signature
        const isValid = await verifySignedMessage(message.trim(), sig);
        setVerifyResult(isValid === true);
      }
    } catch (err) {
      console.error('Signing failed:', err);
    } finally {
      setSigning(false);
    }
  };

  const handleResolveBNS = async () => {
    if (!bnsName.trim()) return;
    
    setResolvingBNS(true);
    setBnsResult(null);
    
    try {
      const address = await resolveBNS(bnsName.trim());
      setBnsResult(address);
    } catch (err) {
      setBnsResult('Not found');
    } finally {
      setResolvingBNS(false);
    }
  };

  const fillExampleBNS = () => {
    setBnsName('cosmic.ban');
  };

  const fillExampleTransaction = () => {
    setRecipient('cosmic.ban');
    setAmount('0.001');
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Experience MonkeyMask</h2>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Try the most advanced Banano wallet extension with enterprise-grade security and developer-friendly APIs
        </p>
      </div>
      {/* Interactive Demos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 border border-border p-2 rounded-xl">
        {/* Connection Status */}
        <DemoCard 
          title="Wallet Connection" 
          icon="mdi:wallet-outline"
          className="xl:row-span-2"
        >
          <div className="space-y-4">
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Connected
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">Public Key</div>
                  <div className="font-mono text-sm bg-[var(--panel)] p-2 rounded border">
                    {truncatedKey}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[var(--text-secondary)] mb-1">Balance</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-lg font-semibold">
                      {loadingBalance ? 'Loading...' : balance ? `${balance} BAN` : '0 BAN'}
                    </div>
                    <Button 
                      onClick={refreshBalance} 
                      variant="secondary" 
                      size="sm"
                      disabled={loadingBalance}
                    >
                      <Icon icon="mdi:refresh" className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[var(--text-secondary)]">
                  Connect your MonkeyMask wallet to try all features
                </p>
                <ConnectButton />
              </div>
            )}
          </div>
        </DemoCard>

        {/* Send Transaction */}
        <DemoCard title="Send Transaction" icon="mdi:send">
          <form onSubmit={handleSend} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ban_1... or name.ban"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
                />
                <Button 
                  type="button" 
                  onClick={fillExampleTransaction}
                  variant="secondary" 
                  size="sm"
                >
                  Example
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (BAN)</label>
              <input
                type="text"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
              />
            </div>
            <Button 
              type="submit" 
              disabled={!isConnected || sending || !recipient || !amount}
              size="sm"
              variant="secondary"
            >
              {sending ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Transaction'
              )}
            </Button>
            {sendResult && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                <div className="font-medium text-green-800 mb-1">Transaction Sent!</div>
                <div className="font-mono break-all text-green-700">{sendResult}</div>
              </div>
            )}
            {sendError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {sendError}
              </div>
            )}
          </form>
        </DemoCard>

        {/* Message Signing */}
        <DemoCard title="Message Signing" icon="mdi:file-sign">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm resize-none"
                placeholder="Enter message to sign..."
              />
            </div>
            <Button 
              onClick={handleSign} 
              disabled={!isConnected || signing || !message.trim()}
              size="sm"
              variant="secondary"
            >
              {signing ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Signing...
                </>
              ) : (
                'Sign Message'
              )}
            </Button>
            {signature && (
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-xs font-medium text-blue-800 mb-1">Signature</div>
                  <div className="font-mono text-xs break-all text-blue-700">{signature.slice(0, 40)}...</div>
                </div>
                {verifyResult !== null && (
                  <div className={`p-2 rounded text-xs ${
                    verifyResult 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    Verification: {verifyResult ? '✅ Valid' : '❌ Invalid'}
                  </div>
                )}
              </div>
            )}
          </div>
        </DemoCard>

        {/* BNS Resolution */}
        <DemoCard title="BNS Resolution" icon="mdi:web">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">BNS Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="username.ban"
                  value={bnsName}
                  onChange={(e) => setBnsName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
                />
                <Button 
                  type="button" 
                  onClick={fillExampleBNS}
                  variant="secondary" 
                  size="sm"
                >
                  Example
                </Button>
              </div>
            </div>
            <Button 
              onClick={handleResolveBNS} 
              disabled={resolvingBNS || !bnsName.trim()}
              size="sm"
              variant="secondary"
            >
              {resolvingBNS ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Resolving...
                </>
              ) : (
                'Resolve BNS'
              )}
            </Button>
            {bnsResult && (
              <div className={`p-2 rounded text-xs ${
                bnsResult === 'Not found' 
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="font-medium mb-1">
                  {bnsResult === 'Not found' ? 'BNS Not Found' : 'Resolved Address'}
                </div>
                {bnsResult !== 'Not found' && (
                  <div className="font-mono break-all text-green-700">{bnsResult}</div>
                )}
              </div>
            )}
          </div>
        </DemoCard>

        {/* Error Display */}
        {error && (
          <DemoCard title="Error Handling" icon="mdi:alert-circle" className="xl:col-span-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="mdi:alert-circle" className="size-4 text-red-600" />
                <span className="font-medium text-red-800">Error Detected</span>
              </div>
              <div className="text-sm text-red-700 mb-2">{error}</div>
              <Button onClick={clearError} variant="secondary" size="sm">
                Dismiss
              </Button>
            </div>
          </DemoCard>
        )}

        {/* API Status */}
        <DemoCard title="API Status" icon="mdi:api" className={error ? '' : 'xl:col-span-1'}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Connection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${balance !== null ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Balance API</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${signature ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Message Signing</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${sendResult ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Transactions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${bnsResult && bnsResult !== 'Not found' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">BNS Resolution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${verifyResult === true ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm">Verification</span>
              </div>
            </div>
          </div>
        </DemoCard>
      </div>
    </div>
  );
}

export default FunctionalitySection;


