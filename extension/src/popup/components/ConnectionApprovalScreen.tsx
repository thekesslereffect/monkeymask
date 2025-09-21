import React, { useState } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, Alert } from './ui';
import { Icon } from '@iconify/react';
import { useAccounts } from '../hooks/useAccounts';

interface ConnectionApprovalScreenProps {
  request: {
    id: string;
    origin: string;
    data: {
      origin: string;
      currentAccountAddress?: string;
      accounts: Array<{
        address: string;
        name: string;
        balance: string;
      }>;
    };
  };
  onApprove: (requestId: string, selectedAccounts: string[]) => void;
  onReject: (requestId: string) => void;
}

export const ConnectionApprovalScreen: React.FC<ConnectionApprovalScreenProps> = ({
  request,
  onApprove,
  onReject
}) => {
  const { currentAccount } = useAccounts();
  
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([
    request.data.currentAccountAddress || currentAccount?.address || request.data.accounts[0]?.address || ''
  ]);

  const handleAccountToggle = (address: string) => {
    setSelectedAccounts(prev => 
      prev.includes(address)
        ? prev.filter(addr => addr !== address)
        : [...prev, address]
    );
  };

  const handleApprove = () => {
    if (selectedAccounts.length === 0) {
      alert('Please select at least one account to connect');
      return;
    }
    onApprove(request.id, selectedAccounts);
  };

  const handleReject = () => {
    onReject(request.id);
  };

  // Extract domain from origin for display
  const domain = request.origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />

      <ContentContainer>
        <PageName name="Connection Request" back={false} />
        
        <div className="w-full space-y-4">
          {/* Site Info Card */}
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

          {/* Account Selection Card */}
          <Card label="Select Accounts to Connect" className="w-full">
            <div className="space-y-3">
              {request.data.accounts.map((account) => (
                <div
                  key={account.address}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedAccounts.includes(account.address)
                      ? 'border-primary bg-primary/10'
                      : 'border-tertiary/20 hover:border-tertiary/40'
                  }`}
                  onClick={() => handleAccountToggle(account.address)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.includes(account.address)}
                        onChange={() => handleAccountToggle(account.address)}
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

          {/* Warning Alert */}
          <Alert variant="warning" className="w-full">
            <Icon icon="lucide:alert-triangle" className="text-lg" />
            <div>
              <div className="font-semibold mb-1">Only connect with sites you trust</div>
              <div className="text-sm">
                Connecting gives this site permission to view your account addresses and balances, 
                and request approval for transactions.
              </div>
            </div>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              onClick={handleReject}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={selectedAccounts.length === 0}
              className="flex-1"
            >
              Connect ({selectedAccounts.length})
            </Button>
          </div>
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
