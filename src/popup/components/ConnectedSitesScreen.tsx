import React, { useState, useEffect } from 'react';

interface ConnectedSite {
  origin: string;
  approvedAccounts: string[];
  approvedAt: number;
  lastUsed: number;
}

interface ConnectedSitesScreenProps {
  onBack: () => void;
}

export const ConnectedSitesScreen: React.FC<ConnectedSitesScreenProps> = ({ onBack }) => {
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-xl p-6 text-white">
          <div className="flex items-center mb-4">
            <button
              onClick={onBack}
              className="text-white hover:text-yellow-200 mr-4"
            >
              ← Back
            </button>
            <div className="text-2xl mr-3">🔗</div>
            <h1 className="text-xl font-bold">Connected Sites</h1>
          </div>
          <p className="text-yellow-100">
            Manage sites that can access your MonkeyMask
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {connectedSites.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🌐</div>
              <div className="text-gray-600 mb-2">No connected sites</div>
              <div className="text-sm text-gray-500">
                Sites you connect to will appear here
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {connectedSites.map((site) => (
                <div
                  key={site.origin}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {formatDomain(site.origin).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {formatDomain(site.origin)}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          {site.origin}
                        </div>
                        <div className="text-xs text-gray-400">
                          Connected: {formatDate(site.approvedAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Last used: {formatDate(site.lastUsed)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectSite(site.origin)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                  
                  {/* Connected Accounts */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">
                      Connected accounts ({site.approvedAccounts.length}):
                    </div>
                    <div className="space-y-1">
                      {site.approvedAccounts.map((account) => (
                        <div
                          key={account}
                          className="text-xs font-mono text-gray-500 bg-gray-50 rounded px-2 py-1"
                        >
                          {account.slice(0, 12)}...{account.slice(-8)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
