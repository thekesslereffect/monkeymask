// The core Banano wallet: keys + block build/sign/publish + NFT metaprotocol
// operations. Runs in Node (server / custodial wallets) and in browsers (the
// MonkeyMask extension). No storage, no approval UI — callers own key custody.
//
// This is the `@solana/web3.js`-style layer: a `Wallet` is one (seed, index)
// keypair with every operation the MonkeyMask extension can perform.

import {
  createSignInMessageText,
  isSupplyRepresentative,
  maxSupplyFromRepresentative,
  isBurnAccount,
  isFinishSupplyRepresentative,
  finishSupplyHeightFromRepresentative,
  CANONICAL_BURN_ACCOUNT,
  SEND_ALL_NFTS_REPRESENTATIVE,
  KALIUM_DEFAULT_REPRESENTATIVE,
  assessRepresentativeForDelegationChange,
  type BananoBatchLegResult,
  type BananoOperation,
  type BananoSignInInput,
} from '@monkeymask/wallet-standard';
import { bananojs, type BananoBlock } from './bananojs.js';
import { withBananoNodeFallback } from './node.js';
import { BananoRPC } from './rpc.js';
import { bnsResolver, type BNSResolver } from './bns.js';
import { deriveAccount, normalizeSeedInput, type DerivedAccount } from './keys.js';
import {
  assetRepresentativeAccount,
  metadataRepresentativeFromCid,
  supplyRepresentative,
  finishSupplyRepresentative,
} from './nftRepresentatives.js';

export interface MintNFTResult {
  /** The mint block hash — the NFT's asset representative. */
  assetRepresentative: string;
  supplyBlockHash: string;
  /** Hashes of the fee sends published after the mint (empty if none). */
  feeHashes: string[];
}

export interface MintFee {
  to: string;
  amount: string;
  label?: string;
}

/**
 * A neutral representative to restore an issuer's account to after minting.
 *
 * The metaprotocol footgun: a `send#mint` sets the account's representative to
 * the metadata rep, and EVERY later block reusing that rep (fees, normal sends)
 * counts as another edition. After minting we always change the rep back to a
 * clean value so ordinary activity never accidentally mints phantom editions.
 */
const CLEAN_REPRESENTATIVE = KALIUM_DEFAULT_REPRESENTATIVE;
const DEFAULT_RECEIVE_REPRESENTATIVE = KALIUM_DEFAULT_REPRESENTATIVE;
const ZERO_LINK = '0000000000000000000000000000000000000000000000000000000000000000';

/** One state block in a locally-chained publish sequence (see publishStateChain). */
interface EngineLeg {
  /** `send` debits the balance; `change` (rep restore) keeps it. */
  subtype: 'send' | 'change';
  /** Amount to debit, in raw (0 for change). */
  amountRaw: bigint;
  /** Block link: destination public key (send) or zeros (change). */
  link: string;
  /** Representative override for this block (defaults to the account's current rep). */
  representative?: string;
  /** Internal legs (e.g. rep restore) are published but excluded from results. */
  internal?: boolean;
  /** User-facing metadata copied into the per-leg result. */
  report: BananoBatchLegResult;
}

export interface WalletOptions {
  /** Account index on the seed (default 0). */
  index?: number;
  /** Custom BNS resolver (defaults to the shared resolver on the active endpoint). */
  bns?: BNSResolver;
}

export class Wallet {
  readonly seed: string;
  readonly index: number;
  readonly address: string;
  readonly publicKey: string;
  readonly privateKey: string;

  private readonly rpc = new BananoRPC();
  private readonly bns: BNSResolver;

  private constructor(seed: string, account: DerivedAccount, bns: BNSResolver) {
    this.seed = seed;
    this.index = account.index;
    this.address = account.address;
    this.publicKey = account.publicKey;
    this.privateKey = account.privateKey;
    this.bns = bns;
  }

  /**
   * Create a wallet from a 64-char hex seed or a BIP39 mnemonic. This is the
   * server-side entry point:
   *
   * ```ts
   * const wallet = await Wallet.fromSeed(process.env.BANANO_SEED!);
   * await wallet.receiveAll();
   * await wallet.send('ban_1abc…', '1.5');
   * ```
   */
  static async fromSeed(seedOrMnemonic: string, options: WalletOptions = {}): Promise<Wallet> {
    const seed = normalizeSeedInput(seedOrMnemonic);
    const account = await deriveAccount(seed, options.index ?? 0);
    return new Wallet(seed, account, options.bns ?? bnsResolver);
  }

  /** Derive a sibling wallet on the same seed at another account index. */
  async deriveIndex(index: number): Promise<Wallet> {
    const account = await deriveAccount(this.seed, index);
    return new Wallet(this.seed, account, this.bns);
  }

