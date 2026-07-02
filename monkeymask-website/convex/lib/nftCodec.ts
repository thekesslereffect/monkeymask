// Pure Banano NFT metaprotocol decoders, inlined for the Convex V8 runtime.
//
// This intentionally duplicates packages/wallet-standard/src/nft.ts. Convex
// bundles run in an isolated runtime where resolving a workspace package's
// symlinked dist is fragile, so the source of truth is copied here verbatim.
// Keep the two in sync if the codec ever changes.

import { blake2b } from 'blakejs';

const NANO_ALPHABET = '13456789abcdefghijkmnopqrstuwxyz';
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const SUPPLY_HEADER_HEX = '51BACEED6078000000';
export const FINISH_SUPPLY_HEADER_HEX = '3614865E0051BA0033BB581E';
export const ATOMIC_SWAP_HEADER_HEX = '23559C159E22C';

/** Special representative meaning "send every NFT held by this account". */
export const SEND_ALL_NFTS_REPRESENTATIVE =
  'ban_1senda11nfts1111111111111111111111111111111111111111rtbtxits';

/** Voids the immediately-preceding `change#supply` block. */
export const CANCEL_SUPPLY_REPRESENTATIVE =
  'ban_1nftsupp1ycance1111oops1111that1111was1111my1111bad1hq5sjhey';

/** Accounts that permanently destroy an asset sent to them. */
export const BURN_ACCOUNTS = new Set<string>([
  'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w',
  'ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp',
  'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw',
  'ban_1111111111111111111111111111111111111111111111111111hifc8npp',
]);

const INVALID_MINT_REPRESENTATIVES = new Set<string>([
  'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w',
  'ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp',
  'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw',
  'ban_1111111111111111111111111111111111111111111111111111hifc8npp',
  'ban_1nftsupp1ycance1111oops1111that1111was1111my1111bad1hq5sjhey',
]);

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Decode a ban_/nano_ account into its 64-char hex public key (no checksum). */
export function accountToPublicKeyHex(account: string): string {
  const underscore = account.indexOf('_');
  const body = underscore >= 0 ? account.slice(underscore + 1) : account;
  const encoded = body.slice(0, 52);
  if (encoded.length !== 52) throw new Error('Invalid account: unexpected length');
  let bits = '';
  for (const char of encoded) {
    const value = NANO_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid account character: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }
  const pubBits = bits.slice(4);
  let hex = '';
  for (let i = 0; i < pubBits.length; i += 4) {
    hex += parseInt(pubBits.slice(i, i + 4), 2).toString(16);
  }
  return hex.toUpperCase();
}

/** Encode raw bytes as nano base32, left-padding the bit string to a multiple of 5. */
function encodeNanoBase32(bytes: Uint8Array): string {
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  const pad = (5 - (bits.length % 5)) % 5;
  bits = '0'.repeat(pad) + bits;
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += NANO_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/**
 * Encode a 64-char public-key hex into a ban_ account, computing the 5-byte
 * blake2b checksum. Inverse of accountToPublicKeyHex. Needed to crawl the
 * accounts referenced by send/receive `link` fields while tracing transfers.
 */
export function publicKeyHexToAccount(pubHex: string, prefix = 'ban_'): string {
  const clean = pubHex.toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(clean)) throw new Error('Invalid public key hex');
  const pubBytes = hexToBytes(clean);
  const encodedKey = encodeNanoBase32(pubBytes);
  const checksum = blake2b(pubBytes, undefined, 5);
  const checksumReversed = Uint8Array.from(checksum).reverse();
  return `${prefix}${encodedKey}${encodeNanoBase32(checksumReversed)}`;
}

/**
 * True if a `send` block's `representative` marks it as a `send#asset` for the
 * asset whose mint block hash is `mintHash`. The asset representative is the
 * mint hash encoded as an account, so its public key equals the hash.
 */
export function representativeMatchesAsset(representative: string, mintHash: string): boolean {
  if (representative === SEND_ALL_NFTS_REPRESENTATIVE) return true;
  try {
    return accountToPublicKeyHex(representative) === mintHash.toUpperCase();
  } catch {
    return false;
  }
}

function base58Encode(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let out = '';
  while (value > 0n) {
    const rem = Number(value % 58n);
    value /= 58n;
    out = BASE58_ALPHABET[rem] + out;
  }
  for (const byte of bytes) {
    if (byte === 0) out = '1' + out;
    else break;
  }
  return out;
}

/** Convert a metadata_representative account into its IPFS v0 CID (Qm…). */
export function metadataCidFromRepresentative(account: string): string {
  const pubHex = accountToPublicKeyHex(account);
  const cidBytes = hexToBytes(`1220${pubHex}`);
  return base58Encode(cidBytes);
}

/** True if a `change` block representative marks a `change#supply` block. */
export function isSupplyRepresentative(account: string): boolean {
  try {
    return accountToPublicKeyHex(account).startsWith(SUPPLY_HEADER_HEX);
  } catch {
    return false;
  }
}

/** Parse the max supply encoded in a supply_representative (0 = unlimited). */
export function maxSupplyFromRepresentative(account: string): number {
  const hex = accountToPublicKeyHex(account);
  return Number(BigInt(`0x${hex.slice(48)}`));
}

/** True if an account is a valid metadata_representative for a mint block. */
export function isValidMetadataRepresentative(account: string): boolean {
  if (INVALID_MINT_REPRESENTATIVES.has(account)) return false;
  let hex: string;
  try {
    hex = accountToPublicKeyHex(account);
  } catch {
    return false;
  }
  if (hex.startsWith(SUPPLY_HEADER_HEX)) return false;
  if (hex.startsWith(FINISH_SUPPLY_HEADER_HEX)) return false;
  if (hex.startsWith(ATOMIC_SWAP_HEADER_HEX)) return false;
  return true;
}

/** True if a block representative marks a `#finish_supply` (locks further mints). */
export function isFinishSupplyRepresentative(account: string): boolean {
  try {
    return accountToPublicKeyHex(account).startsWith(FINISH_SUPPLY_HEADER_HEX);
  } catch {
    return false;
  }
}

/** The supply-block height a `#finish_supply` representative points at. */
export function finishSupplyHeightFromRepresentative(account: string): number {
  const hex = accountToPublicKeyHex(account);
  return Number(BigInt(`0x${hex.slice(FINISH_SUPPLY_HEADER_HEX.length)}`));
}

/** True if a block representative cancels the preceding `change#supply`. */
export function isCancelSupplyRepresentative(account: string): boolean {
  if (account === CANCEL_SUPPLY_REPRESENTATIVE) return true;
  try {
    const hex = accountToPublicKeyHex(account);
    return (
      hex.startsWith(SUPPLY_HEADER_HEX) ||
      hex.startsWith(FINISH_SUPPLY_HEADER_HEX) ||
      hex.startsWith(ATOMIC_SWAP_HEADER_HEX)
    );
  } catch {
    return false;
  }
}

/** True if a send block representative marks a `send#atomic_swap`. */
export function isAtomicSwapRepresentative(account: string): boolean {
  try {
    return accountToPublicKeyHex(account).startsWith(ATOMIC_SWAP_HEADER_HEX);
  } catch {
    return false;
  }
}

/** Rewrite an ipfs:// URI or bare CID to an HTTP gateway URL. */
export function ipfsToHttp(value: string | undefined, gateway: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('ipfs://')) return `${gateway}${trimmed.slice('ipfs://'.length)}`;
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[0-9a-z]+)(\/.*)?$/.test(trimmed)) {
    return `${gateway}${trimmed}`;
  }
  return trimmed;
}
