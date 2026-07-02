// TLD mapping for BNS resolution (from official BNS library)
const TLD_MAPPING = {
  "mictest": "ban_1dzpfrgi8t4byzmdeidh57p14h5jwbursf1t3ztbmeqnqqdcbpgp9x8j3cw6",
  "jtv": "ban_3gipeswotbnyemcc1dejyhy5a1zfgj35kw356dommbx4rdochiteajcsay56",
  "ban": "ban_1fdo6b4bqm6pp1w55duuqw5ebz455975o4qcp8of85fjcdw9qhuzxsd3tjb9",
};

// Transaction amounts for domain operations (from official BNS library)
const TRANS_MIN = "120703010000000000000000000"; // 0.0012070301 BAN
const TRANS_MAX = "120703011000000000000000000"; // 0.00120703011 BAN
const RESOLVER_AMOUNT = "4224"; // Amount for resolver blocks

export class BNSResolver {
  private rpcUrl: string;

  constructor(rpcUrl: string = "https://kaliumapi.appditto.com/api") {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Decode domain name from hex (based on official BNS library)
   */
  private decodeDomainName(encodedDomainName: string): string {
    const bytes = [];
    for (let i = 0; i < encodedDomainName.length; i += 2) {
      bytes.push(parseInt(encodedDomainName.substr(i, 2), 16));
    }
    return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\u0000/g, "");
  }

  /**
   * Get public key from address using bananojs
   */
  private getPublicKeyFromAddress(address: string): string {
    // Import bananojs dynamically to avoid build issues
    const bananojs = require('@bananocoin/bananojs');
    return bananojs.getAccountPublicKey(address);
  }

  /**
   * Get address from public key using bananojs
   */
  private getAddressFromPublicKey(publicKey: string): string {
    // Import bananojs dynamically to avoid build issues
    const bananojs = require('@bananocoin/bananojs');
    return bananojs.getAccount(publicKey, 'ban_');
  }