  // ------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------

  /** Confirmed balance in BAN (decimal string), read from the node. */
  async getBalance(): Promise<string> {
    const info = await bananojs.getAccountInfo(this.address, true);
    if (!info || info.error || info.balance === undefined) {
      return '0';
    }
    return bananojs.getBananoPartsAsDecimal(bananojs.getBananoPartsFromRaw(String(info.balance)));
  }

  /** Receivable (pending) block hashes → raw amounts. */
  async getReceivables(count = 10): Promise<Record<string, unknown>> {
    const pending = await this.rpc.getPending(this.address, count);
    const blocks = pending.success ? pending.data?.blocks : null;
    return blocks && typeof blocks === 'object' && !Array.isArray(blocks) ? blocks : {};
  }

  // ------------------------------------------------------------------
  // Messages / SIWB
  // ------------------------------------------------------------------

  /** Sign an arbitrary UTF-8 message (Banano dummy-block message signing). */
  async signMessage(message: string): Promise<string> {
    return bananojs.BananoUtil.signMessage(this.privateKey, message);
  }

  /** Verify a message signature against this wallet's public key. */
  verifyMessage(message: string, signatureHex: string): boolean {
    try {
      return bananojs.BananoUtil.verifyMessage(this.publicKey, message, signatureHex);
    } catch {
      return false;
    }
  }

  /** Produce a Sign-In-With-Banano (SIWB) proof for the given input. */
  async signIn(
    input: BananoSignInInput,
  ): Promise<{ signedMessage: Uint8Array; signature: Uint8Array; messageText: string }> {
    if (!input.domain) throw new Error('SIWB input requires a domain');
    const messageText = createSignInMessageText({
      ...input,
      domain: input.domain,
      address: input.address ?? this.address,
    });
    const signatureHex = await bananojs.BananoUtil.signMessage(this.privateKey, messageText);
    return {
      signedMessage: new TextEncoder().encode(messageText),
      signature: hexToUint8(signatureHex),
      messageText,
    };
  }

  // ------------------------------------------------------------------
  // BAN transfers
  // ------------------------------------------------------------------

  /** Send BAN to one recipient (ban_ address or BNS name). Returns the block hash. */
  async send(to: string, amountBan: string): Promise<string> {
    const { hashes, results } = await this.batchSend([{ to, amount: amountBan }]);
    const hash = hashes[0];
    if (!hash) {
      throw new Error(results[0]?.error || 'Send failed');
    }
    return hash;
  }

  /**
   * Publish several plain sends as one locally-chained block sequence with
   * pipelined work (multi-send / airdrop). Best-effort: returns per-recipient
   * results; throws only if nothing sent.
   */
  async batchSend(
    sends: { to: string; amount: string }[],
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    if (!sends.length) {
      throw new Error('Batch send requires at least one recipient');
    }

    const legs: EngineLeg[] = [];
    let total = 0n;
    for (const send of sends) {
      const raw = this.toRaw(send.amount);
      if (raw <= 0n) {
        throw new Error(`Invalid amount: ${send.amount}`);
      }
      const to = await this.resolveRecipient(send.to);
      total += raw;
      legs.push({
        subtype: 'send',
        amountRaw: raw,
        link: bananojs.BananoUtil.getAccountPublicKey(to),
        report: { to, amount: send.amount },
      });
    }

    const { hashes, results } = await this.publishStateChain(legs, { minBalanceRaw: total });
    if (hashes.length === 0) {
      throw new Error(results[0]?.error || 'Batch send failed');
    }
    return { hashes, results };
  }

  /**
   * Claim receivable (pending) blocks. With no `blockHash`, claims all pending;
   * with `blockHash`, claims only that specific receivable. Returns the
   * published receive/open block hashes.
   */
  async receivePending(blockHash?: string): Promise<string[]> {
    const representative = await this.currentRepresentative();
    const received = await withBananoNodeFallback(() =>
      bananojs.receiveBananoDepositsForSeed(this.seed, this.index, representative, blockHash),
    );
    return extractReceiveBlockHashes(received);
  }

  /** Claim every receivable block (alias of {@link receivePending} with no hash). */
  async receiveAll(): Promise<string[]> {
    // Confirm receivable blocks exist before calling bananojs (avoids RPC 400s
    // when the node has no matching pending entries).
    const blocks = await this.getReceivables(1);
    if (!Object.keys(blocks).length) return [];
    return this.receivePending();
  }

