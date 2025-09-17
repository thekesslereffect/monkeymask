import React, { useState } from 'react';

interface ImportWalletScreenProps {
  onWalletImported: () => void;
  onBack: () => void;
}

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({
  onWalletImported,
  onBack
}) => {
  const [seed, setSeed] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!seed.trim()) {
      setError('Please enter your seed phrase');
      return;
    }

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_WALLET',
        password,
        seed: seed.trim()
      });

      if (response.success) {
        onWalletImported();
      } else {
        setError(response.error || 'Failed to import wallet');
      }
    } catch (error) {
      setError('Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-banano-500 p-4 text-white">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 text-white hover:text-banano-100">
            ←
          </button>
          <h2 className="text-lg font-semibold">Import Existing Wallet</h2>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Restore Wallet</h3>
          <p className="text-gray-600 text-sm">
            Enter your seed phrase and choose a password to restore your wallet.
          </p>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seed Phrase or Hex Seed
            </label>
            <textarea
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="input h-24 resize-none font-mono text-sm"
              placeholder="Enter your 24-word seed phrase or 64-character hex seed..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter either: BIP39 mnemonic (24 words separated by spaces) or Banano hex seed (64 hex characters).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used to encrypt your wallet locally.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Confirm password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 text-lg mr-2">ℹ️</span>
              <span className="font-semibold text-blue-800">Security Note</span>
            </div>
            <p className="text-blue-700 text-sm">
              Your seed phrase will be encrypted and stored locally in your browser. MonkeyMask never sends your private keys to any server.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Importing Wallet...' : 'Import Wallet'}
          </button>
        </form>
      </div>
    </div>
  );
};
