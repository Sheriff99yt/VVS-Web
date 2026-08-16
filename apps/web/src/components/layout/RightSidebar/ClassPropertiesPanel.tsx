'use client';

import React from 'react';
import type { ClassSymbol, TargetLanguage } from '@vvs/graph-types';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';
import { ExtendsListEditor } from '@/components/layout/ExtendsListEditor';

export function ClassPropertiesPanel({
  cls,
  classes,
  targetLanguage,
  onChange,
}: {
  cls: ClassSymbol;
  classes: ClassSymbol[];
  targetLanguage?: TargetLanguage | string;
  onChange: (next: ClassSymbol) => void;
}) {
  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Name</label>
        <input
          type="text"
          value={cls.name}
          onChange={(e) => onChange({ ...cls, name: e.target.value })}
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
          {...graphInlineFieldProps}
        />
      </div>
      <ExtendsListEditor
        cls={cls}
        classes={classes}
        targetLanguage={targetLanguage}
        onChange={onChange}
      />
    </div>
  );
}
