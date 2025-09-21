// Utility functions for formatting balances and numbers

/**
 * Format a numeric balance in BAN with:
 * - Thousands separators
 * - Up to 4 decimal places without trailing zeros
 * - K/M suffixes for large values
 */
export const formatBalance = (value: string | number): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '0';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 100_000) {
    return `${(num / 100_000).toFixed(2)}K`;
  }

  // Limit to 4 decimals, trim trailing zeros, then add thousands separators
  const withDecimals = num.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  
  // Split into integer and decimal parts
  const [integerPart, decimalPart] = withDecimals.split('.');
  
  // Add thousands separators only to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Combine integer and decimal parts
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};


