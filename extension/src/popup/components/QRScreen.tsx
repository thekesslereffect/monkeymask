import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'qrcode';
import { Header, Card, Button, ContentContainer, Footer } from './ui';
import { useNavigation } from '../hooks/useRouter';
import { PageName } from './ui/PageName';

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
}

interface QRScreenProps {
  account: Account;
}

export const QRScreen: React.FC<QRScreenProps> = ({ account }) => {
  const navigation = useNavigation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQRCode();
  }, [account]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const qrUrl = await QRCode.toDataURL(account.address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#FFFFFF',
          light: '#00000000'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account.address);
      setCopySuccess(true);
      setCopyError('');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      setCopyError('Failed to copy address to clipboard');
      setTimeout(() => setCopyError(''), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <Header active={true}/>
      
      <ContentContainer>
        <PageName name="Receive" back />
              {/* QR Code Display */}
                <Card className="justify-center items-center aspect-square">
                  <div className="flex flex-col items-center justify-center w-full">
                  {qrCodeUrl && !loading && (
                    <img 
                      src={qrCodeUrl} 
                      alt="Address QR Code" 
                      className="w-full h-full"
                    />
                  )}
                  </div>
                </Card>
                <div className="text-center text-lg font-mono text-foreground break-all">
                  {formatAddress(account.address)}
                </div>
              {/* Copy Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={copyAddress}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="lucide:copy" className="text-2xl" />
                  {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                </div>
              </Button>
      </ContentContainer>
      <Footer />
    </div>
  );
};
