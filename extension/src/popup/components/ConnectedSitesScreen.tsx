import React, { useState, useEffect } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button } from './ui';
import { Icon } from '@iconify/react';

interface ConnectedSite {
  origin: string;
  approvedAccounts: string[];
  approvedAt: number;
  lastUsed: number;
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
      
      const sites = Object.values(permissions) as ConnectedSite[];
      sites.sort((a, b) => b.lastUsed - a.lastUsed); // Sort by most recently used
      
      setConnectedSites(sites);
    } catch (error) {
      console.error('Failed to load connected sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectSite = async (origin: string) => {
    try {
      // Send disconnect request to background
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
                        Connected: {formatDate(site.approvedAt)}
                      </div>
                      <div className="text-xs text-tertiary/70">
                        Last used: {formatDate(site.lastUsed)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connected Accounts */}
                <div className="pt-2 border-t border-tertiary/20 mb-2">
                  <div className="text-xs text-tertiary/70 mb-2">
                    Connected accounts ({site.approvedAccounts.length}):
                  </div>
                  <div className="space-y-1">
                    {site.approvedAccounts.map((account) => (
                      <div
                        key={account}
                        className="text-xs font-mono text-tertiary bg-tertiary/10 rounded px-2 py-1"
                      >
                        {account.slice(0, 12)}...{account.slice(-8)}
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => disconnectSite(site.origin)}
                >
                  Disconnect
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
