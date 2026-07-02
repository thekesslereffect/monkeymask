// Pure codecs for the Banano NFT metaprotocol (73-meta-tokens).
//
// These operate on `representative` accounts embedded in NFT blocks and need no
// blake2b, because decoding an account into its public key does not require the
// checksum. (Encoding a public key back into an account *does* need blake2b, so
// that direction lives in the wallet where bananojs is available.)

import { hexToBytes } from './features.js';

/** Nano/Banano base32 alphabet. */
const NANO_ALPHABET = '13456789abcdefghijkmnopqrstuwxyz';
/** Base58 (Bitcoin) alphabet, used for IPFS v0 CIDs. */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Supply block representative header (hex prefix of the public key). */
export const SUPPLY_HEADER_HEX = '51BACEED6078000000';
/** Finish-supply representative header. */
export const FINISH_SUPPLY_HEADER_HEX = '3614865E0051BA0033BB581E';

/** Special representative meaning "send every NFT held by this account". */
export const SEND_ALL_NFTS_REPRESENTATIVE =
  'ban_1senda11nfts1111111111111111111111111111111111111111rtbtxits';

/**
 * Canonical burn account used as the default `send#burn` target. It's the
 * readable "burn baby burn" black-hole address from the 73-meta-tokens spec.
 */
export const CANONICAL_BURN_ACCOUNT =
  'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w';

/** Accounts that permanently destroy an asset sent to them. */
export const BURN_ACCOUNTS = new Set<string>([
  CANONICAL_BURN_ACCOUNT,
  'ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp',
  'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw',
  'ban_1111111111111111111111111111111111111111111111111111hifc8npp',
]);

/** True if `account` is a recognized burn address (asset sent here is destroyed). */
export function isBurnAccount(account: string): boolean {
  return BURN_ACCOUNTS.has(account);
}

/** Accounts that invalidate a mint (burn + cancel), per the spec. */
const INVALID_MINT_REPRESENTATIVES = new Set<string>([
  'ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w',
  'ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp',
  'ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw',
  'ban_1111111111111111111111111111111111111111111111111111hifc8npp',
  'ban_1nftsupp1ycance1111oops1111that1111was1111my1111bad1hq5sjhey',
]);

/**
 * Decode a ban_/nano_ account into its 64-char hex public key.
 * Does not verify the checksum (on-chain data is trusted).
 */
export function accountToPublicKeyHex(account: string): string {
  const underscore = account.indexOf('_');
  const body = underscore >= 0 ? account.slice(underscore + 1) : account;
  const encoded = body.slice(0, 52); // public key portion (excludes 8-char checksum)
  if (encoded.length !== 52) {
    throw new Error('Invalid account: unexpected length');
  }
  let bits = '';
  for (const char of encoded) {
    const value = NANO_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid account character: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }
  // 52 * 5 = 260 bits; the leading 4 bits are zero padding.
  const pubBits = bits.slice(4);
  let hex = '';
  for (let i = 0; i < pubBits.length; i += 4) {
    hex += parseInt(pubBits.slice(i, i + 4), 2).toString(16);
  }
  return hex.toUpperCase();
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

/**
 * Convert a metadata_representative account into its IPFS v0 CID (Qm…).
 * Inverse of the wallet's CID → representative encoding.
 */
export function metadataCidFromRepresentative(account: string): string {
  const pubHex = accountToPublicKeyHex(account);
  // Re-attach the sha2-256 multihash prefix (0x12 0x20).
  const cidBytes = hexToBytes(`1220${pubHex}`);
  return base58Encode(cidBytes);
}

/**
 * True if a `send` block's `representative` marks it as a `send#asset` for the
 * asset whose mint block hash is `mintHash`. The asset representative is that
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

/**
 * True if an account is a valid metadata_representative for a mint block
 * (i.e. not a burn/cancel/finish/supply header).
 */
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
  return true;
}
