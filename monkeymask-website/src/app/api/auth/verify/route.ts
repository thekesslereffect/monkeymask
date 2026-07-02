import { NextResponse } from 'next/server';
import {
  deserializeSignInOutput,
  verifySignIn,
  type BananoSignInInput,
} from '@monkeymask/wallet-standard';
import { consumeNonce, createSession } from '@/lib/siwb-store';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bananojs = require('@bananocoin/bananojs');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body.input as BananoSignInInput | undefined;
    const rawOutput = body.output as Record<string, unknown> | undefined;

    if (!input || !rawOutput) {
      return NextResponse.json(
        { valid: false, error: 'Missing input or output' },
        { status: 400 },
      );
    }

    const output = deserializeSignInOutput(rawOutput);

    // 1. Bind verification to the host that served the request rather than a
    //    client-controlled domain.
    const url = new URL(request.url);
    const expectedDomain = request.headers.get('host') ?? url.host;
    if (input.domain !== expectedDomain) {
      return NextResponse.json({ valid: false, error: 'Domain mismatch' }, { status: 401 });
    }

    // 2. The nonce must be one we issued, unexpired, and unused (single-use).
    const nonceRecord = await consumeNonce(input.nonce);
    if (!nonceRecord || nonceRecord.domain !== expectedDomain) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired nonce' },
        { status: 401 },
      );
    }

    // 3. The signing account must match the address the message was bound to.
    if (input.address && output.account.address !== input.address) {
      return NextResponse.json({ valid: false, error: 'Address mismatch' }, { status: 401 });
    }

    // 4. Full field + cryptographic verification (also enforces issuedAt window
    //    and expiration/notBefore).
    const valid = verifySignIn(input, output, bananojs.BananoUtil, { expectedDomain });
    if (!valid) {
      return NextResponse.json(
        { valid: false, error: 'SIWB verification failed' },
        { status: 401 },
      );
    }

    const sessionToken = await createSession(output.account.address);
    const response = NextResponse.json({
      valid: true,
      address: output.account.address,
      sessionToken,
    });

    response.cookies.set('monkeymask_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : 'Verification error' },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ service: 'MonkeyMask SIWB Verify', status: 'ok' });
}
