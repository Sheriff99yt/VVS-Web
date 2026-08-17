'use client';

import React from 'react';
import type { ClassForm, ClassSymbol, TargetLanguage } from '@vvs/graph-types';
import { classFormOf, classFormUiOptions, normalizeClassForm } from '@vvs/graph-types';

const FORM_LABEL: Record<ClassForm, string> = {
  class: 'Class',
  interface: 'Interface',
  trait: 'Trait',
};

export function ClassFormEditor({
  cls,
  targetLanguage,
  onChange,
}: {
  cls: ClassSymbol;
  targetLanguage?: TargetLanguage | string;
  onChange: (next: ClassSymbol) => void;
}) {
  const options = classFormUiOptions(targetLanguage);
  if (options.length === 0) return null;
  const current = classFormOf(cls);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Form</label>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              const next = normalizeClassForm(option);
              onChange({
                ...cls,
                form: next && next !== 'class' ? next : undefined,
              });
            }}
            className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
              current === option
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {FORM_LABEL[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
