'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Languages, Trash2, XCircle, Terminal, History, List } from 'lucide-react';
import { FloatingPanelShell } from './FloatingPanelShell';
import { CompilerLogCompactStrip, CompilerLogDiagChips } from './CompilerLogDiagChips';
import { LogActivityTab, LogHistoryTab } from './LogHistoryTab';
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
  OPEN_ACTION_HISTORY_EVENT,
  readUiPreference,
  RESET_COMPILER_LOG_LAYOUT_EVENT,
  TOGGLE_COMPILER_LOG_PIN_EVENT,
  writeUiPreferences,
} from '@/lib/uiPreferences';
import { shortcutKeys } from '@/lib/graphShortcuts';
import {
  HIGHLIGHT_LOG_HISTORY_EVENT,
  OPEN_LOG_HISTORY_TAB_EVENT,
} from '@/lib/historyDiscardGate';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  buildLanguageScopedLogView,
  buildUnscopedLogView,
  countValidatorLogEntries,
} from '@/lib/compilerLogLanguageScope';

type LogPanelTab = 'log' | 'history' | 'activity';

const LANG_SHORT: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  cpp: 'C++',
  verse: 'Verse',
  gdscript: 'GDScript',
  rust: 'Rust',
  csharp: 'C#',
  go: 'Go',
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
  const tip = navigable ? (log.symbolId ? 'Go to variable' : 'Go to node') : undefined;
  return (
    <Tooltip content={tip} placement="top" disabled={!navigable} className="block w-full min-w-0">
      <button
        type="button"
        onClick={() => onNavigate(log)}
        disabled={!navigable}
        className={`w-full text-left flex items-start gap-1.5 py-0.5 rounded px-0.5 ${
          navigable ? 'hover:bg-zinc-800/60 cursor-pointer' : 'cursor-default'
        }`}
      >
        {logIcon(log.type)}
        <span className={`flex-1 min-w-0 break-words leading-snug ${logColor(log.type)}`}>
          <span className="text-zinc-600 mr-1">[{log.source}]</span>
          {log.message}
        </span>
      </button>
    </Tooltip>
  );
}

/**
 * Output panel (Log · History · Activity):
 * - closed → compact strip (chips + terminal)
 * - open → full floating panel
 * `` ` `` cycles enabled tabs then closes.
 */
