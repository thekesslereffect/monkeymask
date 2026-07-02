import type { Wallet } from '@wallet-standard/base';
import {
  BananoSignAndSendTransaction,
  BananoSignIn,
  BananoSignMessage,
  BananoSignTransaction,
  BANANO_MAINNET,
} from '@monkeymask/wallet-standard';
import { StandardConnect, type StandardConnectFeature } from '@wallet-standard/features';

const MONKEYMASK_WALLET_NAME = 'MonkeyMask';

export function isBananoWallet(wallet: Wallet): boolean {
  return (
    wallet.chains.some((c) => c.startsWith('banano:')) &&
    (BananoSignMessage in wallet.features ||
      BananoSignIn in wallet.features ||
      BananoSignTransaction in wallet.features ||
      BananoSignAndSendTransaction in wallet.features)
  );
}

export function isMonkeyMaskWallet(wallet: Wallet): boolean {
  return wallet.name === MONKEYMASK_WALLET_NAME;
}

export function findMonkeyMaskWallet(wallets: readonly Wallet[]): Wallet | undefined {
  return wallets.find(isMonkeyMaskWallet) ?? wallets.find(isBananoWallet);
}

export function getBananoWallets(wallets: readonly Wallet[]): Wallet[] {
  return wallets.filter(isBananoWallet);
}

export async function connectWallet(
  wallet: Wallet,
  options?: { silent?: boolean },
): Promise<{ accounts: readonly import('@wallet-standard/base').WalletAccount[] }> {
  const connectFeature = wallet.features[StandardConnect] as
    | StandardConnectFeature[typeof StandardConnect]
    | undefined;
  if (!connectFeature) {
    throw new Error('Wallet does not support standard:connect');
  }
  const result = await connectFeature.connect({ silent: options?.silent });
  return { accounts: result.accounts };
}

export function walletSupportsChain(wallet: Wallet, chain = BANANO_MAINNET): boolean {
  return wallet.chains.includes(chain);
}

export { MONKEYMASK_WALLET_NAME };
