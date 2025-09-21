import React from 'react';
import { AvatarType, useAvatarType } from './AvatarToggle';

interface AvatarProps {
  address: string;
  size?: number;
  className?: string;
  avatarType?: AvatarType; // Optional override
}

// Generate a simple identicon-style avatar
const generateIdenticon = (address: string, size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Use address to generate a deterministic pattern
  const hash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  const bgColor = colors[Math.abs(hash) % colors.length];
  const gridSize = 5;
  const cellSize = size / gridSize;
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Generate pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const cellHash = hash + i * gridSize + j;
      if (cellHash % 3 === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }
  
  return canvas.toDataURL();
};

// Generate a geometric pattern avatar
const generateGeometric = (address: string, size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  const hash = address.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const bgColor = colors[Math.abs(hash) % colors.length];
  const shapeColor = colors[Math.abs(hash + 1) % colors.length];
  
  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);
  
  // Draw geometric shapes
  ctx.fillStyle = shapeColor;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 4;
  
  // Draw circle or triangle based on hash
  if (hash % 2 === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX - radius, centerY + radius);
    ctx.lineTo(centerX + radius, centerY + radius);
    ctx.closePath();
    ctx.fill();
  }
  
  return canvas.toDataURL();
};

export const Avatar: React.FC<AvatarProps> = ({ 
  address, 
  size = 32, 
  className = '',
  avatarType: overrideAvatarType 
}) => {
  const contextAvatarType = useAvatarType();
  const avatarType = overrideAvatarType || contextAvatarType;

  const getAvatarSrc = (): string => {
    switch (avatarType) {
      case 'monkey':
        // Use MonKey API from monkey.banano.cc
        return `https://monkey.banano.cc/api/v1/monkey/${address}?format=png&size=${Math.max(100, Math.min(1000, size))}&background=true`;
      
      case 'identicon':
        return generateIdenticon(address, size);
      
      case 'geometric':
        return generateGeometric(address, size);
      
      case 'robohash':
        // Use RoboHash API
        return `https://robohash.org/${address}?size=${size}x${size}&set=set1`;
      
      default:
        return generateIdenticon(address, size);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback to identicon if external service fails
    const img = e.target as HTMLImageElement;
    img.src = generateIdenticon(address, size);
  };

  return (
    <img
      src={getAvatarSrc()}
      alt={`Avatar for ${address}`}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      onError={handleImageError}
      loading="lazy"
    />
  );
};
