'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CodePreviewPanel } from './CodePreviewPanel';
import { GeneratedFilesPanel } from './GeneratedFilesPanel';
import { OutputViewTabs, type OutputViewTab } from './OutputViewTabs';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';

export function CodeOutputPanel() {
  const [activeTab, setActiveTab] = useState<OutputViewTab>('code');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const { result: projectResult } = useProjectTranspileResult();
  const fileCount = projectResult.files.length;

  const handleOpenFile = useCallback((path: string) => {
    setSelectedFilePath(path);
    setActiveTab('code');
  }, []);

  useEffect(() => {
    const onOpenFilesTab = () => setActiveTab('files');
    window.addEventListener('vvs:open-generated-files', onOpenFilesTab);
    return () => window.removeEventListener('vvs:open-generated-files', onOpenFilesTab);
  }, []);

  const handleClearPinnedFile = useCallback(() => setSelectedFilePath(null), []);

  return (
    <div className="h-full flex flex-col min-h-0 bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/80 px-2 h-8 shrink-0 min-w-0">
        <OutputViewTabs value={activeTab} onChange={setActiveTab} />

        {activeTab === 'files' ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedFilePath ? (
              <span
                className="text-[10px] font-mono text-zinc-500 truncate"
                title={selectedFilePath}
              >
                {selectedFilePath}
              </span>
            ) : null}
            <span className="text-[10px] text-zinc-600 tabular-nums ml-auto shrink-0">
              {fileCount} {fileCount === 1 ? 'file' : 'files'}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'code' ? (
          <CodePreviewPanel
            selectedFilePath={selectedFilePath}
            onSelectedFilePathChange={setSelectedFilePath}
            onClearPinnedFile={handleClearPinnedFile}
          />
        ) : (
          <GeneratedFilesPanel
            selectedFilePath={selectedFilePath}
            onSelectFile={setSelectedFilePath}
            onOpenFile={handleOpenFile}
          />
        )}
      </div>
    </div>
  );
}
