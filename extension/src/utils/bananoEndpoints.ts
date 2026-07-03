/** Public Banano RPC endpoints used by the extension (ordered by preference). */
export const BANANO_RPC_ENDPOINTS = [
  'https://kaliumapi.appditto.com/api',
  /** Full-node proxy — supports `representatives_online` and other node-only RPCs. */
  'https://api.banano.trade/proxy',
  'https://booster.dev-ptera.com/banano-rpc',
] as const;

export type BananoRpcEndpoint = (typeof BANANO_RPC_ENDPOINTS)[number];
