'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Languages, Trash2, XCircle, Terminal } from 'lucide-react';
import { FloatingPanelShell } from './FloatingPanelShell';
import { CompilerLogCompactStrip, CompilerLogDiagChips } from './CompilerLogDiagChips';
import { useCompilerLogs, type LogEntry, type LogType } from '@/hooks/useCompilerLogs';
import {
  dispatchNavigateToNode,
  dispatchFocusFirstValidationError,
  firstNavigableValidationMessage,
  navigateToValidationMessage,
} from '@/lib/graphNavigation';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { useProject } from '@/contexts/ProjectContext';
import { useActiveGraphCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import { useUiPreference } from '@/hooks/useUiPreference';
import {
  clampDetailsPanelHeight,
  clampFloatingPanelWidth,
  defaultCompilerLogLayout,
  dispatchRequestGenerate,
  dispatchResetCompilerLogLayout,
  readUiPreference,
  RESET_COMPILER_LOG_LAYOUT_EVENT,
  writeUiPreferences,
} from '@/lib/uiPreferences';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  buildLanguageScopedLogView,
  buildUnscopedLogView,
  countValidatorLogEntries,
} from '@/lib/compilerLogLanguageScope';

const LANG_SHORT: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  verse: 'Verse',
  gdscript: 'GDScript',
  rust: 'Rust',
  csharp: 'C#',
  json: 'JSON',
};

function languageLabel(id: string): string {
  return LANG_SHORT[id] ?? id;
}

const ERROR_FLASH_MS = 900;

function logIcon(type: LogType) {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle size={10} className="text-amber-500 shrink-0" />;
    case 'error':
      return <XCircle size={10} className="text-red-500 shrink-0" />;
    default:
      return <div className="w-1 h-1 rounded-full bg-blue-500 shrink-0 mt-1" />;
  }
}

