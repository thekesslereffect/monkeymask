import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Icon } from '@iconify/react';

type Theme = 'dark' | 'light' | 'banano';

const STORAGE_KEY = 'theme';

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

const readStoredTheme = async (): Promise<Theme> => {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return (result[STORAGE_KEY] as Theme) ?? 'dark';
  } catch (error) {
    console.warn('Failed to read stored theme:', error);
    return 'dark';
  }
};

const saveTheme = async (theme: Theme): Promise<void> => {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: theme });
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
};

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await readStoredTheme();
        setTheme(saved);
        applyTheme(saved);
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Fallback to dark theme
        setTheme('dark');
        applyTheme('dark');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  const handleSetTheme = async (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    await saveTheme(next);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-secondary border border-border w-max">
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-secondary border border-border w-max">
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border ${theme === 'dark' ? 'ring-2 ring-primary' : ''}`}
        style={{ backgroundColor: '#0b0b0b' }}
        onClick={() => handleSetTheme('dark')}
        aria-label="Dark theme"
        aria-pressed={theme === 'dark'}
        title="Dark"
      />
      <button
        type="button"
        className={`h-8 w-8 rounded-full border ${theme === 'light' ? 'ring-2 ring-primary' : 'border-border'}`}
        style={{ backgroundColor: '#ffffff' }}
        onClick={() => handleSetTheme('light')}
        aria-label="Light theme"
        aria-pressed={theme === 'light'}
        title="Light"
      />
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border ${theme === 'banano' ? 'ring-2 ring-primary' : ''} bg-gradient-to-br from-green-600 to-yellow-400`}
        onClick={() => handleSetTheme('banano')}
        aria-label="Banano theme"
        aria-pressed={theme === 'banano'}
        title="Banano"
      />
    </div>
  );
};


