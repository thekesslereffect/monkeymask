import {
  createSignInMessageText,
  decodeBase64,
  encodeBase64,
  PROVIDER_ERRORS,
  type BananoBatchLegResult,
  type BananoOperation,
  type BananoSignInInput,
  type ProtocolMethod,
} from '@monkeymask/wallet-standard';

type SendResponse = (response: {
  success: boolean;
  data?: unknown;
  error?: string;
  code?: number;
}) => void;

export interface ProtocolHandlerHost {
  walletManager: {
    isWalletInitialized(): Promise<boolean>;
    isWalletUnlocked(): boolean;
    getAccounts(): Array<{ address: string; publicKey: string; name: string; balance: string }>;
    getStoredAccounts(): Promise<Array<{ address: string; publicKey: string; name: string; balance: string }>>;
    signMessageBytes(address: string, messageBytes: Uint8Array): Promise<string>;
    signIn(address: string, input: BananoSignInInput, origin: string): Promise<{
      signedMessage: Uint8Array;
      signature: Uint8Array;
    }>;
    signOperation(address: string, operation: BananoOperation): Promise<string>;
    sendOperation(
      address: string,
      operation: BananoOperation,
    ): Promise<{ hashes: string[]; results?: BananoBatchLegResult[] }>;
  };
  getCurrentAccountAddress(): Promise<string | null>;
  isAccountAuthorizedForOrigin(account: string, origin: string): boolean;
  getAuthorizedAccountsForOrigin(origin: string): string[];
  authorizeAccountsForOrigin(origin: string, accounts: string[]): Promise<void>;
  revokeOriginPermissions(origin: string): Promise<void>;
  queueApproval(
    type: string,
    origin: string,
    data: Record<string, unknown>,
  ): Promise<{ approved: boolean; accounts?: string[]; requestId: string }>;
  storeOperationResult(requestId: string, result: Record<string, unknown>): void;
  emitProviderEvent(event: string, data: unknown, targetOrigin?: string): void;
  createStandardError(message: string, code: number): { success: false; error: string; code: number };
  handleGetAccountInfo(request: { address?: string; origin?: string }, sendResponse: SendResponse): Promise<void>;
  handleGetReceivable(request: { address?: string; count?: number }, sendResponse: SendResponse): Promise<void>;
  handleGetAccountHistory(
    request: { address?: string; count?: number; head?: string },
    sendResponse: SendResponse,
  ): Promise<void>;
  handleResolveBNS(request: { bnsName: string }, sendResponse: SendResponse): Promise<void>;
  handleReverseResolveBNS(
    request: { address?: string; tld?: string },
    sendResponse: SendResponse,
  ): Promise<void>;
  handleRequestSpendingSession(
    request: { limit?: string; durationMs?: number; address?: string },
    origin: string,
    sendResponse: SendResponse,
  ): Promise<void>;
  handleGetSpendingSession(origin: string, sendResponse: SendResponse): Promise<void>;
  handleRevokeSpendingSession(origin: string, sendResponse: SendResponse): Promise<void>;
  /** True if a single `send` of `amountBan` fits the origin's active allowance. */
  canAutoApproveSend(origin: string, address: string, amountBan: string): boolean;
  /** Record an auto-approved spend against the origin's allowance. */
  recordAutoApprovedSpend(origin: string, address: string, amountBan: string): void;
}

function toWalletAccounts(
  addresses: string[],
  accounts: Array<{ address: string; publicKey: string; name: string }>,
) {
  return addresses.map((address) => {
    const account = accounts.find((a) => a.address === address);
    return {
      address,
      publicKeyHex: account?.publicKey ?? '',
      label: account?.name,
    };
  });
}

