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

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

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
 * Convert an IPFS v0 CID (Qm…, base58btc sha2-256 multihash) into the
 * metadata_representative account used in `#mint` blocks.
 */
export function metadataRepresentativeFromCidV0(cid: string): string {
  if (!cid || !cid.startsWith('Qm')) {
    throw new Error('Metadata CID must be an IPFS v0 CID (starts with "Qm")');
  }
  const hex = bytesToHex(base58Decode(cid));
  // Multihash prefix: 0x12 (sha2-256) 0x20 (32-byte length) => "1220".
  if (!hex.startsWith('1220') || hex.length !== 68) {
    throw new Error('Unexpected CID format; expected a 34-byte sha2-256 multihash');
  }
  return publicKeyToAccount(hex.slice(4));
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
