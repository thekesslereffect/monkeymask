import React, { useState, useEffect } from 'react';
import { ContentContainer } from './ui';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [autoLockTimeout, setAutoLockTimeout] = useState<number>(15); // minutes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auto-lock timeout options (in minutes) - matching Phantom's options
  const timeoutOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 60, label: '1 hour' },
  ];

  useEffect(() => {
    loadCurrentTimeout();
  }, []);

  const loadCurrentTimeout = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTO_LOCK_TIMEOUT' });
      if (response.success) {
        setAutoLockTimeout(response.data.minutes);
      }
    } catch (error) {
      console.error('Failed to load auto-lock timeout:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTimeout = async (minutes: number) => {
    setSaving(true);
    try {
      const timeoutMs = minutes * 60 * 1000;
      const response = await chrome.runtime.sendMessage({ 
        type: 'SET_AUTO_LOCK_TIMEOUT', 
        timeout: timeoutMs 
      });
      
      if (response.success) {
        setAutoLockTimeout(minutes);
        console.log('Auto-lock timeout saved:', minutes, 'minutes');
      } else {
        console.error('Failed to save auto-lock timeout:', response.error);
      }
    } catch (error) {
      console.error('Failed to save auto-lock timeout:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-500 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-6">
          <div className="text-center">Loading settings...</div>
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
            <div className="text-2xl mr-3">⚙️</div>
            <h1 className="text-xl font-bold">Settings</h1>
          </div>
          <p className="text-yellow-100">
            Configure your MonkeyMask preferences
          </p>
        </div>

        {/* Content */}
        <ContentContainer className="justify-start p-6">
          {/* Auto-Lock Settings */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-lg mr-2">🔒</span>
              Auto-Lock Timer
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose how long MonkeyMask stays unlocked when you're not using it. 
              For security, your wallet will automatically lock after this period of inactivity.
            </p>
            
            <div className="space-y-3">
              {timeoutOptions.map((option) => (
                <div
                  key={option.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    autoLockTimeout === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => saveTimeout(option.value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={autoLockTimeout === option.value}
                        onChange={() => saveTimeout(option.value)}
                        className="mr-3 text-orange-500 focus:ring-orange-500"
                        disabled={saving}
                      />
                      <span className="font-medium text-gray-900">
                        {option.label}
                      </span>
                    </div>
                    {saving && autoLockTimeout === option.value && (
                      <div className="text-orange-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">ℹ️</div>
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">Security Tip</div>
                <div>
                  Shorter timeouts provide better security but require more frequent unlocking. 
                  Choose a balance that works for your usage pattern.
                </div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500">
              Current setting: <span className="font-semibold text-gray-700">
                {timeoutOptions.find(opt => opt.value === autoLockTimeout)?.label}
              </span>
            </div>
          </div>
        </ContentContainer>
      </div>
    </div>
  );
};
