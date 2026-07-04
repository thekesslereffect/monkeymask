import { DEFAULT_BANANO_RPC_ENDPOINTS } from '@monkeymask/core';

/** Public Banano RPC endpoints used by the extension (ordered by preference). */
export const BANANO_RPC_ENDPOINTS = DEFAULT_BANANO_RPC_ENDPOINTS;

export type BananoRpcEndpoint = (typeof BANANO_RPC_ENDPOINTS)[number];
