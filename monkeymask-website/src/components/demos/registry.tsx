'use client';

import React from 'react';
import { NftGallery } from '@/components/NftGallery';
import { MintNftForm } from '@/components/MintNftForm';
import { AirdropForm } from '@/components/AirdropForm';
import { ReceiveHistoryForm } from '@/components/ReceiveHistoryForm';
import { PaymentUriForm } from '@/components/PaymentUriForm';
import { SpendingSessionForm } from '@/components/SpendingSessionForm';
import { WalletConnectionDemo } from './WalletConnectionDemo';
import { SendTransactionDemo } from './SendTransactionDemo';
import { MessageSigningDemo } from './MessageSigningDemo';
import { BnsDemo } from './BnsDemo';
import { NftGateDemo } from './NftGateDemo';
import { RepExplorerDemo } from './RepExplorerDemo';

export interface DemoDef {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  render: () => React.ReactNode;
}

/** Catalog of interactive home-page feature demos for the spotlight layout. */
export const DEMOS: DemoDef[] = [
  {
    id: 'connection',
    title: 'Wallet Connection',
    icon: 'mdi:wallet-outline',
    blurb: 'Connect your wallet, read your balance, and sign in with Banano.',
    render: () => <WalletConnectionDemo />,
  },
  {
    id: 'send',
    title: 'Send Transaction',
    icon: 'mdi:send',
    blurb: 'Send feeless BAN to any address or .ban name.',
    render: () => <SendTransactionDemo />,
  },
  {
    id: 'receive',
    title: 'Receive & History',
    icon: 'mdi:download-circle-outline',
    blurb: 'Receive pending blocks and browse your transaction history.',
    render: () => <ReceiveHistoryForm />,
  },
  {
    id: 'payment-uri',
    title: 'Payment URI & QR',
    icon: 'mdi:qrcode',
    blurb: 'Build and parse ban: payment requests with QR codes.',
    render: () => <PaymentUriForm />,
  },
  {
    id: 'sign',
    title: 'Message Signing',
    icon: 'mdi:file-sign',
    blurb: 'Cryptographically sign arbitrary messages.',
    render: () => <MessageSigningDemo />,
  },
  {
    id: 'bns',
    title: 'BNS Resolution',
    icon: 'mdi:web',
    blurb: 'Resolve .ban names forward and in reverse.',
    render: () => <BnsDemo />,
  },
  {
    id: 'nft-mint',
    title: 'Mint an NFT',
    icon: 'lucide:sparkles',
    blurb: 'Pin art to IPFS and mint a 73-meta-tokens NFT end to end.',
    render: () => <MintNftForm />,
  },
  {
    id: 'nft-gallery',
    title: 'NFT Collection',
    icon: 'mdi:image-multiple',
    blurb: 'Browse the NFTs held by the connected account.',
    render: () => <NftGallery />,
  },
  {
    id: 'nft-gate',
    title: 'NFT Gating',
    icon: 'mdi:lock-open-variant-outline',
    blurb: 'Unlock content by proving you hold an NFT from a verified issuer (SIWB + on-chain check).',
    render: () => <NftGateDemo />,
  },
  {
    id: 'rep-explorer',
    title: 'Representative Explorer',
    icon: 'mdi:vote',
    blurb: 'Browse voting weight by representative and delegate to decentralize ORV.',
    render: () => <RepExplorerDemo />,
  },
  {
    id: 'airdrop',
    title: 'Airdrop / Multi-send',
    icon: 'mdi:parachute-outline',
    blurb: 'Send BAN to many recipients in one flow.',
    render: () => <AirdropForm />,
  },
  {
    id: 'spending-session',
    title: 'Spending Session',
    icon: 'mdi:timer-lock-outline',
    blurb: 'Grant a scoped, time-boxed auto-approval allowance.',
    render: () => <SpendingSessionForm />,
  },
];
