'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import {
  useMonkeyMask,
  useTransferNFT,
  useMintEdition,
  useBurnNFT,
  useFinishSupply,
} from '@/providers';
import { Button, Badge, StatusBox, Separator } from '@/components/ui';
import type { NormalizedNFT } from '@/lib/nft';
import { supplyBadge } from '@/lib/nftDisplay';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const FIELD_CLASS =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50';

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

function ActionPanel({
  title,
  description,
  icon,
  tone = 'default',
  children,
}: {
  title: string;
  description?: string;
  icon: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`space-y-3 rounded-xl border p-4 ${
        tone === 'danger' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-[var(--panel)]/30'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          icon={icon}
          className={`mt-0.5 size-4 shrink-0 ${tone === 'danger' ? 'text-destructive' : 'text-foreground'}`}
        />
        <div>
          <div className={`text-sm font-semibold ${tone === 'danger' ? 'text-destructive' : ''}`}>
            {title}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function TxLink({ hash, label }: { hash: string; label?: string }) {
  return (
    <a
      className="font-mono text-xs underline underline-offset-2 break-all hover:text-primary"
      href={`https://creeper.banano.cc/hash/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label ?? `${hash.slice(0, 16)}…`}
    </a>
  );
}

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
  const [showDetails, setShowDetails] = useState(false);

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

  const maxSupply = nft.maxSupply;
  const mintedCount = nft.mintedCount ?? 0;
  const heldCount = nft.heldCount ?? 0;
  const limitReached = typeof maxSupply === 'number' && maxSupply > 0 && mintedCount >= maxSupply;
  const isFinished = Boolean(nft.finished) || Boolean(finishHash);

  const canMintEdition =
    nft.collection === 'Minted by you' &&
    !!nft.metadataCid &&
    maxSupply !== 1 &&
    !limitReached &&
    !isFinished;

  const canFinish =
    nft.collection === 'Minted by you' && !!nft.metadataCid && maxSupply !== 1 && !isFinished;

  const badge = supplyBadge(nft);
  const creeperUrl = nft.assetRepresentative
    ? `https://creeper.banano.cc/hash/${nft.assetRepresentative}`
    : undefined;
  const metadataUrl = nft.metadataCid ? `${IPFS_GATEWAY}${nft.metadataCid}` : undefined;
  const showImage = nft.image && !imageFailed;
  const isTerminal = Boolean(transferHash || burnHash);

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

  const handleDownload = async () => {
    if (!nft.image) return;
    setDownloading(true);
    await downloadImage(nft.image, nft.name);
    setDownloading(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nft-modal-title"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="nft-modal-title" className="truncate text-xl font-bold tracking-tight">
              {nft.name}
            </h2>
            {nft.collection && (
              <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">{nft.collection}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-[var(--text-secondary)] transition hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <Icon icon="lucide:x" className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Artwork */}
            <div className="relative bg-secondary p-4 sm:p-6 lg:min-h-[360px]">
              <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                {showImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="size-full object-contain"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <Icon icon="lucide:image" className="size-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              {nft.image && (
                <div className="mt-3 flex justify-center">
                  <Button size="sm" variant="secondary" onClick={handleDownload} disabled={downloading}>
                    {downloading ? (
                      <Icon icon="mdi:loading" className="size-4 animate-spin" />
                    ) : (
                      <Icon icon="lucide:download" className="size-4" />
                    )}
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Details + actions */}
            <div className="space-y-5 p-5 sm:p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {badge && (
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1">
                    <Icon icon={badge.icon} />
                    {badge.label}
                  </Badge>
                )}
                {heldCount > 0 && (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    You hold {heldCount}
                  </Badge>
                )}
                {limitReached && (
                  <Badge variant="outline" className="rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">
                    Sold out
                  </Badge>
                )}
                {isFinished && (
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    <Icon icon="lucide:lock" />
                    Supply locked
                  </Badge>
                )}
              </div>

              {nft.description && (
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{nft.description}</p>
              )}

              <Separator />

              {/* Quick links */}
              <div className="flex flex-wrap items-center gap-2">
                {creeperUrl && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={creeperUrl} target="_blank" rel="noopener noreferrer">
                      <Icon icon="lucide:external-link" />
                      View on Creeper
                    </a>
                  </Button>
                )}
                {metadataUrl && (
                  <Button size="sm" variant="secondary" asChild>
                    <a href={metadataUrl} target="_blank" rel="noopener noreferrer">
                      <Icon icon="lucide:file-json" />
                      Metadata
                    </a>
                  </Button>
                )}
                {!isTerminal && nft.assetRepresentative && !showTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransfer(false);
                      setShowBurn((v) => !v);
                    }}
                    aria-label="Burn NFT"
                    aria-pressed={showBurn}
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 ${
                      showBurn ? 'bg-destructive/15' : ''
                    }`}
                  >
                    <Icon icon="lucide:flame" className="size-5" />
                  </button>
                )}
              </div>

              {/* Primary actions */}
              {!isTerminal && (
                <div className="flex flex-wrap gap-2">
                  {nft.assetRepresentative && !showBurn && (
                    <Button
                      size="sm"
                      variant={showTransfer ? 'default' : 'secondary'}
                      onClick={() => {
                        setShowBurn(false);
                        setShowTransfer((v) => !v);
                      }}
                    >
                      <Icon icon="lucide:send" />
                      Transfer
                    </Button>
                  )}
                  {canMintEdition && (
                    <Button
                      size="sm"
                      variant={showEdition ? 'default' : 'secondary'}
                      onClick={() => setShowEdition((v) => !v)}
                    >
                      <Icon icon="lucide:copy-plus" />
                      Mint copy
                    </Button>
                  )}
                  {canFinish && !finishHash && (
                    <Button
                      size="sm"
                      variant={showFinish ? 'default' : 'secondary'}
                      onClick={() => setShowFinish((v) => !v)}
                    >
                      <Icon icon="lucide:lock" />
                      Finish collection
                    </Button>
                  )}
                </div>
              )}

              {/* Action panels */}
              {showFinish && !finishHash && (
                <ActionPanel
                  icon="lucide:lock"
                  title="Lock this collection?"
                  description="Publishes a #finish_supply block. No further editions can ever be minted. This cannot be undone."
                >
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleFinish} disabled={finishing}>
                      {finishing ? (
                        <>
                          <Icon icon="mdi:loading" className="size-4 animate-spin" />
                          Finishing…
                        </>
                      ) : (
                        'Finish collection'
                      )}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowFinish(false)} disabled={finishing}>
                      Cancel
                    </Button>
                  </div>
                  {finishError && <StatusBox variant="error">{finishError}</StatusBox>}
                </ActionPanel>
              )}

              {finishHash && (
                <StatusBox variant="success" title="Collection finished">
                  <p className="text-sm">No more editions can be minted from this collection.</p>
                  <TxLink hash={finishHash} />
                </StatusBox>
              )}

              {showBurn && !burnHash && (
                <ActionPanel
                  icon="lucide:flame"
                  title="Permanently destroy this NFT?"
                  description="Burning sends the asset to a black-hole account (send#burn). This is irreversible."
                  tone="danger"
                >
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={handleBurn} disabled={burning}>
                      {burning ? (
                        <>
                          <Icon icon="mdi:loading" className="size-4 animate-spin" />
                          Burning…
                        </>
                      ) : (
                        'Burn forever'
                      )}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowBurn(false)} disabled={burning}>
                      Cancel
                    </Button>
                  </div>
                  {burnError && <StatusBox variant="error">{burnError}</StatusBox>}
                </ActionPanel>
              )}

              {burnHash && (
                <StatusBox variant="success" title="NFT burned">
                  <p className="text-sm">The NFT has been destroyed. It will leave your gallery once the index updates.</p>
                  <TxLink hash={burnHash} />
                </StatusBox>
              )}

              {showEdition && (
                <ActionPanel
                  icon="lucide:copy-plus"
                  title="Mint another edition"
                  description="Publishes a new copy from this collection. Fails if the edition limit is reached."
                >
                  <input
                    type="text"
                    value={editionRecipient}
                    onChange={(e) => setEditionRecipient(e.target.value)}
                    placeholder="ban_1... or name.ban (defaults to you)"
                    disabled={minting}
                    className={FIELD_CLASS}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleMintEdition} disabled={minting}>
                      {minting ? (
                        <>
                          <Icon icon="mdi:loading" className="size-4 animate-spin" />
                          Minting…
                        </>
                      ) : (
                        'Mint copy'
                      )}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowEdition(false)} disabled={minting}>
                      Cancel
                    </Button>
                  </div>
                  {editionError && <StatusBox variant="error">{editionError}</StatusBox>}
                  {editionHash && (
                    <StatusBox variant="success" title="Edition minted">
                      <TxLink hash={editionHash} />
                    </StatusBox>
                  )}
                </ActionPanel>
              )}

              {showTransfer && !transferHash && (
                <ActionPanel
                  icon="lucide:send"
                  title="Transfer this NFT"
                  description="Send this asset to another Banano address or .ban name."
                >
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
                          <Icon icon="mdi:loading" className="size-4 animate-spin" />
                          Transferring…
                        </>
                      ) : (
                        'Confirm transfer'
                      )}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShowTransfer(false)} disabled={transferring}>
                      Cancel
                    </Button>
                  </div>
                  {transferError && <StatusBox variant="error">{transferError}</StatusBox>}
                </ActionPanel>
              )}

              {transferHash && (
                <StatusBox variant="success" title="Transfer sent">
                  <p className="text-sm">The NFT is on its way. It will leave your gallery once the index updates.</p>
                  <TxLink hash={transferHash} />
                </StatusBox>
              )}

              {/* On-chain details */}
              {nft.assetRepresentative && (
                <>
                  <Separator />
                  <button
                    type="button"
                    onClick={() => setShowDetails((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:text-foreground"
                  >
                    On-chain details
                    <Icon
                      icon="lucide:chevron-down"
                      className={`size-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {showDetails && (
                    <div className="space-y-3 rounded-xl border border-border bg-[var(--panel)]/40 p-4">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                          Asset representative
                        </div>
                        <div className="mt-1 font-mono text-xs break-all">{nft.assetRepresentative}</div>
                      </div>
                      {nft.metadataCid && (
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                            Metadata CID
                          </div>
                          <div className="mt-1 font-mono text-xs break-all">{nft.metadataCid}</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}

export default NftDetailModal;
