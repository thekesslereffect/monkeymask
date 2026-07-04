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

function readStyle(el: HTMLElement | null): string {
  return el?.getAttribute('style') ?? '';
}

function writeStyle(el: HTMLElement | null, style: string) {
  if (!el) return;
  if (style) el.setAttribute('style', style);
  else el.removeAttribute('style');
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
 * Rasterize the on-screen promo shot at design size.
 *
 * Captures the same DOM node as the preview (no second tree). Temporarily
 * removes the responsive CSS scale and parks the node in the viewport so
 * fonts, shadows, and layout match what you see.
 */
export async function renderPromoShot(
  node: HTMLElement,
  width: number,
  height: number,
): Promise<Blob | null> {
  // PromoShot structure: wrap > frame > shot(node)
  const frame = node.parentElement;
  const wrap = frame?.parentElement ?? null;

  const saved = {
    node: readStyle(node),
    frame: readStyle(frame),
    wrap: readStyle(wrap),
  };

  // Full-size, unscaled, in-viewport (near-invisible) for a faithful paint.
  writeStyle(
    wrap,
    [
      'position:fixed',
      'left:0',
      'top:0',
      `width:${width}px`,
      `height:${height}px`,
      'max-width:none',
      'overflow:visible',
      'z-index:-1',
      'opacity:0.01',
      'pointer-events:none',
    ].join(';'),
  );
  writeStyle(frame, `width:${width}px;height:${height}px;max-width:none;overflow:visible`);
  writeStyle(
    node,
    `width:${width}px;height:${height}px;transform:none;transform-origin:top left`,
  );

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await waitForPaint();

    const { snapdom } = await import('@zumer/snapdom');
    const canvas = await snapdom.toCanvas(node, SNAPDOM_OPTS);
    return canvasToPngBlob(canvas);
  } finally {
    writeStyle(node, saved.node);
    writeStyle(frame, saved.frame);
    writeStyle(wrap, saved.wrap);
  }
}

export { EXPORT_SCALE };
