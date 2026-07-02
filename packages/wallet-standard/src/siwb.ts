import type { BananoSignInInput, BananoSignInOutput } from './features.js';
import { bytesToHex, decodeBase64, encodeBase64, hexToBytes } from './features.js';

const SIWB_HEADER = ' wants you to sign in with your Banano account:';

export interface ParsedBananoSignInMessage extends BananoSignInInput {
  readonly domain: string;
  readonly address: string;
}

export interface VerifySignInOptions {
  readonly expectedDomain?: string;
  readonly issuedAtThresholdMs?: number;
}

export function createSignInMessageText(input: BananoSignInInput): string {
  if (!input.domain || !input.address) {
    throw new Error('SIWB message requires domain and address');
  }

  let message = `${input.domain}${SIWB_HEADER}\n`;
  message += input.address;

  if (input.statement) {
    message += `\n\n${input.statement}`;
  }

  const fields: string[] = [];
  if (input.uri) fields.push(`URI: ${input.uri}`);
  if (input.version) fields.push(`Version: ${input.version}`);
  if (input.chainId) fields.push(`Chain ID: ${input.chainId}`);
  if (input.nonce) fields.push(`Nonce: ${input.nonce}`);
  if (input.issuedAt) fields.push(`Issued At: ${input.issuedAt}`);
  if (input.expirationTime) fields.push(`Expiration Time: ${input.expirationTime}`);
  if (input.notBefore) fields.push(`Not Before: ${input.notBefore}`);
  if (input.requestId) fields.push(`Request ID: ${input.requestId}`);
  if (input.resources?.length) {
    fields.push('Resources:');
    for (const resource of input.resources) {
      fields.push(`- ${resource}`);
    }
  }

  if (fields.length) {
    message += `\n\n${fields.join('\n')}`;
  }

  return message;
}

export function parseSignInMessage(text: string): ParsedBananoSignInMessage {
  const headerIndex = text.indexOf(SIWB_HEADER);
  if (headerIndex === -1) {
    throw new Error('Invalid SIWB message format');
  }

  const domain = text.slice(0, headerIndex);
  const remainder = text.slice(headerIndex + SIWB_HEADER.length).replace(/^\n/, '');
  const lines = remainder.split('\n');
  const address = lines[0]?.trim();
  if (!domain || !address) {
    throw new Error('Invalid SIWB message: missing domain or address');
  }

  const parsed: Record<string, string | string[]> = { domain, address };

  const isFieldLine = (line: string): boolean =>
    line.startsWith('URI: ') ||
    line.startsWith('Version: ') ||
    line.startsWith('Chain ID: ') ||
    line.startsWith('Nonce: ') ||
    line.startsWith('Issued At: ') ||
    line.startsWith('Expiration Time: ') ||
    line.startsWith('Not Before: ') ||
    line.startsWith('Request ID: ') ||
    line === 'Resources:';

  let fieldStartIndex = lines.findIndex((line, index) => index > 0 && isFieldLine(line));
  if (fieldStartIndex === -1) {
    fieldStartIndex = lines.length;
  }

  const statementBlock = lines.slice(1, fieldStartIndex).join('\n').trim();
  if (statementBlock) {
    parsed.statement = statementBlock;
  }

  let inResources = false;
  for (let i = fieldStartIndex; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('URI: ')) {
      inResources = false;
      parsed.uri = line.slice(5);
      continue;
    }
    if (line.startsWith('Version: ')) {
      inResources = false;
      parsed.version = line.slice(9);
      continue;
    }
    if (line.startsWith('Chain ID: ')) {
      inResources = false;
      parsed.chainId = line.slice(10);
      continue;
    }
    if (line.startsWith('Nonce: ')) {
      inResources = false;
      parsed.nonce = line.slice(7);
      continue;
    }
    if (line.startsWith('Issued At: ')) {
      inResources = false;
      parsed.issuedAt = line.slice(11);
      continue;
    }
    if (line.startsWith('Expiration Time: ')) {
      inResources = false;
      parsed.expirationTime = line.slice(17);
      continue;
    }
    if (line.startsWith('Not Before: ')) {
      inResources = false;
      parsed.notBefore = line.slice(12);
      continue;
    }
    if (line.startsWith('Request ID: ')) {
      inResources = false;
      parsed.requestId = line.slice(12);
      continue;
    }
    if (line === 'Resources:') {
      inResources = true;
      parsed.resources = [];
      continue;
    }
    if (inResources && line.startsWith('- ')) {
      (parsed.resources as string[]).push(line.slice(2));
    }
  }

  return {
    domain,
    address,
    ...(parsed.statement ? { statement: parsed.statement as string } : {}),
    ...(parsed.uri ? { uri: parsed.uri as string } : {}),
    ...(parsed.version ? { version: parsed.version as string } : {}),
    ...(parsed.chainId ? { chainId: parsed.chainId as string } : {}),
    ...(parsed.nonce ? { nonce: parsed.nonce as string } : {}),
    ...(parsed.issuedAt ? { issuedAt: parsed.issuedAt as string } : {}),
    ...(parsed.expirationTime ? { expirationTime: parsed.expirationTime as string } : {}),
    ...(parsed.notBefore ? { notBefore: parsed.notBefore as string } : {}),
    ...(parsed.requestId ? { requestId: parsed.requestId as string } : {}),
    ...(parsed.resources ? { resources: parsed.resources as string[] } : {}),
  };
}

