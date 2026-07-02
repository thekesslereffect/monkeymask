'use client';

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  useMonkeyMask,
  useTransferNFT,
  useMintEdition,
  useBurnNFT,
  useFinishSupply,
} from '@/providers';
import { Button, StatusBox } from '@/components/ui';
import type { NormalizedNFT } from '@/lib/nft';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

async function downloadImage(url: string, name: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'png').split('+')[0];
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${name.replace(/[^a-z0-9-_]+/gi, '_') || 'nft'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

export function NftDetailModal({
  nft,
  onClose,
  onTransferred,
}: {
  nft: NormalizedNFT;
  onClose: () => void;
  onTransferred?: () => void;
}) {
  const { publicKey } = useMonkeyMask();
  const transferNFT = useTransferNFT();
  const mintEdition = useMintEdition();
  const burnNFT = useBurnNFT();
  const finishSupply = useFinishSupply();
  const [imageFailed, setImageFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferHash, setTransferHash] = useState<string | null>(null);

  const [showEdition, setShowEdition] = useState(false);
  const [editionRecipient, setEditionRecipient] = useState('');
  const [minting, setMinting] = useState(false);
  const [editionError, setEditionError] = useState<string | null>(null);
  const [editionHash, setEditionHash] = useState<string | null>(null);

  const [showBurn, setShowBurn] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnHash, setBurnHash] = useState<string | null>(null);

  const [showFinish, setShowFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [finishHash, setFinishHash] = useState<string | null>(null);

  // Supply model for display + gating the "Mint copy" action.
  const maxSupply = nft.maxSupply;
  const mintedCount = nft.mintedCount ?? 0;
  const heldCount = nft.heldCount ?? 0;
  const limitReached = typeof maxSupply === 'number' && maxSupply > 0 && mintedCount >= maxSupply;
  // Finished either on-chain (from the index) or just now in this session.
  const isFinished = Boolean(nft.finished) || Boolean(finishHash);
  const supplyLabel =
    nft.supplyType === 'unique'
      ? 'One of a kind (1 of 1)'
      : nft.supplyType === 'unlimited'
        ? `Unlimited edition · ${mintedCount} minted${isFinished ? ' · finished' : ''}`
        : nft.supplyType === 'limited'
          ? `Limited edition · ${mintedCount} of ${maxSupply} minted${isFinished ? ' · finished' : ''}`
          : null;

  // The issuer can mint more copies of a collection with room left. A 1-of-1
  // (maxSupply 1) is never re-mintable, and a finished collection is locked.
  const canMintEdition =
    nft.collection === 'Minted by you' &&
    !!nft.metadataCid &&
    maxSupply !== 1 &&
    !limitReached &&
    !isFinished;

  // A collection you issued (multi/unlimited) can be locked so no more editions
  // can ever be minted — even once the limit is already reached. Once locked,
  // there's nothing left to finish.
  const canFinish =
    nft.collection === 'Minted by you' &&
    !!nft.metadataCid &&
    maxSupply !== 1 &&
    !isFinished;

  const handleMintEdition = async () => {
    setEditionError(null);
    if (!nft.metadataCid) {
      setEditionError('This NFT has no metadata CID to mint from.');
      return;
    }
    setMinting(true);
    try {
      const result = await mintEdition({
        metadataCid: nft.metadataCid,
        to: editionRecipient.trim() || publicKey || '',
        name: nft.name,
      });
      const hash =
        typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';
      setEditionHash(hash);
      setEditionRecipient('');
      onTransferred?.();
    } catch (err) {
      setEditionError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setMinting(false);
    }
  };

  const handleFinish = async () => {
    setFinishError(null);
    if (!nft.metadataCid) {
      setFinishError('This NFT has no metadata CID.');
      return;
    }
    setFinishing(true);
    try {
      const result = await finishSupply({ metadataCid: nft.metadataCid, name: nft.name });
      const hash = typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';
      setFinishHash(hash);
      onTransferred?.();
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : 'Finish failed');
    } finally {
      setFinishing(false);
    }
  };

  const handleBurn = async () => {
    setBurnError(null);
    if (!nft.assetRepresentative) {
      setBurnError('This NFT has no asset representative to burn.');
      return;
    }
    setBurning(true);
    try {
      const result = await burnNFT({
        assetRepresentative: nft.assetRepresentative,
        name: nft.name,
      });
      const hash = typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';
      setBurnHash(hash);
      onTransferred?.();
    } catch (err) {
      setBurnError(err instanceof Error ? err.message : 'Burn failed');
    } finally {
      setBurning(false);
    }
  };

  const handleTransfer = async () => {
    setTransferError(null);
    if (!nft.assetRepresentative) {
      setTransferError('This NFT has no asset representative to transfer.');
      return;
    }
    if (!recipient.trim()) {
      setTransferError('Enter a recipient address.');
      return;
    }
    setTransferring(true);
    try {
      const result = await transferNFT({
        assetRepresentative: nft.assetRepresentative,
        to: recipient.trim(),
        name: nft.name,
      });
      const hash = typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';
      setTransferHash(hash);
      setRecipient('');
      onTransferred?.();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const creeperUrl = nft.assetRepresentative
    ? `https://creeper.banano.cc/hash/${nft.assetRepresentative}`
    : undefined;
  const metadataUrl = nft.metadataCid ? `${IPFS_GATEWAY}${nft.metadataCid}` : undefined;
  const showImage = nft.image && !imageFailed;

  const handleDownload = async () => {
    if (!nft.image) return;
    setDownloading(true);
    await downloadImage(nft.image, nft.name);
    setDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-semibold truncate pr-2">{nft.name}</span>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-foreground shrink-0"
            aria-label="Close"
          >
            <Icon icon="lucide:x" className="size-5" />
          </button>
        </div>

        <div className="aspect-square flex items-center justify-center bg-secondary overflow-hidden">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Icon icon="lucide:image" className="size-16 text-muted-foreground" />
          )}
        </div>

        <div className="p-4 space-y-3">
          {nft.collection && (
            <div className="text-xs text-[var(--text-secondary)]">{nft.collection}</div>
          )}
          {supplyLabel && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium">
                <Icon
                  icon={
                    nft.supplyType === 'unique'
                      ? 'lucide:gem'
                      : nft.supplyType === 'unlimited'
                        ? 'lucide:infinity'
                        : 'lucide:layers'
                  }
                  className="size-3"
                />
                {supplyLabel}
              </span>
              {heldCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  You hold {heldCount}
                </span>
              )}
              {limitReached && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                  Sold out
                </span>
              )}
              {isFinished && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  <Icon icon="lucide:lock" className="size-3" />
                  Supply locked
                </span>
              )}
            </div>
          )}
          {nft.description && <p className="text-sm">{nft.description}</p>}

          <div className="flex flex-wrap gap-2">
            {nft.image && (
              <Button size="sm" variant="secondary" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                ) : (
                  <Icon icon="lucide:download" className="size-4 mr-2" />
                )}
                Download
              </Button>
            )}
            {creeperUrl && (
              <a href={creeperUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  <Icon icon="lucide:external-link" className="size-4 mr-2" />
                  Creeper
                </Button>
              </a>
            )}
            {metadataUrl && (
              <a href={metadataUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="secondary">
                  <Icon icon="lucide:file-json" className="size-4 mr-2" />
                  Metadata
                </Button>
              </a>
            )}
            {nft.assetRepresentative && !transferHash && !burnHash && (
              <Button
                size="sm"
                variant={showTransfer ? 'default' : 'secondary'}
                onClick={() => setShowTransfer((v) => !v)}
              >
                <Icon icon="lucide:send" className="size-4 mr-2" />
                Transfer
              </Button>
            )}
            {canMintEdition && !burnHash && (
              <Button
                size="sm"
                variant={showEdition ? 'default' : 'secondary'}
                onClick={() => setShowEdition((v) => !v)}
              >
                <Icon icon="lucide:copy-plus" className="size-4 mr-2" />
                Mint copy
              </Button>
            )}
            {canFinish && !burnHash && !finishHash && (
              <Button
                size="sm"
                variant={showFinish ? 'default' : 'secondary'}
                onClick={() => setShowFinish((v) => !v)}
              >
                <Icon icon="lucide:lock" className="size-4 mr-2" />
                Finish
              </Button>
            )}
            {nft.assetRepresentative && !transferHash && !burnHash && (
              <Button
                size="sm"
                variant={showBurn ? 'destructive' : 'ghost'}
                onClick={() => setShowBurn((v) => !v)}
              >
                <Icon icon="lucide:flame" className="size-4 mr-2" />
                Burn
              </Button>
            )}
          </div>

          {showFinish && !finishHash && (
            <div className="space-y-2 rounded-md border border-[var(--border)] p-3">
              <div className="flex items-start gap-2">
                <Icon icon="lucide:lock" className="size-4 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Lock this collection?</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Publishes a <code>#finish_supply</code> block. No further editions can ever be
                    minted. Existing copies are unaffected. This cannot be undone.
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFinish} disabled={finishing}>
                  {finishing ? (
                    <>
                      <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                      Finishing…
                    </>
                  ) : (
                    'Finish collection'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowFinish(false)}
                  disabled={finishing}
                >
                  Cancel
                </Button>
              </div>
              {finishError && (
                <StatusBox variant="error" title="Finish failed">
                  {finishError}
                </StatusBox>
              )}
            </div>
          )}

          {finishHash && (
            <StatusBox variant="success" title="Collection finished">
              <div className="space-y-1">
                <div>No more editions can be minted from this collection.</div>
                <a
                  className="underline break-all"
                  href={`https://creeper.banano.cc/hash/${finishHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {finishHash.slice(0, 16)}…
                </a>
              </div>
            </StatusBox>
          )}

          {showBurn && !burnHash && (
            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <div className="flex items-start gap-2 text-destructive">
                <Icon icon="lucide:flame" className="size-4 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Permanently destroy this NFT?</div>
                  <div className="text-xs opacity-90">
                    Burning sends the asset to a black-hole account (73-meta-tokens{' '}
                    <code>send#burn</code>). This is irreversible — it can never be recovered or
                    moved again.
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleBurn} disabled={burning}>
                  {burning ? (
                    <>
                      <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                      Burning…
                    </>
                  ) : (
                    'Burn forever'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowBurn(false)}
                  disabled={burning}
                >
                  Cancel
                </Button>
              </div>
              {burnError && (
                <StatusBox variant="error" title="Burn failed">
                  {burnError}
                </StatusBox>
              )}
            </div>
          )}

          {burnHash && (
            <StatusBox variant="success" title="NFT burned">
              <div className="space-y-1">
                <div>The NFT has been destroyed. It will leave your gallery once the index updates.</div>
                <a
                  className="underline break-all"
                  href={`https://creeper.banano.cc/hash/${burnHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {burnHash.slice(0, 16)}…
                </a>
              </div>
            </StatusBox>
          )}

          {showEdition && (
            <div className="space-y-2 rounded-md border border-[var(--border)] p-3">
              <label className="block text-sm font-medium">Mint another edition to</label>
              <input
                type="text"
                value={editionRecipient}
                onChange={(e) => setEditionRecipient(e.target.value)}
                placeholder="ban_1... or name.ban (defaults to you)"
                disabled={minting}
                className={FIELD_CLASS}
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Publishes a new copy from this collection. Fails if the edition limit is reached.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleMintEdition} disabled={minting}>
                  {minting ? (
                    <>
                      <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                      Minting…
                    </>
                  ) : (
                    'Mint copy'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowEdition(false)}
                  disabled={minting}
                >
                  Cancel
                </Button>
              </div>
              {editionError && (
                <StatusBox variant="error" title="Mint failed">
                  {editionError}
                </StatusBox>
              )}
              {editionHash && (
                <StatusBox variant="success" title="Edition minted">
                  <a
                    className="underline break-all"
                    href={`https://creeper.banano.cc/hash/${editionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {editionHash.slice(0, 16)}…
                  </a>
                </StatusBox>
              )}
            </div>
          )}

          {showTransfer && !transferHash && (
            <div className="space-y-2 rounded-md border border-[var(--border)] p-3">
              <label className="block text-sm font-medium">Send this NFT to</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="ban_1... or name.ban"
                disabled={transferring}
                className={FIELD_CLASS}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleTransfer} disabled={transferring}>
                  {transferring ? (
                    <>
                      <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                      Transferring…
                    </>
                  ) : (
                    'Confirm transfer'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowTransfer(false)}
                  disabled={transferring}
                >
                  Cancel
                </Button>
              </div>
              {transferError && (
                <StatusBox variant="error" title="Transfer failed">
                  {transferError}
                </StatusBox>
              )}
            </div>
          )}

          {transferHash && (
            <StatusBox variant="success" title="Transfer sent">
              <div className="space-y-1">
                <div>The NFT is on its way. It will leave your gallery once the index updates.</div>
                <a
                  className="underline break-all"
                  href={`https://creeper.banano.cc/hash/${transferHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {transferHash.slice(0, 16)}…
                </a>
              </div>
            </StatusBox>
          )}

          {nft.assetRepresentative && (
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                Asset representative
              </div>
              <div className="font-mono text-xs break-all">{nft.assetRepresentative}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NftDetailModal;
