// Banano Name Service (BNS) resolution — forward (name → address) and reverse
// (address → names). Pure fetch + bananojs account codecs; runs anywhere.

import { bananojs } from './bananojs.js';
import { getActiveBananoEndpoint } from './node.js';

// TLD mapping for BNS resolution (from the official BNS library).
const TLD_MAPPING: Record<string, string> = {
  mictest: 'ban_1dzpfrgi8t4byzmdeidh57p14h5jwbursf1t3ztbmeqnqqdcbpgp9x8j3cw6',
  jtv: 'ban_3gipeswotbnyemcc1dejyhy5a1zfgj35kw356dommbx4rdochiteajcsay56',
  ban: 'ban_1fdo6b4bqm6pp1w55duuqw5ebz455975o4qcp8of85fjcdw9qhuzxsd3tjb9',
};

// Transaction amounts for domain operations (from the official BNS library).
const TRANS_MIN = '120703010000000000000000000'; // 0.0012070301 BAN
const TRANS_MAX = '120703011000000000000000000'; // 0.00120703011 BAN
const RESOLVER_AMOUNT = '4224'; // Amount for resolver blocks

export class BNSResolver {
  private readonly rpcUrl?: string;

  /** @param rpcUrl Optional fixed RPC URL; defaults to the active core endpoint. */
  constructor(rpcUrl?: string) {
    this.rpcUrl = rpcUrl;
  }

  private endpoint(): string {
    return this.rpcUrl ?? getActiveBananoEndpoint();
  }

