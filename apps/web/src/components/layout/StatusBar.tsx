'use client';

import React from 'react';
import { Loader2, Terminal, FileCode2, FolderTree, Map, WifiOff, AlertCircle, CheckCircle2, CircleDashed } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { useEditorView } from '@/contexts/EditorViewContext';
import { dispatchFocusFirstValidationError } from '@/lib/graphNavigation';
import { useApiHealth } from '@/hooks/useApiHealth';
import { formatSavedAt } from '@/lib/formatSavedAt';
import { useProjectFolder } from '@/contexts/ProjectFolderContext';
import { isFolderPickerSupported } from '@/lib/projectFolder';
import { dispatchSaveOnDiskPrompt } from '@/lib/promoteProjectToDisk';

function apiModeShort(
  apiMode: ReturnType<typeof useApiHealth>['apiMode'],
  healthState: ReturnType<typeof useApiHealth>['healthState'],
  serviceName: string | null
): { label: string; className?: string; title?: string } {
  if (apiMode === 'mock') return { label: 'Offline', className: 'text-zinc-500' };
  if (healthState === 'checking') return { label: 'API…', className: 'text-zinc-500' };
  if (healthState === 'connected')
    return {
      label: serviceName ? `API · ${serviceName}` : 'API',
      className: 'text-emerald-500/90',
      title: serviceName ? `${serviceName} healthy` : 'API server connected',
    };
  return { label: 'API unreachable', className: 'text-amber-500/90', title: 'Could not reach API health endpoint' };
}

export function StatusBar() {
  const { compileState, validationErrors, validationWarnings, lastSavedAt, crossOverMode } = useProject();
  const { isFolderProject } = useProjectFolder();
  const { consoleOpen, codeOpen, graphNavOpen, graphChromeOpen, toggleConsole, toggleCode, toggleGraphNav, toggleGraphChrome, setCompilerLogOpen } =
    useEditorPanels();
  const { isCanvasActive } = useEditorView();
  const { apiMode, healthState, serviceName } = useApiHealth();

  const errorCount = validationErrors.length;
  const warningCount = validationWarnings.length;
  const hasErrors = compileState === 'error' || errorCount > 0;
  const isCompiling = compileState === 'compiling';
  const isDirty = compileState === 'dirty';

  const savedLabel = formatSavedAt(lastSavedAt);
  const api = apiModeShort(apiMode, healthState, serviceName);

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
        <span className={`flex items-center gap-1 ${api.className ?? ''}`} title={api.title ?? api.label}>
          {apiMode === 'mock' ? <WifiOff size={10} /> : null}
          {api.label}
        </span>
        {crossOverMode.enabled ? (
          <span
            className="px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
            title={`Cross Over Architecture: ${crossOverMode.allowedLanguages.join(', ')}`}
          >
            COA
          </span>
        ) : null}
        {!isFolderProject && isFolderPickerSupported() ? (
          <>
            <div className="w-px h-3 bg-zinc-800" />
            <button
              type="button"
              onClick={() => dispatchSaveOnDiskPrompt()}
              className="px-1.5 py-0.5 rounded border border-amber-500/25 bg-amber-500/10 text-amber-400/90 hover:bg-amber-500/15 transition-colors"
              title="This project is browser-only — save to a folder on disk"
            >
              Browser only · Save to disk
            </button>
          </>
        ) : null}
        {savedLabel ? (
          <>
            <div className="w-px h-3 bg-zinc-800" />
            <span className="text-zinc-600 normal-case tracking-normal" title="Last saved">
              {savedLabel}
            </span>
          </>
        ) : null}
        <div className="w-px h-3 bg-zinc-800" />
        {isCanvasActive ? (
          <>
            <button
              type="button"
              onClick={toggleGraphNav}
              className={`p-1 rounded transition-colors ${
                graphNavOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Graph navigator"
              aria-label="Graph navigator"
              aria-pressed={graphNavOpen}
            >
              <FolderTree size={11} />
            </button>
            <button
              type="button"
              onClick={toggleGraphChrome}
              className={`p-1 rounded transition-colors ${
                graphChromeOpen ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Minimap & zoom controls"
              aria-label="Minimap and zoom controls"
              aria-pressed={graphChromeOpen}
            >
              <Map size={11} />
            </button>
          </>
        ) : null}
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
          <button
            type="button"
            onClick={() => {
              if (!consoleOpen) setCompilerLogOpen(true);
              else toggleConsole();
            }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 transition-colors"
            title={`${warningCount} portability warning${warningCount === 1 ? '' : 's'} — open log`}
          >
            <AlertCircle size={10} />
            {warningCount}
          </button>
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