export async function handleProtocolRequest(
  host: ProtocolHandlerHost,
  request: { method: ProtocolMethod; params?: Record<string, unknown>; origin?: string },
  sendResponse: SendResponse,
): Promise<void> {
  const origin = request.origin ?? 'unknown';
  const params = request.params ?? {};

  switch (request.method) {
    case 'standard:connect':
      return handleProtocolConnect(host, origin, params, sendResponse);
    case 'standard:disconnect':
      return handleProtocolDisconnect(host, origin, sendResponse);
    case 'banano:signMessage':
      return handleProtocolSignMessage(host, origin, params, sendResponse);
    case 'banano:signIn':
      return handleProtocolSignIn(host, origin, params, sendResponse);
    case 'banano:signTransaction':
      return handleProtocolSignTransaction(host, origin, params, sendResponse);
    case 'banano:signAndSendTransaction':
      return handleProtocolSignAndSend(host, origin, params, sendResponse);
    case 'banano:getAccountInfo':
      return host.handleGetAccountInfo({ address: params.address as string | undefined, origin }, sendResponse);
    case 'banano:getReceivable':
      return host.handleGetReceivable(
        { address: params.address as string | undefined, count: params.count as number | undefined },
        sendResponse,
      );
    case 'banano:getAccountHistory':
      return host.handleGetAccountHistory(
        {
          address: params.address as string | undefined,
          count: params.count as number | undefined,
          head: params.head as string | undefined,
        },
        sendResponse,
      );
    case 'banano:resolveBNS':
      return host.handleResolveBNS({ bnsName: params.bnsName as string }, sendResponse);
    case 'banano:requestSpendingSession':
      return host.handleRequestSpendingSession(
        {
          limit: params.limit as string | undefined,
          durationMs: params.durationMs as number | undefined,
          address: params.address as string | undefined,
        },
        origin,
        sendResponse,
      );
    case 'banano:getSpendingSession':
      return host.handleGetSpendingSession(origin, sendResponse);
    case 'banano:revokeSpendingSession':
      return host.handleRevokeSpendingSession(origin, sendResponse);
    case 'banano:reverseResolveBNS':
      return host.handleReverseResolveBNS(
        {
          address: params.address as string | undefined,
          tld: params.tld as string | undefined,
        },
        sendResponse,
      );
    default:
      sendResponse(host.createStandardError('Unsupported method', PROVIDER_ERRORS.UNSUPPORTED_METHOD.code));
  }
}

async function handleProtocolConnect(
  host: ProtocolHandlerHost,
  origin: string,
  params: Record<string, unknown>,
  sendResponse: SendResponse,
): Promise<void> {
  const silent = !!params.silent;
  const initialized = await host.walletManager.isWalletInitialized();
  if (!initialized) {
    sendResponse(host.createStandardError('Wallet not initialized', PROVIDER_ERRORS.DISCONNECTED.code));
    return;
  }

  const accounts = host.walletManager.isWalletUnlocked()
    ? host.walletManager.getAccounts()
    : await host.walletManager.getStoredAccounts();
  if (!accounts.length) {
    sendResponse(host.createStandardError('No accounts available', PROVIDER_ERRORS.DISCONNECTED.code));
    return;
  }

  const currentAddress = (await host.getCurrentAccountAddress()) ?? accounts[0].address;
  const authorized = host.getAuthorizedAccountsForOrigin(origin);

  if (host.isAccountAuthorizedForOrigin(currentAddress, origin)) {
    sendResponse({
      success: true,
      data: {
        accounts: toWalletAccounts(authorized.length ? authorized : [currentAddress], accounts).map((acc) => ({
          address: acc.address,
          publicKey: acc.publicKeyHex,
          chains: ['banano:mainnet'],
          features: [
            'banano:signMessage',
            'banano:signIn',
            'banano:signTransaction',
            'banano:signAndSendTransaction',
          ],
          label: acc.label,
        })),
      },
    });
    return;
  }

  if (silent) {
    sendResponse(host.createStandardError('Origin not trusted', PROVIDER_ERRORS.UNAUTHORIZED.code));
    return;
  }

  const approval = await host.queueApproval('connect', origin, {
    origin,
    currentAccountAddress: currentAddress,
    accounts: accounts.map((acc) => ({ address: acc.address, name: acc.name, balance: acc.balance })),
  });

  if (!approval.approved) {
    sendResponse(host.createStandardError('User rejected the connection request', PROVIDER_ERRORS.USER_REJECTED.code));
    return;
  }

  const selected = approval.accounts ?? [currentAddress];
  await host.authorizeAccountsForOrigin(origin, selected);
  host.emitProviderEvent(
    'connect',
    { publicKey: selected[0], publicKeyHex: accounts.find((a) => a.address === selected[0])?.publicKey, accounts: selected },
    origin,
  );
  sendResponse({
    success: true,
    data: {
      accounts: toWalletAccounts(selected, accounts).map((acc) => ({
        address: acc.address,
        publicKey: acc.publicKeyHex,
        chains: ['banano:mainnet'],
        features: [
          'banano:signMessage',
          'banano:signIn',
          'banano:signTransaction',
          'banano:signAndSendTransaction',
        ],
        label: acc.label,
      })),
    },
  });
}

