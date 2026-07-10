'use client';

import React from 'react';
import { INDENT, type SectionViewMode } from './constants';
import { explorerBtnCompactPrimaryClass } from './explorerStyles';
import { sectionGridSpan } from './explorerUtils';

export function TreeRenameRow({
  value,
  onChange,
  onSave,
  onCancel,
  viewMode,
  depth = 'l2',
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  viewMode?: SectionViewMode;
  depth?: keyof typeof INDENT;
}) {
  return (
    <div className={`${INDENT[depth]} py-1 pr-2 flex gap-1 ${sectionGridSpan(viewMode) ?? ''}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-zinc-600"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
          if (e.key === 'Escape') onCancel?.();
        }}
      />
      <button type="button" onClick={onSave} className={explorerBtnCompactPrimaryClass}>
        Save
      </button>
    </div>
  );
}
