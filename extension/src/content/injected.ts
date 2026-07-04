import type { Wallet, WalletAccount } from '@wallet-standard/base';
import {
  BananoSignAndSendTransaction,
  BananoSignIn,
  BananoSignMessage,
  BananoSignTransaction,
  BANANO_MAINNET,
  BANANO_CHAINS,
  type BananoSignInInput,
  type BananoSignInOutput,
  type BananoSignMessageInput,
  type BananoSignMessageOutput,
  type BananoSignTransactionInput,
  type BananoSignAndSendTransactionInput,
  type BananoSignAndSendTransactionOutput,
  createBananoWalletAccount,
  decodeBase64,
  encodeBase64,
  hexToBytes,
  PROTOCOL_INIT_EVENT,
  PROTOCOL_SOURCE_EVENT,
  PROTOCOL_SOURCE_REQUEST,
  PROTOCOL_SOURCE_RESPONSE,
  BALANCES_CHANGED_EVENT,
  REPRESENTATIVE_CHANGED_EVENT,
  SPENDING_SESSION_EVENT,
  WALLET_STANDARD_APP_READY_EVENT,
  WALLET_STANDARD_REGISTER_EVENT,
  type ProtocolMethod,
  getProtocolTimeoutMs,
  PROVIDER_ERRORS,
  createProviderError,
} from '@monkeymask/wallet-standard';
import {
  StandardConnect,
  StandardDisconnect,
  StandardEvents,
  type StandardConnectFeature,
  type StandardDisconnectFeature,
  type StandardEventsFeature,
} from '@wallet-standard/features';

const MONKEYMASK_ICON =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNjQiIGZpbGw9IiMwMDAwMDAiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMCAyMCkgc2NhbGUoMC42ODc1KSIgZmlsbD0iI2Y5ZmFmYiI+PHBhdGggZD0iTTEyMC43NCA1NC42N2MtMi4yMy0xLjIzLTUuMTktMS45NC03LjczLTEuNjhjLTIuNzYtMTAuNjctOC41OS0yMC43My0xNi41NC0yNy42M0M4Ny45IDE3LjkxIDc1LjgzIDE0LjExIDY0IDE0LjE0Yy0xMS44Mi0uMDMtMjMuOSAzLjc3LTMyLjQ3IDExLjIyYy03Ljk2IDYuOS0xMy43OSAxNi45Ni0xNi41NCAyNy42M2MtMi41My0uMjYtNS40OS40NS03LjczIDEuNjhDLjk5IDU4LjEzLS40NSA2Ni40NSAxLjAzIDczLjQyYzEuMTggNS41NSA0LjM5IDkuNzIgMTEuMDEgMTEuMzhjMS4yOC4zMiAyLjQ0LjM1IDMuNDUuMjZjMS44NSA1LjgzIDQuOTQgMTEuMTggOS44MyAxNS42YzUuODEgNS4yNiAxMy4wNSA4LjgyIDIwLjUgMTAuNzZjMi44NC43NCAxMC4xNiAyLjQ1IDE3LjgzIDIuNDVjNy42OCAwIDE1LjcxLTEuNzEgMTguNTQtMi40NWM3LjQ2LTEuOTQgMTQuNjktNS41IDIwLjUtMTAuNzZjNC44OS00LjQzIDcuOTgtOS43NyA5LjgzLTE1LjZjMS4wMS4wOSAyLjE3LjA2IDMuNDQtLjI2YzYuNjItMS42NiA5Ljg0LTUuODMgMTEuMDItMTEuMzhjMS40Ny02Ljk3LjA0LTE1LjI4LTYuMjQtMTguNzUiLz48L2c+PC9zdmc+';

type WalletRegisterCallback = (api: { register: (...wallets: Wallet[]) => () => void }) => void;

function registerWallet(wallet: Wallet): void {
  const callback: WalletRegisterCallback = (api) => {
    api.register(wallet);
  };
  window.dispatchEvent(
    new CustomEvent(WALLET_STANDARD_REGISTER_EVENT, { detail: callback }),
  );
}

function listenForWalletStandardAppReady(wallet: Wallet): void {
  window.addEventListener(WALLET_STANDARD_APP_READY_EVENT, (event) => {
    const detail = (event as CustomEvent<{ register: (w: Wallet) => () => void }>).detail;
    detail.register(wallet);
  });
}

class ProtocolBridge {
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  constructor() {
    window.addEventListener('message', (event) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        !event.data ||
        event.data.source !== PROTOCOL_SOURCE_RESPONSE
      ) {
        return;
      }
      const { id, response } = event.data;
      const pending = this.pending.get(id);
      if (!pending) return;
      this.pending.delete(id);
      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(createProviderError(response.error, response.code));
      }
    });
  }

  async request<T>(method: ProtocolMethod, params: Record<string, unknown> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      window.postMessage(
        { source: PROTOCOL_SOURCE_REQUEST, id, method, params },
        window.location.origin,
      );
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(createProviderError('Request timeout', PROVIDER_ERRORS.INTERNAL_ERROR.code));
      }, getProtocolTimeoutMs(method));
    });
  }
}

class MonkeyMaskWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly name = 'MonkeyMask';
  readonly icon = MONKEYMASK_ICON as Wallet['icon'];
  readonly chains = BANANO_CHAINS;
  accounts: WalletAccount[] = [];

  private bridge = new ProtocolBridge();
  private eventListeners = new Map<string, Set<(data?: unknown) => void>>();

  readonly features: Wallet['features'] = {
    [StandardConnect]: {
      version: '1.0.0',
      connect: async ({ silent } = {}) => {
        const result = await this.bridge.request<{ accounts: WalletAccount[] }>('standard:connect', {
          silent,
        });
        this.accounts = result.accounts;
        this.emitConnect();
        return { accounts: this.accounts };
      },
    } satisfies StandardConnectFeature[typeof StandardConnect],
    [StandardDisconnect]: {
      version: '1.0.0',
      disconnect: async () => {
        await this.bridge.request('standard:disconnect');
        this.accounts = [];
        this.emitDisconnect();
      },
    } satisfies StandardDisconnectFeature[typeof StandardDisconnect],
    [StandardEvents]: {
      version: '1.0.0',
      on: (event, listener) => {
        if (!this.eventListeners.has(event)) {
          this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(listener as (data?: unknown) => void);
        return () => this.eventListeners.get(event)?.delete(listener as (data?: unknown) => void);
      },
    } satisfies StandardEventsFeature[typeof StandardEvents],
    [BananoSignMessage]: {
      version: '1.0.0',
      signMessage: async (...inputs: readonly BananoSignMessageInput[]) => {
        const outputs: BananoSignMessageOutput[] = [];
        for (const input of inputs) {
          outputs.push(await this.bridge.request<BananoSignMessageOutput>('banano:signMessage', {
            address: input.account.address,
            message: encodeBase64(input.message),
          }));
        }
        return outputs;
      },
    },
    [BananoSignIn]: {
      version: '1.0.0',
      signIn: async (...inputs: readonly BananoSignInInput[]) => {
        const outputs: BananoSignInOutput[] = [];
        for (const input of inputs) {
          const output = await this.bridge.request<{
            account: WalletAccount & { publicKey: string };
            signedMessage: string;
            signature: string;
          }>('banano:signIn', { input });
          outputs.push({
            account: {
              ...output.account,
              publicKey: decodeBase64(output.account.publicKey as unknown as string),
            },
            signedMessage: decodeBase64(output.signedMessage),
            signature: decodeBase64(output.signature),
            signatureType: 'ed25519',
          });
        }
        return outputs;
      },
    },
    [BananoSignTransaction]: {
      version: '1.0.0',
      signTransaction: async (...inputs: readonly BananoSignTransactionInput[]) => {
        const outputs = [];
        for (const input of inputs) {
          outputs.push(
            await this.bridge.request<{ signedBlock: string }>('banano:signTransaction', {
              address: input.account.address,
              chain: input.chain,
              transaction: input.transaction,
            }),
          );
        }
        return outputs;
      },
    },
    [BananoSignAndSendTransaction]: {
      version: '1.0.0',
      signAndSendTransaction: async (...inputs: readonly BananoSignAndSendTransactionInput[]) => {
        const outputs = [];
        for (const input of inputs) {
          outputs.push(
            await this.bridge.request<BananoSignAndSendTransactionOutput>('banano:signAndSendTransaction', {
              address: input.account.address,
              chain: input.chain,
              transaction: input.transaction,
            }),
          );
        }
        return outputs;
      },
    },
  };

  constructor() {
    this.setupEventRelay();
    this.attemptSilentConnect();
    listenForWalletStandardAppReady(this);
    registerWallet(this);
  }

  private setupEventRelay(): void {
    window.addEventListener('message', (event) => {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.source !== PROTOCOL_SOURCE_EVENT
      ) {
        return;
      }
      const { event: eventName, data } = event.data;
      if (eventName === 'connect' && data) {
        const connectData = data as { publicKey: string; publicKeyHex?: string; label?: string };
        this.accounts = [
          createBananoWalletAccount(
            connectData.publicKey,
            connectData.publicKeyHex
              ? hexToBytes(connectData.publicKeyHex)
              : new Uint8Array(32),
            undefined,
            connectData.label,
          ),
        ];
        this.emitConnect();
        return;
      }
      if (eventName === 'disconnect') {
        this.accounts = [];
        this.emitDisconnect();
        return;
      }
      if (eventName === 'change' && data) {
        const changeData = data as {
          accounts: Array<{ address: string; publicKeyHex: string; label?: string }>;
        };
        this.accounts = changeData.accounts.map((acc) =>
          createBananoWalletAccount(acc.address, hexToBytes(acc.publicKeyHex), undefined, acc.label),
        );
        this.eventListeners.get('change')?.forEach((listener) => listener({ accounts: this.accounts }));
        // Keep the legacy window.banano provider's publicKey in sync with the
        // active account so its request() calls target the right account.
        if (this.accounts[0]) legacyProvider.syncFromWallet(this.accounts[0].address);
        else legacyProvider.clear();
        return;
      }
      if (eventName === 'spendingSessionChanged') {
        // Surface as a DOM event so the React provider can react without polling.
        window.dispatchEvent(new CustomEvent(SPENDING_SESSION_EVENT, { detail: data }));
        return;
      }
      if (eventName === 'representativeChanged') {
        // Rep changed inside the wallet — let the dApp refresh its delegation UI.
        window.dispatchEvent(new CustomEvent(REPRESENTATIVE_CHANGED_EVENT, { detail: data }));
        return;
      }
      if (eventName === 'balancesChanged') {
        // A block was published (send/receive/NFT/…) — let the dApp re-fetch
        // balance, receivable, history, or NFTs for the affected accounts.
        window.dispatchEvent(new CustomEvent(BALANCES_CHANGED_EVENT, { detail: data }));
      }
    });
  }

  private emitConnect(): void {
    const account = this.accounts[0];
    if (!account) return;
    this.eventListeners.get('connect')?.forEach((listener) => listener({ accounts: this.accounts }));
    legacyProvider.syncFromWallet(account.address);
  }

  private emitDisconnect(): void {
    this.eventListeners.get('disconnect')?.forEach((listener) => listener());
    // Wallet Standard consumers track accounts via the `change` event, so also
    // notify them that there are no more connected accounts (e.g. auto-lock).
    this.eventListeners.get('change')?.forEach((listener) => listener({ accounts: this.accounts }));
    legacyProvider.clear();
  }

  private async attemptSilentConnect(): Promise<void> {
    try {
      await new Promise((r) => setTimeout(r, 500));
      const result = await this.bridge.request<{ accounts: WalletAccount[] }>('standard:connect', {
        silent: true,
      });
      if (result.accounts.length) {
        this.accounts = result.accounts;
        this.emitConnect();
      }
    } catch {
      // Expected when not yet authorized.
    }
  }
}

