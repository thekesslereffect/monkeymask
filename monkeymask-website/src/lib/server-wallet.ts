// Server-side (custodial) Banano wallet, the Solana-style pattern of a Keypair
// loaded from an env secret. Gives API routes and server actions the same
// capabilities as the MonkeyMask extension: send, receive/claim pending, sweep,
// sign messages / SIWB, and every NFT operation (mint, editions, transfer,
// burn, finish, send-all).
//
// SECURITY:
// - `BANANO_SEED` is a hot-wallet secret. Use a dedicated account (never a
//   treasury), keep only working balances on it, and never expose it with a
//   NEXT_PUBLIC_ prefix or import this module from client components.
// - Never wire wallet methods to an HTTP route without auth: gate any endpoint
//   that triggers signing behind a verified SIWB session (or equivalent).
//
// Usage (Node runtime API route or server action):
//
//   import { getServerWallet } from '@/lib/server-wallet';
//
//   const wallet = await getServerWallet();
//   await wallet.receiveAll();                        // claim pending
//   const hash = await wallet.send('ban_1abc…', '1'); // or a BNS name
//   const mint = await wallet.mintNFT({ metadataCid, to: recipient });

import { Wallet } from '@monkeymask/core';

let walletPromise: Promise<Wallet> | null = null;

/** True when a server wallet is configured (BANANO_SEED is set). */
export function hasServerWallet(): boolean {
  return Boolean(process.env.BANANO_SEED?.trim());
}

/**
 * The server's Banano wallet, derived from the `BANANO_SEED` env var (64-char
 * hex seed or BIP39 mnemonic). Cached for the process lifetime.
 */
export function getServerWallet(): Promise<Wallet> {
  const seed = process.env.BANANO_SEED?.trim();
  if (!seed) {
    throw new Error(
      'BANANO_SEED is not set. Add a 64-char hex seed (or BIP39 mnemonic) to the server environment to enable the server wallet.',
    );
  }
  if (!walletPromise) {
    walletPromise = Wallet.fromSeed(seed);
  }
  return walletPromise;
}
