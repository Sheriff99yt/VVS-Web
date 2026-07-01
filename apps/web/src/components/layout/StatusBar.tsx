'use client';

import React from 'react';
import { Loader2, Terminal, FileCode2 } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { dispatchFocusFirstValidationError } from '@/lib/graphNavigation';

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  verse: 'Verse',
  json: 'Graph JSON',
};

export function StatusBar() {
  const { targetLanguage, compileState, validationErrors } = useProject();
  const { consoleOpen, codeOpen, toggleConsole, toggleCode } = useEditorPanels();

  const errorCount = validationErrors.length;
  const hasErrors = compileState === 'error' || errorCount > 0;
  const isCompiling = compileState === 'compiling';
  const isDirty = compileState === 'dirty';

  const errorLabel =
    errorCount > 0
      ? `${errorCount} Error${errorCount === 1 ? '' : 's'}`
      : hasErrors
        ? '1 Error'
        : '0 Errors';

  return (
    <div className="h-6 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-3 text-[10px] font-bold tracking-wider text-zinc-500 relative z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 px-2 bg-zinc-800/50 text-zinc-400 rounded-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span>MCP: DISCONNECTED</span>
        </div>
        <span>OFFLINE MODE</span>
        <div className="w-px h-3 bg-zinc-800" />
        <button
          type="button"
          onClick={toggleConsole}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            consoleOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
          }`}
          title="Toggle compiler log"
        >
          <Terminal size={10} />
          <span>Log</span>
        </button>
        <button
          type="button"
          onClick={toggleCode}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            codeOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
          }`}
          title="Toggle generated code"
        >
          <FileCode2 size={10} />
          <span>Code</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span>VVS 2.0</span>
        <div className="w-px h-3 bg-zinc-800" />
        <span className="text-indigo-400 bg-indigo-500/10 px-2 rounded-sm">
          TARGET: {LANGUAGE_LABELS[targetLanguage] ?? targetLanguage.toUpperCase()}
        </span>
        <button
          type="button"
          disabled={!hasErrors || errorCount === 0}
          onClick={() => dispatchFocusFirstValidationError()}
          className={`flex items-center gap-1.5 px-1.5 rounded transition-colors ${
            hasErrors ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 cursor-pointer' :
            isCompiling ? 'text-amber-400 bg-amber-500/20' :
            isDirty ? 'text-zinc-400 bg-zinc-800' :
            'text-emerald-100 bg-emerald-500/20'
          } disabled:opacity-60 disabled:cursor-default`}
          title={errorCount > 0 ? 'Go to first error' : undefined}
        >
          {isCompiling && <Loader2 size={10} className="animate-spin" />}
          <span>
            {hasErrors && errorCount > 0
              ? errorLabel
              : isCompiling
                ? 'Compiling...'
                : isDirty
                  ? 'Uncompiled'
                  : '0 Errors'}
          </span>
        </button>
      </div>
    </div>
  );
}
