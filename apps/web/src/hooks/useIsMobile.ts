'use client';

import { useEffect, useState } from 'react';
import { COARSE_POINTER_QUERY, MOBILE_VIEWPORT_QUERY } from '@/lib/mobileViewport';

export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return matches;
}

export function useIsMobile(): boolean {
  return useMatchMedia(MOBILE_VIEWPORT_QUERY);
}

export function useCoarsePointer(): boolean {
  return useMatchMedia(COARSE_POINTER_QUERY);
}
