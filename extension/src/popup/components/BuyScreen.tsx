import React, { useMemo, useState } from 'react';
import { Header, ContentContainer, Footer, Button, Input } from './ui';
import { PageName } from './ui/PageName';
import { useAccounts } from '../hooks/useAccounts';

export const BuyScreen: React.FC = () => {
  const { banPrice, priceLoading } = useAccounts();
  const [isBanPrimary, setIsBanPrimary] = useState(true);
  const [banAmount, setBanAmount] = useState<string>('69.00');
  const [usdAmount, setUsdAmount] = useState<string>('');

  const rateText = useMemo(() => {
    if (priceLoading) return 'Loading…';
    if (!banPrice) return 'N/A';
    return `1BAN = $${banPrice}`;
  }, [banPrice, priceLoading]);

  const syncFromBan = (value: string) => {
    setBanAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && banPrice) setUsdAmount((num * banPrice).toFixed(2));
    else setUsdAmount('');
  };

  const syncFromUsd = (value: string) => {
    setUsdAmount(value);
    const num = parseFloat(value);
    if (!isNaN(num) && banPrice) setBanAmount((num / banPrice).toFixed(2));
    else setBanAmount('');
  };

  const handleBuy = () => {
    // Placeholder: open a provider in new tab
    window.open('https://banano.trade', '_blank');
  };

  return (
    <div className="h-full flex flex-col font-semibold">
      <Header active={true} />
      <ContentContainer>
        <PageName name="Buy" back />

        <div className="flex flex-col items-center gap-2 h-full min-h-36 justify-center">
          <div className="text-5xl text-primary">1BAN = 1BAN</div>
          <div className="text-xl text-tertiary">{rateText}</div>
        </div>

        <div className="relative w-full mb-2">
            {isBanPrimary ? (
              <Input
                label="Amount"
                variant="secondary"
                size="lg"
                type="number"
                value={banAmount}
                onChange={(e) => syncFromBan(e.target.value)}
                placeholder="69.00"
                className="text-center no-spinner pl-20 pr-20"
              />
            ) : (
              <Input
                label="Amount"
                variant="secondary"
                size="lg"
                type="number"
                value={usdAmount}
                onChange={(e) => syncFromUsd(e.target.value)}
                placeholder="69.00"
                className="text-center no-spinner pl-20 pr-20"
              />
            )}
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex flex-col justify-center items-center bg-transparent"
              onClick={() => {
                if (isBanPrimary) {
                  syncFromBan(banAmount);
                  setIsBanPrimary(false);
                } else {
                  syncFromUsd(usdAmount);
                  setIsBanPrimary(true);
                }
              }}
              aria-pressed={!isBanPrimary}
            >
              <div className="flex items-center gap-1 h-full justify-center text-md">
                <span className={isBanPrimary ? 'text-primary' : 'text-tertiary'}>BAN</span><span className={isBanPrimary ? 'text-tertiary' : 'text-primary'}>USD</span>
              </div>
            </button>
        </div>

        <Button variant="primary" size="lg" onClick={handleBuy}>
          Buy
        </Button>
      </ContentContainer>
      <Footer />
    </div>
  );
};


