'use client';

import React, { ReactNode } from 'react';
import { MonkeyMaskProvider } from '@monkeymask/react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MonkeyMaskProvider
      config={{
        autoConnect: true,
        onConnect: () => {},
        onDisconnect: () => {},
        onError: () => {},
      }}
    >
      {children}
    </MonkeyMaskProvider>
  );
}

export {
  useMonkeyMask,
  useWallet,
  useConnect,
  useAccounts,
  useSignIn,
  useSignMessage,
  useSignTransaction,
  useSignAndSendTransaction,
  useSend,
  useReceive,
  useReceivable,
  useSweep,
  useAccountHistory,
  useReverseBNS,
  useSpendingSession,
  useMintNFT,
  useMintEdition,
  useTransferNFT,
  useBurnNFT,
  useFinishSupply,
  useSendAllNfts,
  buildBananoUri,
  parseBananoUri,
  isBananoUri,
  banToRaw,
  rawToBan,
} from '@monkeymask/react';

export type {
  MonkeyMaskContextValue,
  MonkeyMaskProviderConfig,
  SendParams,
  MintNFTParams,
  MintEditionParams,
  TransferNFTParams,
  BurnNFTParams,
  FinishSupplyParams,
  SendAllNftsParams,
  BananoPaymentRequest,
  SpendingSessionInfo,
} from '@monkeymask/react';