async function handleProtocolDisconnect(
  host: ProtocolHandlerHost,
  origin: string,
  sendResponse: SendResponse,
): Promise<void> {
  await host.revokeOriginPermissions(origin);
  host.emitProviderEvent('disconnect', null, origin);
  sendResponse({ success: true, data: null });
}

async function handleProtocolSignMessage(
  host: ProtocolHandlerHost,
  origin: string,
  params: Record<string, unknown>,
  sendResponse: SendResponse,
): Promise<void> {
  const address = (params.address as string) || (await host.getCurrentAccountAddress());
  const messageBase64 = params.message as string;
  if (!address || !messageBase64) {
    sendResponse(host.createStandardError('Invalid params', PROVIDER_ERRORS.INVALID_PARAMS.code));
    return;
  }
  if (!host.isAccountAuthorizedForOrigin(address, origin)) {
    sendResponse(host.createStandardError('Unauthorized', PROVIDER_ERRORS.UNAUTHORIZED.code));
    return;
  }

  const messageBytes = decodeBase64(messageBase64);
  const approval = await host.queueApproval('signMessage', origin, {
    address,
    messagePreview: new TextDecoder().decode(messageBytes).slice(0, 200),
    messageBase64,
  });
  if (!approval.approved) {
    sendResponse(host.createStandardError('User rejected the request', PROVIDER_ERRORS.USER_REJECTED.code));
    return;
  }

  try {
    const signatureHex = await host.walletManager.signMessageBytes(address, messageBytes);
    const signatureBytes = hexToBytes(signatureHex);
    host.storeOperationResult(approval.requestId, {
      success: true,
      type: 'signMessage',
    });
    sendResponse({
      success: true,
      data: {
        signedMessage: messageBase64,
        signature: encodeBase64(signatureBytes),
        signatureType: 'ed25519',
      },
    });
  } catch (error) {
    host.storeOperationResult(approval.requestId, {
      success: false,
      type: 'signMessage',
      error: error instanceof Error ? error.message : 'Failed to sign message',
    });
    sendResponse(
      host.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign message',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ),
    );
  }
}

