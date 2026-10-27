import React from 'react';
import { cn } from '../lib/utils';

// Hues sit around the teal accent so tiles feel like one family, not confetti.
const HUES = [168, 190, 210, 145, 125, 32, 350, 260];

/** Colored initial tile that makes each entry recognisable at a glance. */
export const Monogram: React.FC<{ title: string; size?: 'sm' | 'md' }> = ({ title, size = 'sm' }) => {
  const text = title.trim() || '?';
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const hue = HUES[Math.abs(hash) % HUES.length];

  return (
    <div
      aria-hidden
      className={cn(
        'rounded-lg flex items-center justify-center font-semibold text-white shrink-0',
        size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base'
      )}
      style={{ backgroundColor: `hsl(${hue} 55% 38%)` }}
    >
      {text[0].toUpperCase()}
    </div>
  );
};
