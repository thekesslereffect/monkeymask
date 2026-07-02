'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { Button, StatusBox } from '@/components/ui';

/** Self-contained BNS forward + reverse resolution demo. */
export function BnsDemo() {
  const { connected, resolveBNS, reverseResolveBNS } = useMonkeyMask();

  const [bnsName, setBnsName] = useState('');
  const [bnsResult, setBnsResult] = useState<string | null>(null);
  const [resolvingBNS, setResolvingBNS] = useState(false);

  const [reverseAddress, setReverseAddress] = useState('');
  const [reverseResult, setReverseResult] = useState<string[] | null>(null);
  const [reversing, setReversing] = useState(false);

  const fillExampleBNS = () => setBnsName('cosmic.ban');

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

  const handleReverseBNS = async () => {
    setReversing(true);
    setReverseResult(null);
    try {
      const names = await reverseResolveBNS(reverseAddress.trim() || undefined);
      setReverseResult(names);
    } catch {
      setReverseResult([]);
    } finally {
      setReversing(false);
    }
  };

  return (
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
          <Button type="button" onClick={fillExampleBNS} variant="secondary" size="sm">
            Example
          </Button>
        </div>
      </div>
      <Button onClick={handleResolveBNS} disabled={resolvingBNS || !bnsName.trim()} size="sm" variant="secondary">
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
  );
}

export default BnsDemo;
