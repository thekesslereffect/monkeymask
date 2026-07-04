import React, { useEffect, useState } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert, MonkeyLogo } from './ui';
import { Icon } from '@iconify/react';
import { formatBalance } from '../../utils/format';

type ApprovalType =
  | 'connect'
  | 'signMessage'
  | 'signIn'
  | 'signBlock'
  | 'sendTransaction'
  | 'signTransaction'
  | 'signAndSendTransaction'
  | 'spendingSession';

interface UnifiedApprovalRequest {
  id: string;
  origin: string;
  type: ApprovalType;
  data: any;
}

interface UnifiedApprovalScreenProps {
  request: UnifiedApprovalRequest;
  onApproveTx: (requestId: string) => Promise<void>;
  onApproveConnect: (requestId: string, selectedAccounts: string[]) => void;
  onReject: (requestId: string) => void;
}

function getTitle(type: ApprovalType, txType?: string): string {
  if (
    txType === 'change' &&
    (type === 'signAndSendTransaction' || type === 'signTransaction' || type === 'sendTransaction')
  ) {
    return 'Change';
  }
  if (
    txType === 'receive' &&
    (type === 'signAndSendTransaction' || type === 'signTransaction' || type === 'sendTransaction')
  ) {
    return 'Claim Pending';
  }
  switch (type) {
    case 'connect':
      return 'Connection Request';
    case 'signMessage':
      return 'Sign Message';
    case 'signBlock':
      return 'Sign Block';
    case 'signIn':
      return 'Sign In With Banano';
    case 'sendTransaction':
    case 'signAndSendTransaction':
      return 'Transaction Approval';
    case 'signTransaction':
      return 'Sign Transaction';
    case 'spendingSession':
      return 'Spending Allowance';
    default:
      return 'Approval Request';
  }
}

function getProcessingMessage(type: ApprovalType, txType?: string): string {
  if (
    txType === 'change' &&
    (type === 'signAndSendTransaction' || type === 'sendTransaction')
  ) {
    return 'Updating representative…';
  }
  if (
    txType === 'receive' &&
    (type === 'signAndSendTransaction' || type === 'sendTransaction')
  ) {
    return 'Claiming pending funds…';
  }
  switch (type) {
    case 'signMessage':
    case 'signBlock':
      return 'Signing message…';
    case 'signIn':
      return 'Completing sign-in…';
    case 'signTransaction':
      return 'Signing block…';
    case 'signAndSendTransaction':
    case 'sendTransaction':
      return 'Sending transaction…';
    default:
      return 'Processing…';
  }
}

function getApproveLabel(type: ApprovalType, txType?: string): string {
  if (
    txType === 'change' &&
    (type === 'signAndSendTransaction' || type === 'signTransaction' || type === 'sendTransaction')
  ) {
    return 'Change';
  }
  if (
    txType === 'receive' &&
    (type === 'signAndSendTransaction' || type === 'signTransaction' || type === 'sendTransaction')
  ) {
    return 'Claim Pending';
  }
  switch (type) {
    case 'signIn':
      return 'Sign In';
    case 'signMessage':
    case 'signBlock':
      return 'Sign';
    case 'signTransaction':
      return 'Sign';
    case 'sendTransaction':
    case 'signAndSendTransaction':
      return 'Confirm & Send';
    case 'spendingSession':
      return 'Allow';
    default:
      return 'Approve';
  }
}

