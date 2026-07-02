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
  const [attributes, setAttributes] = useState<
    { trait_type: string; value: string; display_type: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<'idle' | 'pinning' | 'minting'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<MintSuccess | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const reset = () => {
    setSuccess(null);
    setError(null);
  };

  const addTrait = () =>
    setAttributes((a) =>
      a.length >= 20 ? a : [...a, { trait_type: '', value: '', display_type: '' }],
    );
  const updateTrait = (index: number, field: 'trait_type' | 'value' | 'display_type', value: string) =>
    setAttributes((a) =>
      a.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, [field]: value };
        // Switching display type can invalidate the prior value (e.g. text -> date),
        // so clear it to avoid submitting a mistyped value.
        if (field === 'display_type') next.value = '';
        return next;
      }),
    );
  const removeTrait = (index: number) =>
    setAttributes((a) => a.filter((_, i) => i !== index));

  /** HTML input type for a trait value given its OpenSea display_type. */
  const valueInputType = (displayType: string): string => {
    if (displayType === 'date') return 'date';
    if (displayType === 'number' || displayType === 'boost_number' || displayType === 'boost_percentage') {
      return 'number';
    }
    return 'text';
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
      const cleanedAttributes = attributes
        .map((t) => {
          const trait_type = t.trait_type.trim();
          const raw = t.value.trim();
          const dt = t.display_type;
          if (!trait_type || raw === '') return null;

          let value: string | number = raw;
          if (dt === 'date') {
            const ms = Date.parse(raw);
            if (!Number.isFinite(ms)) return null;
            value = Math.floor(ms / 1000); // OpenSea dates are unix seconds
          } else if (dt === 'number' || dt === 'boost_number' || dt === 'boost_percentage') {
            const n = Number(raw);
            if (!Number.isFinite(n)) return null;
            value = n;
          }

          const attr: { trait_type: string; value: string | number; display_type?: string } = {
            trait_type,
            value,
          };
          if (dt) attr.display_type = dt;
          return attr;
        })
        .filter((t): t is NonNullable<typeof t> => t !== null);
      if (cleanedAttributes.length > 0) {
        form.append('attributes', JSON.stringify(cleanedAttributes));
      }

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
      setAttributes([]);
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
        <div className="space-y-1">
          <div className="w-24 h-24 rounded-md overflow-hidden border border-[var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            File type: <span className="font-mono">{file?.type || 'unknown'}</span>
          </p>
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
        <label className="block text-sm font-medium mb-1">Traits (optional)</label>
        <div className="space-y-2">
          {attributes.map((trait, i) => (
            <div key={i} className="space-y-2 rounded-md border border-[var(--border)] p-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trait.trait_type}
                  onChange={(e) => updateTrait(i, 'trait_type', e.target.value)}
                  placeholder="Type (e.g. Background)"
                  disabled={busy}
                  className={FIELD_CLASS}
                />
                <button
                  type="button"
                  onClick={() => removeTrait(i)}
                  disabled={busy}
                  aria-label="Remove trait"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  <Icon icon="lucide:x" className="size-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type={valueInputType(trait.display_type)}
                  value={trait.value}
                  onChange={(e) => updateTrait(i, 'value', e.target.value)}
                  placeholder={trait.display_type === 'date' ? '' : 'Value (e.g. Volcano)'}
                  disabled={busy}
                  className={`${FIELD_CLASS} min-w-0 flex-1`}
                />
                <select
                  value={trait.display_type}
                  onChange={(e) => updateTrait(i, 'display_type', e.target.value)}
                  disabled={busy}
                  aria-label="Display type"
                  className="w-28 shrink-0 rounded-md border border-[var(--border)] bg-white px-2 py-2 text-sm"
                >
                  <option value="">Text</option>
                  <option value="number">Number</option>
                  <option value="boost_number">Boost</option>
                  <option value="boost_percentage">Boost %</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </div>
          ))}
          <Button
            type="button"
            onClick={addTrait}
            size="sm"
            variant="secondary"
            disabled={busy || attributes.length >= 20}
          >
            <Icon icon="lucide:plus" className="size-4 mr-1" />
            Add trait
          </Button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          ERC-721 style attributes shown by wallets and marketplaces. Purely descriptive; the
          metaprotocol doesn&apos;t require them.
        </p>
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
          succeeds. A failed mint never costs you the fee.
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
