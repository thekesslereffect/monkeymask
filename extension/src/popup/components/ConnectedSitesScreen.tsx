import React, { useState, useEffect } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Button, EmptyState } from './ui';
import { Icon } from '@iconify/react';
import { truncateMiddle } from '../../utils/format';

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

/** An active auto-approve allowance for an origin (values already in BAN). */
interface SpendAllowance {
  origin: string;
  address: string;
  limit: string;
  spent: string;
  remaining: string;
  expiresAt: number;
}

export const ConnectedSitesScreen: React.FC = () => {
  const [connectedSites, setConnectedSites] = useState<ConnectedSite[]>([]);
  const [allowances, setAllowances] = useState<Record<string, SpendAllowance>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectedSites();
  }, []);

  const loadAllowances = async (): Promise<Record<string, SpendAllowance>> => {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GET_SPENDING_SESSIONS' });
      const sessions: SpendAllowance[] = res?.data?.sessions ?? [];
      const map: Record<string, SpendAllowance> = {};
      for (const s of sessions) map[s.origin] = s;
      setAllowances(map);
      return map;
    } catch (error) {
      console.error('Failed to load spending allowances:', error);
      setAllowances({});
      return {};
    }
  };

  const loadConnectedSites = async () => {
    try {
      const [response] = await Promise.all([
        chrome.storage.local.get(['permissions']),
        loadAllowances(),
      ]);
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

  const revokeAllowance = async (origin: string) => {
    try {
      await chrome.runtime.sendMessage({ type: 'REVOKE_SPENDING_SESSION', origin });
      await loadAllowances();
    } catch (error) {
      console.error('Failed to revoke spending allowance:', error);
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

  const formatExpiry = (expiresAt: number): string => {
    const ms = expiresAt - Date.now();
    if (ms <= 0) return 'expired';
    const minutes = Math.round(ms / 60000);
    if (minutes < 60) return `in ${minutes} min`;
    const hours = Math.round(minutes / 60);
    return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  };

  const formatDomain = (origin: string) => {
    return origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  };

  const AllowancePanel: React.FC<{ allowance: SpendAllowance }> = ({ allowance }) => (
    <div className="pt-2 border-t border-tertiary/20 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon icon="lucide:zap" className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs text-tertiary/70">Auto-approve allowance</span>
      </div>
      <div className="bg-amber-500/10 rounded-lg p-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-tertiary/70">Remaining</span>
          <span className="font-mono text-primary">
            {allowance.remaining} / {allowance.limit} BAN
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-tertiary/70">Spent</span>
          <span className="font-mono text-tertiary">{allowance.spent} BAN</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-tertiary/70">Expires</span>
          <span className="text-tertiary">{formatExpiry(allowance.expiresAt)}</span>
        </div>
      </div>
      <button
        onClick={() => revokeAllowance(allowance.origin)}
        className="mt-2 w-full text-xs font-semibold text-red-600 hover:text-red-700 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 transition-colors"
      >
        <Icon icon="lucide:shield-off" className="w-3.5 h-3.5" />
        Revoke allowance
      </button>
    </div>
  );

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
        
        {connectedSites.length === 0 && Object.keys(allowances).length === 0 ? (
          <EmptyState
            icon="lucide:link"
            title="No connected sites"
            description="Sites you connect to will appear here"
          />
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
                            {truncateMiddle(connectedAccount.account, 12, 8)}
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

                {/* Auto-approve allowance (if this site has an active one) */}
                {allowances[site.origin] && (
                  <AllowancePanel allowance={allowances[site.origin]} />
                )}
                
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

            {/* Allowances whose origin is no longer a connected site (rare —
                disconnect normally clears these). Surfaced so the user can
                always revoke, regardless of the granting dApp. */}
            {Object.values(allowances)
              .filter((a) => !connectedSites.some((s) => s.origin === a.origin))
              .map((allowance) => (
                <Card key={allowance.origin} label={formatDomain(allowance.origin)} className="w-full">
                  <div className="text-xs text-tertiary mb-1">{allowance.origin}</div>
                  <div className="text-xs text-tertiary/70 mb-1">No active connection</div>
                  <AllowancePanel allowance={allowance} />
                </Card>
              ))}
          </div>
        )}
      </ContentContainer>

      <Footer />
    </div>
  );
};
