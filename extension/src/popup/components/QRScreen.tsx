import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import QRCode from 'qrcode';
import { Header, Button, ContentContainer, Footer } from './ui';
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
          dark: '#000000',
          light: '#FFFFFF'
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
              {/* QR Code Display — white panel with dark modules (promo look) */}
                <div className="flex flex-1 flex-col items-center justify-center gap-5">
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    {qrCodeUrl && !loading ? (
                      <img
                        src={qrCodeUrl}
                        alt="Address QR Code"
                        className="size-52"
                      />
                    ) : (
                      <div className="size-52 animate-pulse rounded-xl bg-black/10" />
                    )}
                  </div>
                  <div className="rounded-xl bg-card px-4 py-2 font-mono text-xs font-semibold text-tertiary">
                    {truncateMiddle(account.address, 12, 6)}
                  </div>
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