  /**
   * Resolve a BNS name to a Banano address
   * Based on the official BNS library implementation
   * @param bnsName - The BNS name (e.g., "username.ban")
   * @returns Promise<string> - The resolved Banano address
   */
  async resolveBNS(bnsName: string): Promise<string> {
    try {
      console.log('BNS: Resolving BNS name:', bnsName);
      
      // Extract domain and TLD from the BNS name
      const parts = bnsName.split('.');
      if (parts.length !== 2) {
        throw new Error('Invalid BNS format. Expected: username.tld');
      }
      
      const [domain, tld] = parts;
      
      // Check if TLD is supported
      if (!TLD_MAPPING[tld as keyof typeof TLD_MAPPING]) {
        throw new Error(`Unsupported TLD: ${tld}. Supported TLDs: ${Object.keys(TLD_MAPPING).join(', ')}`);
      }
      
      const tldAddress = TLD_MAPPING[tld as keyof typeof TLD_MAPPING];
      console.log('BNS: Using TLD address:', tldAddress);
      
      // Get TLD account history to find domain registration
      const historyResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'account_history',
          account: tldAddress,
          count: 500,
          raw: true
        })
      });
      
      const historyData = await historyResponse.json();
      
      if (historyData.error || !historyData.history) {
        throw new Error(`Failed to get TLD history: ${historyData.error}`);
      }
      
      console.log('BNS: Found', historyData.history.length, 'transactions in TLD history');
      
      // Look for domain registration transaction
      let domainAddress = null;
      for (const block of historyData.history) {
        try {
          // Check if this is a domain registration transaction
          if (block.subtype === 'send' && 
              block.amount >= TRANS_MIN && 
              block.amount <= TRANS_MAX) {
            
            // Get public key from representative using bananojs
            const publicKey = this.getPublicKeyFromAddress(block.representative);
            
            // Decode the domain name from the public key
            const decodedDomainName = this.decodeDomainName(publicKey);
            
            console.log('BNS: Found domain registration for:', decodedDomainName);
            
            if (decodedDomainName.toLowerCase() === domain.toLowerCase()) {
              // Found the domain! Create domain address from link using bananojs
              domainAddress = this.getAddressFromPublicKey(block.link);
              console.log('BNS: Found domain address:', domainAddress);
              break;
            }
          }
        } catch (blockError) {
          console.log('BNS: Error processing block:', blockError);
          continue;
        }
      }
      
      if (!domainAddress) {
        throw new Error(`Domain not found: ${bnsName}`);
      }
      
      // Now get the domain account history to find the resolved address
      const domainHistoryResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'account_history',
          account: domainAddress,
          count: 100,
          raw: true
        })
      });
      
      const domainHistoryData = await domainHistoryResponse.json();
      
      if (domainHistoryData.error || !domainHistoryData.history) {
        throw new Error(`Failed to get domain history: ${domainHistoryData.error}`);
      }
      
      console.log('BNS: Found', domainHistoryData.history.length, 'transactions in domain history');
      
      // Look for resolver block (amount = 4224)
      for (const block of domainHistoryData.history) {
        try {
          if (block.subtype === 'send' && block.amount === RESOLVER_AMOUNT) {
            // Found the resolver block! Create resolved address from link using bananojs
            const resolvedAddress = this.getAddressFromPublicKey(block.link);
            console.log('BNS: Found resolved address:', resolvedAddress);
            return resolvedAddress;
          }
        } catch (blockError) {
          console.log('BNS: Error processing domain block:', blockError);
          continue;
        }
      }
      
      throw new Error(`No resolver block found for domain: ${bnsName}`);
      
    } catch (error) {
      console.error('BNS: Failed to resolve', bnsName, ':', error);
      throw new Error(`Failed to resolve BNS name: ${bnsName}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a string looks like a BNS name
   * @param input - The input string to check
   * @returns boolean - True if it looks like a BNS name
   */
  isBNSName(input: string): boolean {
    const parts = input.split('.');
    if (parts.length !== 2) return false;
    
    const [domain, tld] = parts;
    
    if (!TLD_MAPPING[tld as keyof typeof TLD_MAPPING]) return false;
    
    // Basic validation for domain name
    return /^[a-zA-Z0-9_-]+$/.test(domain) && domain.length > 0;
  }

  /** POST a JSON-RPC action to the node and return the parsed response. */
  private async rpc(body: Record<string, unknown>): Promise<any> {
    const res = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  /** Reverse the TLD_MAPPING: TLD account → its label (e.g. "ban"). */
  private tldLabelForAccount(account: string): string | undefined {
    return Object.keys(TLD_MAPPING).find(
      (label) => TLD_MAPPING[label as keyof typeof TLD_MAPPING] === account,
    );
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
      // Opening block = first block on the chain (reverse history, count 1).
      const openResp = await this.rpc({
        action: 'account_history',
        account: domainAccount,
        count: 1,
        reverse: true,
        raw: true,
      });
      const opening = openResp?.history?.[0];
      const transferHash: string | undefined = opening?.link;
      if (!transferHash || /^0+$/.test(transferHash)) return null;

      // The Domain Transfer (send from the TLD account) carries the name in its
      // representative, and its `block_account` is the TLD account.
      const blockResp = await this.rpc({
        action: 'block_info',
        hash: transferHash,
        json_block: true,
      });
      if (blockResp?.error) return null;
      const tldAccount: string | undefined = blockResp?.block_account;
      const representative: string | undefined = blockResp?.contents?.representative;
      if (!tldAccount || !representative) return null;

      const tld = this.tldLabelForAccount(tldAccount);
      if (!tld) return null; // Registered under a TLD we don't know.

      const publicKey = this.getPublicKeyFromAddress(representative);
      const name = this.decodeDomainName(publicKey).toLowerCase();
      if (!name) return null;
      return { name, tld };
    } catch (error) {
      console.log('BNS: domainNameForAccount error:', error);
      return null;
    }
  }

  /**
   * Reverse-resolve a Banano address into the BNS name(s) that currently point
   * to it. Implements the canonical banani-bns approach: scan the address for
   * receives / receivables of exactly 4224 raw (Domain Resolver blocks) to find
   * candidate Domain Accounts, recover each domain's name + TLD, then forward
   * resolve to confirm it still resolves to this address.
   *
   * Best-effort and inherently ambiguous (multiple names can map to one
   * address). Never throws — returns [] on failure.
   *
   * @param address - The Banano address to reverse lookup.
   * @param tld - Optional TLD filter (e.g. "ban").
   */
  async reverseResolve(address: string, tld?: string): Promise<string[]> {
    try {
      console.log('BNS: Reverse resolving address:', address);
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
        const blocks = recv?.blocks;
        if (blocks && typeof blocks === 'object') {
          for (const info of Object.values(blocks) as any[]) {
            if (info?.amount === RESOLVER_AMOUNT && info?.source) candidates.add(info.source);
          }
        }
      } catch (e) {
        console.log('BNS: receivable lookup failed:', e);
      }

      // 2. Already-received Domain Resolver blocks of 4224 raw.
      try {
        const hist = await this.rpc({
          action: 'account_history',
          account: address,
          count: 500,
        });
        if (Array.isArray(hist?.history)) {
          for (const b of hist.history) {
            if (b?.type === 'receive' && b?.amount === RESOLVER_AMOUNT && b?.account) {
              candidates.add(b.account);
            }
          }
        }
      } catch (e) {
        console.log('BNS: history lookup failed:', e);
      }

      // 3. For each candidate Domain Account, recover the name and verify it
      //    forward-resolves back to this address (confirms current ownership).
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

      const result = [...names];
      console.log('BNS: Reverse resolved', address, '→', result);
      return result;
    } catch (error) {
      console.error('BNS: Failed to reverse resolve', address, ':', error);
      return [];
    }
  }

  /**
   * Get all supported TLDs
   * @returns string[] - Array of supported TLD names
   */
  getSupportedTLDs(): string[] {
    return Object.keys(TLD_MAPPING);
  }
}

// Export a singleton instance
export const bnsResolver = new BNSResolver();