function logColor(type: LogType): string {
  switch (type) {
    case 'success':
      return 'text-emerald-400';
    case 'warning':
      return 'text-amber-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}

function LogLine({ log, onNavigate }: { log: LogEntry; onNavigate: (log: LogEntry) => void }) {
  const navigable = Boolean((log.nodeId && log.tabId) || log.symbolId);
  return (
    <button
      type="button"
      onClick={() => onNavigate(log)}
      disabled={!navigable}
      className={`w-full text-left flex items-start gap-1.5 py-0.5 rounded px-0.5 ${
        navigable ? 'hover:bg-zinc-800/60 cursor-pointer' : 'cursor-default'
      }`}
      title={navigable ? (log.symbolId ? 'Go to variable' : 'Go to node') : undefined}
    >
      {logIcon(log.type)}
      <span className={`flex-1 min-w-0 break-words leading-snug ${logColor(log.type)}`}>
        <span className="text-zinc-600 mr-1">[{log.source}]</span>
        {log.message}
      </span>
    </button>
  );
}

/**
 * Compiler log — two states only:
 * - closed → compact strip (chips + terminal)
 * - open → full floating panel
 * Tilde / `` ` `` toggles open ↔ closed (no header-only middle state).
 */
export function GraphFloatingCompilerLog() {
  const { compilerLogOpen, setCompilerLogOpen } = useEditorPanels();
  const { logs, clearLogs, navigableErrorsRef } = useCompilerLogs();
  const { validationErrors, validationWarnings, compileState, targetLanguage: projectLanguage } =
    useProject();
  const { targetLanguage: graphLanguage } = useActiveGraphCodegenSettings();
  const scopeLanguage = graphLanguage || projectLanguage;
  const [languageScoped, setLanguageScoped] = useUiPreference('compilerLogLanguageScoped');
  const visibleLogs = useMemo(() => {
    const build = languageScoped ? buildLanguageScopedLogView : buildUnscopedLogView;
    return build(logs, scopeLanguage, validationErrors, validationWarnings);
  }, [logs, languageScoped, scopeLanguage, validationErrors, validationWarnings]);
  const { errorCount, warningCount } = useMemo(
    () => countValidatorLogEntries(visibleLogs),
    [visibleLogs]
  );
  const hiddenValidatorCount = useMemo(() => {
    if (!languageScoped) return 0;
    return logs.filter(
      (l) => l.source === 'Validator' && l.language && l.language !== scopeLanguage
    ).length;
  }, [logs, languageScoped, scopeLanguage]);
  const [errorFlash, setErrorFlash] = useState(false);
  const [expandedHeight, setExpandedHeight] = useState(() =>
    clampDetailsPanelHeight(readUiPreference('compilerLogExpandedHeight'))
  );
  const [expandedWidth, setExpandedWidth] = useState(() =>
    clampFloatingPanelWidth(readUiPreference('compilerLogExpandedWidth'))
  );
  const [offsetRight, setOffsetRight] = useState(() => readUiPreference('compilerLogOffsetRight'));
  const [offsetBottom, setOffsetBottom] = useState(() => readUiPreference('compilerLogOffsetBottom'));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevErrorCountRef = useRef(0);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const isCompiling = compileState === 'compiling';
  const isDirty = compileState === 'dirty';

  const jumpErrors = useCallback(() => {
    const target = firstNavigableValidationMessage(validationErrors, validationWarnings);
    if (target && navigateToValidationMessage(target)) {
      if (!compilerLogOpen) setCompilerLogOpen(true);
      return;
    }
    setCompilerLogOpen(true);
    dispatchFocusFirstValidationError();
  }, [validationErrors, validationWarnings, compilerLogOpen, setCompilerLogOpen]);

  const jumpWarnings = useCallback(() => {
    const target = firstNavigableValidationMessage([], validationWarnings);
    if (target && navigateToValidationMessage(target)) {
      if (!compilerLogOpen) setCompilerLogOpen(true);
      return;
    }
    setCompilerLogOpen(true);
  }, [validationWarnings, compilerLogOpen, setCompilerLogOpen]);

  const triggerErrorFlash = useCallback(() => {
    setErrorFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setErrorFlash(false);
      flashTimerRef.current = null;
    }, ERROR_FLASH_MS);
  }, []);

  // New errors → flash compact strip only (do not auto-open the full panel).
  useEffect(() => {
    const prev = prevErrorCountRef.current;
    prevErrorCountRef.current = errorCount;
    if (errorCount > prev) {
      triggerErrorFlash();
    }
  }, [errorCount, triggerErrorFlash]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleHeightChange = useCallback((height: number) => {
    const next = clampDetailsPanelHeight(height);
    setExpandedHeight(next);
    writeUiPreferences({ compilerLogExpandedHeight: next });
  }, []);

  const handleWidthChange = useCallback((width: number) => {
    const next = clampFloatingPanelWidth(width);
    setExpandedWidth(next);
    writeUiPreferences({ compilerLogExpandedWidth: next });
  }, []);

  const applyDefaultLayout = useCallback(() => {
    const d = defaultCompilerLogLayout();
    setExpandedWidth(d.width);
    setExpandedHeight(d.height);
    setOffsetRight(d.offsetRight);
    setOffsetBottom(d.offsetBottom);
  }, []);

  const handleResetLayout = useCallback(() => {
    dispatchResetCompilerLogLayout();
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const onReset = () => applyDefaultLayout();
    window.addEventListener(RESET_COMPILER_LOG_LAYOUT_EVENT, onReset);
    return () => window.removeEventListener(RESET_COMPILER_LOG_LAYOUT_EVENT, onReset);
  }, [applyDefaultLayout]);

  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    const onDown = (e: MouseEvent) => {
      if (contextMenuRef.current?.contains(e.target as Node)) return;
      setContextMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [contextMenu]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(paneMenuPosition(event.clientX, event.clientY, 180, 40));
  }, []);

  const handleOffsetChange = useCallback((right: number, bottom: number) => {
    setOffsetRight(right);
    setOffsetBottom(bottom);
    writeUiPreferences({ compilerLogOffsetRight: right, compilerLogOffsetBottom: bottom });
  }, []);

  const handleLogClick = (log: LogEntry) => {
    navigateToValidationMessage({
      tabId: log.tabId,
      nodeId: log.nodeId,
      symbolId: log.symbolId,
    });
  };

  useEffect(() => {
    const onFocusFirst = () => {
      const live = firstNavigableValidationMessage(validationErrors, validationWarnings);
      if (live && navigateToValidationMessage(live)) return;
      const first = navigableErrorsRef.current[0];
      if (first?.tabId && first?.nodeId) {
        dispatchNavigateToNode(first.tabId, first.nodeId);
      }
    };
    window.addEventListener('vvs:focus-first-validation-error', onFocusFirst);
    return () => window.removeEventListener('vvs:focus-first-validation-error', onFocusFirst);
  }, [navigableErrorsRef, validationErrors, validationWarnings]);

  if (!compilerLogOpen) {
    return (
      <CompilerLogCompactStrip
        errorCount={errorCount}
        warningCount={warningCount}
        isCompiling={isCompiling}
        isDirty={isDirty}
        onOpen={() => setCompilerLogOpen(true)}
        onJumpErrors={jumpErrors}
        onJumpWarnings={jumpWarnings}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes vvs-log-error-flash {
          0%, 100% { border-color: rgb(39 39 42); box-shadow: 0 0 0 0 transparent; }
          25% { border-color: rgb(239 68 68); box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.55), 0 0 16px rgba(239, 68, 68, 0.25); }
          50% { border-color: rgb(248 113 113); box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.7), 0 0 20px rgba(239, 68, 68, 0.35); }
          75% { border-color: rgb(239 68 68); box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.55), 0 0 16px rgba(239, 68, 68, 0.25); }
        }
        .vvsLogErrorFlash {
          animation: vvs-log-error-flash 0.9s ease-out 1;
        }
      `}</style>
      <FloatingPanelShell
        title="Log"
        titleIcon={<Terminal size={11} />}
        corner="bottom-right"
        expanded
        onClose={() => setCompilerLogOpen(false)}
        onContextMenu={handleContextMenu}
        widthClass="w-[min(260px,calc(100%-20px))]"
        maxHeightClass="max-h-[min(300px,50vh)]"
        heightPx={expandedHeight}
        onHeightChange={handleHeightChange}
        widthPx={expandedWidth}
        onWidthChange={handleWidthChange}
        offsetRight={offsetRight}
        offsetBottom={offsetBottom}
        onOffsetChange={handleOffsetChange}
        shellClassName={errorFlash ? 'vvsLogErrorFlash' : undefined}
        headerExtra={
          <div className="flex items-center gap-1">
            <CompilerLogDiagChips
              errorCount={errorCount}
              warningCount={warningCount}
              onJumpErrors={jumpErrors}
              onJumpWarnings={jumpWarnings}
              compact
            />
            <Tooltip
              content={
                languageScoped
                  ? `Live ${languageLabel(scopeLanguage)} only — click for full history (runs Generate)`
                  : `Full history — click to scope to ${languageLabel(scopeLanguage)} (runs Generate)`
              }
              placement="bottom"
            >
              <button
                type="button"
                onClick={() => {
                  setLanguageScoped(!languageScoped);
                  dispatchRequestGenerate();
                }}
                className={`p-0.5 rounded hover:bg-zinc-800/80 ${
                  languageScoped
                    ? 'text-sky-400 hover:text-sky-300'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-pressed={languageScoped}
                data-testid="compiler-log-language-scope"
                aria-label={
                  languageScoped
                    ? `Language scoped to ${languageLabel(scopeLanguage)}`
                    : 'Show all languages'
                }
              >
                <Languages size={11} />
              </button>
            </Tooltip>
            <button
              type="button"
              onClick={clearLogs}
              className="p-0.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80"
              title="Clear log"
            >
              <Trash2 size={11} />
            </button>
          </div>
        }
      >
        <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
          {languageScoped ? (
            <p className="text-zinc-600 py-0.5 text-[9px]">
              Scoped to {languageLabel(scopeLanguage)} (live)
              {hiddenValidatorCount > 0
                ? ` · ${hiddenValidatorCount} historical Validator line${hiddenValidatorCount === 1 ? '' : 's'} hidden`
                : ''}
            </p>
          ) : null}
          {visibleLogs.length === 0 ? (
            <p className="text-zinc-600 py-1">
              {languageScoped
                ? `No ${languageLabel(scopeLanguage)} issues. Toggle language scope to browse Generate history for all languages.`
                : 'No messages yet. Generate or fix graph errors — click a line to jump to the node.'}
            </p>
          ) : (
            visibleLogs.map((log) => <LogLine key={log.id} log={log} onNavigate={handleLogClick} />)
          )}
        </div>
      </FloatingPanelShell>
      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="fixed z-[80] min-w-[168px] py-0.5 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800"
            onClick={handleResetLayout}
          >
            Reset size & position
          </button>
        </div>
      ) : null}
    </>
  );
}
