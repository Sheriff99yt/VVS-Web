'use client';

import { useEffect, useState } from 'react';
import { isFolderPickerSupported } from '@/lib/projectFolder';

/** False during SSR and the first client paint; updated after mount when FS Access is available. */
export function useFolderPickerSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isFolderPickerSupported());
  }, []);

  return supported;
}