async function handleProtocolSignIn(
  host: ProtocolHandlerHost,
  origin: string,
  params: Record<string, unknown>,
  sendResponse: SendResponse,
): Promise<void> {
  const input = (params.input as BananoSignInInput) ?? {};
  const address = input.address || (await host.getCurrentAccountAddress());
  if (!address) {
    sendResponse(host.createStandardError('No account available', PROVIDER_ERRORS.UNAUTHORIZED.code));
    return;
  }

  const domain = input.domain || new URL(origin.startsWith('http') ? origin : `https://${origin}`).host;
  const signInInput: BananoSignInInput = { ...input, domain, address };

  const approval = await host.queueApproval('signIn', origin, { input: signInInput });
  if (!approval.approved) {
    sendResponse(host.createStandardError('User rejected the request', PROVIDER_ERRORS.USER_REJECTED.code));
    return;
  }

  try {
    const result = await host.walletManager.signIn(address, signInInput, origin);
    await host.authorizeAccountsForOrigin(origin, [address]);

    const accounts = host.walletManager.isWalletUnlocked()
      ? host.walletManager.getAccounts()
      : await host.walletManager.getStoredAccounts();
    const account = accounts.find((a) => a.address === address);

    host.emitProviderEvent(
      'connect',
      { publicKey: address, publicKeyHex: account?.publicKey, accounts: [address] },
      origin,
    );

    host.storeOperationResult(approval.requestId, {
      success: true,
      type: 'signIn',
    });

    sendResponse({
      success: true,
      data: {
        account: {
          address,
          publicKey: encodeBase64(hexToBytes(account?.publicKey ?? '')),
          chains: ['banano:mainnet'],
          features: [
            'banano:signMessage',
            'banano:signIn',
            'banano:signTransaction',
            'banano:signAndSendTransaction',
          ],
          label: account?.name,
        },
        signedMessage: encodeBase64(result.signedMessage),
        signature: encodeBase64(result.signature),
        signatureType: 'ed25519',
      },
    });
  } catch (error) {
    host.storeOperationResult(approval.requestId, {
      success: false,
      type: 'signIn',
      error: error instanceof Error ? error.message : 'Failed to sign in',
    });
    sendResponse(
      host.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign in',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ),
    );
  }
}

async function handleProtocolSignTransaction(
  host: ProtocolHandlerHost,
  origin: string,
  params: Record<string, unknown>,
  sendResponse: SendResponse,
): Promise<void> {
  const address = (params.address as string) || (await host.getCurrentAccountAddress());
  const transaction = params.transaction as BananoOperation;
  if (!address || !transaction) {
    sendResponse(host.createStandardError('Invalid params', PROVIDER_ERRORS.INVALID_PARAMS.code));
    return;
  }
  if (!host.isAccountAuthorizedForOrigin(address, origin)) {
    sendResponse(host.createStandardError('Unauthorized', PROVIDER_ERRORS.UNAUTHORIZED.code));
    return;
  }

  const approval = await host.queueApproval('signTransaction', origin, { address, transaction });
  if (!approval.approved) {
    sendResponse(host.createStandardError('User rejected the request', PROVIDER_ERRORS.USER_REJECTED.code));
    return;
  }

  try {
    const signedBlock = await host.walletManager.signOperation(address, transaction);
    host.storeOperationResult(approval.requestId, {
      success: true,
      type: 'signTransaction',
    });
    sendResponse({ success: true, data: { signedBlock } });
  } catch (error) {
    host.storeOperationResult(approval.requestId, {
      success: false,
      type: 'signTransaction',
      error: error instanceof Error ? error.message : 'Failed to sign transaction',
    });
    sendResponse(
      host.createStandardError(
        error instanceof Error ? error.message : 'Failed to sign transaction',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ),
    );
  }
}

