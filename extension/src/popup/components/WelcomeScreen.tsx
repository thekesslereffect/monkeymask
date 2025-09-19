import React from 'react';
import { Header, Button, Footer, ContentContainer } from './ui';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWallet,
  onImportWallet
}) => {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <ContentContainer>
        {/* Monkey Emoji */}
        <div className="flex flex-col items-center h-min min-h-48 justify-center text-center">
          <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f412/512.webp" type="image/webp" />
            <img 
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f412/512.gif" 
              alt="🐒" 
              width="128" 
              height="128"
              className="mx-auto"
            />
          </picture>
        </div>
        
        {/* Buttons */}
        <div className="w-full space-y-4">
          <Button
            onClick={onCreateWallet}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Create Wallet
          </Button>
          
          <Button
            onClick={onImportWallet}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Import Seed
          </Button>
        </div>
      </ContentContainer>
      <Footer active={false} />
    </div>
  );
};
