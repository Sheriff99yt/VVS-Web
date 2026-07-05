'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, XCircle, Terminal } from 'lucide-react';
import { FloatingPanelShell } from './FloatingPanelShell';
import { useCompilerLogs, type LogEntry, type LogType } from '@/hooks/useCompilerLogs';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';
import { dispatchFocusFirstValidationError } from '@/lib/graphNavigation';
import { useEditorPanels } from '@/contexts/EditorPanelContext';

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

function LogLine({
  log,
  compact,
  onNavigate,
}: {
  log: LogEntry;
  compact: boolean;
  onNavigate: (log: LogEntry) => void;
}) {
  const navigable = Boolean(log.nodeId && log.tabId);
  return (
    <button
      type="button"
      onClick={() => onNavigate(log)}
      disabled={!navigable}
      className={`w-full text-left flex items-start gap-1.5 py-0.5 rounded px-0.5 ${
        navigable ? 'hover:bg-zinc-800/60 cursor-pointer' : 'cursor-default'
      }`}
      title={navigable ? 'Go to node' : undefined}
    >
      {logIcon(log.type)}
      <span className={`flex-1 min-w-0 break-words leading-snug ${logColor(log.type)}`}>
        {!compact && <span className="text-zinc-600 mr-1">[{log.source}]</span>}
        {log.message}
      </span>
    </button>
  );
}

export function GraphFloatingCompilerLog() {
  const { compilerLogOpen, setCompilerLogOpen } = useEditorPanels();
  const { logs, clearLogs, navigableErrorsRef } = useCompilerLogs();
  const [expanded, setExpanded] = useState(false);

  const visibleLogs = expanded ? logs : logs.slice(-3);
  const errorCount = logs.filter((l) => l.type === 'error').length;

  const handleLogClick = (log: LogEntry) => {
    if (log.nodeId && log.tabId) {
      dispatchNavigateToNode(log.tabId, log.nodeId);
    }
  };

  useEffect(() => {
    const onFocusFirst = () => {
      const first = navigableErrorsRef.current[0];
      if (first?.tabId && first?.nodeId) {
        dispatchNavigateToNode(first.tabId, first.nodeId);
      }
    };
    window.addEventListener('vvs:focus-first-validation-error', onFocusFirst);
    return () => window.removeEventListener('vvs:focus-first-validation-error', onFocusFirst);
  }, [navigableErrorsRef]);

  if (!compilerLogOpen) return null;

  return (
    <FloatingPanelShell
      title="Log"
      titleIcon={<Terminal size={11} />}
      corner="bottom-right"
      expanded={expanded}
      onToggleExpanded={() => setExpanded((v) => !v)}
      onClose={() => setCompilerLogOpen(false)}
      widthClass="w-[min(260px,calc(100%-20px))]"
      maxHeightClass="max-h-[min(300px,50vh)]"
      headerExtra={
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <button
              type="button"
              onClick={() => dispatchFocusFirstValidationError()}
              className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25"
              title={`${errorCount} errors`}
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
      <div className="font-mono text-[10px] leading-relaxed space-y-0.5">
        {visibleLogs.length === 0 ? (
          <p className="text-zinc-600 italic">Empty</p>
        ) : (
          visibleLogs.map((log) => (
            <LogLine key={log.id} log={log} compact={!expanded} onNavigate={handleLogClick} />
          ))
        )}
        {!expanded && logs.length > 3 && (
          <p className="text-[9px] text-zinc-600 pt-0.5">+{logs.length - 3} more</p>
        )}
      </div>
    </FloatingPanelShell>
  );
}
