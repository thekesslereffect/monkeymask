import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Input, Alert } from './ui';
import { openCreeperHash } from '../../utils/format';
import type { MonkeyNFT } from '../../utils/nft';

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

async function downloadImage(url: string, name: string): Promise<void> {
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

interface NFTDetailProps {
  nft: MonkeyNFT;
  onClose: () => void;
  /** Account that currently holds the NFT (the sender for a transfer). */
  fromAddress?: string;
  /** Called after a successful transfer or burn, with the affected asset id. */
  onTransferred?: (assetRepresentative: string) => void;
}

/** Full-screen NFT detail overlay: large art + download / explorer / metadata / transfer. */
export const NFTDetail: React.FC<NFTDetailProps> = ({ nft, onClose, fromAddress, onTransferred }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferHash, setTransferHash] = useState<string | null>(null);
  const [showBurn, setShowBurn] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burnError, setBurnError] = useState<string | null>(null);
  const [burnHash, setBurnHash] = useState<string | null>(null);
  const showImage = nft.image && !imageFailed;
  const metadataUrl = nft.metadataCid ? `${IPFS_GATEWAY}${nft.metadataCid}` : undefined;
  const canTransfer = Boolean(nft.assetRepresentative && fromAddress);
  const done = Boolean(transferHash || burnHash);

  const handleDownload = async () => {
    if (!nft.image) return;
    setDownloading(true);
    await downloadImage(nft.image, nft.name);
    setDownloading(false);
  };

  const handleTransfer = async () => {
    setTransferError(null);
    if (!nft.assetRepresentative || !fromAddress) {
      setTransferError('This NFT cannot be transferred.');
      return;
    }
    if (!recipient.trim()) {
      setTransferError('Enter a recipient address.');
      return;
    }
    setTransferring(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSFER_NFT',
        fromAddress,
        assetRepresentative: nft.assetRepresentative,
        toAddress: recipient.trim(),
      });
      if (response?.success) {
        setTransferHash(response.data.hash);
        setRecipient('');
        onTransferred?.(nft.assetRepresentative);
      } else {
        setTransferError(response?.error || 'Transfer failed');
      }
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const handleBurn = async () => {
    setBurnError(null);
    if (!nft.assetRepresentative || !fromAddress) {
      setBurnError('This NFT cannot be burned.');
      return;
    }
    setBurning(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'BURN_NFT',
        fromAddress,
        assetRepresentative: nft.assetRepresentative,
      });
      if (response?.success) {
        setBurnHash(response.data.hash);
        onTransferred?.(nft.assetRepresentative);
      } else {
        setBurnError(response?.error || 'Burn failed');
      }
    } catch (err) {
      setBurnError(err instanceof Error ? err.message : 'Burn failed');
    } finally {
      setBurning(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tertiary/10">
        <span className="text-sm font-semibold text-primary truncate pr-2">{nft.name}</span>
        <button onClick={onClose} className="text-tertiary hover:text-primary shrink-0" aria-label="Close">
          <Icon icon="lucide:x" className="text-xl" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="aspect-square flex items-center justify-center bg-tertiary/10 overflow-hidden">
          {showImage ? (
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Icon icon="lucide:image" className="text-6xl text-tertiary/50" />
          )}
        </div>

        <div className="p-4 space-y-3">
          {nft.collection && <div className="text-xs text-tertiary/70">{nft.collection}</div>}
          {nft.supplyType && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/10 px-2 py-0.5 font-medium text-primary">
                <Icon
                  icon={
                    nft.supplyType === 'unique'
                      ? 'lucide:gem'
                      : nft.supplyType === 'unlimited'
                        ? 'lucide:infinity'
                        : 'lucide:layers'
                  }
                  className="text-xs"
                />
                {nft.supplyType === 'unique'
                  ? '1 of 1'
                  : nft.supplyType === 'unlimited'
                    ? `Unlimited · ${nft.mintedCount ?? 0} minted`
                    : `Limited · ${nft.mintedCount ?? 0} of ${nft.maxSupply}`}
              </span>
              {(nft.heldCount ?? 0) > 0 && (
                <span className="inline-flex items-center rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
                  You hold {nft.heldCount}
                </span>
              )}
            </div>
          )}
          {nft.description && <p className="text-sm text-primary/90">{nft.description}</p>}

          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="secondary" onClick={handleDownload} disabled={!nft.image || downloading}>
              {downloading ? (
                <Icon icon="mdi:loading" className="text-base animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <Icon icon="lucide:download" className="text-base" /> Save
                </span>
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => nft.assetRepresentative && openCreeperHash(nft.assetRepresentative)}
              disabled={!nft.assetRepresentative}
            >
              <span className="flex items-center gap-1">
                <Icon icon="lucide:external-link" className="text-base" /> Creeper
              </span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => metadataUrl && window.open(metadataUrl, '_blank', 'noopener,noreferrer')}
              disabled={!metadataUrl}
            >
              <span className="flex items-center gap-1">
                <Icon icon="lucide:file-json" className="text-base" /> Meta
              </span>
            </Button>
          </div>

          {canTransfer && !done && !showBurn && (
            <Button
              size="sm"
              variant={showTransfer ? 'primary' : 'secondary'}
              onClick={() => setShowTransfer((v) => !v)}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-1">
                <Icon icon="lucide:send" className="text-base" /> Transfer
              </span>
            </Button>
          )}

          {canTransfer && !done && !showTransfer && (
            <Button
              size="sm"
              variant={showBurn ? 'danger' : 'ghost'}
              onClick={() => setShowBurn((v) => !v)}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-1">
                <Icon icon="lucide:flame" className="text-base" /> Burn
              </span>
            </Button>
          )}

          {showBurn && !done && (
            <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-start gap-2 text-destructive">
                <Icon icon="lucide:flame" className="text-base shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold">Permanently destroy this NFT?</div>
                  <div className="opacity-90">
                    It will be sent to a black-hole account and can never be recovered.
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="danger" onClick={handleBurn} disabled={burning}>
                  {burning ? (
                    <Icon icon="mdi:loading" className="text-base animate-spin" />
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
              {burnError && <Alert variant="destructive">{burnError}</Alert>}
            </div>
          )}

          {burnHash && (
            <Alert variant="destructive">NFT burned. It will leave your gallery once the index updates.</Alert>
          )}

          {showTransfer && !done && (
            <div className="space-y-2 rounded-lg border border-tertiary/10 p-3">
              <Input
                label="Send this NFT to"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="ban_1... or name.ban"
                disabled={transferring}
                size="sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={handleTransfer} disabled={transferring}>
                  {transferring ? (
                    <Icon icon="mdi:loading" className="text-base animate-spin" />
                  ) : (
                    'Confirm'
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
              {transferError && <Alert variant="destructive">{transferError}</Alert>}
            </div>
          )}

          {transferHash && (
            <Alert variant="success">
              Transfer sent. It will leave your gallery once the index updates.
            </Alert>
          )}

          {nft.assetRepresentative && (
            <div className="pt-1">
              <div className="text-[10px] uppercase tracking-wide text-tertiary/70">Asset representative</div>
              <div className="font-mono text-xs text-primary/80 break-all">{nft.assetRepresentative}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
