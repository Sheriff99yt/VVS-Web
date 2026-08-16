'use client';

import React from 'react';
import type { ClassSymbol } from '@vvs/graph-types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { buildExtendsClassPickerOptions } from '@/lib/classScope';
import { graphInlineFieldProps } from '@/components/graph/graphInlineFieldProps';

export function ClassPropertiesPanel({
  cls,
  classes,
  onChange,
}: {
  cls: ClassSymbol;
  classes: ClassSymbol[];
  onChange: (next: ClassSymbol) => void;
}) {
  const options = buildExtendsClassPickerOptions(classes, cls.id);
  const current = cls.extendsType ?? '';
  const extendsOptions =
    current && !options.some((option) => option.value === current)
      ? [{ value: current, label: current, description: 'Current value' }, ...options]
      : options;

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
      <div className="space-y-1">
        <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Extends</label>
        <SearchableSelect
          value={current}
          onChange={(value) => onChange({ ...cls, extendsType: value.trim() || undefined })}
          options={extendsOptions}
          placeholder="Parent class…"
          searchable
        />
      </div>
    </div>
  );
}
