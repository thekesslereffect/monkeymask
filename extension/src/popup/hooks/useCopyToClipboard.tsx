import { useCallback, useState } from 'react';

/**
 * Clipboard helper that tracks a transient "copied" flag so UIs can show
 * feedback without each screen re-implementing the timeout logic.
 */
export const useCopyToClipboard = (resetAfterMs = 2000) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), resetAfterMs);
        return true;
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        setError('Failed to copy to clipboard');
        setTimeout(() => setError(null), resetAfterMs);
        return false;
      }
    },
    [resetAfterMs],
  );

  return { copy, copied, error };
};
