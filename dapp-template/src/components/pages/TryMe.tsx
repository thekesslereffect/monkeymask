'use client';

import React from 'react';
import { useMonkeyMask } from '@/providers';

interface TryMeProps {
  className?: string;
}

export function TryMe({ className = '' }: TryMeProps) {
  const { isConnected, publicKey } = useMonkeyMask();

  const displayKey = React.useMemo(() => {
    if (isConnected && publicKey) {
      return `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`;
    }
    return 'ban_14...xb5pym';
  }, [isConnected, publicKey]);

  return (
    <div className={className} aria-hidden>
      <div className="relative text-tertiary rotate-10">
        <svg
          viewBox="0 0 76.44 79.66"
          className="w-[60px] h-auto"
          role="img"
          aria-label="hand-drawn arrow"
        >
          <path
            d="M3.63,77.66c35.22-13.51,37.77-31.72,29.65-51.63C24.43,4.33-14.52,16.12,9.97,36.87c15.81,13.4,67.84,24.37,55.46-34.81"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <path
            d="M55.87,14.57s3.73-3.92,9.66-12.57c6.55,7.06,8.92,13.35,8.92,13.35"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
        </svg>
        <div className="absolute -left-10 -bottom-8 font-nunito text-xl font-extrabold rotate-10">
          Try Me!
        </div>
      </div>
    </div>
  );
}

export default TryMe;


