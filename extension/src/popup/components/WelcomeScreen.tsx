import React from 'react';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWallet,
  onImportWallet
}) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-banano-400 to-banano-600">
      <div className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐒</div>
          <h1 className="text-3xl font-bold text-white mb-2">MonkeyMask</h1>
          <p className="text-banano-100 text-sm">
            Your gateway to the Banano ecosystem
          </p>
        </div>
        
        <div className="w-full max-w-xs space-y-4">
          <button
            onClick={onCreateWallet}
            className="w-full bg-white text-banano-600 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Create New Wallet
          </button>
          
          <button
            onClick={onImportWallet}
            className="w-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-banano-600 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Import Existing Wallet
          </button>
        </div>
      </div>
      
      <div className="p-4 text-center">
        <p className="text-banano-100 text-xs">
          Secure • Decentralized • Fast
        </p>
      </div>
    </div>
  );
};