  /**
   * Sweep the account: claim any pending, then send the entire confirmed
   * balance (in raw, so no dust is left) to one recipient.
   */
  async sweep(to: string): Promise<{ hash: string; amount: string }> {
    const resolvedTo = await this.resolveRecipient(to);

    try {
      await this.receiveAll();
    } catch {
      /* best-effort; sweep continues with the confirmed balance */
    }

    const info = await bananojs.getAccountInfo(this.address, true);
    if (!info || info.error || info.balance === undefined) {
      throw new Error(`Unable to load balance for sweep: ${String(info?.error ?? 'no data')}`);
    }
    const balanceRaw = BigInt(String(info.balance));
    if (balanceRaw <= 0n) {
      throw new Error('Nothing to sweep: balance is zero');
    }

    const amount = bananojs.getBananoPartsAsDecimal(
      bananojs.getBananoPartsFromRaw(balanceRaw.toString(10)),
    );
    const result = await bananojs.sendBananoWithdrawalFromSeed(
      this.seed,
      this.index,
      resolvedTo,
      amount,
    );
    const hash = extractHash(result);
    if (!hash) {
      throw new Error('Failed to publish sweep block: missing hash');
    }
    return { hash, amount };
  }

  // ------------------------------------------------------------------
  // Representative (voting delegate)
  // ------------------------------------------------------------------

  /**
   * Change the voting delegate. Refuses when the current representative encodes
   * an in-flight NFT protocol state, mirroring the extension's safety checks.
   */
  async changeRepresentative(representative: string): Promise<string> {
    const currentRep = await this.currentRepresentative().catch(() => null);
    const assessment = assessRepresentativeForDelegationChange(currentRep);
    if (!assessment.allowed) {
      throw new Error(assessment.message ?? 'Representative change is blocked for this account');
    }
    if (representative === currentRep) {
      throw new Error('Account already delegates to this representative');
    }
    if (assessRepresentativeForDelegationChange(representative).severity === 'block') {
      throw new Error('That address is not a valid node representative for delegation');
    }

    const result = await bananojs.changeBananoRepresentativeForSeed(
      this.seed,
      this.index,
      representative,
    );
    const hash = extractHash(result);
    if (!hash) throw new Error('Invalid change result: missing transaction hash');
    return hash;
  }

  // ------------------------------------------------------------------
  // NFTs (73-meta-tokens)
  // ------------------------------------------------------------------

  /**
   * Mint a Banano NFT and send it to a recipient.
   *
   * Publishes two consecutive blocks on the issuer's chain:
   *   1. `change#supply` — representative encodes protocol header + version + max supply.
   *   2. `send#mint`     — representative = metadata_representative (IPFS CID);
   *                        `previous` is pinned to the supply block hash.
   *
   * The `send#mint` block hash is the NFT's asset representative. The recipient
   * takes ownership by receiving the send (a normal Banano receive).
   */
  async mintNFT(params: {
    metadataCid: string;
    to: string;
    amount?: string;
    maxSupply?: number;
    fees?: MintFee[];
  }): Promise<MintNFTResult> {
    const supplyRep = supplyRepresentative(params.maxSupply ?? 1);
    const metadataRep = metadataRepresentativeFromCid(params.metadataCid);
    return this.publishMintPair({
      supplyRep,
      metadataRep,
      to: params.to,
      amount: params.amount,
      fees: params.fees,
    });
  }

  /**
   * Mint an additional edition of an existing collection this account issued.
   * Publishes a fresh `change#supply` → `send#mint` pair reusing the collection's
   * metadata_representative. Rejects if the edition limit is reached or the
   * collection is finished.
   */
  async mintEdition(params: {
    metadataCid: string;
    to: string;
    amount?: string;
    fees?: MintFee[];
  }): Promise<MintNFTResult> {
    const metadataRep = metadataRepresentativeFromCid(params.metadataCid);

    // Pocket any pending first: editions minted to self return the send as a
    // receivable, and claiming guarantees a clean frontier before publishing.
    try {
      await this.receiveAll();
    } catch {
      /* best-effort */
    }

    const stats = await this.collectionEditionStats(metadataRep);
    if (!stats) {
      throw new Error(
        'Collection not found for this account — you can only mint editions of a collection you issued',
      );
    }
    if (stats.finished) {
      throw new Error('Collection is finished — no further editions can be minted');
    }
    if (stats.maxSupply > 0 && stats.minted >= stats.maxSupply) {
      throw new Error(`Edition limit reached: ${stats.minted}/${stats.maxSupply} already minted`);
    }

    return this.publishMintPair({
      supplyRep: supplyRepresentative(stats.maxSupply),
      metadataRep,
      to: params.to,
      amount: params.amount,
      fees: params.fees,
    });
  }

