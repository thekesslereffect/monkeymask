import React, { useState } from 'react';
import { Header, Input, Button, Alert, Footer, ContentContainer, Card } from './ui';
import { Icon } from '@iconify/react';

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
          <form onSubmit={handlePasswordSubmit} className="w-full space-y-4">
            <div>
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
            </div>
            <div>

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
            </div>

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
              {loading ? 'Creating Wallet...' : 'Confirm'}
            </Button>
          </form>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  if (step === 'seed') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <Header 
          title="MonKeyMask"
          leftElement={
            <button onClick={() => setStep('password')} className="text-text-primary hover:text-primary transition-colors">
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

          {/* Seed Phrase Display */}
          <div className="w-full mb-6">            
            <Card label="Mnemonic" hintText={`What's this?`} hintTooltip={'This is your seed phrase. It is used to recover your wallet if you forget your password.'}>
              <div className="grid grid-cols-4 gap-2 font-mono text-sm text-secondary-foreground">
                {seed.split(' ').map((word, index) => (
                  <span key={index}>
                    {word}
                  </span>
                ))}
              </div>
            
            </Card>
          </div>

          <div className="w-full space-y-3">
            <Button
              onClick={copySeedToClipboard}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              <div className="flex items-center justify-center">
                <Icon icon="lucide:copy" className="text-2xl" />
                {seedCopied ? 'Copied!' : 'Copy to Clipboard'}
              </div>
            </Button>
            
            <Button
              onClick={handleSeedBackup}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Next
            </Button>
          </div>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <Header 
          title="MonKeyMask"
          leftElement={
            <button onClick={() => setStep('seed')} className="text-text-primary hover:text-primary transition-colors">
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
          <form onSubmit={handleSeedConfirm} className="w-full space-y-4">
            <Input
              label="Seed Phrase"
              value={seedConfirm}
              onChange={(e) => setSeedConfirm(e.target.value)}
              placeholder="Enter your seed phrase..."
              required
              size="lg"
              variant="secondary"
              className="font-mono text-sm"
            />

            {error && (
              <Alert variant="destructive">
                {error}
              </Alert>
            )}


            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Confirm & Create
            </Button>
          </form>
        </ContentContainer>
        <Footer />
      </div>
    );
  }

  return null;
};