const truncate = (value?: string, head = 12, tail = 8): string => {
  if (!value) return 'Unknown';
  // Coerce defensively so a non-string never crashes the approval popup.
  const str = typeof value === 'string' ? value : String(value);
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}...${str.slice(-tail)}`;
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '';
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Date(ts).toLocaleString();
};

const SiteHeader: React.FC<{ domain: string; origin: string; description: string }> = ({
  domain,
  origin,
  description,
}) => (
  <Card label="Site Details" className="w-full">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-primary rounded-full aspect-square flex items-center justify-center text-primary-foreground font-bold text-sm">
        {domain.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-tertiary font-semibold truncate">{domain}</div>
        <div className="text-xs text-tertiary/70 truncate">{origin}</div>
        <div className="text-xs text-tertiary/70 mt-2">{description}</div>
      </div>
    </div>
  </Card>
);

const DetailRow: React.FC<{ label: string; children: React.ReactNode; border?: boolean }> = ({
  label,
  children,
  border = true,
}) => (
  <div
    className={`flex justify-between items-center gap-3 py-2 ${
      border ? 'border-b border-tertiary/20' : ''
    }`}
  >
    <span className="text-sm text-tertiary shrink-0">{label}</span>
    <span className="text-sm font-mono text-tertiary text-right break-all">{children}</span>
  </div>
);

export const ApprovalScreen: React.FC<UnifiedApprovalScreenProps> = ({
  request,
  onApproveTx,
  onApproveConnect,
  onReject
}) => {
  const [processing, setProcessing] = useState(false);

  // Connect always uses the currently active account (no selector).
  const connectAddress: string =
    request.type === 'connect'
      ? request.data.currentAccountAddress || request.data.accounts?.[0]?.address || ''
      : '';
  const connectAccount =
    request.type === 'connect'
      ? (request.data.accounts || []).find(
          (a: { address: string }) => a.address === connectAddress,
        )
      : undefined;

  // Auto-confirmation is an advanced, off-by-default feature. A spending-session
  // request can only be approved once the user has explicitly turned it on.
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState<boolean>(
    request.type === 'spendingSession' ? Boolean(request.data?.autoConfirmEnabled) : false,
  );
  const [togglingAutoConfirm, setTogglingAutoConfirm] = useState(false);

  useEffect(() => {
    if (request.type !== 'spendingSession') return;
    let cancelled = false;
    chrome.runtime
      .sendMessage({ type: 'GET_AUTO_CONFIRM_ENABLED' })
      .then((res) => {
        if (!cancelled && res?.success) setAutoConfirmEnabled(Boolean(res.data?.enabled));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [request.type]);

  const setAutoConfirm = async (enabled: boolean) => {
    setTogglingAutoConfirm(true);
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SET_AUTO_CONFIRM_ENABLED',
        enabled,
      });
      if (res?.success) setAutoConfirmEnabled(enabled);
    } catch (error) {
      console.error('Failed to update auto-confirmation setting:', error);
    } finally {
      setTogglingAutoConfirm(false);
    }
  };

  const domain = request.origin
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  // Burn is destructive — surface it with a red primary action.
  const isBurn =
    (request.type === 'signAndSendTransaction' || request.type === 'signTransaction') &&
    (request.data?.transaction as { type?: string } | undefined)?.type === 'burn';

  const previewTx = (request.data?.transaction || {}) as {
    type?: string;
    to?: string;
    amount?: string;
    representative?: string;
    sends?: unknown[];
  };
  const isLegacySendPreview = request.type === 'sendTransaction';
  const previewTxType = isLegacySendPreview
    ? 'send'
    : previewTx.type === 'change' ||
        (previewTx.representative &&
          !previewTx.to &&
          !previewTx.amount &&
          !previewTx.sends?.length)
      ? 'change'
      : previewTx.type || 'send';
  const isRepChange = previewTxType === 'change';
  const isReceiveClaim = previewTxType === 'receive';

  const handleReject = () => onReject(request.id);

  const handleApprove = async () => {
    if (request.type === 'connect') {
      if (!connectAddress) return;
      onApproveConnect(request.id, [connectAddress]);
      return;
    }

    setProcessing(true);
    try {
      await onApproveTx(request.id);
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const renderConnect = () => (
    <>
      {/* Origin → wallet graphic (promo layout) */}
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-card">
            <Icon icon="lucide:globe" width={26} className="text-tertiary" />
          </div>
          <Icon icon="lucide:arrow-right" width={20} className="text-tertiary/60" />
          <div className="flex size-14 items-center justify-center rounded-full bg-black text-white">
            <MonkeyLogo className="size-8" />
          </div>
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">Connect wallet</div>
          <div className="mt-1 text-sm text-tertiary">{domain} wants to connect</div>
          {connectAccount && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-foreground">
              <span className="size-2 shrink-0 rounded-full bg-success" />
              {connectAccount.name || truncate(connectAddress)}
            </div>
          )}
        </div>
      </div>

      <Card className="w-full">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-tertiary">
          This app will be able to
        </div>
        {['View your account address', 'Request approval for transactions'].map((t) => (
          <div key={t} className="flex items-center gap-2 py-1">
            <Icon icon="lucide:check" width={16} className="text-success shrink-0" />
            <span className="text-xs text-foreground">{t}</span>
          </div>
        ))}
      </Card>
    </>
  );

  const renderSignMessage = () => (
    <>
      <SiteHeader
        domain={domain}
        origin={request.origin}
        description={
          request.type === 'signMessage'
            ? 'This site wants you to sign a message.'
            : 'This site wants you to sign a block.'
        }
      />

      <Card label={request.type === 'signMessage' ? 'Message to Sign' : 'Block to Sign'} className="w-full">
        {request.type === 'signMessage' ? (
          <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
            {request.data.messagePreview || request.data.message || 'No message provided'}
          </div>
        ) : (
          <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(request.data.block || {}, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      <Alert variant="default" className="w-full">
        <div className="flex items-start gap-2">
          <Icon icon="lucide:info" className="text-lg shrink-0 mt-0.5" />
          <div className="text-sm">
            Signing proves you control this account. It does not move any funds.
          </div>
        </div>
      </Alert>
    </>
  );

  const renderSignIn = () => {
    const input = (request.data.input || {}) as {
      domain?: string;
      address?: string;
      statement?: string;
      nonce?: string;
      issuedAt?: string;
      expirationTime?: string;
      uri?: string;
      chainId?: string;
    };

    return (
      <>
        <SiteHeader
          domain={input.domain || domain}
          origin={request.origin}
          description="This site wants you to sign in with your Banano account to prove you own it."
        />

        {input.statement && (
          <Card label="Statement" className="w-full">
            <div className="text-sm text-tertiary leading-relaxed">{input.statement}</div>
          </Card>
        )}

        <Card label="Request Details" className="w-full">
          <DetailRow label="Account">{truncate(input.address)}</DetailRow>
          {input.chainId && <DetailRow label="Network">{input.chainId}</DetailRow>}
          {input.nonce && <DetailRow label="Nonce">{input.nonce}</DetailRow>}
          {input.expirationTime && (
            <DetailRow label="Expires" border={false}>
              {formatDateTime(input.expirationTime)}
            </DetailRow>
          )}
        </Card>

        <Alert variant="default" className="w-full">
          <div className="flex items-start gap-2">
            <Icon icon="lucide:shield-check" className="text-lg shrink-0 mt-0.5" />
            <div className="text-sm">
              Signing in verifies ownership of your account. It will not trigger a blockchain
              transaction or move any funds.
            </div>
          </div>
        </Alert>
      </>
    );
  };

  const renderSpendingSession = () => {
    const address: string = request.data.address || '';
    const limit: string = request.data.limit || '0';
    const durationMs: number = request.data.durationMs || 0;
    const minutes = Math.round(durationMs / 60000);
    const durationLabel =
      minutes >= 60 ? `${Math.round(minutes / 60)} hour${minutes >= 120 ? 's' : ''}` : `${minutes} min`;
    return (
      <>
        <SiteHeader
          domain={domain}
          origin={request.origin}
          description="This site wants to auto-confirm small payments without asking each time."
        />

        <Card label="What this allows" className="w-full">
          <div className="text-sm text-tertiary leading-relaxed">
            While active, this site can send BAN from your wallet{' '}
            <span className="font-semibold">automatically, with no confirmation popup</span>, up to
            the limit below until it expires. Handy for games and tipping — but payments will leave
            your wallet without asking each time.
          </div>
        </Card>

        <Card label="Requested allowance" className="w-full">
          <DetailRow label="Account">{truncate(address)}</DetailRow>
          <DetailRow label="Up to">{formatBalance(limit)} BAN total</DetailRow>
          <DetailRow label="Expires in" border={false}>
            {durationLabel}
          </DetailRow>
        </Card>

        {/* The advanced opt-in gate. Approval is blocked until this is on. */}
        <div
          className={`w-full rounded-xl border p-3 ${
            autoConfirmEnabled ? 'border-primary/40 bg-primary/5' : 'border-tertiary/30 bg-tertiary/5'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">Enable auto-confirmation</div>
              <div className="text-xs text-tertiary mt-0.5">
                Advanced feature · off by default
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoConfirmEnabled}
              disabled={togglingAutoConfirm}
              onClick={() => setAutoConfirm(!autoConfirmEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                autoConfirmEnabled ? 'bg-primary' : 'bg-tertiary/40'
              } ${togglingAutoConfirm ? 'opacity-60' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  autoConfirmEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <Alert variant={autoConfirmEnabled ? 'warning' : 'default'} className="w-full">
          <div className="flex items-start gap-2">
            <Icon icon="lucide:shield-alert" className="text-lg shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">
                {autoConfirmEnabled ? 'You are turning on auto-approved spending' : 'Only enable for sites you fully trust'}
              </div>
              <div className="text-sm">
                {autoConfirmEnabled ? (
                  <>
                    This site will be able to send up to {formatBalance(limit)} BAN in total from the
                    account above without another prompt, until it expires. You can revoke it anytime
                    from <span className="font-semibold">Connected Sites</span>.
                  </>
                ) : (
                  <>
                    Turn on the switch above to allow auto-confirmation. Leaving it off keeps a
                    confirmation prompt on every payment (recommended). You can also manage this in{' '}
                    <span className="font-semibold">Settings → Advanced</span>.
                  </>
                )}
              </div>
            </div>
          </div>
        </Alert>
      </>
    );
  };

  const renderTransaction = () => {
    // Both signAndSendTransaction and signTransaction carry { address, transaction }.
    // sendTransaction (legacy) carries flat fields.
    const tx = (request.data.transaction || {}) as {
      type?: string;
      to?: string;
      amount?: string;
      representative?: string;
      metadataCid?: string;
      maxSupply?: number;
      assetRepresentative?: string;
      name?: string;
      message?: string;
      blockHash?: string;
      fees?: { to: string; amount: string; label?: string }[];
      sends?: { to: string; amount: string; label?: string }[];
      transfers?: { assetRepresentative: string; to: string; amount?: string }[];
    };
    const fromAddress: string = request.data.fromAddress || request.data.address || '';
    const isLegacySend = request.type === 'sendTransaction';
    const willPublish = request.type !== 'signTransaction';

    const toAddress = isLegacySend ? request.data.toAddress : tx.to;
    const amount = isLegacySend ? request.data.amount : tx.amount;

    const txType = isLegacySend
      ? 'send'
      : tx.type === 'change' ||
          (tx.representative && !toAddress && !amount && !(tx.sends && tx.sends.length))
        ? 'change'
        : tx.type || 'send';
    const isRepChangeTx = txType === 'change';
    const isReceiveTx = txType === 'receive';

    if (isRepChangeTx) {
      return (
        <>
          <SiteHeader
            domain={domain}
            origin={request.origin}
            description="Update which node your voting weight is delegated to. Your BAN stays in your account."
          />

          <Card label="Representative Change" className="w-full">
            <DetailRow label="Account">{truncate(fromAddress)}</DetailRow>
            <DetailRow label="Delegate to" border={false}>
              {truncate(tx.representative)}
            </DetailRow>
          </Card>

          <Alert variant="default" className="w-full flex items-start gap-2 text-foreground">
            <Icon icon="lucide:vote" className="shrink-0 text-lg text-tertiary" />
            <div className="text-sm text-secondary-foreground">
              Representatives vote on network blocks only—they cannot spend your funds.
            </div>
          </Alert>
        </>
      );
    }

    if (isReceiveTx) {
      return (
        <>
          <SiteHeader
            domain={domain}
            origin={request.origin}
            description="Claim incoming BAN that is waiting in pending. Nothing is sent from your wallet."
          />

          <Card label="Claim Pending" className="w-full">
            <DetailRow label="Account">{truncate(fromAddress)}</DetailRow>
            <DetailRow label="Scope" border={false}>
              {tx.blockHash ? truncate(tx.blockHash) : 'All pending receivables'}
            </DetailRow>
          </Card>

          <Alert variant="default" className="w-full flex items-start gap-2 text-foreground">
            <Icon icon="lucide:download" className="shrink-0 text-lg text-tertiary" />
            <div className="text-sm text-secondary-foreground">
              Receive is a wallet maintenance action—it publishes open/receive blocks to move
              pending funds into your balance. No BAN leaves your account.
            </div>
          </Alert>
        </>
      );
    }

    return (
      <>
        <SiteHeader
          domain={domain}
          origin={request.origin}
          description={
            willPublish
              ? 'This site wants to send a transaction from your wallet.'
              : 'This site wants you to sign a block without broadcasting it.'
          }
        />

        <Card label="Transaction Details" className="w-full">
          <DetailRow label="Type">
            <span className="capitalize">{txType}</span>
          </DetailRow>
          <DetailRow label="From">{truncate(fromAddress)}</DetailRow>

          {txType === 'mint' || txType === 'mintEdition' ? (
            <>
              {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
              <DetailRow label="Recipient">{truncate(toAddress)}</DetailRow>
              {txType === 'mint' ? (
                <DetailRow label="Max supply">{tx.maxSupply ?? 1}</DetailRow>
              ) : (
                <DetailRow label="Edition">additional copy</DetailRow>
              )}
              <DetailRow label="Metadata CID" border={!!(tx.fees && tx.fees.length)}>
                {truncate(tx.metadataCid)}
              </DetailRow>
              {tx.fees?.map((fee, i) => (
                <DetailRow
                  key={`${fee.to}-${i}`}
                  label={fee.label || 'Fee'}
                  border={i < (tx.fees?.length ?? 0) - 1}
                >
                  {formatBalance(fee.amount || '0')} BAN → {truncate(fee.to)}
                </DetailRow>
              ))}
            </>
          ) : txType === 'transfer' ? (
            tx.transfers && tx.transfers.length ? (
              <>
                {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
                <DetailRow label="NFTs">{tx.transfers.length}</DetailRow>
                {tx.transfers.map((t, i) => (
                  <DetailRow
                    key={`${t.assetRepresentative}-${i}`}
                    label={`#${i + 1}`}
                    border={i < (tx.transfers?.length ?? 0) - 1}
                  >
                    {truncate(t.assetRepresentative)} → {truncate(t.to)}
                  </DetailRow>
                ))}
              </>
            ) : (
              <>
                {tx.name ? <DetailRow label="NFT">{tx.name}</DetailRow> : null}
                <DetailRow label="Recipient">{truncate(toAddress)}</DetailRow>
                <DetailRow label="Asset" border={false}>
                  {truncate(tx.assetRepresentative)}
                </DetailRow>
              </>
            )
          ) : txType === 'burn' ? (
            <>
              {tx.name ? <DetailRow label="NFT">{tx.name}</DetailRow> : null}
              <DetailRow label="Asset">{truncate(tx.assetRepresentative)}</DetailRow>
              <DetailRow label="Sent to" border={false}>
                {truncate(toAddress)} (burn)
              </DetailRow>
            </>
          ) : txType === 'finishSupply' ? (
            <>
              {tx.name ? <DetailRow label="Collection">{tx.name}</DetailRow> : null}
              <DetailRow label="Metadata CID" border={false}>
                {truncate(tx.metadataCid)}
              </DetailRow>
            </>
          ) : txType === 'sendAllNfts' ? (
            <>
              {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
              <DetailRow label="Recipient" border={false}>
                {truncate(toAddress)}
              </DetailRow>
            </>
          ) : txType === 'receive' ? (
            <>
              {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
              <DetailRow label="Claiming" border={false}>
                {tx.blockHash ? truncate(tx.blockHash) : 'all pending receivables'}
              </DetailRow>
            </>
          ) : txType === 'sweep' ? (
            <>
              {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
              <DetailRow label="Recipient">{truncate(toAddress)}</DetailRow>
              <DetailRow label="Amount" border={false}>
                Entire balance
              </DetailRow>
            </>
          ) : tx.sends && tx.sends.length ? (
            <>
              {tx.name ? <DetailRow label="Name">{tx.name}</DetailRow> : null}
              <DetailRow label="Recipients">{tx.sends.length}</DetailRow>
              {tx.sends.map((send, i) => (
                <DetailRow
                  key={`${send.to}-${i}`}
                  label={send.label || `Send ${i + 1}`}
                  border={i < (tx.sends?.length ?? 0) - 1}
                >
                  {formatBalance(send.amount || '0')} BAN → {truncate(send.to)}
                </DetailRow>
              ))}
              <div className="flex justify-between items-center gap-3 py-2">
                <span className="text-sm text-tertiary shrink-0">Total</span>
                <span className="text-lg font-semibold text-primary text-right">
                  {formatBalance(
                    (tx.sends.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)).toString(),
                  )}{' '}
                  BAN
                </span>
              </div>
            </>
          ) : (
            <>
              {tx.name ? <DetailRow label="Label">{tx.name}</DetailRow> : null}
              {tx.message ? <DetailRow label="Note">{tx.message}</DetailRow> : null}
              <DetailRow label="To">{truncate(toAddress)}</DetailRow>
              <div className="flex justify-between items-center gap-3 py-2">
                <span className="text-sm text-tertiary shrink-0">Amount</span>
                <span className="text-lg font-semibold text-primary text-right">
                  {formatBalance(amount || '0')} BAN
                </span>
              </div>
            </>
          )}
        </Card>

        {txType === 'burn' ? (
          <Alert variant="destructive" className="w-full">
            <div className="flex items-start gap-2">
              <Icon icon="lucide:flame" className="text-lg shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Permanently destroy this NFT</div>
                <div className="text-sm">
                  Burning sends the asset to a black-hole account. This is irreversible — the NFT
                  can never be recovered or moved again.
                </div>
              </div>
            </div>
          </Alert>
        ) : (
          <Alert variant="warning" className="w-full">
            <div className="flex items-start gap-2">
              <Icon icon="lucide:shield-alert" className="text-lg shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Review carefully</div>
                <div className="text-sm">
                  {willPublish
                    ? 'Only approve transactions you trust and understand. This action cannot be undone.'
                    : 'Only sign blocks from sites you trust.'}
                </div>
              </div>
            </div>
          </Alert>
        )}
      </>
    );
  };

  const renderBody = () => {
    switch (request.type) {
      case 'connect':
        return renderConnect();
      case 'signMessage':
      case 'signBlock':
        return renderSignMessage();
      case 'signIn':
        return renderSignIn();
      case 'signTransaction':
      case 'signAndSendTransaction':
      case 'sendTransaction':
        return renderTransaction();
      case 'spendingSession':
        return renderSpendingSession();
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col font-semibold relative">
      {processing && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 px-6 text-center">
          <Icon icon="lucide:loader-2" className="animate-spin text-4xl text-primary mb-4" />
          <div className="text-lg font-semibold text-foreground">
            {getProcessingMessage(request.type, previewTxType)}
          </div>
          <div className="text-sm text-tertiary mt-2">
            {isRepChange
              ? 'Signing a change block—your balance is not affected.'
              : isReceiveClaim
                ? 'Publishing receive blocks—funds move from pending into your balance.'
                : 'This may take a few seconds while your wallet signs and broadcasts.'}
          </div>
        </div>
      )}
      <Header active />
      <ContentContainer>
        {/* Connect renders its own centered title inside the origin→wallet graphic. */}
        {request.type !== 'connect' && (
          <PageName name={getTitle(request.type, previewTxType)} back={false} />
        )}

        <div className="w-full space-y-4">{renderBody()}</div>

        <div className="flex gap-3 w-full mt-4">
          <Button variant="secondary" onClick={handleReject} className="flex-1" disabled={processing}>
            Cancel
          </Button>
          <Button
            variant={isBurn ? 'danger' : 'primary'}
            onClick={handleApprove}
            disabled={
              request.type === 'connect'
                ? !connectAddress
                : request.type === 'spendingSession'
                  ? processing || !autoConfirmEnabled
                  : processing
            }
            className="flex-1"
          >
            {processing ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin mr-2" />
                Processing…
              </>
            ) : request.type === 'connect' ? (
              'Connect'
            ) : isBurn ? (
              'Burn NFT'
            ) : isRepChange ? (
              'Change'
            ) : isReceiveClaim ? (
              'Claim Pending'
            ) : (
              getApproveLabel(request.type, previewTxType)
            )}
          </Button>
        </div>
      </ContentContainer>
      <Footer />
    </div>
  );
};
