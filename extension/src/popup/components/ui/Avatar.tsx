import React from 'react';

interface AvatarProps {
  address: string;
  size?: number;
  className?: string;
}

// Deterministic colored-circle fallback used only if the MonKey API fails.
const generateFallback = (address: string, size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const hash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const colors = ['#FBDD11', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD'];
  ctx.fillStyle = colors[Math.abs(hash) % colors.length];
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL();
};

export const Avatar: React.FC<AvatarProps> = ({ address, size = 32, className = '' }) => {
  // MonKey avatars from monkey.banano.cc (cryptomonkeys).
  const src = `https://monkey.banano.cc/api/v1/monkey/${address}?format=png&size=${Math.max(
    100,
    Math.min(1000, size),
  )}&background=true`;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = generateFallback(address, size);
  };

  return (
    <img
      src={src}
      alt={`Avatar for ${address}`}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
