import React, { useState } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
import { Icon } from '@iconify/react';
import { formatBalance } from '../../utils/format';

type ApprovalType = 'connect' | 'signMessage' | 'signBlock' | 'sendTransaction';

interface UnifiedApprovalRequest {
  id: string;
  origin: string;
  type: ApprovalType;
  data: any;
}

interface UnifiedApprovalScreenProps {
  request: UnifiedApprovalRequest;
  onApproveTx: (requestId: string) => void;
  onApproveConnect: (requestId: string, selectedAccounts: string[]) => void;
  onReject: (requestId: string) => void;
}

export const ApprovalScreen: React.FC<UnifiedApprovalScreenProps> = ({
  request,
  onApproveTx,
  onApproveConnect,
  onReject
}) => {
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      onApproveTx(request.id);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (address: string) => {
    setSelectedAccounts(prev =>
      prev.includes(address)
        ? prev.filter(a => a !== address)
        : [...prev, address]
    );
  };

  const renderBody = () => {
    switch (request.type) {
      case 'connect':
        return (
          <>
            <Card label="Site Details" className="w-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-background rounded-full aspect-square flex items-center justify-center text-tertiary text-sm">
                  {domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-tertiary font-semibold">{domain}</div>
                  <div className="text-xs text-tertiary/70">{request.origin}</div>
                  <div className="text-xs text-tertiary/70 mt-2">
                    This site is requesting access to view your account addresses, account balance, activity, and suggest transactions to approve.
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.address)}
                          onChange={() => toggleAccount(account.address)}
                          className="text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="text-sm text-tertiary font-semibold">{account.name}</div>
                          <div className="text-xs text-tertiary/70 font-mono">
                            {account.address.slice(0, 12)}...{account.address.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-tertiary font-semibold">{account.balance} BAN</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Alert variant="warning" className="w-full">
              <Icon icon="lucide:alert-triangle" className="text-lg" />
              <div>
                <div className="font-semibold mb-1">Only connect with sites you trust</div>
                <div className="text-sm">
                  Connecting gives this site permission to view your account addresses and balances, and request approval for transactions.
                </div>
              </div>
            </Alert>
          </>
        );

      case 'signMessage':
      case 'signBlock':
        return (
          <>
            <Card label="Site Details" className="w-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-tertiary font-semibold">{domain}</div>
                  <div className="text-xs text-tertiary/70">{request.origin}</div>
                  <div className="text-xs text-tertiary/70 mt-2">
                    {request.type === 'signMessage' ? 'A website wants you to sign a message' : 'A website wants you to sign a block'}
                  </div>
                </div>
              </div>
            </Card>

            <Card label={request.type === 'signMessage' ? 'Message to Sign' : 'Block to Sign'} className="w-full">
              {request.type === 'signMessage' ? (
                <div>
                  <div className="text-xs text-tertiary/70 mb-2">Display format: {request.data.display || 'utf8'}</div>
                  <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
                    {request.data.message || 'No message provided'}
                  </div>
                </div>
              ) : (
                <div className="font-mono text-xs bg-tertiary/10 text-primary border border-tertiary/20 rounded p-3 max-h-32 overflow-y-auto">
                  <pre>{JSON.stringify(request.data.block || {}, null, 2)}</pre>
                </div>
              )}
            </Card>

            <Alert variant="warning" className="w-full">
              <Icon icon="lucide:alert-triangle" className="text-lg" />
              <div>
                <div className="font-semibold mb-1">Verify before signing</div>
                <div className="text-sm">
                  {request.type === 'signMessage'
                    ? 'Signing this message proves you own this account. Only sign messages you understand and trust.'
                    : 'Signing this block will authorize a blockchain transaction. Make sure you understand what this block does.'}
                </div>
              </div>
            </Alert>
          </>
        );

      case 'sendTransaction':
        return (
          <>
            <Card label="Site Details" className="w-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {domain.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-tertiary font-semibold">{domain}</div>
                  <div className="text-xs text-tertiary/70">{request.origin}</div>
                  <div className="text-xs text-tertiary/70 mt-2">This site wants to send Banano from your wallet.</div>
                </div>
              </div>
            </Card>

            <Card label="Transaction Details" className="w-full">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                  <span className="text-sm text-tertiary">From</span>
                  <span className="text-sm font-mono text-tertiary">
                    {(request.data.fromAddress || '').slice(0, 12)}...{(request.data.fromAddress || '').slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-tertiary/20">
                  <span className="text-sm text-tertiary">To</span>
                  <span className="text-sm font-mono text-tertiary">
                    {(request.data.toAddress || '').slice(0, 12)}...{(request.data.toAddress || '').slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-tertiary">Amount</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatBalance(request.data.amount || '0')} BAN
                  </span>
                </div>
              </div>
            </Card>

            <Alert variant="warning" className="w-full mt-4">
              <Icon icon="lucide:shield-alert" className="text-lg" />
              <div>
                <div className="font-semibold mb-1">Review carefully</div>
                <div className="text-sm">Only approve transactions you trust and understand. This action cannot be undone.</div>
              </div>
            </Alert>
          </>
        );
    }
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />
      <ContentContainer>
        <PageName
          name={
            request.type === 'connect'
              ? 'Connection Request'
              : request.type === 'sendTransaction'
              ? 'Transaction Approval'
              : request.type === 'signMessage'
              ? 'Sign Message'
              : 'Sign Block'
          }
          back={false}
        />

        <div className="w-full space-y-4">{renderBody()}</div>

        <div className="flex gap-3 w-full mt-4">
          <Button variant="secondary" onClick={handleReject} className="flex-1">
            {loading ? <Icon icon="lucide:loader-2" className="animate-spin mr-2" /> : null}
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={request.type === 'connect' ? selectedAccounts.length === 0 : loading}
            className="flex-1"
          >
            {request.type === 'connect' ? `Connect (${selectedAccounts.length})` : loading ? 'Approving...' : 'Approve'}
          </Button>
        </div>
      </ContentContainer>
      <Footer />
    </div>
  );
};


