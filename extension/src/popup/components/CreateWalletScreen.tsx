import React, { useState } from 'react';

interface CreateWalletScreenProps {
  onWalletCreated: () => void;
  onBack: () => void;
}

export const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({
  onWalletCreated,
  onBack
}) => {
  const [step, setStep] = useState<'password' | 'seed' | 'confirm'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seed, setSeed] = useState('');
  const [seedConfirm, setSeedConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seedCopied, setSeedCopied] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_WALLET',
        password
      });

      if (response.success) {
        setSeed(response.data.mnemonic);
        setStep('seed');
      } else {
        setError(response.error || 'Failed to create wallet');
      }
    } catch (error) {
      setError('Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedBackup = () => {
    setStep('confirm');
  };

  const copySeedToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(seed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy seed:', error);
    }
  };

  const handleSeedConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (seedConfirm.trim() === seed.trim()) {
      onWalletCreated();
    } else {
      setError('Seed phrase does not match');
    }
  };

  if (step === 'password') {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-banano-500 p-4 text-white">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 text-white hover:text-banano-100">
              ←
            </button>
            <h2 className="text-lg font-semibold">Create New Wallet</h2>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Password</h3>
            <p className="text-gray-600 text-sm">
              Choose a strong password to protect your wallet. This password will be used to encrypt your private keys locally.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Creating Wallet...' : 'Create Wallet'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'seed') {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-banano-500 p-4 text-white">
          <h2 className="text-lg font-semibold">Backup Your Seed Phrase</h2>
        </div>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <span className="text-red-600 text-lg mr-2">⚠️</span>
                <span className="font-semibold text-red-800">Important!</span>
              </div>
              <p className="text-red-700 text-sm">
                Write down your seed phrase and store it safely. This is the only way to recover your wallet if you lose access.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-600 mb-2 font-medium">Your Seed Phrase:</p>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {seed}
              </div>
              <button
                onClick={copySeedToClipboard}
                className="mt-2 text-sm text-banano-600 hover:text-banano-700"
              >
                {seedCopied ? '✅ Copied!' : '📋 Copy to Clipboard'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span>•</span>
              <span>Store this seed phrase in a safe place</span>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span>•</span>
              <span>Never share it with anyone</span>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span>•</span>
              <span>MonkeyMask will never ask for your seed phrase</span>
            </div>
          </div>

          <button
            onClick={handleSeedBackup}
            className="btn-primary w-full mt-6"
          >
            I've Saved My Seed Phrase
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-banano-500 p-4 text-white">
          <h2 className="text-lg font-semibold">Confirm Seed Phrase</h2>
        </div>

        <div className="flex-1 p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Please enter your seed phrase to confirm you've saved it correctly.
            </p>
          </div>

          <form onSubmit={handleSeedConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seed Phrase
              </label>
              <textarea
                value={seedConfirm}
                onChange={(e) => setSeedConfirm(e.target.value)}
                className="input h-24 resize-none font-mono text-sm"
                placeholder="Enter your seed phrase..."
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('seed')}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                Confirm & Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
