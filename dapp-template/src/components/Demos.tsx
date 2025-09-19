'use client';

import React, { useState } from 'react';
import { useMonkeyMask } from '@/providers';
import { WalletInfo } from '@/components/examples/WalletInfo';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Alert } from '@/components/ui';
import { ConnectButton } from './ConnectButton';

export function Demos() {
  const { isConnected, publicKey, connect, sendTransaction, signMessage, verifySignedMessage, resolveBNS } = useMonkeyMask();

  // Send state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.000001');
  const [resolved, setResolved] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'destructive'; msg: string } | null>(null);

  // Sign state
  const [message, setMessage] = useState('Hello from MonkeyMask');
  const [signature, setSignature] = useState<string | null>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{ type: 'success' | 'destructive'; msg: string } | null>(null);

  const handleResolve = async () => {
    setResolved(null);
    setVerifyStatus(null);
    if (!recipient) return;
    if (recipient.includes('.ban')) {
      try {
        const addr = await resolveBNS(recipient);
        setResolved(addr);
      } catch {}
    }
  };

  const handleSend = async () => {
    if (!isConnected || !publicKey) return;
    setSendLoading(true);
    setSendStatus(null);
    try {
      const to = resolved || recipient || publicKey; // default to self if empty
      const hash = await sendTransaction(to, amount || '0.000001');
      if (hash) {
        setSendStatus({ type: 'success', msg: 'Success! Check your activity in the wallet.' });
      } else {
        setSendStatus({ type: 'destructive', msg: 'Failed or cancelled.' });
      }
    } catch (e) {
      setSendStatus({ type: 'destructive', msg: 'Failed or cancelled.' });
    } finally {
      setSendLoading(false);
    }
  };

  const handleSign = async () => {
    if (!isConnected) return;
    setSignLoading(true);
    setSignature(null);
    setVerifyStatus(null);
    try {
      const result = await signMessage(message || '');
      setSignature(result);
    } catch (e) {
      setSignature(null);
    } finally {
      setSignLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifyStatus(null);
    if (!signature) return;
    const ok = await verifySignedMessage(message || '', signature);
    if (ok) setVerifyStatus({ type: 'success', msg: 'Signature verified for your current account.' });
    else setVerifyStatus({ type: 'destructive', msg: 'Invalid signature.' });
  };

  return (
    <section className="bg-[var(--elevated)] border-y border-[var(--border)]">
      <div className="container py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">Try it now</h3>
          <p className="mt-2 text-lg muted">Interact with MonkeyMask directly on this page.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Connect */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm muted">Connect your wallet to begin.</p>
              <ConnectButton className="mt-4" />
              <div className="text-xs muted mt-3">You can also use the Connect button in the header.</div>
            </CardContent>
          </Card>

          {/* Wallet Info */}
          <div className="lg:col-span-2">
            <WalletInfo className="rounded-xl" />
          </div>

          {/* Send */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Send BAN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="recipient">Recipient (address or BNS)</Label>
                  <Input id="recipient" placeholder="ban_1... or username.ban" className="mt-1" value={recipient} onChange={(e) => setRecipient(e.target.value)} onBlur={handleResolve} />
                  {resolved && <div className="text-xs muted mt-1">Resolved: {resolved}</div>}
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" type="text" className="mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button onClick={handleSend} disabled={!isConnected || sendLoading} className="mt-1">
                  {sendLoading ? 'Sending…' : 'Send'}
                </Button>
                {sendStatus && <Alert variant={sendStatus.type} className="mt-2">{sendStatus.msg}</Alert>}
              </div>
            </CardContent>
          </Card>

          {/* Sign */}
          <Card className="flex flex-col lg:col-span-2">
            <CardHeader>
              <CardTitle>Sign & Verify</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" className="mt-1" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSign} disabled={!isConnected || signLoading}>
                    {signLoading ? 'Signing…' : 'Sign message'}
                  </Button>
                  <Button onClick={handleVerify} disabled={!signature} variant="outline">Verify</Button>
                </div>
                {signature && (
                  <div className="text-xs mt-1">
                    <div className="muted mb-1">Signature (hex):</div>
                    <div className="font-mono break-all bg-[var(--elevated)] p-2 rounded border border-[var(--border)]">{signature}</div>
                  </div>
                )}
                {verifyStatus && <Alert variant={verifyStatus.type}>{verifyStatus.msg}</Alert>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}


