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

  /**
   * Find domain addresses for a given Banano address
   * Based on the official BNS library's reverse resolution approach
   * @param address - The Banano address to search for domain addresses
   * @returns Promise<string[]> - Array of domain addresses found
   */
  private async findDomainAddresses(address: string): Promise<string[]> {
    try {
      console.log('BNS: Finding domain addresses for:', address);
      
      // Get account history including receivable transactions
      const historyResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'account_history',
          account: address,
          count: 500
        })
      });
      
      const historyData = await historyResponse.json();
      
      if (historyData.error || !historyData.history) {
        console.log('BNS: No history found for address:', address);
        return [];
      }
      
      // Also check receivable transactions
      const receivableResponse = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receivable',
          account: address,
          count: 50,
          threshold: '0'
        })
      });
      
      const receivableData = await receivableResponse.json();
      
      const domainAddresses: string[] = [];
      
      // Look for Domain Resolve blocks in transaction history
      // Based on official BNS library: look for transactions with amount "4224"
      for (const block of historyData.history) {
        try {
          // Get block details
          const blockResponse = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'block_info',
              hash: block.hash
            })
          });
          
          const blockData = await blockResponse.json();
          
          if (blockData.error) continue;
          
          // Check if this is a Domain Resolve block
          // Domain Resolve blocks typically have specific characteristics:
          // - They are send blocks with a specific amount (like 4224 raw)
          // - They have a specific destination pattern
          if (blockData.type === 'send' && blockData.destination) {
            // Check if the destination looks like a domain address
            if (blockData.destination.startsWith('ban_') && blockData.destination.length === 64) {
              // Check if this is a domain resolve block by amount
              // Domain resolve blocks often have specific amounts
              if (blockData.amount === '4224' || blockData.amount === '1000000000000000000000000000') {
                console.log('BNS: Found potential domain address:', blockData.destination);
                domainAddresses.push(blockData.destination);
              }
            }
          }
        } catch (blockError) {
          console.log('BNS: Error processing block:', blockError);
          continue;
        }
      }
      
      // Also check receivable transactions for domain addresses
      if (receivableData.blocks) {
        for (const [hash, blockInfo] of Object.entries(receivableData.blocks)) {
          const block = blockInfo as any; // Type assertion for receivable block
          if (block.source && block.source.startsWith('ban_') && block.source.length === 64) {
            // Check if this receivable is from a domain address
            if (block.amount === '4224' || block.amount === '1000000000000000000000000000') {
              console.log('BNS: Found potential domain address in receivable:', block.source);
              domainAddresses.push(block.source);
            }
          }
        }
      }
      
      console.log('BNS: Found', domainAddresses.length, 'potential domain addresses');
      return [...new Set(domainAddresses)]; // Remove duplicates
      
    } catch (error) {
      console.error('BNS: Error finding domain addresses:', error);
      return [];
    }
  }

  /**
   * Resolve backwards from a Banano address to find BNS names
   * Based on the official BNS library's reverse resolution approach
   * @param address - The Banano address to reverse lookup
   * @param tld - The TLD to search in (optional)
   * @returns Promise<string[]> - Array of BNS names for this address
   */
  async reverseResolve(address: string, tld?: string): Promise<string[]> {
    try {
      console.log('BNS: Reverse resolving address:', address);
      
      // For now, return empty array to avoid interfering with balance display
      // TODO: Implement proper reverse resolution when needed
      console.log('BNS: Reverse resolution not implemented, returning empty array');
      return [];
      
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