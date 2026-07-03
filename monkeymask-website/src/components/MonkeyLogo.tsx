import React from 'react';

/**
 * The MonkeyMask monkey mark, rendered as a single silhouette. `faceFill`
 * controls the fill so it can flip for light/dark backgrounds.
 */
export function MonkeyLogo({
  className = 'size-8',
  faceFill = '#f9fafb',
}: {
  className?: string;
  faceFill?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 128 128"
      aria-label="MonkeyMask"
      role="img"
    >
      <path
        fill={faceFill}
        d="M120.74 54.67c-2.23-1.23-5.19-1.94-7.73-1.68c-2.76-10.67-8.59-20.73-16.54-27.63C87.9 17.91 75.83 14.11 64 14.14c-11.82-.03-23.9 3.77-32.47 11.22c-7.96 6.9-13.79 16.96-16.54 27.63c-2.53-.26-5.49.45-7.73 1.68C.99 58.13-.45 66.45 1.03 73.42c1.18 5.55 4.39 9.72 11.01 11.38c1.28.32 2.44.35 3.45.26c1.85 5.83 4.94 11.18 9.83 15.6c5.81 5.26 13.05 8.82 20.5 10.76c2.84.74 10.16 2.45 17.83 2.45c7.68 0 15.71-1.71 18.54-2.45c7.46-1.94 14.69-5.5 20.5-10.76c4.89-4.43 7.98-9.77 9.83-15.6c1.01.09 2.17.06 3.44-.26c6.62-1.66 9.84-5.83 11.02-11.38c1.47-6.97.04-15.28-6.24-18.75"
      />
    </svg>
  );
}

export default MonkeyLogo;
