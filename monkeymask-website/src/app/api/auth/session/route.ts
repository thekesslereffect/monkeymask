import { NextResponse } from 'next/server';
import { getSessionAddress } from '@/lib/gating';

// Depends on the session cookie, so never cache it.
export const dynamic = 'force-dynamic';

/** Report the address of the current SIWB session (or null), for UI state. */
export async function GET(request: Request) {
  const address = await getSessionAddress(request);
  return NextResponse.json({ address });
}
