'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CodePreviewPanel } from './CodePreviewPanel';
import {
  SELECT_GENERATED_FILE_EVENT,
} from '@/lib/generatedFileNavigation';

export function CodeOutputPanel() {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const handleClearPinnedFile = useCallback(() => setSelectedFilePath(null), []);

  useEffect(() => {
    const onSelectFile = (event: Event) => {
      const path = (event as CustomEvent<{ path: string }>).detail?.path;
      if (path) setSelectedFilePath(path);
    };
    window.addEventListener(SELECT_GENERATED_FILE_EVENT, onSelectFile);
    return () => window.removeEventListener(SELECT_GENERATED_FILE_EVENT, onSelectFile);
  }, []);

  return (
    <div className="h-full flex flex-col min-h-0 bg-zinc-950">
      <CodePreviewPanel
        selectedFilePath={selectedFilePath}
        onSelectedFilePathChange={setSelectedFilePath}
        onClearPinnedFile={handleClearPinnedFile}
      />
    </div>
  );
}
