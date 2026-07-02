'use client';

import React, { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask, useMintNFT } from '@/providers';
import { Button, StatusBox } from '@/components/ui';
import { invalidateNftCache } from '@/components/NftGallery';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

interface MintSuccess {
  assetRepresentative: string;
  metadataCid: string;
  imageCid: string;
}

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

/**
 * Optional protocol fee for the demo, read from build-time env. When both are
 * set, each mint attaches a fee send that only goes out after the mint succeeds.
 */
const FEE_ADDRESS = process.env.NEXT_PUBLIC_MONKEYMASK_FEE_ADDRESS?.trim() || '';
const FEE_AMOUNT = process.env.NEXT_PUBLIC_MONKEYMASK_FEE_AMOUNT?.trim() || '';
const FEE_ENABLED = FEE_ADDRESS.length > 0 && parseFloat(FEE_AMOUNT) > 0;

/**
 * Mints a Banano NFT (73-meta-tokens) end to end: pins the image + metadata to
 * IPFS via our server, then asks the connected wallet to publish the
 * supply + mint blocks and send the NFT to a recipient.
 */
export function MintNftForm() {
  const { connected, publicKey } = useMonkeyMask();
  const mintNFT = useMintNFT();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [maxSupply, setMaxSupply] = useState('1');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'idle' | 'pinning' | 'minting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<MintSuccess | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const reset = () => {
    setSuccess(null);
    setError(null);
  };

  const handleMint = async () => {
    reset();
    if (!connected || !publicKey) {
      setError('Connect your wallet first.');
      return;
    }
    if (!file) {
      setError('Choose an image to mint.');
      return;
    }
    if (!name.trim()) {
      setError('Give your NFT a name.');
      return;
    }

    setBusy(true);
    try {
      setStage('pinning');
      const form = new FormData();
      form.append('file', file);
      form.append('name', name.trim());
      form.append('description', description.trim());
      form.append('issuer', publicKey);

      const res = await fetch('/api/ipfs', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to pin to IPFS');
      }
      const metadataCid: string = data.metadataCid;
      const imageCid: string = data.imageCid;

      setStage('minting');
      const to = recipient.trim() || publicKey;
      const fees = FEE_ENABLED
        ? [{ to: FEE_ADDRESS, amount: FEE_AMOUNT, label: 'MonkeyMask fee' }]
        : undefined;
      const parsedSupply = parseInt(maxSupply, 10);
      const supply = Number.isFinite(parsedSupply) && parsedSupply >= 0 ? parsedSupply : 1;
      const result = await mintNFT({ metadataCid, to, maxSupply: supply, name: name.trim(), fees });
      const assetRepresentative =
        typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';

      setSuccess({ assetRepresentative, metadataCid, imageCid });
      invalidateNftCache(publicKey);
      setFile(null);
      setName('');
      setDescription('');
      setRecipient('');
      setMaxSupply('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setBusy(false);
      setStage('idle');
    }
  };

  if (!connected) {
    return (
      <p className="text-[var(--text-secondary)] text-sm">
        Connect your wallet to mint a Banano NFT.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
          className={FIELD_CLASS}
        />
      </div>

      {previewUrl && (
        <div className="w-24 h-24 rounded-md overflow-hidden border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Banano NFT"
          disabled={busy}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A one-of-a-kind Banano collectible"
          disabled={busy}
          className={`${FIELD_CLASS} resize-none`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Recipient (optional)</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="ban_1... or name.ban (defaults to you)"
          disabled={busy}
          className={FIELD_CLASS}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Max supply (editions)</label>
        <input
          type="number"
          min={0}
          value={maxSupply}
          onChange={(e) => setMaxSupply(e.target.value)}
          placeholder="1"
          disabled={busy}
          className={FIELD_CLASS}
        />
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          1 = one-of-a-kind. Set &gt; 1 for a limited edition (0 = unlimited); you can mint the
          extra copies later from the NFT&apos;s detail view.
        </p>
      </div>

      {FEE_ENABLED && (
        <p className="text-xs text-[var(--text-secondary)]">
          A {FEE_AMOUNT} BAN MonkeyMask fee applies per mint. It&apos;s only sent after the mint
          succeeds — a failed mint never costs you the fee.
        </p>
      )}

      <Button onClick={handleMint} disabled={busy || !connected} size="sm" variant="secondary">
        {busy ? (
          <>
            <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
            {stage === 'pinning' ? 'Pinning to IPFS...' : 'Minting...'}
          </>
        ) : (
          'Mint NFT'
        )}
      </Button>

      {error && (
        <StatusBox variant="error" title="Mint failed">
          {error}
        </StatusBox>
      )}

      {success && (
        <StatusBox variant="success" title="Minted and sent">
          <div className="flex gap-3">
            <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden border border-green-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${IPFS_GATEWAY}${success.imageCid}`}
                alt="Minted NFT"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <div>
                Asset:{' '}
                <a
                  className="underline"
                  href={`https://creeper.banano.cc/hash/${success.assetRepresentative}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {success.assetRepresentative.slice(0, 16)}…
                </a>
              </div>
              <div className="font-mono break-all">metadata: {success.metadataCid}</div>
              <div className="text-green-800">
                It lands as a receivable block; your wallet auto-claims it on the next refresh,
                then it appears in the gallery once indexed.
              </div>
            </div>
          </div>
        </StatusBox>
      )}
    </div>
  );
}

export default MintNftForm;
