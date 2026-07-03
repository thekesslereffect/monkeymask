const EXPORT_SCALE = 2;

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
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
    return await snapdom.toBlob(node, {
      scale: EXPORT_SCALE,
      dpr: 1,
      embedFonts: true,
      outerTransforms: true,
      outerShadows: true,
    });
  } finally {
    if (savedHostStyle) host.setAttribute('style', savedHostStyle);
    else host.removeAttribute('style');
  }
}

export { EXPORT_SCALE };