class LegacyBananoProvider {
  private bridge = new ProtocolBridge();
  readonly isMonkeyMask = true;
  readonly isBanano = true;
  private _publicKey: string | null = null;

  get isConnected(): boolean {
    return !!this._publicKey;
  }

  get publicKey(): string | null {
    return this._publicKey;
  }

  syncFromWallet(address: string): void {
    this._publicKey = address;
  }

  clear(): void {
    this._publicKey = null;
  }

  async request(args: { method: string; params?: Record<string, unknown> }): Promise<unknown> {
    const { method, params = {} } = args;
    switch (method) {
      case 'connect':
        return this.bridge.request('standard:connect', params);
      case 'disconnect':
        await this.bridge.request('standard:disconnect');
        this.clear();
        return null;
      case 'getAccounts': {
        const result = await this.bridge.request<{ accounts: WalletAccount[] }>('standard:connect', {
          silent: true,
        });
        return result.accounts.map((a) => a.address);
      }
      case 'getAccountInfo':
        return this.bridge.request('banano:getAccountInfo', params);
      case 'getReceivable':
        return this.bridge.request('banano:getReceivable', params);
      case 'getAccountHistory':
        return this.bridge.request('banano:getAccountHistory', params);
      case 'resolveBNS': {
        const result = await this.bridge.request<{ address: string }>('banano:resolveBNS', params);
        return result.address;
      }
      case 'reverseResolveBNS': {
        const result = await this.bridge.request<{ names: string[] }>(
          'banano:reverseResolveBNS',
          params,
        );
        return result.names;
      }
      case 'requestSpendingSession':
        return this.bridge.request('banano:requestSpendingSession', {
          address: this._publicKey,
          ...params,
        });
      case 'getSpendingSession':
        return this.bridge.request('banano:getSpendingSession', params);
      case 'revokeSpendingSession':
        return this.bridge.request('banano:revokeSpendingSession', params);
      case 'signMessage': {
        const message = params.message as string;
        const bytes = new TextEncoder().encode(message);
        const output = await this.bridge.request<BananoSignMessageOutput>('banano:signMessage', {
          address: this._publicKey,
          message: encodeBase64(bytes),
        });
        return { signature: encodeBase64(output.signature), publicKey: this._publicKey };
      }
      case 'signIn':
        return this.bridge.request('banano:signIn', params);
      case 'signAndSendTransaction':
        return this.bridge.request('banano:signAndSendTransaction', {
          address: this._publicKey,
          chain: BANANO_MAINNET,
          transaction: params.transaction,
        });
      default:
        throw createProviderError(
          `${PROVIDER_ERRORS.UNSUPPORTED_METHOD.message}: ${method}`,
          PROVIDER_ERRORS.UNSUPPORTED_METHOD.code,
        );
    }
  }

  on(): void {}
  off(): void {}
  removeAllListeners(): void {}
}

const legacyProvider = new LegacyBananoProvider();
const wallet = new MonkeyMaskWallet();

if (!(window as Window & { banano?: LegacyBananoProvider }).banano) {
  Object.defineProperty(window, 'banano', {
    value: legacyProvider,
    writable: false,
    configurable: false,
  });
  window.dispatchEvent(new CustomEvent(PROTOCOL_INIT_EVENT, { detail: { wallet, provider: legacyProvider } }));
}

export {};
