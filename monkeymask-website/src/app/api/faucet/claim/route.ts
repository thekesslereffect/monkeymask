import { NextResponse } from 'next/server';
import { getSessionAddress, isValidBananoAddress } from '@/lib/gating';
import { getServerWallet, getServerWalletSpendableBalance, hasServerWallet } from '@/lib/server-wallet';
import {
  FAUCET_CLAIM_BAN,
  confirmClaim,
  hashIp,
  releaseClaim,
  reserveClaim,
} from '@/lib/faucet-store';

export const dynamic = 'force-dynamic';

/**
 * Claim a faucet payout.
 *
 * Fairness model:
 * - The recipient comes from the SIWB session cookie, never the request body —
 *   claiming requires cryptographic proof of key ownership.
 * - One claim per address AND per IP hash per cooldown window, reserved
 *   atomically in Convex before any BAN moves (no double-claims under
 *   concurrency).
 * - A failed send releases the reservation so honest users can retry.
 */
export async function POST(request: Request) {
  if (!hasServerWallet()) {
    return NextResponse.json({ error: 'Faucet is not available yet' }, { status: 503 });
  }

  const address = await getSessionAddress(request);
  if (!address) {
    return NextResponse.json({ error: 'Sign in with Banano first' }, { status: 401 });
  }
  if (!isValidBananoAddress(address)) {
    return NextResponse.json({ error: 'Invalid session address' }, { status: 400 });
  }

  const { address: faucetAddress, balance } = await getServerWalletSpendableBalance();
  if (address === faucetAddress) {
    return NextResponse.json({ error: 'Nice try' }, { status: 400 });
  }

  // Donations arrive as receivables — already pocketed above for the balance check.
  if (parseFloat(balance) < parseFloat(FAUCET_CLAIM_BAN)) {
    return NextResponse.json(
      { error: 'The faucet is empty right now. Check back later!' },
      { status: 503 },
    );
  }

  const reservation = await reserveClaim(address, hashIp(request));
  if (!reservation.ok) {
    return NextResponse.json(
      { error: 'Cooldown active', retryAfterMs: reservation.retryAfterMs },
      { status: 429 },
    );
  }

  try {
    const wallet = await getServerWallet();
    const hash = await wallet.send(address, FAUCET_CLAIM_BAN);
    await confirmClaim(reservation.claimId, hash).catch(() => {
      // The payout went through; a failed confirm only loses the hash record.
    });
    return NextResponse.json({ hash, amountBan: FAUCET_CLAIM_BAN, address });
  } catch (error) {
    await releaseClaim(reservation.claimId).catch(() => {});
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payout failed. Please try again.' },
      { status: 502 },
    );
  }
}
