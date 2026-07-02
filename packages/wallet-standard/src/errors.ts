export const PROVIDER_ERRORS = {
  USER_REJECTED: { code: 4001, message: 'User rejected the request' },
  UNAUTHORIZED: { code: 4100, message: 'Unauthorized - not connected to MonkeyMask' },
  UNSUPPORTED_METHOD: { code: 4200, message: 'Unsupported method' },
  DISCONNECTED: { code: 4900, message: 'Provider is disconnected' },
  CHAIN_DISCONNECTED: { code: 4901, message: 'Chain is disconnected' },
  INVALID_PARAMS: { code: -32602, message: 'Invalid method parameters' },
  INTERNAL_ERROR: { code: -32603, message: 'Internal error' },
  PARSE_ERROR: { code: -32700, message: 'Parse error' },
  INVALID_REQUEST: { code: -32600, message: 'Invalid request' },
  METHOD_NOT_FOUND: { code: -32601, message: 'Method not found' },
} as const;

export type ProviderErrorCode = (typeof PROVIDER_ERRORS)[keyof typeof PROVIDER_ERRORS]['code'];

export interface ProviderError extends Error {
  code: number;
  data?: unknown;
}

export function createProviderError(
  message: string,
  code: number = PROVIDER_ERRORS.INTERNAL_ERROR.code,
  data?: unknown,
): ProviderError {
  const error = new Error(message) as ProviderError;
  error.code = code;
  error.data = data;
  return error;
}
