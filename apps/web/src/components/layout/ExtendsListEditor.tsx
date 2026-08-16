'use client';

import React, { useState } from 'react';
import type { ClassSymbol, TargetLanguage } from '@vvs/graph-types';
import { extendsListUiMode, syncClassExtendsFields } from '@vvs/graph-types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { buildExtendsClassPickerOptions } from '@/lib/classScope';

export function ExtendsListEditor({
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
  const mode = extendsListUiMode(targetLanguage);
  const [extraBlank, setExtraBlank] = useState(false);
  if (mode === 'hidden') return null;

  const options = buildExtendsClassPickerOptions(classes, cls.id);
  const names = syncClassExtendsFields(cls.extendsType, cls.extendsTypes).extendsTypes ?? [];
  const baseRows = names.length > 0 ? names : [''];
  const rows = mode === 'multi' && extraBlank ? [...baseRows, ''] : baseRows;

  const commit = (nextNames: string[]) => {
    const synced = syncClassExtendsFields(undefined, nextNames);
    onChange({
      ...cls,
      extendsType: synced.extendsType,
      extendsTypes: synced.extendsTypes,
    });
  };

  const setRow = (index: number, value: string) => {
    const next = [...rows];
    next[index] = value;
    commit(next);
    if (value.trim()) setExtraBlank(false);
  };

  const addRow = () => setExtraBlank(true);
  const removeRow = (index: number) => {
    commit(rows.filter((_, i) => i !== index));
    setExtraBlank(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Extends</label>
      {rows.map((name, index) => {
        const rowOptions =
          name && !options.some((option) => option.value === name)
            ? [{ value: name, label: name, description: 'Current value' }, ...options]
            : options;
        return (
          <div key={`${index}-${name || 'blank'}`} className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <SearchableSelect
                value={name}
                onChange={(value) => setRow(index, value)}
                options={rowOptions}
                placeholder={index === 0 ? 'Parent class…' : 'Another base…'}
                searchable
              />
            </div>
            {mode === 'multi' && rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="text-[10px] text-zinc-500 hover:text-zinc-200 px-1"
              >
                ×
              </button>
            ) : null}
          </div>
        );
      })}
      {mode === 'multi' ? (
        <button type="button" onClick={addRow} className="text-[10px] text-zinc-400 hover:text-zinc-200">
          + Add base
        </button>
      ) : null}
    </div>
  );
}
