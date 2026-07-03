import { NextResponse } from 'next/server';
import { generateNonce, type BananoSignInInput } from '@monkeymask/wallet-standard';
import { issueNonce } from '@/lib/siwb-store';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Bind the sign-in message to the host that actually served the request
    // instead of trusting a client-supplied domain.
    const domain = request.headers.get('host') ?? url.host;
    const origin = `${url.protocol}//${domain}`;
    const nonce = generateNonce(16);
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await issueNonce(nonce, domain);

    const signInInput: BananoSignInInput = {
      domain,
      statement:
        'Sign in to verify you own this Banano account. This request will not trigger a blockchain transaction.',
      version: '1',
      chainId: 'banano:mainnet',
      nonce,
      issuedAt,
      expirationTime,
      uri: origin,
    };

    return NextResponse.json(signInInput);
  } catch (error) {
    console.error('SIWB nonce error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to issue sign-in nonce',
      },
      { status: 500 },
    );
  }
}