  /**
   * Transfer an owned NFT: publishes a `send#asset` block — a normal send whose
   * `representative` is the asset representative (mint block hash as account).
   * Pockets pending first so the asset is held before it moves.
   */
  async transferNFT(params: {
    assetRepresentative: string;
    to: string;
    amount?: string;
  }): Promise<string> {
    const { hashes, results } = await this.transferNFTs([params]);
    const hash = hashes[0];
    if (!hash) {
      throw new Error(results[0]?.error || 'NFT transfer failed');
    }
    return hash;
  }

  /**
   * Transfer several owned NFTs in one locally-chained sequence (one `send#asset`
   * block per NFT, pipelined work), then restore the account's representative.
   * Best-effort: returns per-NFT results; throws only if none transferred.
   */
  async transferNFTs(
    transfers: { assetRepresentative: string; to: string; amount?: string }[],
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    if (!transfers.length) {
      throw new Error('Transfer requires at least one NFT');
    }

    try {
      await this.receiveAll();
    } catch {
      /* best-effort */
    }

    const legs: EngineLeg[] = [];
    let total = 0n;
    for (const t of transfers) {
      const assetRep = assetRepresentativeAccount(t.assetRepresentative);
      const to = await this.resolveRecipient(t.to);
      const amount = t.amount && t.amount.trim() !== '' ? t.amount : '0.0001';
      const raw = this.toRaw(amount);
      total += raw;
      legs.push({
        subtype: 'send',
        amountRaw: raw,
        link: bananojs.BananoUtil.getAccountPublicKey(to),
        representative: assetRep,
        report: { assetRepresentative: t.assetRepresentative, to, amount },
      });
    }

    const { hashes, results } = await this.publishStateChain(legs, {
      minBalanceRaw: total,
      restoreRepresentative: true,
    });
    if (hashes.length === 0) {
      throw new Error(results[0]?.error || 'NFT transfer failed');
    }
    return { hashes, results };
  }

  /**
   * Permanently destroy an owned NFT (`send#burn` to a canonical burn account).
   * Irreversible.
   */
  async burnNFT(params: {
    assetRepresentative: string;
    to?: string;
    amount?: string;
  }): Promise<string> {
    const to = params.to ?? CANONICAL_BURN_ACCOUNT;
    if (!isBurnAccount(to)) {
      throw new Error('Burn target must be a recognized burn account');
    }
    return this.transferNFT({
      assetRepresentative: params.assetRepresentative,
      to,
      amount: params.amount,
    });
  }

  /**
   * Lock a collection you issued (`#finish_supply`): publish a change block
   * whose representative encodes the collection's supply-block height.
   * Afterwards `mintEdition` for this collection is refused.
   */
  async finishCollection(params: { metadataCid: string }): Promise<string> {
    const metadataRep = metadataRepresentativeFromCid(params.metadataCid);
    const stats = await this.collectionEditionStats(metadataRep);
    if (!stats || stats.supplyHeights.length === 0) {
      throw new Error('Collection not found for this account');
    }
    if (stats.finished) {
      throw new Error('Collection is already finished');
    }

    const targetHeight = Math.max(...stats.supplyHeights);
    const finishRep = finishSupplyRepresentative(targetHeight);
    const cleanRep = await this.cleanRepresentative(
      (rep) => !isSupplyRepresentative(rep) && !isFinishSupplyRepresentative(rep),
    );

    const result = await bananojs.changeBananoRepresentativeForSeed(
      this.seed,
      this.index,
      finishRep,
    );
    const hash = extractHash(result);
    if (!hash) throw new Error('Failed to publish finish block: missing hash');

    await this.restoreRepresentative(cleanRep);
    return hash;
  }

