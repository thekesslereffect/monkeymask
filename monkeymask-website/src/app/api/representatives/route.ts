import { NextResponse } from 'next/server';
import {
  fetchAccountDelegation,
  fetchRepNetworkSnapshot,
  suggestDecentralizedRepresentative,
} from '@/lib/representatives';

const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const view = url.searchParams.get('view') ?? 'snapshot';

  try {
    if (view === 'snapshot') {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? '25') || 25));
      const snapshot = await fetchRepNetworkSnapshot(limit);
      return NextResponse.json(snapshot, {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      });
    }

    if (view === 'delegation') {
      const account = url.searchParams.get('account')?.trim() ?? '';
      if (!BANANO_ADDRESS.test(account)) {
        return NextResponse.json({ error: 'Invalid Banano address' }, { status: 400 });
      }
      const delegation = await fetchAccountDelegation(account);
      return NextResponse.json(delegation, {
        headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=120' },
      });
    }

    if (view === 'suggest') {
      const exclude = url.searchParams.getAll('exclude').filter((a) => BANANO_ADDRESS.test(a));
      const suggestion = await suggestDecentralizedRepresentative(new Set(exclude));
      return NextResponse.json({ suggestion });
    }

    return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Representative RPC failed' },
      { status: 502 },
    );
  }
}
