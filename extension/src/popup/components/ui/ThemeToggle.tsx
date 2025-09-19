import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Icon } from '@iconify/react';

type Theme = 'dark' | 'light' | 'banano';

const STORAGE_KEY = 'monkeymask.theme';

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

const readStoredTheme = (): Theme => {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return saved ?? 'dark';
};

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const saved = readStoredTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const handleSetTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

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


