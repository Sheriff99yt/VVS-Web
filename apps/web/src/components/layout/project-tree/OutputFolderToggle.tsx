'use client';

import React from 'react';
import { FolderOutput } from 'lucide-react';

export function OutputFolderToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      title={
        enabled
          ? 'Hide full project folder tree'
          : 'Show project folder (.vvs, generated, workspace files)'
      }
      className={`shrink-0 inline-flex items-center gap-1 px-1.5 h-6 rounded text-[9px] font-semibold uppercase tracking-wide border transition-colors ${
        enabled
          ? 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30'
          : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:bg-zinc-800/40'
      }`}
    >
      <FolderOutput size={11} />
      Output
    </button>
  );
}
