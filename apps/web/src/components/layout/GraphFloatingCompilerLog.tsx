'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, XCircle, Terminal } from 'lucide-react';
import { FloatingPanelShell } from './FloatingPanelShell';
import { useCompilerLogs, type LogEntry, type LogType } from '@/hooks/useCompilerLogs';
import {
  dispatchNavigateToNode,
  dispatchFocusFirstValidationError,
  firstNavigableValidationMessage,
  navigateToValidationMessage,
} from '@/lib/graphNavigation';
import { useEditorPanels } from '@/contexts/EditorPanelContext';
import { useProject } from '@/contexts/ProjectContext';
import { useUiPreference } from '@/hooks/useUiPreference';
import {
  clampDetailsPanelHeight,
  clampFloatingPanelWidth,
  defaultCompilerLogLayout,
  dispatchResetCompilerLogLayout,
  readUiPreference,
  RESET_COMPILER_LOG_LAYOUT_EVENT,
  TOGGLE_COMPILER_LOG_PIN_EVENT,
  writeUiPreferences,
} from '@/lib/uiPreferences';
import { paneMenuPosition } from '@/lib/paneMenuPosition';
import { withShortcut } from '@/lib/graphShortcuts';

const HOVER_EXPAND_MS = 180;
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

function compactSubtitle(logs: LogEntry[], errorCount: number, warningCount: number): React.ReactNode {
  if (logs.length === 0) return 'Empty';
  if (errorCount > 0) {
    const lastError = [...logs].reverse().find((l) => l.type === 'error');
    const preview = lastError?.message.slice(0, 42) ?? '';
    return (
      <span className="text-red-400/90">
        {errorCount} error{errorCount === 1 ? '' : 's'}
        {preview ? ` · ${preview}${lastError && lastError.message.length > 42 ? '…' : ''}` : ''}
      </span>
    );
  }
  if (warningCount > 0) {
    return (
      <span className="text-amber-400/90">
        {warningCount} warning{warningCount === 1 ? '' : 's'}
      </span>
    );
  }
  const last = logs[logs.length - 1];
  if (last?.type === 'success') return <span className="text-emerald-400/80">OK</span>;
  return `${logs.length} message${logs.length === 1 ? '' : 's'}`;
}

export function GraphFloatingCompilerLog() {
  const { compilerLogOpen, setCompilerLogOpen } = useEditorPanels();
  const { logs, clearLogs, navigableErrorsRef } = useCompilerLogs();
  const { validationErrors, validationWarnings } = useProject();
  const [pinned, setPinned] = useUiPreference('compilerLogPinned');
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [peekExpanded, setPeekExpanded] = useState(false);
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureActiveRef = useRef(false);
  const hoverInsideRef = useRef(false);
  const prevErrorCountRef = useRef(0);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const errorCount = logs.filter((l) => l.type === 'error').length;
  const warningCount = logs.filter((l) => l.type === 'warning').length;
  const effectiveExpanded = pinned || hoverExpanded || peekExpanded;

  const triggerErrorFlash = useCallback(() => {
    setErrorFlash(true);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      setErrorFlash(false);
      flashTimerRef.current = null;
    }, ERROR_FLASH_MS);
  }, []);

  // New errors → open panel, peek-expand (not pin), flash red.
  useEffect(() => {
    const prev = prevErrorCountRef.current;
    prevErrorCountRef.current = errorCount;
    if (errorCount > prev) {
      setCompilerLogOpen(true);
      setPeekExpanded(true);
      triggerErrorFlash();
    }
  }, [errorCount, setCompilerLogOpen, triggerErrorFlash]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleHoverChange = useCallback(
    (hovered: boolean) => {
      hoverInsideRef.current = hovered;
      if (gestureActiveRef.current) {
        // Stay expanded for the whole move/resize; re-evaluate on release.
        if (hovered) {
          if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
          }
          setHoverExpanded(true);
        }
        return;
      }
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (hovered) {
        hoverTimerRef.current = setTimeout(() => {
          setHoverExpanded(true);
          hoverTimerRef.current = null;
        }, HOVER_EXPAND_MS);
        return;
      }
      setHoverExpanded(false);
      if (!pinned) {
        setPeekExpanded(false);
      }
    },
    [pinned]
  );

  const handleGestureChange = useCallback(
    (active: boolean) => {
      gestureActiveRef.current = active;
      if (active) {
        // Keep open for the gesture even if pointer leaves the panel.
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
        }
        setHoverExpanded(true);
        return;
      }
      // Released — collapse only if pointer is outside and not pinned.
      if (!hoverInsideRef.current && !pinned) {
        setHoverExpanded(false);
        setPeekExpanded(false);
      }
    },
    [pinned]
  );

  const togglePinned = useCallback(() => {
    setPinned(!pinned);
  }, [pinned, setPinned]);

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
    const onTogglePin = () => {
      setCompilerLogOpen(true);
      const next = !pinnedRef.current;
      setPinned(next);
      if (next) {
        setHoverExpanded(true);
        setPeekExpanded(true);
        return;
      }
      // Unpin via keyboard — collapse immediately if pointer is not over the panel.
      if (!hoverInsideRef.current) {
        setHoverExpanded(false);
        setPeekExpanded(false);
      }
    };
    window.addEventListener(TOGGLE_COMPILER_LOG_PIN_EVENT, onTogglePin);
    return () => window.removeEventListener(TOGGLE_COMPILER_LOG_PIN_EVENT, onTogglePin);
  }, [setCompilerLogOpen, setPinned]);

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

  if (!compilerLogOpen) return null;

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
        subtitle={effectiveExpanded ? undefined : compactSubtitle(logs, errorCount, warningCount)}
        titleIcon={<Terminal size={11} />}
        corner="bottom-right"
        expanded={effectiveExpanded}
        pinned={pinned}
        onTogglePinned={togglePinned}
        pinTitle={
          pinned
            ? withShortcut('Unpin — collapse when pointer leaves', 'toggle-log-pin')
            : withShortcut('Pin — keep expanded', 'toggle-log-pin')
        }
        onHoverChange={handleHoverChange}
        onGestureChange={handleGestureChange}
        onContextMenu={handleContextMenu}
        onClose={() => setCompilerLogOpen(false)}
        widthClass="w-[min(260px,calc(100%-20px))]"
        maxHeightClass="max-h-[min(300px,50vh)]"
        heightPx={effectiveExpanded ? expandedHeight : undefined}
        onHeightChange={effectiveExpanded ? handleHeightChange : undefined}
        widthPx={expandedWidth}
        onWidthChange={effectiveExpanded ? handleWidthChange : undefined}
        offsetRight={offsetRight}
        offsetBottom={offsetBottom}
        onOffsetChange={handleOffsetChange}
        shellClassName={errorFlash ? 'vvsLogErrorFlash' : undefined}
        headerExtra={
          <div className="flex items-center gap-1">
            {errorCount > 0 && (
              <button
                type="button"
                onClick={() => dispatchFocusFirstValidationError()}
                className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25"
                title={`${errorCount} errors — jump to first`}
              >
                {errorCount}
              </button>
            )}
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
        {effectiveExpanded ? (
          <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-zinc-600 italic">Empty</p>
            ) : (
              logs.map((log) => <LogLine key={log.id} log={log} onNavigate={handleLogClick} />)
            )}
          </div>
        ) : null}
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
