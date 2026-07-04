const EXPORT_SCALE = 2;

const SNAPDOM_OPTS = {
  scale: EXPORT_SCALE,
  dpr: 1,
  embedFonts: true,
  outerTransforms: true,
  outerShadows: true,
} as const;

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Ensure clipboard/download consumers always get a PNG, not SVG. */
export async function ensurePngBlob(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png') return blob;

  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode image for PNG conversion'));
      el.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');

    ctx.drawImage(img, 0, 0);
    const png = await canvasToPngBlob(canvas);
    if (!png) throw new Error('PNG conversion failed');
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Rasterize a promo shot at design size. Uses SnapDOM with dpr: 1 so mobile
 * devicePixelRatio does not stack on top of the 2× scale (which misaligns shadows).
 * Briefly moves the export host into the viewport so WebKit paints shadows.
 */
export async function renderPromoShot(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<Blob | null> {
  const host = node.parentElement;
  if (!host) return null;

  const savedHostStyle = host.getAttribute('style') ?? '';

  host.setAttribute(
    'style',
    [
      'position:fixed',
      'left:0',
      'top:0',
      `width:${width}px`,
      `height:${height}px`,
      'z-index:-1',
      'opacity:0.01',
      'pointer-events:none',
      'overflow:visible',
    ].join(';'),
  );

  await waitForPaint();

  try {
    const { snapdom } = await import('@zumer/snapdom');
    // toBlob() can return SVG on some browsers; rasterize explicitly to PNG.
    const canvas = await snapdom.toCanvas(node, SNAPDOM_OPTS);
    return canvasToPngBlob(canvas);
  } finally {
    if (savedHostStyle) host.setAttribute('style', savedHostStyle);
    else host.removeAttribute('style');
  }
}

export { EXPORT_SCALE };
