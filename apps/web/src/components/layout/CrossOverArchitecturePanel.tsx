'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import {
  COA_LANGUAGE_OPTIONS,
  writeCrossOverMode,
} from '@/lib/crossOverPreferences';
import { coaLanguageLabel, coaSafeFeatureCount } from '@/lib/variableCoaUi';
import type { TargetLanguage } from '@vvs/graph-types';

export function CrossOverArchitecturePanel() {
  const { crossOverMode, setCrossOverMode } = useProject();

  const toggleLanguage = (lang: TargetLanguage) => {
    const has = crossOverMode.allowedLanguages.includes(lang);
    const allowedLanguages = has
      ? crossOverMode.allowedLanguages.filter((l) => l !== lang)
      : [...crossOverMode.allowedLanguages, lang];
    const next = {
      ...crossOverMode,
      allowedLanguages: allowedLanguages.length > 0 ? allowedLanguages : [lang],
    };
    setCrossOverMode(next);
    writeCrossOverMode(next);
  };

  const setEnabled = (enabled: boolean) => {
    const next = { ...crossOverMode, enabled };
    setCrossOverMode(next);
    writeCrossOverMode(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Layers size={14} className="text-indigo-400/80 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-200">Cross Over Architecture</p>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Preview mode: restrict authoring to features that stay valid across selected codegen
            languages. Switching target language should not surface portability issues.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={crossOverMode.enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="accent-indigo-500 bg-zinc-900 border-zinc-800"
        />
        Enable COA authoring limits
      </label>

      <div className="space-y-1.5">
        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
          Allowed languages
        </span>
        <div className="flex flex-wrap gap-1">
          {COA_LANGUAGE_OPTIONS.map((option) => {
            const active = crossOverMode.allowedLanguages.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={!crossOverMode.enabled}
                onClick={() => toggleLanguage(option.id)}
                className={`px-2 py-0.5 rounded text-[10px] border transition-colors disabled:opacity-40 ${
                  active
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {crossOverMode.enabled ? (
        <div className="rounded border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-2 space-y-1">
          <p className="text-[10px] text-indigo-200/90">
            Active set: {coaLanguageLabel(crossOverMode)}
          </p>
          <p className="text-[10px] text-zinc-500">
            {coaSafeFeatureCount(crossOverMode)} portability features are safe across this set.
            Unsafe variable bindings and data types are disabled in the inspector.
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-zinc-600">
          When off, portability is checked against the single target language in the code panel only.
        </p>
      )}
    </div>
  );
}
