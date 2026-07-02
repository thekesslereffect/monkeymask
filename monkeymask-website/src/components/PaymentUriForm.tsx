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

/**
 * `ban:` payment-URI demo: build a request → URI → QR, or paste a URI to parse
 * and pay it. Uses the pure `buildBananoUri` / `parseBananoUri` helpers so any
 * dApp can generate scannable payment codes without touching bananojs.
 */
export function PaymentUriForm() {
  const { connected } = useMonkeyMask();
  const send = useSend();

  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [pasteUri, setPasteUri] = useState('');
  const [parsed, setParsed] = useState<BananoPaymentRequest | null>(null);
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const uri = useMemo(() => {
    if (!address.trim()) return null;
    try {
      return buildBananoUri({
        address: address.trim(),
        amount: amount.trim() || undefined,
        label: label.trim() || undefined,
      });
    } catch {
      return null;
    }
  }, [address, amount, label]);

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
