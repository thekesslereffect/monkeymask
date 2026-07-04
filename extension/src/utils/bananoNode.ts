// bananojs node configuration + endpoint fallback now live in @monkeymask/core
// (shared with server-side wallets). This module re-exports them so existing
// extension imports keep working.
export {
  bananojs,
  configureBananoNode,
  getActiveBananoEndpoint,
  rotateBananoEndpoint,
  isRateLimitError,
  isTransientNodeError,
  withBananoNodeFallback,
} from '@monkeymask/core';
