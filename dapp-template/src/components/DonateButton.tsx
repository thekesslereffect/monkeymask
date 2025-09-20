import { useMonkeyMask } from '@/providers';
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Icon } from '@iconify/react';

export function DonateButton() {
  const { sendTransaction } = useMonkeyMask();
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const DONATION_AMOUNT = '100';

  // Reset success/error states after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSend = async () => {
    // Reset states immediately when user clicks
    setError(null);
    setSuccess(false);
    setSending(true);
    
    try {
      console.log('Starting transaction...');
      const result = await sendTransaction('cosmic.ban', DONATION_AMOUNT);
      console.log('Transaction successful:', result);
      
      // Only set success if we got a transaction hash
      if (result) {
        setSuccess(true);
      } else {
        throw new Error('Transaction failed - no hash returned');
      }
    } catch (err) {
      console.log('Transaction failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setSending(false);
    }
  };
  const getButtonContent = () => {
    if (sending) {
      return (
        <>
          <Icon icon="mdi:loading" className="size-4 animate-spin text-rose-500" />
          Sending...
        </>
      );
    }
    
    if (success) {
      return (
        <>
          <Icon icon="mdi:heart" className="size-4 text-rose-500" />
          Thank you!
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <Icon icon="mdi:heart" className="size-4 text-rose-500" />
          Maybe next time...
        </>
      );
    }
    
    return (
      <>
        <Icon icon="mdi:heart" className="size-4 text-rose-500" />
        Donate {DONATION_AMOUNT} BAN
      </>
    );
  };

  return (
    <Button 
      onClick={handleSend} 
      disabled={sending} 
      variant="secondary" 
      size="sm" 
      className="fixed bottom-4 right-4 gap-2" 
      title={error ? `Error: ${error}` : `Donate ${DONATION_AMOUNT} BAN to cosmic.ban`}
    >
      {getButtonContent()}
    </Button>
  );
}

