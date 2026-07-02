import React, { useState, useEffect } from 'react';
import { Header, ContentContainer, Footer, PageName, Card, Alert } from './ui';
import { Icon } from '@iconify/react';

export const SettingsScreen: React.FC = () => {
  const [autoLockTimeout, setAutoLockTimeout] = useState<number>(15); // minutes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(false);
  const [savingAutoConfirm, setSavingAutoConfirm] = useState(false);

  // Auto-lock timeout options (in minutes) - matching Phantom's options
  const timeoutOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 60, label: '1 hour' },
  ];

  useEffect(() => {
    loadCurrentTimeout();
    loadAutoConfirm();
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

  const loadAutoConfirm = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTO_CONFIRM_ENABLED' });
      if (response.success) setAutoConfirmEnabled(Boolean(response.data.enabled));
    } catch (error) {
      console.error('Failed to load auto-confirmation setting:', error);
    }
  };

  const toggleAutoConfirm = async (enabled: boolean) => {
    setSavingAutoConfirm(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_AUTO_CONFIRM_ENABLED',
        enabled,
      });
      if (response.success) setAutoConfirmEnabled(enabled);
    } catch (error) {
      console.error('Failed to update auto-confirmation setting:', error);
    } finally {
      setSavingAutoConfirm(false);
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
      <div className="h-full flex flex-col">
        <Header active />
        <ContentContainer>
          <PageName name="Settings" back={true} />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-tertiary">Loading settings...</div>
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
        <PageName name="Settings" back={true} />
        
        <div className="w-full space-y-4">
          {/* Auto-Lock Settings Card */}
          <Card label="Auto-Lock Timer" className="w-full">
            <div className="mb-4">
              <div className="text-xs text-tertiary/70 mb-4">
                Choose how long MonkeyMask stays unlocked when you're not using it. 
                For security, your wallet will automatically lock after this period of inactivity.
              </div>
              
              <div className="space-y-3">
                {timeoutOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      autoLockTimeout === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-tertiary/20 hover:border-tertiary/40'
                    }`}
                    onClick={() => saveTimeout(option.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={autoLockTimeout === option.value}
                          onChange={() => saveTimeout(option.value)}
                          className="!text-destructive !focus:ring-destructive"
                          disabled={saving}
                        />
                        <span className="text-sm text-tertiary">
                          {option.label}
                        </span>
                      </div>
                      {saving && autoLockTimeout === option.value && (
                        <Icon icon="lucide:loader-2" className="text-primary animate-spin text-lg" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Status */}
            <div className="pt-3 border-t border-tertiary/20">
              <div className="text-xs text-tertiary/70">
                Current setting: <span className="font-semibold text-tertiary">
                  {timeoutOptions.find(opt => opt.value === autoLockTimeout)?.label}
                </span>
              </div>
            </div>
          </Card>

          {/* Security Info Alert */}
          <Alert variant="default" className="w-full">
            <Icon icon="lucide:info" className="text-lg" />
            <div>
              <div className="font-semibold mb-1">Security Tip</div>
              <div className="text-sm">
                Shorter timeouts provide better security but require more frequent unlocking. 
                Choose a balance that works for your usage pattern.
              </div>
            </div>
          </Alert>

          {/* Advanced: auto-confirmation (spending allowances) */}
          <Card label="Advanced" className="w-full">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-tertiary font-semibold">Auto-confirmation</div>
                <div className="text-xs text-tertiary/70 mt-1 leading-relaxed">
                  Let sites request a spending allowance so small payments send
                  automatically, without a confirmation popup, up to a limit you approve.
                  Off by default. When off, every payment always asks first.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoConfirmEnabled}
                disabled={savingAutoConfirm}
                onClick={() => toggleAutoConfirm(!autoConfirmEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                  autoConfirmEnabled ? 'bg-primary' : 'bg-tertiary/40'
                } ${savingAutoConfirm ? 'opacity-60' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    autoConfirmEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {autoConfirmEnabled && (
              <div className="mt-3 pt-3 border-t border-tertiary/20 text-xs text-amber-600 flex items-start gap-2">
                <Icon icon="lucide:shield-alert" className="text-base shrink-0 mt-0.5" />
                <span>
                  Sites you approve can spend up to their allowance without prompting. Turning this
                  off immediately revokes all active allowances. Manage per-site limits in Connected
                  Sites.
                </span>
              </div>
            )}
          </Card>
        </div>

        
      </ContentContainer>

      <Footer />
    </div>
  );
};
