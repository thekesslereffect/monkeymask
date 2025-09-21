import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

type AvatarType = 'monkey' | 'identicon' | 'geometric' | 'robohash';

const STORAGE_KEY = 'avatarType';

const saveAvatarType = async (avatarType: AvatarType): Promise<void> => {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: avatarType });
  } catch (error) {
    console.error('Failed to save avatar type:', error);
  }
};

const readStoredAvatarType = async (): Promise<AvatarType> => {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    return (result[STORAGE_KEY] as AvatarType) ?? 'monkey';
  } catch (error) {
    console.warn('Failed to read stored avatar type:', error);
    return 'monkey';
  }
};

export const AvatarToggle: React.FC = () => {
  const [avatarType, setAvatarType] = useState<AvatarType>('monkey');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAvatarType = async () => {
      try {
        const saved = await readStoredAvatarType();
        setAvatarType(saved);
      } catch (error) {
        console.error('Failed to load avatar type:', error);
        // Fallback to monkey avatars
        setAvatarType('monkey');
      } finally {
        setLoading(false);
      }
    };

    loadAvatarType();
  }, []);

  const handleSetAvatarType = async (next: AvatarType) => {
    setAvatarType(next);
    await saveAvatarType(next);
    
    // Dispatch custom event to notify other components of avatar type change
    window.dispatchEvent(new CustomEvent('monkeymask:avatar-type-changed', { 
      detail: { avatarType: next } 
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-secondary border border-border w-max">
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-secondary border border-border w-max">
      {/* MonKey Avatar */}
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border flex items-center justify-center ${
          avatarType === 'monkey' ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'
        }`}
        onClick={() => handleSetAvatarType('monkey')}
        aria-label="MonKey avatars"
        aria-pressed={avatarType === 'monkey'}
        title="MonKey"
      >
        <span className="text-xs">🐵</span>
      </button>

      {/* Identicon Avatar */}
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border flex items-center justify-center ${
          avatarType === 'identicon' ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'
        }`}
        onClick={() => handleSetAvatarType('identicon')}
        aria-label="Identicon avatars"
        aria-pressed={avatarType === 'identicon'}
        title="Identicon"
      >
        <Icon icon="lucide:grid-3x3" className="w-4 h-4" />
      </button>

      {/* Geometric Avatar */}
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border flex items-center justify-center ${
          avatarType === 'geometric' ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'
        }`}
        onClick={() => handleSetAvatarType('geometric')}
        aria-label="Geometric avatars"
        aria-pressed={avatarType === 'geometric'}
        title="Geometric"
      >
        <Icon icon="lucide:shapes" className="w-4 h-4" />
      </button>

      {/* RoboHash Avatar */}
      <button
        type="button"
        className={`h-8 w-8 rounded-full border border-border flex items-center justify-center ${
          avatarType === 'robohash' ? 'ring-2 ring-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'
        }`}
        onClick={() => handleSetAvatarType('robohash')}
        aria-label="Robot avatars"
        aria-pressed={avatarType === 'robohash'}
        title="Robot"
      >
        <Icon icon="lucide:bot" className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook to get current avatar type
export const useAvatarType = () => {
  const [avatarType, setAvatarType] = useState<AvatarType>('monkey');

  useEffect(() => {
    const loadAvatarType = async () => {
      const saved = await readStoredAvatarType();
      setAvatarType(saved);
    };

    loadAvatarType();

    // Listen for avatar type changes
    const handleAvatarTypeChange = (event: CustomEvent) => {
      setAvatarType(event.detail.avatarType);
    };

    window.addEventListener('monkeymask:avatar-type-changed', handleAvatarTypeChange as EventListener);

    return () => {
      window.removeEventListener('monkeymask:avatar-type-changed', handleAvatarTypeChange as EventListener);
    };
  }, []);

  return avatarType;
};

export type { AvatarType };
