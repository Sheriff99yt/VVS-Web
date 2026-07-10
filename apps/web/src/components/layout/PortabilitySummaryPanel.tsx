'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { getLanguageProfile } from '@vvs/language-profiles';
import { LOGICAL_DATA_TYPE_DESCRIPTORS } from '@vvs/graph-types';
import { isCoaAuthoringActive } from '@/lib/coaPolicy';

export function PortabilitySummaryPanel() {
  const {
    targetLanguage,
    crossOverMode,
    validationErrors,
    validationWarnings,
  } = useProject();

  const profile = getLanguageProfile(targetLanguage);
  const errorCount = validationErrors.length;
  const warningCount = validationWarnings.length;
  const messages = [...validationErrors, ...validationWarnings];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
          Cross-language status
        </p>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
            Target: {profile.displayName}
          </span>
          {isCoaAuthoringActive(crossOverMode) ? (
            <span className="px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-200">
              COA on
            </span>
          ) : null}
          {errorCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-300">
              {errorCount} error{errorCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {warningCount > 0 ? (
            <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300">
              {warningCount} warning{warningCount === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
              Clear for {profile.displayName}
            </span>
          )}
        </div>
      </div>

      {messages.length > 0 ? (
        <ul className="space-y-1 max-h-32 overflow-y-auto text-[10px]">
          {messages.slice(0, 8).map((msg, i) => (
            <li
              key={`${msg.code ?? 'msg'}-${i}`}
              className={`flex items-start gap-1 leading-relaxed ${
                msg.level === 'error' ? 'text-red-400/90' : 'text-amber-400/90'
              }`}
            >
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              <span className="min-w-0">{msg.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          No analysis issues for the current graph and target language.
        </p>
      )}

      <div>
        <p className="text-[10px] font-medium text-zinc-500 mb-1">
          Data types <span className="text-zinc-600 normal-case">(Python-style names)</span>
        </p>
        <div className="grid grid-cols-2 gap-1">
          {LOGICAL_DATA_TYPE_DESCRIPTORS.map((descriptor) => (
            <div
              key={descriptor.id}
              className="px-1.5 py-1 rounded border border-zinc-800/80 bg-zinc-900/50"
            >
              <span className="text-[10px] text-zinc-300">{descriptor.label}</span>
              <p className="text-[9px] text-zinc-600 truncate" title={descriptor.description}>
                {descriptor.portabilityFeature ? 'May warn per target' : 'Universal'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