async function handleProtocolSignAndSend(
  host: ProtocolHandlerHost,
  origin: string,
  params: Record<string, unknown>,
  sendResponse: SendResponse,
): Promise<void> {
  const address = (params.address as string) || (await host.getCurrentAccountAddress());
  const transaction = params.transaction as BananoOperation;
  if (!address || !transaction) {
    sendResponse(host.createStandardError('Invalid params', PROVIDER_ERRORS.INVALID_PARAMS.code));
    return;
  }
  if (!host.isAccountAuthorizedForOrigin(address, origin)) {
    sendResponse(host.createStandardError('Unauthorized', PROVIDER_ERRORS.UNAUTHORIZED.code));
    return;
  }

  // Spending session: a single plain `send` within the origin's granted, unexpired
  // allowance is published without a popup. Everything else needs approval.
  const isSingleSend = transaction.type === 'send' && !('sends' in transaction);
  if (isSingleSend && host.canAutoApproveSend(origin, address, transaction.amount)) {
    try {
      const { hashes, results } = await host.walletManager.sendOperation(address, transaction);
      const hash = hashes[0] ?? '';
      host.recordAutoApprovedSpend(origin, address, transaction.amount);
      sendResponse({ success: true, data: { hash, hashes, ...(results ? { results } : {}) } });
    } catch (error) {
      sendResponse(
        host.createStandardError(
          error instanceof Error ? error.message : 'Failed to send transaction',
          PROVIDER_ERRORS.INTERNAL_ERROR.code,
        ),
      );
    }
    return;
  }

  const approval = await host.queueApproval('signAndSendTransaction', origin, { address, transaction });
  if (!approval.approved) {
    sendResponse(host.createStandardError('User rejected the request', PROVIDER_ERRORS.USER_REJECTED.code));
    return;
  }

  try {
    const { hashes, results } = await host.walletManager.sendOperation(address, transaction);
    const hash = hashes[0] ?? '';
    let confirmationBlock:
      | { type: string; fromAddress: string; toAddress: string; amount: string };
    if (transaction.type === 'send') {
      if ('sends' in transaction) {
        const total = transaction.sends.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        confirmationBlock = {
          type: 'send',
          fromAddress: address,
          toAddress: `${transaction.sends.length} recipient${transaction.sends.length === 1 ? '' : 's'}`,
          amount: total.toString(),
        };
      } else {
        confirmationBlock = {
          type: 'send',
          fromAddress: address,
          toAddress: transaction.to,
          amount: transaction.amount,
        };
      }
    } else if (transaction.type === 'receive') {
      confirmationBlock = {
        type: 'receive',
        fromAddress: address,
        toAddress: transaction.blockHash ? transaction.blockHash : 'all pending',
        amount: '0',
      };
    } else if (transaction.type === 'sweep') {
      confirmationBlock = {
        type: 'sweep',
        fromAddress: address,
        toAddress: transaction.to,
        amount: 'all',
      };
    } else if (transaction.type === 'mint' || transaction.type === 'mintEdition') {
      confirmationBlock = {
        type: transaction.type,
        fromAddress: address,
        toAddress: transaction.to,
        amount: transaction.amount ?? '0',
      };
    } else if (transaction.type === 'transfer') {
      if ('transfers' in transaction) {
        confirmationBlock = {
          type: 'transfer',
          fromAddress: address,
          toAddress: `${transaction.transfers.length} NFT${transaction.transfers.length === 1 ? '' : 's'}`,
          amount: '0',
        };
      } else {
        confirmationBlock = {
          type: 'transfer',
          fromAddress: address,
          toAddress: transaction.to,
          amount: transaction.amount ?? '0',
        };
      }
    } else if (transaction.type === 'burn') {
      confirmationBlock = {
        type: 'burn',
        fromAddress: address,
        toAddress: transaction.to ?? 'burn account',
        amount: transaction.amount ?? '0',
      };
    } else if (transaction.type === 'finishSupply') {
      confirmationBlock = {
        type: 'finishSupply',
        fromAddress: address,
        toAddress: transaction.metadataCid,
        amount: '0',
      };
    } else if (transaction.type === 'sendAllNfts') {
      confirmationBlock = {
        type: 'sendAllNfts',
        fromAddress: address,
        toAddress: transaction.to,
        amount: transaction.amount ?? '0',
      };
    } else {
      confirmationBlock = {
        type: transaction.type,
        fromAddress: address,
        toAddress: transaction.representative,
        amount: '0',
      };
    }
    host.storeOperationResult(approval.requestId, {
      success: true,
      type: 'signAndSendTransaction',
      hash,
      hashes,
      ...(results ? { results } : {}),
      block: confirmationBlock,
    });
    sendResponse({ success: true, data: { hash, hashes, ...(results ? { results } : {}) } });
  } catch (error) {
    host.storeOperationResult(approval.requestId, {
      success: false,
      type: 'signAndSendTransaction',
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    });
    sendResponse(
      host.createStandardError(
        error instanceof Error ? error.message : 'Failed to send transaction',
        PROVIDER_ERRORS.INTERNAL_ERROR.code,
      ),
    );
  }
}

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.length === 64 ? hex : hex.padStart(64, '0');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
