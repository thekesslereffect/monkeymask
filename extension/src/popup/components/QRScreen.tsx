import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'qrcode';
import { Header, Card, Button, ContentContainer, Footer } from './ui';
import { PageName } from './ui/PageName';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { truncateMiddle } from '../../utils/format';

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
  const { copy, copied } = useCopyToClipboard();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
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
                  {truncateMiddle(account.address, 8, 8)}
                </div>
              {/* Copy Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={() => copy(account.address)}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon icon="lucide:copy" className="text-2xl" />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </div>
              </Button>
      </ContentContainer>
      <Footer />
    </div>
  );
};
