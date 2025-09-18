import React, { useState } from 'react';
import { Header, Input, Button, Alert, Footer, ContentContainer } from './ui';
import { Icon } from "@iconify/react";

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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Header 
        title="MonKeyMask"
        leftElement={
          <button onClick={onBack} className="text-text-primary hover:text-primary transition-colors">
            <Icon icon="lucide:arrow-left" className="text-2xl" />
          </button>
        }
        showInfoButton={true}
        onInfoClick={() => console.log('Info clicked')}
      />

      {/* Main Content */}
      <ContentContainer>
        {/* Monkey Emoji */}
        <div className="text-center mb-12">
          <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.webp" type="image/webp" />
            <img 
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f648/512.gif" 
              alt="🙈" 
              width="128" 
              height="128"
              className="mx-auto"
            />
          </picture>
        </div>

        {/* Form */}
        <form onSubmit={handleImport} className="w-full space-y-4">
          <Input
            label="Seed Phrase"
            hintText="What's this?"
            hintTooltip="Your seed phrase is a series of 12-24 words that can be used to recover your wallet. Keep it safe and never share it with anyone."
            value={seed}
            type="password"
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Enter your seed phrase..."
            required
            size="lg"
            variant="secondary"
            className="font-mono text-sm"
          />

          <Input
            label="Password"
            hintText="What's this?"
            hintTooltip="This password will be used to encrypt your private keys locally."
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            minLength={8}
            size="lg"
            variant="secondary"
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
            size="lg"
            variant="secondary"
          />

          {error && (
            <Alert variant="destructive">
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? 'Importing Wallet...' : 'Import Wallet'}
          </Button>
        </form>
      </ContentContainer>
      <Footer />
    </div>
  );
};
