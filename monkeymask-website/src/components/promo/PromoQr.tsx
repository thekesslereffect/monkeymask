import QRCode from 'qrcode';

const PROMO_QR_URL = 'https://monkeymask.cc';

const qr = QRCode.create(PROMO_QR_URL, { errorCorrectionLevel: 'M' });
const QR_MODULES = qr.modules.size;
const QR_MARGIN = 4;

/** Scannable QR for promo mockups (points at monkeymask.cc). */
export function PromoQr({
  pixelSize = 6,
  className = '',
}: {
  pixelSize?: number;
  className?: string;
}) {
  const inner = QR_MODULES * pixelSize;
  const outer = inner + QR_MARGIN * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={outer}
      height={outer}
      viewBox={`0 0 ${outer} ${outer}`}
      className={className}
      role="img"
      aria-label={`QR code for ${PROMO_QR_URL}`}
    >
      <rect width={outer} height={outer} fill="#ffffff" />
      {Array.from({ length: QR_MODULES }, (_, row) =>
        Array.from({ length: QR_MODULES }, (_, col) =>
          qr.modules.get(row, col) ? (
            <rect
              key={`${row}-${col}`}
              x={QR_MARGIN + col * pixelSize}
              y={QR_MARGIN + row * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill="#111111"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

export default PromoQr;
