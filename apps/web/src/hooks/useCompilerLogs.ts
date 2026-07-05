'use client';

import { useEffect, useRef, useState } from 'react';
import type { ValidationResult } from '@/lib/graphValidator';

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  source: string;
  tabId?: string;
  nodeId?: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'boot',
    timestamp: new Date().toLocaleTimeString(),
    type: 'info',
    message: 'VVS engine ready.',
    source: 'System',
  },
];

export function useCompilerLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const navigableErrorsRef = useRef<LogEntry[]>([]);

  const appendLogs = (entries: LogEntry[]) => {
    if (entries.length === 0) return;
    setLogs((prev) => [...prev, ...entries]);
    const withNode = entries.filter((e) => e.nodeId && e.tabId);
    if (withNode.length > 0) {
      navigableErrorsRef.current = [...navigableErrorsRef.current, ...withNode];
    }
  };

  const clearLogs = () => {
    setLogs([]);
    navigableErrorsRef.current = [];
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
    const onValidation = (event: Event) => {
      const result = (event as CustomEvent<ValidationResult>).detail;
      const now = new Date().toLocaleTimeString();
      navigableErrorsRef.current = [];
      appendLogs(
        result.messages.map((msg, index) => ({
          id: `val-${Date.now()}-${index}`,
          timestamp: now,
          type: msg.level === 'error' ? 'error' : 'warning',
          message: msg.tabId ? `[${msg.tabId}] ${msg.message}` : msg.message,
          source: 'Validator',
          tabId: msg.tabId,
          nodeId: msg.nodeId,
        }))
      );
    };
    window.addEventListener('vvs:validation-result', onValidation);
    return () => window.removeEventListener('vvs:validation-result', onValidation);
  }, []);

  useEffect(() => {
    const onCompileState = (event: Event) => {
      const next = (event as CustomEvent<{ state: 'clean' | 'dirty' | 'compiling' | 'success' | 'error' }>)
        .detail.state;
      const now = new Date().toLocaleTimeString();
      if (next === 'compiling') {
        appendLogs([
          {
            id: Date.now().toString(),
            timestamp: now,
            type: 'info',
            message: 'Generating code…',
            source: 'Compiler',
          },
        ]);
      } else if (next === 'success') {
        appendLogs([
          {
            id: Date.now().toString(),
            timestamp: now,
            type: 'success',
            message: 'Generation finished.',
            source: 'Compiler',
          },
        ]);
      } else if (next === 'error') {
        appendLogs([
          {
            id: Date.now().toString(),
            timestamp: now,
            type: 'error',
            message: 'Generation failed.',
            source: 'Compiler',
          },
        ]);
      }
    };
    window.addEventListener('vvs:compile-state', onCompileState);
    return () => window.removeEventListener('vvs:compile-state', onCompileState);
  }, []);

  return { logs, appendLogs, clearLogs, navigableErrorsRef };
}
