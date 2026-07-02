'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { ConnectButton } from '@/components/ConnectButton';
import { serializeSignInOutput } from '@monkeymask/wallet-standard';
import { Button, Badge, StatusBox } from '@/components/ui';
import { NftGallery } from '@/components/NftGallery';
import { MintNftForm } from '@/components/MintNftForm';
import { AirdropForm } from '@/components/AirdropForm';
import { ReceiveHistoryForm } from '@/components/ReceiveHistoryForm';
import { PaymentUriForm } from '@/components/PaymentUriForm';
import { SpendingSessionForm } from '@/components/SpendingSessionForm';

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
    connected,
    publicKey,
    getAccountInfo,
    signAndSendTransaction,
    signMessage,
    signIn,
    resolveBNS,
    reverseResolveBNS,
    error,
    clearError,
  } = useMonkeyMask();

  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

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

  // State for reverse BNS demo
  const [reverseAddress, setReverseAddress] = useState('');
  const [reverseResult, setReverseResult] = useState<string[] | null>(null);
  const [reversing, setReversing] = useState(false);

  const truncatedKey = useMemo(() => {
    if (!publicKey) return null;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`;
  }, [publicKey]);

  const refreshBalance = useCallback(async () => {
    if (!connected) return;
    setLoadingBalance(true);
    try {
      const info = await getAccountInfo();
      const balanceValue = info?.balance;
      setBalance(typeof balanceValue === 'string' ? balanceValue : null);
    } catch (err) {
      setBalance(null);
      console.error('Failed to get balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, [getAccountInfo, connected]);

  useEffect(() => {
    if (connected) {
      refreshBalance();
    } else {
      setBalance(null);
      setSendResult(null);
      setSignature(null);
      setVerifyResult(null);
      setBnsResult(null);
    }
  }, [connected, refreshBalance]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthStatus(null);
    clearError();
    try {
      const domain = window.location.host;
      const nonceRes = await fetch(`/api/auth/nonce?domain=${encodeURIComponent(domain)}`);
      const input = await nonceRes.json();
      const output = await signIn(input);
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ...input, address: output.account.address },
          output: serializeSignInOutput(output),
        }),
      });
      const result = await verifyRes.json();
      setAuthStatus(result.valid ? `Signed in as ${result.address}` : 'Sign-in verification failed');
    } catch (err) {
      setAuthStatus(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    
    setSending(true);
    setSendResult(null);
    setSendError(null);
    clearError();
    
    try {
      const result = await signAndSendTransaction({ type: 'send', to: recipient, amount });
      if (result?.hash) {
        setSendResult(result.hash);
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
    if (!connected || !message.trim()) return;
    
    setSigning(true);
    setSignature(null);
    setVerifyResult(null);
    clearError();
    
    try {
      const output = await signMessage(new TextEncoder().encode(message.trim()));
      const sigHex = Array.from(output.signature).map(b => b.toString(16).padStart(2, '0')).join('');
      setSignature(sigHex);
      setVerifyResult(true);
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
    } catch {
      setBnsResult('Not found');
    } finally {
      setResolvingBNS(false);
    }
  };

  const fillExampleBNS = () => {
    setBnsName('cosmic.ban');
  };

  const handleReverseBNS = async () => {
    setReversing(true);
    setReverseResult(null);
    try {
      // Empty input reverse-resolves the connected account.
      const names = await reverseResolveBNS(reverseAddress.trim() || undefined);
      setReverseResult(names);
    } catch {
      setReverseResult([]);
    } finally {
      setReversing(false);
    }
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
            {connected ? (
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
                <Button onClick={() => void handleSignIn()} disabled={signingIn} variant="secondary" size="md">
                  {signingIn ? 'Signing in...' : 'Sign In With Banano'}
                </Button>
                {authStatus && <p className="text-sm text-green-700">{authStatus}</p>}
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
              disabled={!connected || sending || !recipient || !amount}
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
              <StatusBox variant="success" title="Transaction Sent!" mono>
                {sendResult}
              </StatusBox>
            )}
            {sendError && <StatusBox variant="error">{sendError}</StatusBox>}
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
              disabled={!connected || signing || !message.trim()}
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
                <StatusBox variant="info" title="Signature" mono>
                  {signature.slice(0, 40)}...
                </StatusBox>
                {verifyResult !== null && (
                  <StatusBox variant={verifyResult ? 'success' : 'error'}>
                    Verification: {verifyResult ? '✅ Valid' : '❌ Invalid'}
                  </StatusBox>
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
              <StatusBox
                variant={bnsResult === 'Not found' ? 'error' : 'success'}
                title={bnsResult === 'Not found' ? 'BNS Not Found' : 'Resolved Address'}
                mono={bnsResult !== 'Not found'}
              >
                {bnsResult !== 'Not found' ? bnsResult : undefined}
              </StatusBox>
            )}

            <div className="border-t border-[var(--border)] pt-3 space-y-2">
              <label className="block text-sm font-medium">Reverse lookup (address → name)</label>
              <input
                type="text"
                placeholder={connected ? 'ban_1… (blank = your account)' : 'ban_1…'}
                value={reverseAddress}
                onChange={(e) => setReverseAddress(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
              />
              <Button
                onClick={handleReverseBNS}
                disabled={reversing || (!connected && !reverseAddress.trim())}
                size="sm"
                variant="secondary"
              >
                {reversing ? (
                  <>
                    <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                    Searching…
                  </>
                ) : (
                  'Find names'
                )}
              </Button>
              {reverseResult && (
                <StatusBox
                  variant={reverseResult.length > 0 ? 'success' : 'error'}
                  title={reverseResult.length > 0 ? 'Names found' : 'No names found'}
                  mono={reverseResult.length > 0}
                >
                  {reverseResult.length > 0 ? reverseResult.join(', ') : undefined}
                </StatusBox>
              )}
            </div>
          </div>
        </DemoCard>

        {/* NFT Collection */}
        <DemoCard title="NFT Collection" icon="mdi:image-multiple">
          <NftGallery />
        </DemoCard>

        {/* Mint NFT */}
        <DemoCard title="Mint an NFT" icon="lucide:sparkles">
          <MintNftForm />
        </DemoCard>

        {/* Airdrop / Multi-send */}
        <DemoCard title="Airdrop / Multi-send" icon="mdi:parachute-outline">
          <AirdropForm />
        </DemoCard>

        {/* Receive & History */}
        <DemoCard title="Receive & History" icon="mdi:download-circle-outline">
          <ReceiveHistoryForm />
        </DemoCard>

        {/* Payment URIs / QR */}
        <DemoCard title="Payment URI & QR" icon="mdi:qrcode">
          <PaymentUriForm />
        </DemoCard>

        {/* Spending Sessions */}
        <DemoCard title="Spending Session" icon="mdi:timer-lock-outline">
          <SpendingSessionForm />
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
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
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