  /** Decode a domain name from a hex-encoded public key. */
  private decodeDomainName(encodedDomainName: string): string {
    const bytes: number[] = [];
    for (let i = 0; i < encodedDomainName.length; i += 2) {
      bytes.push(parseInt(encodedDomainName.substring(i, i + 2), 16));
    }
    return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\u0000/g, '');
  }

  private getPublicKeyFromAddress(address: string): string {
    return bananojs.BananoUtil.getAccountPublicKey(address);
  }

  private getAddressFromPublicKey(publicKey: string): string {
    return bananojs.BananoUtil.getAccount(publicKey, 'ban_');
  }

  /** POST a JSON-RPC action to the node and return the parsed response. */
  private async rpc(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch(this.endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Record<string, unknown>;
  }

  /**
   * Resolve a BNS name (e.g. "username.ban") to a Banano address.
   * Based on the official BNS library implementation.
   */
  async resolveBNS(bnsName: string): Promise<string> {
    const parts = bnsName.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid BNS format. Expected: username.tld');
    }
    const [domain, tld] = parts;
    const tldAddress = TLD_MAPPING[tld];
    if (!tldAddress) {
      throw new Error(
        `Unsupported TLD: ${tld}. Supported TLDs: ${Object.keys(TLD_MAPPING).join(', ')}`,
      );
    }

    const historyData = await this.rpc({
      action: 'account_history',
      account: tldAddress,
      count: 500,
      raw: true,
    });
    const history = historyData.history as Array<Record<string, unknown>> | undefined;
    if (historyData.error || !history) {
      throw new Error(`Failed to get TLD history: ${String(historyData.error)}`);
    }

    // Look for the domain registration transaction.
    let domainAddress: string | null = null;
    for (const block of history) {
      try {
        if (
          block.subtype === 'send' &&
          String(block.amount) >= TRANS_MIN &&
          String(block.amount) <= TRANS_MAX
        ) {
          const publicKey = this.getPublicKeyFromAddress(block.representative as string);
          const decodedDomainName = this.decodeDomainName(publicKey);
          if (decodedDomainName.toLowerCase() === domain.toLowerCase()) {
            domainAddress = this.getAddressFromPublicKey(block.link as string);
            break;
          }
        }
      } catch {
        continue;
      }
    }
    if (!domainAddress) {
      throw new Error(`Domain not found: ${bnsName}`);
    }

    const domainHistoryData = await this.rpc({
      action: 'account_history',
      account: domainAddress,
      count: 100,
      raw: true,
    });
    const domainHistory = domainHistoryData.history as Array<Record<string, unknown>> | undefined;
    if (domainHistoryData.error || !domainHistory) {
      throw new Error(`Failed to get domain history: ${String(domainHistoryData.error)}`);
    }

    // Look for the resolver block (amount = 4224 raw).
    for (const block of domainHistory) {
      try {
        if (block.subtype === 'send' && String(block.amount) === RESOLVER_AMOUNT) {
          return this.getAddressFromPublicKey(block.link as string);
        }
      } catch {
        continue;
      }
    }
    throw new Error(`No resolver block found for domain: ${bnsName}`);
  }

  /** True if the input looks like a BNS name with a supported TLD. */
  isBNSName(input: string): boolean {
    const parts = input.split('.');
    if (parts.length !== 2) return false;
    const [domain, tld] = parts;
    if (!TLD_MAPPING[tld]) return false;
    return /^[a-zA-Z0-9_-]+$/.test(domain) && domain.length > 0;
  }

  /** Reverse the TLD_MAPPING: TLD account → its label (e.g. "ban"). */
  private tldLabelForAccount(account: string): string | undefined {
    return Object.keys(TLD_MAPPING).find((label) => TLD_MAPPING[label] === account);
  }

  /**
   * Given a Domain Account, recover its `{ name, tld }` by reading the account's
   * opening (Domain Receive) block, following its `link` to the corresponding
   * Domain Transfer send from the TLD account, and decoding the domain name from
   * that send's representative. Returns null if it can't be determined.
   */
  private async domainNameForAccount(
    domainAccount: string,
  ): Promise<{ name: string; tld: string } | null> {
    try {
      const openResp = await this.rpc({
        action: 'account_history',
        account: domainAccount,
        count: 1,
        reverse: true,
        raw: true,
      });
      const opening = (openResp.history as Array<Record<string, unknown>> | undefined)?.[0];
      const transferHash = opening?.link as string | undefined;
      if (!transferHash || /^0+$/.test(transferHash)) return null;

      const blockResp = await this.rpc({
        action: 'block_info',
        hash: transferHash,
        json_block: true,
      });
      if (blockResp.error) return null;
      const tldAccount = blockResp.block_account as string | undefined;
      const representative = (blockResp.contents as Record<string, unknown> | undefined)
        ?.representative as string | undefined;
      if (!tldAccount || !representative) return null;

      const tld = this.tldLabelForAccount(tldAccount);
      if (!tld) return null; // Registered under a TLD we don't know.

      const publicKey = this.getPublicKeyFromAddress(representative);
      const name = this.decodeDomainName(publicKey).toLowerCase();
      if (!name) return null;
      return { name, tld };
    } catch {
      return null;
    }
  }

  /**
   * Reverse-resolve a Banano address into the BNS name(s) that currently point
   * to it: scan for Domain Resolver blocks of exactly 4224 raw to find candidate
   * Domain Accounts, recover each domain's name + TLD, then forward resolve to
   * confirm it still resolves to this address. Best-effort; never throws.
   */
  async reverseResolve(address: string, tld?: string): Promise<string[]> {
    try {
      const candidates = new Set<string>();

      // 1. Receivable (pending) Domain Resolver blocks of 4224 raw.
      try {
        const recv = await this.rpc({
          action: 'receivable',
          account: address,
          count: 50,
          threshold: RESOLVER_AMOUNT,
          source: true,
        });
        const blocks = recv.blocks;
        if (blocks && typeof blocks === 'object') {
          for (const info of Object.values(blocks) as Array<Record<string, unknown>>) {
            if (String(info?.amount) === RESOLVER_AMOUNT && info?.source) {
              candidates.add(info.source as string);
            }
          }
        }
      } catch {
        /* receivable lookup failed */
      }

      // 2. Already-received Domain Resolver blocks of 4224 raw.
      try {
        const hist = await this.rpc({
          action: 'account_history',
          account: address,
          count: 500,
        });
        const history = hist.history;
        if (Array.isArray(history)) {
          for (const b of history as Array<Record<string, unknown>>) {
            if (b?.type === 'receive' && String(b?.amount) === RESOLVER_AMOUNT && b?.account) {
              candidates.add(b.account as string);
            }
          }
        }
      } catch {
        /* history lookup failed */
      }

      // 3. Recover names and confirm they forward-resolve back to this address.
      const names = new Set<string>();
      for (const domainAccount of candidates) {
        const info = await this.domainNameForAccount(domainAccount);
        if (!info) continue;
        if (tld && info.tld !== tld) continue;
        const full = `${info.name}.${info.tld}`;
        try {
          const resolved = await this.resolveBNS(full);
          if (resolved === address) names.add(full);
        } catch {
          // Domain no longer resolves here; skip.
        }
      }

      return [...names];
    } catch {
      return [];
    }
  }

  getSupportedTLDs(): string[] {
    return Object.keys(TLD_MAPPING);
  }
}

/** Shared resolver bound to the active core RPC endpoint. */
export const bnsResolver = new BNSResolver();
