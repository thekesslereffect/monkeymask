'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'qrcode';
import {
  useMonkeyMask,
  useSend,
  buildBananoUri,
  parseBananoUri,
  type BananoPaymentRequest,
} from '@/providers';
import { Button, StatusBox } from '@/components/ui';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';
const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

/**
 * `ban:` payment-URI demo: build a request → URI → QR, or paste a URI to parse
 * and pay it. Uses the pure `buildBananoUri` / `parseBananoUri` helpers so any
 * dApp can generate scannable payment codes. BNS names are resolved to an
 * address first (URIs must carry a real `ban_` address).
 */
export function PaymentUriForm() {
  const { connected, resolveBNS } = useMonkeyMask();
  const send = useSend();

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');

  // Resolve a typed BNS name (foo.ban) to a ban_ address for the URI/QR.
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [payingReq, setPayingReq] = useState(false);
  const [reqResult, setReqResult] = useState<string | null>(null);
  const [reqError, setReqError] = useState<string | null>(null);

  const [pasteUri, setPasteUri] = useState('');
  const [parsed, setParsed] = useState<BananoPaymentRequest | null>(null);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Resolve address / BNS name whenever the input changes (debounced).
  useEffect(() => {
    const value = address.trim();
    setResolveError(null);
    if (!value) {
      setResolvedAddress(null);
      return;
    }
    if (BANANO_ADDRESS.test(value)) {
      setResolvedAddress(value);
      return;
    }
    if (!value.includes('.')) {
      setResolvedAddress(null);
      return;
    }
    let cancelled = false;
    setResolving(true);
    const timer = setTimeout(async () => {
      try {
        const resolved = await resolveBNS(value);
        if (cancelled) return;
        if (BANANO_ADDRESS.test(resolved)) {
          setResolvedAddress(resolved);
        } else {
          setResolvedAddress(null);
          setResolveError('Name did not resolve to an address');
        }
      } catch {
        if (!cancelled) {
          setResolvedAddress(null);
          setResolveError('Could not resolve name');
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [address, resolveBNS]);

  const uri = useMemo(() => {
    if (!resolvedAddress) return null;
    try {
      return buildBananoUri({
        address: resolvedAddress,
        amount: amount.trim() || undefined,
        label: label.trim() || undefined,
      });
    } catch {
      return null;
    }
  }, [resolvedAddress, amount, label]);

  useEffect(() => {
    let cancelled = false;
    if (!uri) {
      setQr(null);
      return;
    }
    QRCode.toDataURL(uri, { margin: 1, width: 220 })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const fillExample = () => {
    setAddress('cosmic.ban');
    setAmount('1');
    setLabel('Coffee');
  };

  const copyUri = async () => {
    if (!uri) return;
    try {
      await navigator.clipboard.writeText(uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  // Open the extension approval to pay the request being built.
  const payRequest = async () => {
    if (!resolvedAddress) return;
    setPayingReq(true);
    setReqResult(null);
    setReqError(null);
    try {
      const output = await send({
        to: resolvedAddress,
        amount: amount.trim() || '0',
        name: label.trim() || undefined,
      });
      setReqResult(output.hash ?? output.hashes[0] ?? '');
    } catch (err) {
      setReqError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPayingReq(false);
    }
  };

  const handleParse = () => {
    setParsed(parseBananoUri(pasteUri.trim()));
    setPayResult(null);
    setPayError(null);
  };

  const handlePay = async () => {
    if (!parsed) return;
    setPaying(true);
    setPayResult(null);
    setPayError(null);
    try {
      const output = await send({
        to: parsed.address,
        amount: parsed.amount ?? '0',
        name: parsed.label,
      });
      setPayResult(output.hash ?? output.hashes[0] ?? '');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Build */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Request a payment</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ban_1... or name.ban"
            className={`${FIELD_CLASS} flex-1`}
          />
          <Button type="button" onClick={fillExample} variant="secondary" size="sm">
            Example
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="amount (BAN, optional)"
            className={`${FIELD_CLASS} w-40`}
          />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="label (optional)"
            className={FIELD_CLASS}
          />
        </div>
        {resolving && (
          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
            <Icon icon="mdi:loading" className="size-3.5 animate-spin" />
            Resolving name…
          </p>
        )}
        {resolveError && <p className="text-xs text-red-600">{resolveError}</p>}
        {resolvedAddress && address.trim() !== resolvedAddress && (
          <p className="text-xs text-[var(--text-secondary)] font-mono break-all">
            → {resolvedAddress}
          </p>
        )}
      </div>

      {uri && (
        <div className="flex flex-col items-center gap-2">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Payment QR" className="rounded-md border border-[var(--border)]" />
          )}
          <div className="w-full flex items-center gap-2">
            <code className="flex-1 text-xs bg-[var(--panel)] px-2 py-1.5 rounded border break-all">
              {uri}
            </code>
            <Button type="button" onClick={copyUri} variant="secondary" size="sm">
              <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            onClick={payRequest}
            variant="secondary"
            size="sm"
            disabled={!connected || payingReq}
            className="w-full"
          >
            {payingReq ? (
              <>
                <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                Opening wallet…
              </>
            ) : (
              <>
                <Icon icon="mdi:wallet-outline" className="size-4 mr-2" />
                Pay in wallet
              </>
            )}
          </Button>
          {!connected && (
            <p className="text-xs text-[var(--text-secondary)]">Connect your wallet to pay.</p>
          )}
          {reqResult && (
            <StatusBox variant="success" title="Payment sent!" mono>
              {reqResult}
            </StatusBox>
          )}
          {reqError && <StatusBox variant="error">{reqError}</StatusBox>}
        </div>
      )}

      {/* Parse + pay */}
      <div className="border-t border-[var(--border)] pt-3 space-y-2">
        <label className="block text-sm font-medium">Pay a `ban:` URI</label>
        <input
          type="text"
          value={pasteUri}
          onChange={(e) => setPasteUri(e.target.value)}
          placeholder="ban:ban_1...?amount=..."
          className={FIELD_CLASS}
        />
        <div className="flex gap-2">
          <Button type="button" onClick={handleParse} variant="secondary" size="sm" disabled={!pasteUri.trim()}>
            Parse
          </Button>
          {parsed && (
            <Button
              type="button"
              onClick={handlePay}
              variant="secondary"
              size="sm"
              disabled={!connected || paying}
            >
              {paying ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Paying...
                </>
              ) : (
                `Pay ${parsed.amount ?? '?'} BAN`
              )}
            </Button>
          )}
        </div>

        {parsed && (
          <StatusBox variant="info" title="Parsed request">
            <div className="text-xs space-y-0.5">
              <div className="font-mono break-all">{parsed.address}</div>
              {parsed.amount && <div>Amount: {parsed.amount} BAN</div>}
              {parsed.label && <div>Label: {parsed.label}</div>}
              {parsed.message && <div>Message: {parsed.message}</div>}
            </div>
          </StatusBox>
        )}
        {pasteUri && !parsed && (
          <p className="text-xs text-red-600">Not a valid `ban:` URI.</p>
        )}
        {payResult && (
          <StatusBox variant="success" title="Payment sent!" mono>
            {payResult}
          </StatusBox>
        )}
        {payError && <StatusBox variant="error">{payError}</StatusBox>}
      </div>
    </div>
  );
}

export default PaymentUriForm;
