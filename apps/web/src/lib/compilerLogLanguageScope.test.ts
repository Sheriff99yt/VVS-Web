import { describe, expect, test } from 'bun:test';
import type { LogEntry } from '@/hooks/useCompilerLogs';
import {
  buildLanguageScopedLogView,
  buildUnscopedLogView,
  countValidatorLogEntries,
  filterLogsForLanguageScope,
} from './compilerLogLanguageScope';

const base = (partial: Partial<LogEntry> & Pick<LogEntry, 'id' | 'source' | 'message'>): LogEntry => ({
  timestamp: '12:00:00',
  type: 'warning',
  ...partial,
});

describe('compilerLogLanguageScope', () => {
  test('unscoped keeps every line', () => {
    const logs = [
      base({ id: '1', source: 'System', message: 'ready', type: 'info' }),
      base({ id: '2', source: 'Validator', message: 'py', language: 'python' }),
      base({ id: '3', source: 'Validator', message: 'cpp', language: 'cpp' }),
      base({ id: '4', source: 'Validator', message: 'untagged' }),
    ];
    expect(filterLogsForLanguageScope(logs, false, 'python')).toHaveLength(4);
  });

  test('scoped hides other-language and untagged Validator lines', () => {
    const logs = [
      base({ id: '1', source: 'System', message: 'ready', type: 'info' }),
      base({ id: '2', source: 'Validator', message: 'py', language: 'python' }),
      base({ id: '3', source: 'Validator', message: 'cpp', language: 'cpp' }),
      base({ id: '4', source: 'Validator', message: 'untagged' }),
    ];
    const visible = filterLogsForLanguageScope(logs, true, 'python');
    expect(visible.map((l) => l.id)).toEqual(['1', '2']);
  });

  test('scoped live view drops historical Validator and uses live diagnostics', () => {
    const logs = [
      base({ id: '1', source: 'Compiler', message: 'Generating…', type: 'info' }),
      base({ id: '2', source: 'Validator', message: 'old cpp', language: 'cpp' }),
      base({ id: '3', source: 'Validator', message: 'old py', language: 'python' }),
    ];
    const view = buildLanguageScopedLogView(
      logs,
      'python',
      [{ level: 'error', message: 'live error', nodeId: 'n1', tabId: 'main' }],
      [{ level: 'warning', message: 'live warn' }]
    );
    expect(view.map((l) => l.source)).toEqual(['Compiler', 'Validator', 'Validator']);
    expect(view[1]!.message).toContain('live error');
    expect(view[1]!.language).toBe('python');
    expect(view[2]!.message).toBe('live warn');
  });

  test('countValidatorLogEntries matches visible Validator lines', () => {
    const logs = [
      base({ id: '1', source: 'System', message: 'ready', type: 'info' }),
      base({ id: '2', source: 'Validator', message: 'e', type: 'error', language: 'python' }),
      base({ id: '3', source: 'Validator', message: 'w1', type: 'warning', language: 'python' }),
      base({ id: '4', source: 'Validator', message: 'w2', type: 'warning', language: 'cpp' }),
    ];
    expect(countValidatorLogEntries(logs)).toEqual({ errorCount: 1, warningCount: 2 });
    expect(countValidatorLogEntries(filterLogsForLanguageScope(logs, true, 'python'))).toEqual({
      errorCount: 1,
      warningCount: 1,
    });
  });

  test('unscoped view keeps other-language history and injects live current lang', () => {
    const logs = [
      base({ id: '1', source: 'Compiler', message: 'done', type: 'success' }),
      base({ id: '2', source: 'Validator', message: 'old cpp', language: 'cpp', type: 'warning' }),
      base({ id: '3', source: 'Validator', message: 'old py', language: 'python', type: 'warning' }),
    ];
    const view = buildUnscopedLogView(
      logs,
      'python',
      [],
      [{ level: 'warning', message: 'live py warn' }]
    );
    expect(view.map((l) => l.message)).toEqual(['done', 'old cpp', 'live py warn']);
    expect(countValidatorLogEntries(view)).toEqual({ errorCount: 0, warningCount: 2 });
  });
});
