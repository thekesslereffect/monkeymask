import { NextResponse } from 'next/server';
import { getSessionAddress } from '@/lib/gating';
import { getServerWallet, hasServerWallet } from '@/lib/server-wallet';
import { FAUCET_CLAIM_BAN, FAUCET_COOLDOWN_MS, getCooldown, hashIp } from '@/lib/faucet-store';

// Balance and per-visitor cooldown are live data.
export const dynamic = 'force-dynamic';

/**
 * Public faucet status: address, balance, payout size, and — when the caller
 * has a SIWB session — their personal cooldown.
 */
export async function GET(request: Request) {
  if (!hasServerWallet()) {
    return NextResponse.json({ enabled: false });
  }

  const wallet = await getServerWallet();
  const [balance, address] = await Promise.all([
    wallet.getBalance().catch(() => null),
    Promise.resolve(wallet.address),
  ]);

  const sessionAddress = await getSessionAddress(request);
  let retryAfterMs: number | null = null;
  if (sessionAddress) {
    retryAfterMs = await getCooldown(sessionAddress, hashIp(request)).catch(() => null);
  }

  return NextResponse.json({
    enabled: true,
    address,
    balance,
    claimAmountBan: FAUCET_CLAIM_BAN,
    cooldownMs: FAUCET_COOLDOWN_MS,
    sessionAddress,
    retryAfterMs,
  });
}
