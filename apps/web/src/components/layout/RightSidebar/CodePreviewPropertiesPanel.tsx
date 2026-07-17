'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, AlignLeft, Circle, Loader2 } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { useProjectTranspileResult } from '@/hooks/useProjectTranspileResult';
import { useUiPreference } from '@/hooks/useUiPreference';
import { isCodePreviewPaused } from '@/lib/codePreviewPause';
import { isOrgOnlyGraphTab } from '@/lib/graphTabs';
import { Tooltip } from '@/components/ui/Tooltip';

const fieldLabelClass = 'text-[9px] font-semibold uppercase tracking-wide text-zinc-600 mb-1';
const toggleRowClass =
  'flex items-center justify-between gap-2 w-full px-2 py-1.5 rounded border border-zinc-800 bg-zinc-900/40 text-[11px] text-zinc-300 hover:border-zinc-700 transition-colors';

export function CodePreviewPropertiesPanel({ filePath }: { filePath: string | null }) {
  const {
    compileState,
    autoCompile,
    validationErrors,
    validationWarnings,
    activeGraphTab,
    classes,
    dirtyTabIds,
  } = useProject();
  const { result: projectResult, fileOwners } = useProjectTranspileResult();
  const codegenTabId =
    (filePath ? fileOwners[filePath] : undefined) ?? activeGraphTab;

  const {
    targetLanguage,
    isOrgGraph: previewOrgGraph,
  } = useActiveGraphCodegenSettings(codegenTabId);

  const [showUnsupportedComments, setShowUnsupportedComments] = useUiPreference(
    'showUnsupportedComments'
  );
  const [showUserComments, setShowUserComments] = useUiPreference('showUserComments');
  const [jsonFormatNote, setJsonFormatNote] = useState<string | null>(null);

  const isOrgGraph = previewOrgGraph || isOrgOnlyGraphTab(codegenTabId, classes);
  const isJsonPreview = targetLanguage === 'json' || (filePath ? /\.json$/i.test(filePath) : false);

  const activeFile = useMemo(() => {
    if (!filePath) return projectResult.files[0] ?? null;
    return projectResult.files.find((f) => f.path === filePath) ?? projectResult.files[0] ?? null;
  }, [filePath, projectResult.files]);

  const lines = activeFile?.content ? activeFile.content.split('\n').length : 0;
  const mappedNodeCount = Object.keys(projectResult.sourceMap).length;

  const isStale = isCodePreviewPaused(
    autoCompile,
    compileState,
    Object.keys(dirtyTabIds).length > 0
  );
  const isCompiling = compileState === 'compiling';
  const hasBlockingIssues = compileState === 'error' || validationErrors.length > 0;

  const syncLabel = isCompiling
    ? 'Generating…'
    : isStale
      ? 'Preview paused'
      : hasBlockingIssues
        ? validationErrors.length > 0
          ? 'Analysis blocked'
          : 'Compile errors'
        : 'In sync';

  const handleFormatJson = useCallback(() => {
    const raw = activeFile?.content ?? '';
    if (!raw.trim()) return;
    try {
      const formatted = JSON.stringify(JSON.parse(raw), null, 2);
      void navigator.clipboard.writeText(formatted);
      setJsonFormatNote('Formatted JSON copied');
      window.setTimeout(() => setJsonFormatNote(null), 1600);
    } catch {
      setJsonFormatNote('Invalid JSON');
      window.setTimeout(() => setJsonFormatNote(null), 1600);
    }
  }, [activeFile?.content]);

  return (
    <div className="flex flex-col gap-3 text-[11px]">
      <div className="flex flex-col gap-1">
        <p className={fieldLabelClass}>Preview</p>
        <div className="flex items-center gap-2 text-zinc-400 px-0.5">
          {isCompiling ? (
            <Loader2 size={11} className="animate-spin text-zinc-400 shrink-0" />
          ) : isStale || hasBlockingIssues ? (
            <AlertTriangle size={11} className="text-zinc-400 shrink-0" />
          ) : (
            <Circle size={7} fill="currentColor" stroke="none" className="text-zinc-500 shrink-0" />
          )}
          <span className="truncate">{syncLabel}</span>
        </div>
        <p className="text-[10px] text-zinc-600 px-0.5 tabular-nums">
          {lines} lines · {mappedNodeCount} mapped nodes
          {validationWarnings.length > 0 ? ` · ${validationWarnings.length} warnings` : ''}
        </p>
        {filePath ? (
          <Tooltip content={filePath} placement="top" className="block w-full min-w-0">
            <p className="text-[10px] text-zinc-600 font-mono truncate px-0.5">{filePath}</p>
          </Tooltip>
        ) : null}
      </div>

      {isOrgGraph ? (
        <p className="text-[10px] text-zinc-500 px-0.5">
          Organization graph — no generated code. Open a class graph to change emit options.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <p className={fieldLabelClass}>Emit options</p>
            <button
              type="button"
              onClick={() => setShowUserComments(!showUserComments)}
              className={toggleRowClass}
              aria-pressed={showUserComments}
            >
              <span>
                Author comments <span className="text-zinc-600">{'//'}</span>
              </span>
              <span className={showUserComments ? 'text-zinc-200' : 'text-zinc-600'}>
                {showUserComments ? 'On' : 'Off'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowUnsupportedComments(!showUnsupportedComments)}
              className={toggleRowClass}
              aria-pressed={showUnsupportedComments}
            >
              <span>
                Unsupported notes <span className="text-zinc-600">(x)</span>
              </span>
              <span className={showUnsupportedComments ? 'text-zinc-200' : 'text-zinc-600'}>
                {showUnsupportedComments ? 'On' : 'Off'}
              </span>
            </button>
          </div>

          {isJsonPreview ? (
            <div className="flex flex-col gap-1.5">
              <p className={fieldLabelClass}>JSON</p>
              <button
                type="button"
                onClick={handleFormatJson}
                disabled={!activeFile?.content?.trim()}
                className={`${toggleRowClass} disabled:opacity-40`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <AlignLeft size={11} />
                  Format & copy
                </span>
                {jsonFormatNote ? <span className="text-zinc-500">{jsonFormatNote}</span> : null}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
