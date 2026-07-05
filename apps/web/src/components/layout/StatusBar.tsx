'use client';

import React from 'react';
import { Loader2, Terminal, FileCode2, WifiOff, AlertCircle, CheckCircle2, CircleDashed } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { dispatchFocusFirstValidationError } from '@/lib/graphNavigation';
import { useApiHealth } from '@/hooks/useApiHealth';
import { formatSavedAt } from '@/lib/formatSavedAt';

function apiModeShort(
  apiMode: ReturnType<typeof useApiHealth>['apiMode'],
  healthState: ReturnType<typeof useApiHealth>['healthState']
): { label: string; className?: string } {
  if (apiMode === 'mock') return { label: 'Offline', className: 'text-zinc-500' };
  if (healthState === 'checking') return { label: 'API…', className: 'text-zinc-500' };
  if (healthState === 'connected') return { label: 'API', className: 'text-emerald-500/90' };
  return { label: 'API', className: 'text-amber-500/90' };
}

export function StatusBar() {
  const { compileState, validationErrors, validationWarnings, lastSavedAt } = useProject();
  const { consoleOpen, codeOpen, toggleConsole, toggleCode } = useEditorPanels();
  const { apiMode, healthState } = useApiHealth();

  const errorCount = validationErrors.length;
  const warningCount = validationWarnings.length;
  const hasErrors = compileState === 'error' || errorCount > 0;
  const isCompiling = compileState === 'compiling';
  const isDirty = compileState === 'dirty';

  const savedLabel = formatSavedAt(lastSavedAt);
  const api = apiModeShort(apiMode, healthState);

  const statusTitle =
    hasErrors && errorCount > 0
      ? `${errorCount} error${errorCount === 1 ? '' : 's'} — click to jump`
      : isCompiling
        ? 'Compiling…'
        : isDirty
          ? 'Graph changed'
          : 'No errors';

  return (
    <div className="h-6 shrink-0 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between px-2 text-[10px] font-medium text-zinc-500 relative z-50">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-1.5 text-zinc-600" title="MCP disconnected">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          <span>MCP</span>
        </div>
        <span className={`flex items-center gap-1 ${api.className ?? ''}`} title={api.label}>
          {apiMode === 'mock' ? <WifiOff size={10} /> : null}
          {api.label}
        </span>
        {savedLabel ? (
          <>
            <div className="w-px h-3 bg-zinc-800" />
            <span className="text-zinc-600 normal-case tracking-normal" title="Last saved">
              {savedLabel}
            </span>
          </>
        ) : null}
        <div className="w-px h-3 bg-zinc-800" />
        <button
          type="button"
          onClick={toggleConsole}
          className={`p-1 rounded transition-colors ${
            consoleOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
          }`}
          title="Compiler log"
        >
          <Terminal size={11} />
        </button>
        <button
          type="button"
          onClick={toggleCode}
          className={`p-1 rounded transition-colors ${
            codeOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
          }`}
          title="Generated code"
        >
          <FileCode2 size={11} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {warningCount > 0 ? (
          <span
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-amber-400 bg-amber-500/15"
            title={`${warningCount} portability warning${warningCount === 1 ? '' : 's'}`}
          >
            <AlertCircle size={10} />
            {warningCount}
          </span>
        ) : null}
      <button
        type="button"
        disabled={!hasErrors || errorCount === 0}
        onClick={() => dispatchFocusFirstValidationError()}
        title={statusTitle}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
          hasErrors && errorCount > 0
            ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 cursor-pointer'
            : isCompiling
              ? 'text-amber-400 bg-amber-500/20'
              : isDirty
                ? 'text-zinc-400 bg-zinc-800'
                : 'text-emerald-400 bg-emerald-500/15'
        } disabled:opacity-60 disabled:cursor-default`}
      >
        {isCompiling ? (
          <Loader2 size={10} className="animate-spin" />
        ) : hasErrors && errorCount > 0 ? (
          <AlertCircle size={10} />
        ) : isDirty ? (
          <CircleDashed size={10} />
        ) : (
          <CheckCircle2 size={10} />
        )}
        {hasErrors && errorCount > 0 ? (
          <span>{errorCount}</span>
        ) : isDirty ? (
          <span className="sr-only">Dirty</span>
        ) : null}
      </button>
      </div>
    </div>
  );
}
