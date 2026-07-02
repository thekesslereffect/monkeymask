import React, { useState } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
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

function getTitle(type: ApprovalType): string {
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

function getProcessingMessage(type: ApprovalType): string {
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

function getApproveLabel(type: ApprovalType): string {
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
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
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
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    request.type === 'connect'
      ? [
          request.data.currentAccountAddress ||
            request.data.accounts?.[0]?.address ||
            ''
        ]
      : []
  );

  const domain = request.origin
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');

  const handleReject = () => onReject(request.id);

  const handleApprove = async () => {
    if (request.type === 'connect') {
      if (selectedAccounts.length === 0) return;
      onApproveConnect(request.id, selectedAccounts);
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

  const toggleAccount = (address: string) => {
    setSelectedAccounts(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const renderConnect = () => (
    <>
      <Card label="Site Details" className="w-full">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary rounded-full aspect-square flex items-center justify-center text-primary-foreground font-bold text-sm">
            {domain.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-tertiary font-semibold truncate">{domain}</div>
            <div className="text-xs text-tertiary/70 truncate">{request.origin}</div>
            <div className="text-xs text-tertiary/70 mt-2">
              This site is requesting access to view your account addresses, balance, activity,
              and to suggest transactions to approve.
            </div>
          </div>
        </div>
      </Card>

      <Card label="Select Accounts to Connect" className="w-full">
        <div className="space-y-3">
          {(request.data.accounts || []).map((account: any) => (
            <div
              key={account.address}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedAccounts.includes(account.address)
                  ? 'border-primary bg-primary/10'
                  : 'border-tertiary/20 hover:border-tertiary/40'
              }`}
              onClick={() => toggleAccount(account.address)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.address)}
                    onChange={() => toggleAccount(account.address)}
                    className="text-primary focus:ring-primary shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-tertiary font-semibold truncate">{account.name}</div>
                    <div className="text-xs text-tertiary/70 font-mono truncate">
                      {truncate(account.address)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-tertiary font-semibold shrink-0">
                  {formatBalance(account.balance || '0')} BAN
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Alert variant="warning" className="w-full">
        <div className="flex items-start gap-2">
          <Icon icon="lucide:alert-triangle" className="text-lg shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-1">Only connect with sites you trust</div>
            <div className="text-sm">
              Connecting lets this site view your addresses and balances, and request approval
              for transactions.
            </div>
          </div>
        </div>
      </Alert>
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
          description="This site wants to auto-approve small payments without asking each time."
        />
        <Card label="Allowance" className="w-full">
          <DetailRow label="Account">{truncate(address)}</DetailRow>
          <DetailRow label="Up to">{formatBalance(limit)} BAN total</DetailRow>
          <DetailRow label="Expires in" border={false}>
            {durationLabel}
          </DetailRow>
        </Card>
        <Alert variant="warning" className="w-full">
          <div className="flex items-start gap-2">
            <Icon icon="lucide:shield-alert" className="text-lg shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Auto-approved spending</div>
              <div className="text-sm">
                While active, this site can send up to {formatBalance(limit)} BAN in total from the
                account above without another prompt. Revoke anytime from Connected Sites.
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
      blockHash?: string;
      fees?: { to: string; amount: string; label?: string }[];
      sends?: { to: string; amount: string; label?: string }[];
      transfers?: { assetRepresentative: string; to: string; amount?: string }[];
    };
    const fromAddress: string = request.data.fromAddress || request.data.address || '';
    const isLegacySend = request.type === 'sendTransaction';
    const txType = isLegacySend ? 'send' : tx.type || 'send';
    const willPublish = request.type !== 'signTransaction';

    const toAddress = isLegacySend ? request.data.toAddress : tx.to;
    const amount = isLegacySend ? request.data.amount : tx.amount;

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
          ) : txType === 'change' ? (
            <DetailRow label="Representative" border={false}>
              {truncate(tx.representative)}
            </DetailRow>
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
          <div className="text-lg font-semibold text-foreground">{getProcessingMessage(request.type)}</div>
          <div className="text-sm text-tertiary mt-2">
            This may take a few seconds while your wallet signs and broadcasts.
          </div>
        </div>
      )}
      <Header active />
      <ContentContainer>
        <PageName name={getTitle(request.type)} back={false} />

        <div className="w-full space-y-4">{renderBody()}</div>

        <div className="flex gap-3 w-full mt-4">
          <Button variant="secondary" onClick={handleReject} className="flex-1" disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={request.type === 'connect' ? selectedAccounts.length === 0 : processing}
            className="flex-1"
          >
            {processing ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin mr-2" />
                Processing…
              </>
            ) : request.type === 'connect' ? (
              `Connect (${selectedAccounts.length})`
            ) : (
              getApproveLabel(request.type)
            )}
          </Button>
        </div>
      </ContentContainer>
      <Footer />
    </div>
  );
};
