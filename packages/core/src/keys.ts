// Seed / mnemonic / key derivation helpers. Work in Node and browsers.

import * as bip39 from 'bip39';
import { bananojs } from './bananojs.js';

/** A derived Banano keypair + address. */
export interface DerivedAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  index: number;
}

/** Generate a new 32-byte hex seed (64 uppercase hex chars). */
export function generateSeed(): string {
  const randomBytes = new Uint8Array(32);
  // globalThis.crypto exists in browsers and Node >= 19 (and Node 18 via webcrypto).
  globalThis.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Generate a 24-word BIP39 mnemonic (256 bits of entropy). */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(256);
}

/**
 * Convert a BIP39 mnemonic to a Banano hex seed. Banano/Nano seeds are the
 * mnemonic's raw entropy (not PBKDF2), so this returns 64 uppercase hex chars.
 */
export function mnemonicToSeed(mnemonic: string): string {
  const normalized = mnemonic.trim().toLowerCase().split(/\s+/).join(' ');
  if (!bip39.validateMnemonic(normalized)) {
    throw new Error('Invalid mnemonic seed');
  }
  return bip39.mnemonicToEntropy(normalized).toUpperCase();
}

/**
 * Normalize a seed input: accepts a 64-char hex seed or a BIP39 mnemonic and
 * returns the uppercase hex seed.
 */
export function normalizeSeedInput(seedInput: string): string {
  if (seedInput.includes(' ')) {
    return mnemonicToSeed(seedInput);
  }
  if (!/^[0-9A-Fa-f]{64}$/.test(seedInput)) {
    throw new Error('Invalid seed format. Expected 64-character hex string or BIP39 mnemonic.');
  }
  return seedInput.toUpperCase();
}

/** Derive the account at `index` from a hex seed. */
export async function deriveAccount(hexSeed: string, index = 0): Promise<DerivedAccount> {
  if (!/^[0-9A-F]{64}$/i.test(hexSeed)) {
    throw new Error('Invalid hex seed format');
  }
  const address = await bananojs.getBananoAccountFromSeed(hexSeed, index);
  const privateKey = bananojs.getPrivateKey(hexSeed, index);
  const publicKey = await bananojs.getPublicKey(privateKey);
  return { address, publicKey, privateKey, index };
}
