'use client';

import React from 'react';
import { useProject } from '@/contexts/ProjectContext';
import type { TargetLanguage } from '@vvs/graph-types';

const TARGET_OPTIONS: { id: TargetLanguage; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'cpp', label: 'C++' },
  { id: 'verse', label: 'Verse' },
  { id: 'json', label: 'Graph JSON' },
];

export function CodegenTargetPanel() {
  const { targetLanguage, setTargetLanguage } = useProject();

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-zinc-400">Codegen target</label>
      <select
        value={targetLanguage}
        onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
      >
        {TARGET_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-zinc-600 leading-relaxed">
        Generated code and portability warnings use this language. Multi-language Cross Over
        Architecture is planned — see settings below.
      </p>
    </div>
  );
}