export function GraphFloatingCompilerLog() {
  const { compilerLogOpen, setCompilerLogOpen } = useEditorPanels();
  const { logs, clearLogs, navigableErrorsRef } = useCompilerLogs();
  const { validationErrors, validationWarnings, compileState, targetLanguage: projectLanguage } =
    useProject();
  const { targetLanguage: graphLanguage } = useActiveGraphCodegenSettings();
  const scopeLanguage = graphLanguage || projectLanguage;
  const [languageScoped, setLanguageScoped] = useUiPreference('compilerLogLanguageScoped');
  const [showLogTab, setShowLogTab] = useUiPreference('logPanelTabLog');
  const [showHistoryTab, setShowHistoryTab] = useUiPreference('logPanelTabHistory');
  const [showActivityTab, setShowActivityTab] = useUiPreference('logPanelTabActivity');
  const [panelTab, setPanelTab] = useState<LogPanelTab>('log');
  const [historyHighlight, setHistoryHighlight] = useState(false);
  const historyFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledTabs = useMemo(() => {
    const tabs: LogPanelTab[] = [];
    if (showLogTab) tabs.push('log');
    if (showHistoryTab) tabs.push('history');
    if (showActivityTab) tabs.push('activity');
    return tabs.length > 0 ? tabs : (['log'] as LogPanelTab[]);
  }, [showLogTab, showHistoryTab, showActivityTab]);

  useEffect(() => {
    if (!enabledTabs.includes(panelTab)) {
      setPanelTab(enabledTabs[0]!);
    }
  }, [enabledTabs, panelTab]);

  const openHistoryTab = useCallback(() => {
    if (!showHistoryTab) setShowHistoryTab(true);
    setCompilerLogOpen(true);
    setPanelTab('history');
  }, [setCompilerLogOpen, setShowHistoryTab, showHistoryTab]);

  const openActivityTab = useCallback(() => {
    if (!showActivityTab) setShowActivityTab(true);
    setCompilerLogOpen(true);
    setPanelTab('activity');
  }, [setCompilerLogOpen, setShowActivityTab, showActivityTab]);

  /** ` : cycle Output tabs Log → History → Activity → off. */
  const cycleOutputPanel = useCallback(() => {
    const tabs = enabledTabs;
    if (tabs.length === 0) return;

    if (!compilerLogOpen) {
      setPanelTab(tabs[0]!);
      setCompilerLogOpen(true);
      return;
    }

    const idx = tabs.indexOf(panelTab);
    if (idx < 0) {
      setPanelTab(tabs[0]!);
      return;
    }
    const next = tabs[idx + 1];
    if (next) {
      setPanelTab(next);
      return;
    }
    setCompilerLogOpen(false);
  }, [compilerLogOpen, enabledTabs, panelTab, setCompilerLogOpen]);

  useEffect(() => {
    const onOpenHistory = () => openHistoryTab();
    window.addEventListener(OPEN_LOG_HISTORY_TAB_EVENT, onOpenHistory);
    window.addEventListener(OPEN_ACTION_HISTORY_EVENT, onOpenHistory);
    return () => {
      window.removeEventListener(OPEN_LOG_HISTORY_TAB_EVENT, onOpenHistory);
      window.removeEventListener(OPEN_ACTION_HISTORY_EVENT, onOpenHistory);
    };
  }, [openHistoryTab]);

  useEffect(() => {
    const onCycle = () => cycleOutputPanel();
    window.addEventListener(TOGGLE_COMPILER_LOG_PIN_EVENT, onCycle);
    return () => window.removeEventListener(TOGGLE_COMPILER_LOG_PIN_EVENT, onCycle);
  }, [cycleOutputPanel]);

  useEffect(() => {
    const onHighlight = (event: Event) => {
      const ms = (event as CustomEvent<{ ms?: number }>).detail?.ms ?? 4500;
      openHistoryTab();
      setHistoryHighlight(true);
      if (historyFlashTimerRef.current) clearTimeout(historyFlashTimerRef.current);
      historyFlashTimerRef.current = setTimeout(() => {
        setHistoryHighlight(false);
        historyFlashTimerRef.current = null;
      }, ms);
    };
    window.addEventListener(HIGHLIGHT_LOG_HISTORY_EVENT, onHighlight);
    return () => {
      window.removeEventListener(HIGHLIGHT_LOG_HISTORY_EVENT, onHighlight);
      if (historyFlashTimerRef.current) clearTimeout(historyFlashTimerRef.current);
    };
  }, [openHistoryTab]);

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
        onOpenActivity={openActivityTab}
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
        @keyframes vvs-log-history-flash {
          0%, 100% { border-color: rgb(39 39 42); box-shadow: 0 0 0 0 transparent; }
          30% { border-color: rgb(234 179 8); box-shadow: 0 0 0 1px rgba(234, 179, 8, 0.55), 0 0 18px rgba(234, 179, 8, 0.28); }
          60% { border-color: rgb(250 204 21); box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.65), 0 0 22px rgba(234, 179, 8, 0.35); }
        }
        .vvsLogErrorFlash {
          animation: vvs-log-error-flash 0.9s ease-out 1;
        }
        .vvsLogHistoryFlash {
          animation: vvs-log-history-flash 1.1s ease-out 3;
        }
      `}</style>
      <FloatingPanelShell
        title="Log"
        titleIcon={<Terminal size={11} />}
        corner="bottom-right"
        expanded
        onClose={() => setCompilerLogOpen(false)}
        onContextMenu={handleContextMenu}
        widthClass="w-[min(280px,calc(100%-20px))]"
        maxHeightClass="max-h-[min(340px,55vh)]"
        heightPx={expandedHeight}
        onHeightChange={handleHeightChange}
        widthPx={expandedWidth}
        onWidthChange={handleWidthChange}
        offsetRight={offsetRight}
        offsetBottom={offsetBottom}
        onOffsetChange={handleOffsetChange}
        shellClassName={
          historyHighlight ? 'vvsLogHistoryFlash' : errorFlash ? 'vvsLogErrorFlash' : undefined
        }
        headerTitle={
          <div
            className="flex items-center gap-0.5 min-w-0"
            role="tablist"
            aria-label="Output panel"
          >
            {enabledTabs.includes('log') ? (
              <Tooltip
                content={`Log (${shortcutKeys('toggle-log-pin')})`}
                placement="bottom"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelTab === 'log'}
                  onClick={() => setPanelTab('log')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                    panelTab === 'log'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Terminal size={10} />
                  Log
                </button>
              </Tooltip>
            ) : null}
            {enabledTabs.includes('history') ? (
              <Tooltip
                content={`History (${shortcutKeys('toggle-log-pin')})`}
                placement="bottom"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelTab === 'history'}
                  onClick={() => setPanelTab('history')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                    panelTab === 'history'
                      ? historyHighlight
                        ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                        : 'bg-zinc-800 text-zinc-100'
                      : historyHighlight
                        ? 'text-amber-300/90 ring-1 ring-amber-400/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <History size={10} />
                  History
                </button>
              </Tooltip>
            ) : null}
            {enabledTabs.includes('activity') ? (
              <Tooltip
                content={`Activity (${shortcutKeys('toggle-log-pin')})`}
                placement="bottom"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={panelTab === 'activity'}
                  onClick={() => setPanelTab('activity')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                    panelTab === 'activity'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <List size={10} />
                  Activity
                </button>
              </Tooltip>
            ) : null}
          </div>
        }
        headerExtra={
          <div className="flex items-center gap-1">
            {panelTab === 'log' ? (
              <>
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
                <Tooltip content="Clear log" placement="bottom">
                  <button
                    type="button"
                    onClick={clearLogs}
                    className="p-0.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80"
                  >
                    <Trash2 size={11} />
                  </button>
                </Tooltip>
              </>
            ) : null}
          </div>
        }
      >
        <div className="font-mono text-[10px] leading-relaxed min-h-0">
          {panelTab === 'log' ? (
            <div className="space-y-0.5">
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
                visibleLogs.map((log) => (
                  <LogLine key={log.id} log={log} onNavigate={handleLogClick} />
                ))
              )}
            </div>
          ) : null}
          {panelTab === 'history' ? <LogHistoryTab /> : null}
          {panelTab === 'activity' ? <LogActivityTab /> : null}
        </div>
      </FloatingPanelShell>
      {contextMenu ? (
        <div
          ref={contextMenuRef}
          className="fixed z-[80] min-w-[188px] py-0.5 rounded-md border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40"
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
          <div className="h-px bg-zinc-800 my-0.5" />
          <p className="px-2.5 py-1 text-[9px] uppercase tracking-wide text-zinc-600">Tabs</p>
          {(
            [
              ['log', 'Log', showLogTab, setShowLogTab],
              ['history', 'History', showHistoryTab, setShowHistoryTab],
              ['activity', 'Activity', showActivityTab, setShowActivityTab],
            ] as const
          ).map(([id, label, on, setOn]) => (
            <button
              key={id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={on}
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800 flex items-center justify-between gap-2"
              onClick={() => {
                const next = !on;
                if (!next && enabledTabs.length <= 1 && enabledTabs[0] === id) return;
                setOn(next);
              }}
            >
              <span>{label}</span>
              <span className={on ? 'text-emerald-400' : 'text-zinc-600'}>{on ? 'On' : 'Off'}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
