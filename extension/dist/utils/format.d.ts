/**
 * Format a numeric balance in BAN with:
 * - Thousands separators
 * - Up to 4 decimal places without trailing zeros
 * - K/M suffixes for large values
 */
export declare const formatBalance: (value: string | number) => string;
