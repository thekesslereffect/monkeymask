import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB
const MIME_RE = /^[-\w.]+\/[-\w.+]+$/;

/** One ERC-721/OpenSea-style trait. Not required by the metaprotocol, but the
 * de-facto standard for client-side display. */
interface Attribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

/**
 * Parse the `attributes` form field (a JSON string) into a sanitized ERC-721
 * trait array. Drops malformed/empty entries and caps the count so a client
 * can't bloat the pinned JSON.
 */
function parseAttributes(raw: string): Attribute[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const out: Attribute[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const trait = typeof rec.trait_type === 'string' ? rec.trait_type.trim() : '';
    let value = rec.value;
    if (typeof value === 'string') value = value.trim();
    if (!trait || value === '' || value === undefined || value === null) continue;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const attr: Attribute = { trait_type: trait, value };
    if (typeof rec.display_type === 'string' && rec.display_type.trim()) {
      attr.display_type = rec.display_type.trim();
    }
    out.push(attr);
    if (out.length >= 50) break;
  }
  return out;
}

/**
 * Pins an NFT image + ERC-721-style metadata JSON to IPFS and returns their
 * CIDs. The metadata CID is what the wallet encodes into the mint block's
 * representative.
 *
 * Provider-agnostic by design; currently implements Pinata (set PINATA_JWT).
 * We request v0 CIDs (`Qm…`), but the wallet codec also accepts v1 (`b…`)
 * sha2-256 CIDs — both reduce to the same 32-byte digest the pubkey stores.
 */
export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json(
      { error: 'IPFS pinning is not configured. Set PINATA_JWT on the server.' },
      { status: 501 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  const name = (form.get('name') as string | null)?.trim() ?? '';
  const description = (form.get('description') as string | null)?.trim() ?? '';
  const issuer = (form.get('issuer') as string | null)?.trim() ?? '';
  const attributes = parseAttributes((form.get('attributes') as string | null) ?? '');

  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image exceeds 15 MB limit' }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (issuer && !BANANO_ADDRESS.test(issuer)) {
    return NextResponse.json({ error: 'Invalid issuer address' }, { status: 400 });
  }

  // The artwork's MIME type, so clients can label the file type without sniffing
  // bytes. Stored in `properties` (protocol-neutral; the metaprotocol ignores it).
  const contentType = MIME_RE.test(file.type) ? file.type : undefined;

  try {
    const imageCid = await pinFile(jwt, file, name);
    const metadata: Record<string, unknown> = {
      name,
      description,
      image: `ipfs://${imageCid}`,
      ...(attributes.length > 0 ? { attributes } : {}),
      properties: {
        ...(issuer ? { issuer } : {}),
        ...(contentType
          ? {
              content_type: contentType,
              files: [{ uri: `ipfs://${imageCid}`, type: contentType }],
            }
          : {}),
      },
    };
    const metadataCid = await pinJson(jwt, metadata, `${name} metadata`);

    // Accept v0 (Qm…) or v1 (b…) sha2-256 CIDs; both encode into the pubkey.
    if (!/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]+)$/.test(metadataCid)) {
      return NextResponse.json(
        { error: 'Pinning provider returned an unsupported CID (need a sha2-256 v0/v1 CID)' },
        { status: 502 },
      );
    }

    return NextResponse.json({ imageCid, metadataCid, metadata });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to pin to IPFS';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function pinFile(jwt: string, file: Blob, name: string): Promise<string> {
  const body = new FormData();
  body.append('file', file, name);
  body.append('pinataOptions', JSON.stringify({ cidVersion: 0 }));
  body.append('pinataMetadata', JSON.stringify({ name }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  return readCid(res);
}

async function pinJson(jwt: string, content: unknown, name: string): Promise<string> {
  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataOptions: { cidVersion: 0 },
      pinataMetadata: { name },
    }),
  });
  return readCid(res);
}

async function readCid(res: Response): Promise<string> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pinning failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) throw new Error('Pinning response missing IpfsHash');
  return json.IpfsHash;
}
