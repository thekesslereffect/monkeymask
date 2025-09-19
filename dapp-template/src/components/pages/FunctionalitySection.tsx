'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { ConnectButton } from '@/components/ConnectButton';
import { Button } from '@/components/ui';

export function FunctionalitySection() {
  const { isConnected, publicKey, getAccountInfo, sendTransaction, signMessage, verifySignedMessage } = useMonkeyMask();

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const [message, setMessage] = useState('Hello from MonkeyMask');
  const [signature, setSignature] = useState<string | null>(null);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);
  const [signing, setSigning] = useState(false);

  const truncatedKey = useMemo(() => {
    if (!publicKey) return null;
    return `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`;
  }, [publicKey]);

  const refreshBalance = async () => {
    if (!isConnected) return;
    setLoadingBalance(true);
    try {
      const info = await getAccountInfo();
      setBalance(info?.balance ?? null);
    } catch {
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      refreshBalance();
    } else {
      setBalance(null);
    }
  }, [isConnected]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setSending(true);
    setSendResult(null);
    try {
      const hash = await sendTransaction(recipient, amount);
      if (hash) {
        setSendResult(hash);
        setRecipient('');
        setAmount('');
        refreshBalance();
      }
    } catch {
      setSendResult(null);
    } finally {
      setSending(false);
    }
  };

  const handleSign = async () => {
    if (!isConnected) return;
    setSigning(true);
    setSignature(null);
    setVerifyOk(null);
    try {
      const sig = await signMessage(message);
      setSignature(sig);
    } catch {
      setSignature(null);
    } finally {
      setSigning(false);
    }
  };

  const handleVerify = async () => {
    if (!signature) return;
    const ok = await verifySignedMessage(message, signature);
    setVerifyOk(!!ok);
  };

  return (
    <div className="my-30 flex flex-col w-full">
    <div className="text-4xl w-full text-center">Try MonkeyMask</div>
    <div className="mt-10 md:mt-14 rounded-xl overflow-hidden shadow-2xl shadow-secondary/80 border border-border p-2">
      <div className=" w-full bg-white">
        <div className="grid grid-cols-2 gap-2 h-full">
          {/* Connect */}
          <div className="bg-white h-full rounded-lg border border-border p-8 row-span-2">
            <div className="flex flex-col justify-end h-full gap-3 max-w-md">
              <div className="text-4xl font-bold flex items-center gap-2">
                <Icon icon="solar:login-2-bold" className="size-7" />
                Connect
              </div>
              <div className="text-md text-muted">
                {isConnected ? (
                  <span className="font-semibold">{truncatedKey}</span>
                ) : (
                  'Connect your wallet to begin.'
                )}
              </div>
              <ConnectButton className="w-fit" />
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white rounded-lg border border-border p-8 col-span-1">
            <div className="flex flex-col justify-end h-full gap-2 max-w-md">
              <div className="text-4xl font-bold flex items-center gap-2">
                <Icon icon="tabler:wallet" className="size-7" />
                Balance
              </div>
              <div className="text-md text-muted">
                {isConnected ? (
                  <div className="flex items-center gap-3">
                    <div className="font-mono">{loadingBalance ? 'Loading…' : balance ? `${balance} BAN` : '—'}</div>
                    <Button onClick={refreshBalance} variant="secondary">Refresh</Button>
                  </div>
                ) : (
                  'Connect to see balance'
                )}
              </div>
            </div>
          </div>

          {/* Send */}
          <div className="bg-white rounded-lg border border-border p-8 col-span-1">
            <div className="flex flex-col justify-end h-full gap-2 max-w-md">
              <div className="text-4xl font-bold flex items-center gap-2">
                <Icon icon="solar:upload-bold" className="size-7" />
                Send
              </div>
              <form onSubmit={handleSend} className="space-y-2">
                <input
                  type="text"
                  placeholder="ban_1... or name.ban"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0.000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-white"
                  />
                  <Button type="submit" disabled={!isConnected || sending || !recipient || !amount} variant="secondary">
                    {sending ? 'Sending…' : 'Send'}
                  </Button>
                </div>
                {sendResult && (
                  <div className="text-xs font-mono break-all mt-1">{sendResult}</div>
                )}
              </form>
            </div>
          </div>

          {/* Sign */}
          <div className="bg-white rounded-lg border border-border p-8 col-span-1">
            <div className="flex flex-col justify-end h-full gap-2 w-full">
              <div className="text-4xl font-bold flex items-center gap-2">
                <Icon icon="solar:document-signed-bold" className="size-7" />
                Sign
              </div>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 h-full border border-border rounded-md bg-white resize-none"
              />
              <div className="flex gap-2 w-full justify-end">
                <Button onClick={handleSign} disabled={!isConnected || signing} variant="secondary">{signing ? 'Signing…' : 'Sign'}</Button>
                <Button onClick={handleVerify} disabled={!signature} variant="secondary">Verify</Button>
              </div>
              {signature && (
                <div className="text-xs font-mono break-all bg-white border border-border rounded p-2">{signature}</div>
              )}
              {verifyOk !== null && (
                <div className="text-sm">Verified: {verifyOk ? 'true' : 'false'}</div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-white rounded-lg border border-border p-8 col-span-1">
            <div className="flex flex-col justify-start h-full gap-2 font-semibold max-w-xl">
              <div className="text-4xl font-bold flex items-center gap-2">
                <Icon icon="solar:history-bold" className="size-7" />
                Activity
              </div>
              <div className="text-md text-muted">
                {isConnected ? 'Check your latest actions in the wallet extension.' : 'Connect to track recent activity.'}
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
    </div>
  );
}

export default FunctionalitySection;


