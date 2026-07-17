'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Clock, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { ValidationResult } from '@/lib/graphValidator';
import { dispatchNavigateToNode } from '@/lib/graphNavigation';

type LogType = 'info' | 'success' | 'warning' | 'error';

interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  source: string;
  tabId?: string;
  nodeId?: string;
}

export function OutputConsolePanel() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'VVS Web editor ready.', source: 'System' },
  ]);
  const navigableErrorsRef = useRef<LogEntry[]>([]);

  const appendLogs = (entries: LogEntry[]) => {
    if (entries.length === 0) return;
    setLogs((prev) => [...prev, ...entries]);
    const withNode = entries.filter((e) => e.nodeId && e.tabId);
    if (withNode.length > 0) {
      navigableErrorsRef.current = [...navigableErrorsRef.current, ...withNode];
    }
  };

  const handleLogClick = (log: LogEntry) => {
    if (log.nodeId && log.tabId) {
      dispatchNavigateToNode(log.tabId, log.nodeId);
    }
  };

  useEffect(() => {
    const onEditorMessage = (event: Event) => {
      const { level, message, source } = (
        event as CustomEvent<{ level: LogType; message: string; source?: string }>
      ).detail;
      appendLogs([
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: level,
          message,
          source: source ?? 'Editor',
        },
      ]);
    };
    window.addEventListener('vvs:editor-message', onEditorMessage);
    return () => window.removeEventListener('vvs:editor-message', onEditorMessage);
  }, []);

  useEffect(() => {
    const onSimulationLog = (event: Event) => {
      const message = (event as CustomEvent<{ message: string }>).detail.message;
      const now = new Date().toLocaleTimeString();
      appendLogs([
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: now,
          type: 'info',
          message,
          source: 'Simulation',
        },
      ]);
    };
    window.addEventListener('vvs:simulation-log', onSimulationLog);
    return () => window.removeEventListener('vvs:simulation-log', onSimulationLog);
  }, []);

  useEffect(() => {
    const onValidation = (event: Event) => {
      const result = (event as CustomEvent<ValidationResult>).detail;
      const now = new Date().toLocaleTimeString();
      navigableErrorsRef.current = [];
      const entries: LogEntry[] = result.messages.map((msg, index) => ({
        id: `val-${Date.now()}-${index}`,
        timestamp: now,
        type: msg.level === 'error' ? 'error' : 'warning',
        message: msg.tabId ? `[${msg.tabId}] ${msg.message}` : msg.message,
        source: 'Validator',
        tabId: msg.tabId,
        nodeId: msg.nodeId,
      }));
      appendLogs(entries);
    };
    window.addEventListener('vvs:validation-result', onValidation);
    return () => window.removeEventListener('vvs:validation-result', onValidation);
  }, []);

  useEffect(() => {
    const onFocusFirst = () => {
      const first = navigableErrorsRef.current[0];
      if (first?.tabId && first?.nodeId) {
        dispatchNavigateToNode(first.tabId, first.nodeId);
      }
    };
    window.addEventListener('vvs:focus-first-validation-error', onFocusFirst);
    return () => window.removeEventListener('vvs:focus-first-validation-error', onFocusFirst);
  }, []);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const next = (event as CustomEvent<{ state: 'clean' | 'dirty' | 'compiling' | 'success' | 'error' }>).detail
        .state;
      const now = new Date().toLocaleTimeString();
      if (next === 'compiling') {
        appendLogs([
          { id: Date.now().toString(), timestamp: now, type: 'info', message: 'Starting transpilation process...', source: 'Compiler' },
          { id: (Date.now() + 1).toString(), timestamp: now, type: 'info', message: 'Generating AST from graph nodes...', source: 'Parser' },
        ]);
      } else if (next === 'success') {
        appendLogs([
          { id: Date.now().toString(), timestamp: now, type: 'success', message: 'Compilation finished successfully.', source: 'Compiler' },
        ]);
      }
    };
    window.addEventListener('vvs:compile-state', onCompileState);
    return () => window.removeEventListener('vvs:compile-state', onCompileState);
  }, []);

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case 'info': return <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />;
      case 'success': return <CheckCircle2 size={12} className="text-emerald-500 mt-0.5" />;
      case 'warning': return <AlertTriangle size={12} className="text-amber-500 mt-0.5" />;
      case 'error': return <XCircle size={12} className="text-red-500 mt-0.5" />;
    }
  };

  const getLogColor = (type: LogType) => {
    switch (type) {
      case 'info': return 'text-zinc-300';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400 bg-red-500/10 px-1 -mx-1 rounded';
    }
  };

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col relative overflow-hidden border-t border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-2 h-8 shrink-0">
        <div className="flex items-center gap-2 px-3 text-[11px] font-semibold text-zinc-100">
          <Terminal size={12} />
          Compiler Log
        </div>
        <Tooltip content="Clear Console" placement="bottom">
          <button
            onClick={() => {
              setLogs([]);
              navigableErrorsRef.current = [];
            }}
            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={12} />
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed">
        <div className="flex flex-col gap-0.5">
          {logs.map((log) => {
            const isNavigable = Boolean(log.nodeId && log.tabId);
            return (
              <Tooltip
                key={log.id}
                content="Go to node"
                placement="top"
                disabled={!isNavigable}
                className="block w-full min-w-0"
              >
                <div
                  onClick={() => handleLogClick(log)}
                  className={`flex items-start gap-2 px-1 py-0.5 rounded transition-colors group ${
                    isNavigable ? 'hover:bg-zinc-800/50 cursor-pointer' : 'hover:bg-zinc-800/30'
                  }`}
                >
                <div className="flex items-center gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <span className="text-zinc-600 flex items-center gap-1 w-20"><Clock size={10} /> {log.timestamp}</span>
                  <span className="text-zinc-500 w-20 truncate">[{log.source}]</span>
                </div>
                <div className="shrink-0 w-4 flex justify-center">{getLogIcon(log.type)}</div>
                <div className={`flex-1 break-all ${getLogColor(log.type)}`}>
                  {log.message}
                  {isNavigable && (
                    <span className="ml-2 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      → node
                    </span>
                  )}
                </div>
                </div>
              </Tooltip>
            );
          })}
          {logs.length === 0 && <div className="text-zinc-600 italic px-2">No compiler logs available.</div>}
        </div>
      </div>
    </div>
  );
}
