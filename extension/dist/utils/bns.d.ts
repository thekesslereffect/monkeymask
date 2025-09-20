export declare class BNSResolver {
    private rpcUrl;
    constructor(rpcUrl?: string);
    /**
     * Decode domain name from hex (based on official BNS library)
     */
    private decodeDomainName;
    /**
     * Get public key from address using bananojs
     */
    private getPublicKeyFromAddress;
    /**
     * Get address from public key using bananojs
     */
    private getAddressFromPublicKey;
    /**
     * Resolve a BNS name to a Banano address
     * Based on the official BNS library implementation
     * @param bnsName - The BNS name (e.g., "username.ban")
     * @returns Promise<string> - The resolved Banano address
     */
    resolveBNS(bnsName: string): Promise<string>;
    /**
     * Check if a string looks like a BNS name
     * @param input - The input string to check
     * @returns boolean - True if it looks like a BNS name
     */
    isBNSName(input: string): boolean;
    /**
     * Find domain addresses for a given Banano address
     * Based on the official BNS library's reverse resolution approach
     * @param address - The Banano address to search for domain addresses
     * @returns Promise<string[]> - Array of domain addresses found
     */
    private findDomainAddresses;
    /**
     * Resolve backwards from a Banano address to find BNS names
     * Based on the official BNS library's reverse resolution approach
     * @param address - The Banano address to reverse lookup
     * @param tld - The TLD to search in (optional)
     * @returns Promise<string[]> - Array of BNS names for this address
     */
    reverseResolve(address: string, tld?: string): Promise<string[]>;
    /**
     * Get all supported TLDs
     * @returns string[] - Array of supported TLD names
     */
    getSupportedTLDs(): string[];
}
export declare const bnsResolver: BNSResolver;