function normalizeSignInOutput(output: BananoSignInOutput): BananoSignInOutput {
  return {
    account: {
      ...output.account,
      publicKey:
        output.account.publicKey instanceof Uint8Array
          ? output.account.publicKey
          : new Uint8Array(output.account.publicKey as ArrayLike<number>),
    },
    signedMessage:
      output.signedMessage instanceof Uint8Array
        ? output.signedMessage
        : new Uint8Array(output.signedMessage as ArrayLike<number>),
    signature:
      output.signature instanceof Uint8Array
        ? output.signature
        : new Uint8Array(output.signature as ArrayLike<number>),
    signatureType: output.signatureType,
  };
}

export interface BananoCryptoUtil {
  verifyMessage(publicKey: string, message: string, signature: string): boolean;
  getAccountPublicKey(account: string): string;
}

export function verifySignIn(
  input: BananoSignInInput,
  output: BananoSignInOutput,
  util: BananoCryptoUtil,
  options: VerifySignInOptions = {},
): boolean {
  const normalized = normalizeSignInOutput(output);
  const messageText = new TextDecoder().decode(normalized.signedMessage);
  const parsed = parseSignInMessage(messageText);

  const expectedDomain = options.expectedDomain ?? input.domain;
  if (expectedDomain && parsed.domain !== expectedDomain) return false;
  if (input.address && parsed.address !== input.address) return false;
  if (input.statement !== undefined && parsed.statement !== input.statement) return false;
  if (input.uri !== undefined && parsed.uri !== input.uri) return false;
  if (input.version !== undefined && parsed.version !== input.version) return false;
  if (input.chainId !== undefined && parsed.chainId !== input.chainId) return false;
  if (input.nonce !== undefined && parsed.nonce !== input.nonce) return false;
  if (input.issuedAt !== undefined && parsed.issuedAt !== input.issuedAt) return false;
  if (input.expirationTime !== undefined && parsed.expirationTime !== input.expirationTime) {
    return false;
  }
  if (input.notBefore !== undefined && parsed.notBefore !== input.notBefore) return false;
  if (input.requestId !== undefined && parsed.requestId !== input.requestId) return false;
  if (input.resources !== undefined) {
    const expected = input.resources.join('\n');
    const actual = (parsed.resources ?? []).join('\n');
    if (expected !== actual) return false;
  }

  const reconstructed = createSignInMessageText(parsed);
  if (reconstructed !== messageText) return false;

  const now = Date.now();
  const threshold = options.issuedAtThresholdMs ?? 10 * 60 * 1000;
  if (parsed.issuedAt) {
    const issued = Date.parse(parsed.issuedAt);
    if (Number.isNaN(issued) || Math.abs(issued - now) > threshold) return false;
  }
  if (parsed.expirationTime) {
    const exp = Date.parse(parsed.expirationTime);
    if (Number.isNaN(exp) || exp <= now) return false;
  }
  if (parsed.notBefore) {
    const nbf = Date.parse(parsed.notBefore);
    if (Number.isNaN(nbf) || nbf > now) return false;
  }

  const hexPublicKey = util.getAccountPublicKey(parsed.address);
  const signatureHex = bytesToHex(normalized.signature);

  return util.verifyMessage(hexPublicKey, messageText, signatureHex);
}

/** Serialize SIWB output for JSON transport (API routes). */
export function serializeSignInOutput(output: BananoSignInOutput): Record<string, unknown> {
  return {
    account: {
      address: output.account.address,
      publicKey: encodeBase64(
        output.account.publicKey instanceof Uint8Array
          ? output.account.publicKey
          : new Uint8Array(output.account.publicKey as ArrayLike<number>),
      ),
      chains: output.account.chains,
      features: output.account.features,
      label: output.account.label,
      icon: output.account.icon,
    },
    signedMessage: encodeBase64(
      output.signedMessage instanceof Uint8Array
        ? output.signedMessage
        : new Uint8Array(output.signedMessage as ArrayLike<number>),
    ),
    signature: encodeBase64(
      output.signature instanceof Uint8Array
        ? output.signature
        : new Uint8Array(output.signature as ArrayLike<number>),
    ),
    signatureType: output.signatureType ?? 'ed25519',
  };
}

/** Deserialize SIWB output from JSON transport. */
export function deserializeSignInOutput(raw: Record<string, unknown>): BananoSignInOutput {
  const account = raw.account as Record<string, unknown>;
  return {
    account: {
      address: account.address as string,
      publicKey: decodeBase64(account.publicKey as string),
      chains: (account.chains as BananoSignInOutput['account']['chains']) ?? [],
      features: (account.features as BananoSignInOutput['account']['features']) ?? [],
      ...(account.label ? { label: account.label as string } : {}),
      ...(account.icon ? { icon: account.icon as BananoSignInOutput['account']['icon'] } : {}),
    },
    signedMessage: decodeBase64(raw.signedMessage as string),
    signature: decodeBase64(raw.signature as string),
    signatureType: (raw.signatureType as 'ed25519') ?? 'ed25519',
  };
}

export function generateNonce(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export { hexToBytes, bytesToHex, encodeBase64, decodeBase64 };
