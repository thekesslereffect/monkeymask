import React, { useState } from 'react';

interface UnlockScreenProps {
  onWalletUnlocked: () => void;
}

export const UnlockScreen: React.FC<UnlockScreenProps> = ({ onWalletUnlocked }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        password
      });

      if (response.success) {
        onWalletUnlocked();
      } else {
        setError(response.error || 'Invalid password');
      }
    } catch (error) {
      setError('Failed to unlock wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-banano-400 to-banano-600">
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-banano-100 text-sm">
            Enter your password to unlock MonkeyMask
          </p>
        </div>
        
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-200 text-sm bg-red-500/20 p-3 rounded-lg border border-red-300/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-banano-600 hover:bg-gray-50 disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
      
      <div className="p-4 text-center">
        <p className="text-banano-100 text-xs">
          Your keys are encrypted and stored locally
        </p>
      </div>
    </div>
  );
};
