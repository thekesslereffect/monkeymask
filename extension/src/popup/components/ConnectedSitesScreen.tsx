import React, { useState, useEffect } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button } from './ui';
import { Icon } from '@iconify/react';

interface ConnectedAccount {
  account: string;
  approvedAt: number;
  lastUsed: number;
}

interface ConnectedSite {
  origin: string;
  accounts: ConnectedAccount[];
  lastUsed: number; // Most recent lastUsed from all accounts
}

export const ConnectedSitesScreen: React.FC = () => {
  const [connectedSites, setConnectedSites] = useState<ConnectedSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectedSites();
  }, []);

  const loadConnectedSites = async () => {
    try {
      const response = await chrome.storage.local.get(['permissions']);
      const permissions = response.permissions || {};
      
      // Group permissions by origin
      const siteMap = new Map<string, ConnectedAccount[]>();
      
      // permissions is now { "account:origin": AccountPermission }
      Object.entries(permissions).forEach(([key, permission]: [string, any]) => {
        const origin = permission.origin;
        const account = permission.account;
        
        if (!siteMap.has(origin)) {
          siteMap.set(origin, []);
        }
        
        siteMap.get(origin)!.push({
          account,
          approvedAt: permission.approvedAt,
          lastUsed: permission.lastUsed
        });
      });
      
      // Convert to ConnectedSite array
      const sites: ConnectedSite[] = Array.from(siteMap.entries()).map(([origin, accounts]) => ({
        origin,
        accounts: accounts.sort((a, b) => b.lastUsed - a.lastUsed), // Sort accounts by most recent
        lastUsed: Math.max(...accounts.map(acc => acc.lastUsed)) // Most recent usage across all accounts
      }));
      
      // Sort sites by most recently used
      sites.sort((a, b) => b.lastUsed - a.lastUsed);
      
      setConnectedSites(sites);
    } catch (error) {
      console.error('Failed to load connected sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (account: string, origin: string) => {
    try {
      // Send disconnect request for specific account
      await chrome.runtime.sendMessage({
        type: 'REVOKE_ACCOUNT_PERMISSION',
        account,
        origin
      });
      
      // Reload the list
      await loadConnectedSites();
    } catch (error) {
      console.error('Failed to disconnect account:', error);
    }
  };

  const disconnectAllAccounts = async (origin: string) => {
    try {
      // Send disconnect request for all accounts on this origin
      await chrome.runtime.sendMessage({
        type: 'REVOKE_PERMISSION',
        origin
      });
      
      // Reload the list
      await loadConnectedSites();
    } catch (error) {
      console.error('Failed to disconnect site:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDomain = (origin: string) => {
    return origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <Header active />
        <ContentContainer>
          <PageName name="Connected Sites" back={true} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-tertiary">Loading connected sites...</div>
          </div>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active />

      <ContentContainer>
        <PageName name="Connected Sites" back={true} />
        
        {connectedSites.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <Icon icon="lucide:link" className="text-4xl text-tertiary mb-4 mx-auto" />
              <div className="text-tertiary">
                <div className="text-lg mb-2">No connected sites</div>
                <div className="text-sm">Sites you connect to will appear here</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            {connectedSites.map((site) => (
              <Card key={site.origin} label={formatDomain(site.origin)} className="w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center text-tertiary font-bold text-sm">
                      {formatDomain(site.origin).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm text-tertiary mb-1">
                        {site.origin}
                      </div>
                      <div className="text-xs text-tertiary/70">
                        First connected: {formatDate(Math.min(...site.accounts.map(acc => acc.approvedAt)))}
                      </div>
                      <div className="text-xs text-tertiary/70">
                        Last used: {formatDate(site.lastUsed)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connected Accounts */}
                <div className="pt-2 border-t border-tertiary/20 mb-3">
                  <div className="text-xs text-tertiary/70 mb-2">
                    Connected accounts ({site.accounts.length}):
                  </div>
                  <div className="space-y-2">
                    {site.accounts.map((connectedAccount) => (
                      <div
                        key={connectedAccount.account}
                        className="flex items-center justify-between bg-tertiary/5 rounded-lg p-2"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="text-xs font-mono text-primary truncate">
                            {connectedAccount.account.slice(0, 12)}...{connectedAccount.account.slice(-8)}
                          </div>
                          <div className="text-xs text-tertiary/60 mt-1">
                            Connected: {formatDate(connectedAccount.approvedAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => disconnectAccount(connectedAccount.account, site.origin)}
                          className="flex-shrink-0 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Disconnect this account"
                        >
                          <Icon icon="lucide:x" className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Disconnect All Button */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => disconnectAllAccounts(site.origin)}
                  className="w-full text-xs"
                >
                  <Icon icon="lucide:unlink" className="w-3 h-3 mr-1" />
                  Disconnect All
                </Button>
              </Card>
            ))}
          </div>
        )}
      </ContentContainer>

      <Footer />
    </div>
  );
};
