// Banano NFT (73-meta-tokens) representative encoding.
//
// The metaprotocol stores collection + metadata pointers inside the
// `representative` field of otherwise-normal Banano blocks:
//
//   supply_representative   = header + semver + max-supply, encoded as a pubkey
//   metadata_representative = an IPFS v0 CID encoded as a pubkey
//
// A 32-byte value (64 hex chars) is a Banano public key, which maps 1:1 to a
// ban_ account. We build those 32-byte values then convert to accounts via
// bananojs.

const bananojs = require('@bananocoin/bananojs');

// Header + semver (1.0.0) for a `change#supply` block representative.
// 18 + 10 + 10 + 10 + 16 = 64 hex chars.
const SUPPLY_HEADER = '51BACEED6078000000';
const VERSION_MAJOR = '0000000001';
const VERSION_MINOR = '0000000000';
const VERSION_PATCH = '0000000000';

// `#finish_supply` representative: 24-hex header + 40-hex supply block height.
const FINISH_SUPPLY_HEADER = '3614865E0051BA0033BB581E';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// RFC4648 base32, lowercase, no padding — the multibase used by CIDv1 (`b…`).
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/** Decode a base58 (Bitcoin alphabet) string to bytes. */
function base58Decode(input: string): Uint8Array {
  const bytes: number[] = [0];
  for (const char of input) {
    const value = BASE58_ALPHABET.indexOf(char);
    if (value === -1) throw new Error(`Invalid base58 character: ${char}`);
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Preserve leading zeros (each leading '1' == a 0x00 byte).
  for (let k = 0; k < input.length && input[k] === '1'; k++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

/** Decode an RFC4648 base32 (lowercase, no padding) string to bytes. */
function base32Decode(input: string): Uint8Array {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of input.toLowerCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function publicKeyToAccount(hexPublicKey: string): string {
  if (hexPublicKey.length !== 64) {
    throw new Error(`Invalid public key length: ${hexPublicKey.length}`);
  }
  // `getBananoAccount` is a top-level bananojs export; `BananoUtil.getAccount`
  // is the equivalent method. Prefer whichever is available at runtime.
  if (typeof bananojs.getBananoAccount === 'function') {
    return bananojs.getBananoAccount(hexPublicKey);
  }
  return bananojs.BananoUtil.getAccount(hexPublicKey, bananojs.BANANO_PREFIX);
}

/**
 * Extract the 32-byte sha2-256 digest (as 64-hex) from an IPFS CID.
 *
 * The metadata_representative encodes only this digest, so both a v0 CID
 * (`Qm…`, base58btc `0x12 0x20` multihash) and a v1 CID (`b…`, base32
 * `0x01 <codec> 0x12 0x20` — dag-pb or raw over sha2-256) map to the same rep.
 */
function sha256DigestFromCid(cid: string): string {
  const trimmed = cid.trim();
  if (trimmed.startsWith('Qm')) {
    const hex = bytesToHex(base58Decode(trimmed));
    // Multihash prefix: 0x12 (sha2-256) 0x20 (32-byte length) => "1220".
    if (!hex.startsWith('1220') || hex.length !== 68) {
      throw new Error('Unexpected v0 CID format; expected a 34-byte sha2-256 multihash');
    }
    return hex.slice(4);
  }
  if (/^b[a-z2-7]+$/.test(trimmed)) {
    const bytes = base32Decode(trimmed.slice(1));
    // Expect: version(0x01) · codec(1 byte) · 0x12 (sha2-256) · 0x20 (len 32) · digest.
    if (bytes.length !== 36 || bytes[0] !== 0x01 || bytes[2] !== 0x12 || bytes[3] !== 0x20) {
      throw new Error('Unsupported v1 CID; expected a dag-pb/raw sha2-256 CID');
    }
    return bytesToHex(bytes.slice(4));
  }
  throw new Error('Metadata CID must be an IPFS v0 (Qm…) or v1 (b…) CID');
}

/**
 * Convert an IPFS CID (v0 `Qm…` or v1 `b…`, sha2-256) into the
 * metadata_representative account used in `#mint` blocks.
 */
export function metadataRepresentativeFromCid(cid: string): string {
  return publicKeyToAccount(sha256DigestFromCid(cid));
}

/** @deprecated Use {@link metadataRepresentativeFromCid} — now accepts v0 and v1. */
export const metadataRepresentativeFromCidV0 = metadataRepresentativeFromCid;

/**
 * Build the `#finish_supply` representative that locks a collection (no further
 * editions can be minted) given the collection's `change#supply` block height.
 */
export function finishSupplyRepresentative(supplyBlockHeight: number): string {
  if (!Number.isInteger(supplyBlockHeight) || supplyBlockHeight < 0) {
    throw new Error('supplyBlockHeight must be a non-negative integer');
  }
  const heightHex = supplyBlockHeight.toString(16).toUpperCase().padStart(40, '0');
  return publicKeyToAccount(`${FINISH_SUPPLY_HEADER}${heightHex}`);
}

/**
 * Encode an NFT's asset representative (its mint block hash, 64 hex) as the
 * `ban_` account used in the `representative` field of a `send#asset` transfer.
 * The mint hash is a 32-byte value, i.e. a public key, so this is a direct
 * public-key → account conversion.
 */
export function assetRepresentativeAccount(mintHash: string): string {
  if (!/^[0-9a-fA-F]{64}$/.test(mintHash)) {
    throw new Error('Invalid asset representative: expected a 64-char mint block hash');
  }
  return publicKeyToAccount(mintHash.toUpperCase());
}

/**
 * Build the supply_representative account for a `change#supply` block.
 * `maxSupply` of 0 means unlimited.
 */
export function supplyRepresentative(maxSupply: number): string {
  if (!Number.isInteger(maxSupply) || maxSupply < 0) {
    throw new Error('maxSupply must be a non-negative integer');
  }
  const maxSupplyHex = maxSupply.toString(16).toUpperCase().padStart(16, '0');
  const publicKey = `${SUPPLY_HEADER}${VERSION_MAJOR}${VERSION_MINOR}${VERSION_PATCH}${maxSupplyHex}`;
  return publicKeyToAccount(publicKey);
}
