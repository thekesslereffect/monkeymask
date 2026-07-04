import { ensurePngBlob } from './renderPromoShot';

/**
 * Copy a PNG blob to the clipboard. Safari/iOS requires clipboard.write to be
 * called synchronously from the click handler with a ClipboardItem whose value
 * is a Promise — awaiting render() first loses the user-gesture context.
 */
export function copyImageToClipboard(
  blobPromise: Promise<Blob | null>,
  filename: string,
): Promise<'copied' | 'shared'> {
  const pngPromise = blobPromise.then(async (blob) => {
    if (!blob) throw new Error('Failed to render image');
    return ensurePngBlob(blob);
  });

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    return navigator.clipboard
      .write([
        new ClipboardItem({
          'image/png': pngPromise,
        }),
      ])
      .then(() => 'copied' as const)
      .catch(() => copyImageFallback(pngPromise, filename));
  }

  return copyImageFallback(pngPromise, filename);
}

async function copyImageFallback(
  pngPromise: Promise<Blob>,
  filename: string,
): Promise<'copied' | 'shared'> {
  const blob = await pngPromise;

  // Some browsers reject promises in ClipboardItem — retry with a resolved blob.
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'copied';
    } catch {
      // Fall through.
    }
  }

  // iOS / Android fallback: native share sheet with the PNG file.
  if (typeof navigator.share === 'function') {
    const file = new File([blob], `${filename}.png`, { type: 'image/png' });
    const shareData: ShareData = { files: [file] };
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return 'shared';
    }
  }

  throw new Error('Copy not supported on this device');
}