  /**
   * Transfer every NFT the account holds to one recipient in a single
   * `send#all_nfts` marker block, then restore a clean representative so
   * subsequent ordinary sends aren't treated as send-all.
   */
  async sendAllNfts(params: { to: string; amount?: string }): Promise<string> {
    const resolvedTo = await this.resolveRecipient(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';

    try {
      await this.receiveAll();
    } catch {
      /* best-effort */
    }

    const cleanRep = await this.cleanRepresentative(
      (rep) => rep !== SEND_ALL_NFTS_REPRESENTATIVE,
    );

    const result = await bananojs.sendBananoWithdrawalFromSeed(
      this.seed,
      this.index,
      resolvedTo,
      amount,
      SEND_ALL_NFTS_REPRESENTATIVE,
    );
    const hash = extractHash(result);
    if (!hash) throw new Error('Failed to publish send-all block: missing hash');

    // Critical: restore a clean rep so the NEXT ordinary send isn't itself
    // interpreted as another send#all_nfts.
    await this.restoreRepresentative(cleanRep);
    return hash;
  }

  // ------------------------------------------------------------------
  // Structured operations (parity with the extension's provider envelope)
  // ------------------------------------------------------------------

  /**
   * Build and sign an operation WITHOUT publishing (only single `send` and
   * `change` support offline signing). Returns the signed block as JSON.
   */
  async signOperation(operation: BananoOperation): Promise<string> {
    if (operation.type === 'send' && !('sends' in operation)) {
      const block = await this.buildSignedSendBlock(operation.to, operation.amount);
      return JSON.stringify(block);
    }
    if (operation.type === 'change') {
      const block = await this.buildSignedChangeBlock(operation.representative);
      return JSON.stringify(block);
    }
    throw new Error(`Operation type "${operation.type}" requires publishing; use sendOperation`);
  }

  /**
   * Build, sign, and publish a structured {@link BananoOperation} — the same
   * envelope dApps send through the MonkeyMask provider. Returns every block
   * hash produced, in publish order, plus per-leg `results` for the array forms
   * of send/transfer.
   */
  async sendOperation(
    operation: BananoOperation,
  ): Promise<{ hashes: string[]; results?: BananoBatchLegResult[] }> {
    return withBananoNodeFallback(() => this.publishOperation(operation));
  }

  private async publishOperation(
    operation: BananoOperation,
  ): Promise<{ hashes: string[]; results?: BananoBatchLegResult[] }> {
    if (operation.type === 'send') {
      if ('sends' in operation) {
        if (operation.sends.length === 0) {
          throw new Error('send requires a non-empty `sends` array');
        }
        return this.batchSend(operation.sends.map((s) => ({ to: s.to, amount: s.amount })));
      }
      const hash = await this.send(operation.to, operation.amount);
      return { hashes: [hash] };
    }
    if (operation.type === 'change') {
      const hash = await this.changeRepresentative(operation.representative);
      return { hashes: [hash] };
    }
    if (operation.type === 'receive') {
      const hashes = await this.receivePending(operation.blockHash);
      return { hashes };
    }
    if (operation.type === 'sweep') {
      const { hash } = await this.sweep(operation.to);
      return { hashes: [hash] };
    }
    if (operation.type === 'mint') {
      const result = await this.mintNFT({
        metadataCid: operation.metadataCid,
        to: operation.to,
        amount: operation.amount,
        maxSupply: operation.maxSupply,
        fees: operation.fees ? [...operation.fees] : undefined,
      });
      return { hashes: [result.assetRepresentative, ...result.feeHashes] };
    }
    if (operation.type === 'mintEdition') {
      const result = await this.mintEdition({
        metadataCid: operation.metadataCid,
        to: operation.to,
        amount: operation.amount,
        fees: operation.fees ? [...operation.fees] : undefined,
      });
      return { hashes: [result.assetRepresentative, ...result.feeHashes] };
    }
    if (operation.type === 'transfer') {
      if ('transfers' in operation) {
        if (operation.transfers.length === 0) {
          throw new Error('transfer requires a non-empty `transfers` array');
        }
        return this.transferNFTs(
          operation.transfers.map((t) => ({
            assetRepresentative: t.assetRepresentative,
            to: t.to,
            amount: t.amount,
          })),
        );
      }
      const hash = await this.transferNFT({
        assetRepresentative: operation.assetRepresentative,
        to: operation.to,
        amount: operation.amount,
      });
      return { hashes: [hash] };
    }
    if (operation.type === 'burn') {
      const hash = await this.burnNFT({
        assetRepresentative: operation.assetRepresentative,
        to: operation.to,
        amount: operation.amount,
      });
      return { hashes: [hash] };
    }
    if (operation.type === 'finishSupply') {
      const hash = await this.finishCollection({ metadataCid: operation.metadataCid });
      return { hashes: [hash] };
    }
    if (operation.type === 'sendAllNfts') {
      const hash = await this.sendAllNfts({ to: operation.to, amount: operation.amount });
      return { hashes: [hash] };
    }
    throw new Error('Unsupported operation type');
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Resolve a recipient to a ban_ address (supports BNS names like user.ban). */
  private async resolveRecipient(to: string): Promise<string> {
    const trimmed = to.trim();
    if (trimmed.startsWith('ban_')) {
      return trimmed;
    }
    if (this.bns.isBNSName(trimmed)) {
      return this.bns.resolveBNS(trimmed);
    }
    throw new Error(
      `Invalid recipient "${trimmed}". Use a ban_ address or BNS name (e.g. username.ban).`,
    );
  }

  private async currentRepresentative(): Promise<string> {
    try {
      const rep = await bananojs.BananodeApi.getAccountRepresentative(this.address);
      return rep || DEFAULT_RECEIVE_REPRESENTATIVE;
    } catch {
      return DEFAULT_RECEIVE_REPRESENTATIVE;
    }
  }

  /**
   * The representative to restore after a metaprotocol operation: the account's
   * current rep if `isClean(rep)`, otherwise the neutral default.
   */
  private async cleanRepresentative(isClean: (rep: string) => boolean): Promise<string> {
    try {
      const baseRep = await bananojs.BananodeApi.getAccountRepresentative(this.address);
      if (baseRep && isClean(baseRep)) return baseRep;
    } catch {
      /* fall through to the neutral rep */
    }
    return CLEAN_REPRESENTATIVE;
  }

  private async restoreRepresentative(representative: string): Promise<void> {
    try {
      await bananojs.changeBananoRepresentativeForSeed(this.seed, this.index, representative);
    } catch {
      // Non-fatal: a stale protocol rep is cleaned up on the next change block.
    }
  }

  /** Shared `change#supply` → `send#mint` → rep restore → fee sends pipeline. */
  private async publishMintPair(params: {
    supplyRep: string;
    metadataRep: string;
    to: string;
    amount?: string;
    fees?: MintFee[];
  }): Promise<MintNFTResult> {
    const resolvedTo = await this.resolveRecipient(params.to);
    const amount = params.amount && params.amount.trim() !== '' ? params.amount : '0.0001';

    const cleanRep = await this.cleanRepresentative(
      (rep) => !isSupplyRepresentative(rep) && rep !== params.metadataRep,
    );

    // Resolve + validate fees up front so we never mint if the balance can't
    // also cover every fee — a failed fee should never happen after a mint, and
    // a short balance must fail before anything is published.
    const fees = params.fees ?? [];
    const resolvedFees: { to: string; amount: string }[] = [];
    let feeTotal = 0;
    for (const fee of fees) {
      const feeAmount = parseFloat(fee.amount);
      if (!Number.isFinite(feeAmount) || feeAmount < 0) {
        throw new Error(`Invalid fee amount: ${fee.amount}`);
      }
      const feeTo = await this.resolveRecipient(fee.to);
      resolvedFees.push({ to: feeTo, amount: fee.amount });
      feeTotal += feeAmount;
    }
    const mintAmount = parseFloat(amount) || 0;
    const availableBalance = parseFloat(await this.getBalance()) || 0;
    if (mintAmount + feeTotal > availableBalance) {
      throw new Error(
        `Insufficient balance: need ${(mintAmount + feeTotal).toString()} BAN ` +
          `(mint + fees) but only ${availableBalance.toString()} BAN available`,
      );
    }

    // 1. change#supply — establishes the collection (or edition slot).
    const supplyResult = await bananojs.changeBananoRepresentativeForSeed(
      this.seed,
      this.index,
      params.supplyRep,
    );
    const supplyBlockHash = extractHash(supplyResult);
    if (!supplyBlockHash) {
      throw new Error('Failed to publish supply block: missing hash');
    }

    // 2. send#mint — pin `previous` to the supply hash so the mint immediately
    //    follows the supply block, and set the representative to the metadata CID.
    const mintResult = await bananojs.sendBananoWithdrawalFromSeed(
      this.seed,
      this.index,
      resolvedTo,
      amount,
      params.metadataRep,
      supplyBlockHash,
    );
    const assetRepresentative = extractHash(mintResult);
    if (!assetRepresentative) {
      throw new Error('Failed to publish mint block: missing hash');
    }

    // 3. Restore a clean representative so the fees (and any later normal send)
    //    don't inherit the metadata rep and mint phantom editions.
    await this.restoreRepresentative(cleanRep);

    // 4. Fees — plain sends published only after a successful mint.
    const feeHashes: string[] = [];
    for (const fee of resolvedFees) {
      const feeResult = await bananojs.sendBananoWithdrawalFromSeed(
        this.seed,
        this.index,
        fee.to,
        fee.amount,
      );
      const feeHash = extractHash(feeResult);
      if (feeHash) feeHashes.push(feeHash);
    }

    return { assetRepresentative, supplyBlockHash, feeHashes };
  }

  /**
   * Look up an existing collection this account issued by its metadata rep, and
   * report the max supply plus how many editions have already been minted.
   *
   * An edition is a self-delimiting `change#supply` → `send#mint` pair (the mint
   * reuses `metadata_representative`). Counting whole pairs — never bare sends —
   * is what keeps ordinary payments from being miscounted as phantom editions.
   */
  private async collectionEditionStats(metadataRepAccount: string): Promise<{
    maxSupply: number;
    minted: number;
    supplyHeights: number[];
    finished: boolean;
  } | null> {
    let history: Array<{ height?: unknown; subtype?: unknown; representative?: unknown }>;
    try {
      const result = await bananojs.getAccountHistory(this.address, -1, undefined, true);
      history = Array.isArray(result?.history) ? result.history : [];
    } catch {
      return null;
    }
    history.sort((a, b) => Number(a.height) - Number(b.height));

    const byHeight = new Map<number, { subtype?: unknown; representative?: unknown }>();
    for (const b of history) byHeight.set(Number(b.height), b);

    let maxSupply: number | null = null;
    let minted = 0;
    const supplyHeights: number[] = [];
    for (const entry of history) {
      if (entry.subtype !== 'change' || typeof entry.representative !== 'string') continue;
      if (!isSupplyRepresentative(entry.representative)) continue;

      const mint = byHeight.get(Number(entry.height) + 1);
      if (!mint || mint.subtype !== 'send') continue;
      if (mint.representative !== metadataRepAccount) continue;

      // Each qualifying pair is one edition of this collection.
      if (maxSupply === null) maxSupply = maxSupplyFromRepresentative(entry.representative);
      minted += 1;
      supplyHeights.push(Number(entry.height));
    }
    if (maxSupply === null) return null;

    // The collection is locked if any `#finish_supply` block points at one of
    // its supply-block heights.
    const supplySet = new Set(supplyHeights);
    const finished = history.some(
      (b) =>
        typeof b.representative === 'string' &&
        isFinishSupplyRepresentative(b.representative) &&
        supplySet.has(finishSupplyHeightFromRepresentative(b.representative)),
    );

    return { maxSupply, minted, supplyHeights, finished };
  }

  /**
   * Publish a chain of state blocks from this account in a single pass.
   *
   * This is the executor behind multi-send / airdrop and multi-NFT transfer:
   *  - Fetches account_info ONCE, then tracks the frontier + balance locally,
   *    building each block off the previous one's (locally computed) hash.
   *  - Pipelines proof-of-work: the block hash is computed locally (blake2b),
   *    so work for block N+1 is requested *while* block N is broadcast.
   *  - Runs best-effort: a leg that fails to publish is recorded and skipped,
   *    so one bad recipient doesn't sink a whole airdrop.
   */
  private async publishStateChain(
    legs: EngineLeg[],
    opts?: { minBalanceRaw?: bigint; restoreRepresentative?: boolean },
  ): Promise<{ hashes: string[]; results: BananoBatchLegResult[] }> {
    const info = await bananojs.getAccountInfo(this.address, true);
    if (!info || info.error || !info.frontier || info.balance === undefined) {
      throw new Error(
        `Unable to load account frontier (account may be unopened): ${String(info?.error ?? 'no data')}`,
      );
    }

    let frontier = String(info.frontier);
    let balance = BigInt(String(info.balance));
    const baseRep: string =
      (info.representative as string | undefined) ||
      (await bananojs.BananodeApi.getAccountRepresentative(this.address));
    let lastRep = baseRep;

    if (opts?.minBalanceRaw !== undefined && balance < opts.minBalanceRaw) {
      throw new Error(
        `Insufficient balance: need ${opts.minBalanceRaw.toString()} raw but only ${balance.toString()} raw available`,
      );
    }

    const safeWork = (hash: string): Promise<string | null> =>
      bananojs.BananodeApi.getGeneratedWork(hash).catch(() => null);

    const hashes: string[] = [];
    const results: BananoBatchLegResult[] = [];
    let workPromise = safeWork(frontier);

    for (const leg of legs) {
      const newBalance = leg.subtype === 'send' ? balance - leg.amountRaw : balance;
      if (newBalance < 0n) {
        if (!leg.internal) results.push({ ...leg.report, error: 'Insufficient balance' });
        continue;
      }

      const representative = leg.representative ?? baseRep;
      let work = await workPromise;
      try {
        if (!work) work = await bananojs.BananodeApi.getGeneratedWork(frontier);

        const block: BananoBlock = {
          type: 'state',
          account: this.address,
          previous: frontier,
          representative,
          balance: newBalance.toString(10),
          link: leg.link,
          work,
        };
        block.signature = await bananojs.getSignature(this.privateKey, block);

        // Hash is deterministic from the block, so we can start the next block's
        // work now, overlapping it with this block's broadcast round-trip.
        const localHash: string = bananojs.BananoUtil.hash(block);
        const nextWorkPromise = safeWork(localHash);

        const processedHash = await bananojs.BananodeApi.process(block, leg.subtype);
        const finalHash = processedHash || localHash;

        frontier = finalHash;
        balance = newBalance;
        lastRep = representative;
        workPromise = nextWorkPromise;

        hashes.push(finalHash);
        if (!leg.internal) results.push({ ...leg.report, hash: finalHash });
      } catch (error) {
        // Publish failed: the chain is unchanged, so rebuild the next leg from
        // the same frontier. Reset the pipelined work to the current frontier.
        workPromise = safeWork(frontier);
        const message = error instanceof Error ? error.message : 'Failed to publish block';
        if (!leg.internal) results.push({ ...leg.report, error: message });
      }
    }

    // Restore the account's original representative if a transfer left it
    // pointing at an asset representative.
    if (opts?.restoreRepresentative && hashes.length > 0 && lastRep !== baseRep) {
      try {
        let work = await workPromise;
        if (!work) work = await bananojs.BananodeApi.getGeneratedWork(frontier);
        const block: BananoBlock = {
          type: 'state',
          account: this.address,
          previous: frontier,
          representative: baseRep,
          balance: balance.toString(10),
          link: ZERO_LINK,
          work,
        };
        block.signature = await bananojs.getSignature(this.privateKey, block);
        await bananojs.BananodeApi.process(block, 'change');
      } catch {
        /* non-fatal: rep restore is cleaned up by the next change block */
      }
    }

    return { hashes, results };
  }

  private toRaw(amountBan: string): bigint {
    return BigInt(
      bananojs.BananoUtil.getRawStrFromMajorAmountStr(amountBan, bananojs.BANANO_PREFIX),
    );
  }

  private async buildSignedSendBlock(to: string, amount: string): Promise<BananoBlock> {
    const resolvedTo = await this.resolveRecipient(to);
    const accountInfo = await bananojs.getAccountInfo(this.address, true);
    if (!accountInfo?.balance || !accountInfo?.frontier) {
      throw new Error('Unable to load account frontier for signing');
    }

    const amountRaw = bananojs.BananoUtil.getRawStrFromMajorAmountStr(
      amount.toString(),
      bananojs.BANANO_PREFIX,
    );
    const balanceRaw = String(accountInfo.balance);
    if (BigInt(balanceRaw) < BigInt(amountRaw)) {
      throw new Error('Insufficient balance');
    }

    const remaining = (BigInt(balanceRaw) - BigInt(amountRaw)).toString(10);
    const representative =
      (accountInfo.representative as string | undefined) ??
      (await bananojs.BananodeApi.getAccountRepresentative(this.address));
    const previous = String(accountInfo.frontier);
    const work = await bananojs.BananodeApi.getGeneratedWork(previous);

    const block: BananoBlock = {
      type: 'state',
      account: this.address,
      previous,
      representative,
      balance: remaining,
      link: bananojs.BananoUtil.getAccountPublicKey(resolvedTo),
      work,
    };
    block.signature = await bananojs.getSignature(this.privateKey, block);
    return block;
  }

  private async buildSignedChangeBlock(representative: string): Promise<BananoBlock> {
    const accountInfo = await bananojs.getAccountInfo(this.address, true);
    if (!accountInfo?.balance || !accountInfo?.frontier) {
      throw new Error('Unable to load account info for change block');
    }

    const previous = String(accountInfo.frontier);
    const work = await bananojs.BananodeApi.getGeneratedWork(previous);
    const block: BananoBlock = {
      type: 'state',
      account: this.address,
      previous,
      representative,
      balance: String(accountInfo.balance),
      link: ZERO_LINK,
      work,
    };
    block.signature = await bananojs.getSignature(this.privateKey, block);
    return block;
  }
}

// --------- local utils ---------

/** bananojs seed helpers resolve to either a bare hash string or `{ hash }`. */
function extractHash(result: unknown): string | null {
  if (typeof result === 'string') return result;
  const hash = (result as { hash?: unknown })?.hash;
  return typeof hash === 'string' ? hash : null;
}

/**
 * Normalize the value returned by bananojs' `receiveBananoDepositsForSeed`.
 * DepositUtil resolves to a summary object shaped like
 * `{ pendingBlocks, receiveBlocks, receiveCount, ... }` (not a hash or array),
 * so we pull the freshly-published receive/open block hashes out of
 * `receiveBlocks`. Older/edge return shapes are handled defensively.
 */
function extractReceiveBlockHashes(received: unknown): string[] {
  if (!received) return [];
  if (typeof received === 'string') return [received];
  if (Array.isArray(received)) return received.filter((h): h is string => typeof h === 'string');
  const blocks = (received as { receiveBlocks?: unknown }).receiveBlocks;
  if (Array.isArray(blocks)) return blocks.filter((h): h is string => typeof h === 'string');
  return [];
}

function hexToUint8(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}
