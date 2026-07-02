/** Banano mainnet chain identifier (Wallet Standard format). */
export const BANANO_MAINNET = 'banano:mainnet' as const;

/** Banano testnet chain identifier (placeholder for future use). */
export const BANANO_TESTNET = 'banano:testnet' as const;

export type BananoChain = typeof BANANO_MAINNET | typeof BANANO_TESTNET;

export const BANANO_CHAINS: readonly BananoChain[] = [BANANO_MAINNET, BANANO_TESTNET];
