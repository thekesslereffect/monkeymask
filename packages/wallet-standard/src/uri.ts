// Pure helpers for `ban:` payment URIs (the Banano flavour of the Nano/BIP21
// scheme). A URI looks like:
//
//   ban:ban_1abc…?amount=<raw>&label=<name>&message=<memo>
//
// The on-wire `amount` is in raw (1 BAN = 10^29 raw). These helpers speak BAN
// decimals at the edges and convert to/from raw internally, so callers never
// have to juggle 29-digit integers. No bananojs / blake2b needed.

const RAW_DECIMALS = 29;
const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

/** Convert a BAN decimal string (e.g. "1.25") to a raw integer string. */
export function banToRaw(amountBan: string): string {
  const trimmed = amountBan.trim();
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === '' || trimmed === '.') {
    throw new Error(`Invalid BAN amount: ${amountBan}`);
  }
  const [whole, frac = ''] = trimmed.split('.');
  const fracPadded = (frac + '0'.repeat(RAW_DECIMALS)).slice(0, RAW_DECIMALS);
  return BigInt((whole || '0') + fracPadded).toString();
}

/** Convert a raw integer string to a trimmed BAN decimal string. */
export function rawToBan(raw: string): string {
  const value = BigInt(raw);
  const base = 10n ** BigInt(RAW_DECIMALS);
  const whole = value / base;
  const frac = value % base;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(RAW_DECIMALS, '0').replace(/0+$/, '');
  return `${whole.toString()}.${fracStr}`;
}

/** A parsed / buildable Banano payment request (amounts in BAN decimals). */
export interface BananoPaymentRequest {
  /** Recipient account (ban_…). */
  address: string;
  /** Requested amount in BAN (omit / "0" for an open amount). */
  amount?: string;
  /** Short human label (payee name). */
  label?: string;
  /** Free-form message / memo. */
  message?: string;
}

/** Build a `ban:` payment URI from a request. Throws on an invalid address. */
export function buildBananoUri(req: BananoPaymentRequest): string {
  if (!BANANO_ADDRESS.test(req.address)) {
    throw new Error(`Invalid Banano address: ${req.address}`);
  }
  const params = new URLSearchParams();
  if (req.amount && req.amount.trim() !== '' && req.amount.trim() !== '0') {
    params.set('amount', banToRaw(req.amount));
  }
  if (req.label) params.set('label', req.label);
  if (req.message) params.set('message', req.message);
  const qs = params.toString();
  return `ban:${req.address}${qs ? `?${qs}` : ''}`;
}

/** True if a string looks like a `ban:` payment URI. */
export function isBananoUri(value: string): boolean {
  return /^ban:/i.test(value.trim());
}

/**
 * Parse a `ban:` payment URI into a request (amount converted to BAN decimals).
 * Returns `null` if the string is not a valid Banano URI.
 */
export function parseBananoUri(uri: string): BananoPaymentRequest | null {
  const match = uri.trim().match(/^ban:([^?]+)(?:\?(.*))?$/i);
  if (!match) return null;
  const address = match[1];
  if (!BANANO_ADDRESS.test(address)) return null;

  const params = new URLSearchParams(match[2] ?? '');
  const rawAmount = params.get('amount');
  let amount: string | undefined;
  if (rawAmount) {
    try {
      amount = rawToBan(rawAmount);
    } catch {
      amount = undefined;
    }
  }
  return {
    address,
    amount,
    label: params.get('label') ?? undefined,
    message: params.get('message') ?? undefined,
  };
}
