'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { Button } from '@/components/ui';

const DONATION_AMOUNT = '1';
const DONATION_RECIPIENT = 'cosmic.ban';

export function DonateButton() {
  const { signAndSendTransaction, connected } = useMonkeyMask();
  const [status, setStatus] = useState<string | null>(null);
  const [donating, setDonating] = useState(false);

  const handleDonate = async () => {
    if (!connected) {
      setStatus('Connect wallet first');
      return;
    }
    setDonating(true);
    setStatus(null);
    try {
      const result = await signAndSendTransaction({
        type: 'send',
        to: DONATION_RECIPIENT,
        amount: DONATION_AMOUNT,
      });
      setStatus(result.hash ? `Thank you! ${result.hash.slice(0, 12)}...` : 'Donation sent');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Donation failed');
    } finally {
      setDonating(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {status && <span className="text-xs bg-white border rounded px-2 py-1">{status}</span>}
      <Button onClick={() => void handleDonate()} variant="default" size="sm" disabled={donating}>
        {donating ? (
          <>
            <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
            Sending…
          </>
        ) : (
          `Donate ${DONATION_AMOUNT} BAN`
        )}
      </Button>
    </div>
  );
}