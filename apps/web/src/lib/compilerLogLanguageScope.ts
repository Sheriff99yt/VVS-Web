import type { LogEntry } from '@/hooks/useCompilerLogs';
import type { ValidationMessage } from '@/lib/graphValidator';

/** Sources that are never language-scoped (always visible). */
export function isLanguageAgnosticLogSource(source: string): boolean {
  return source !== 'Validator';
}

/**
 * U87: when scoped, only Validator lines tagged for `scopeLanguage` remain.
 * Untagged Validator lines are hidden (they cannot be attributed to a language).
 */
export function filterLogsForLanguageScope(
  logs: LogEntry[],
  scoped: boolean,
  scopeLanguage: string
): LogEntry[] {
  if (!scoped) return logs;
  return logs.filter((log) => {
    if (isLanguageAgnosticLogSource(log.source)) return true;
    return Boolean(log.language) && log.language === scopeLanguage;
  });
}

/** Live validation → log lines for the scoped language view. */
export function liveValidationToLogEntries(
  errors: ValidationMessage[],
  warnings: ValidationMessage[],
  language: string
): LogEntry[] {
  const now = new Date().toLocaleTimeString();
  const pack = (msgs: ValidationMessage[], type: 'error' | 'warning') =>
    msgs.map((msg, index) => ({
      id: `live-${language}-${type}-${msg.code ?? 'x'}-${msg.nodeId ?? msg.symbolId ?? index}`,
      timestamp: now,
      type,
      message: msg.tabId ? `[${msg.tabId}] ${msg.message}` : msg.message,
      source: 'Validator' as const,
      tabId: msg.tabId,
      nodeId: msg.nodeId,
      symbolId: msg.symbolId,
      language,
    }));
  return [...pack(errors, 'error'), ...pack(warnings, 'warning')];
}

/**
 * Scoped log view: keep non-Validator history, drop historical Validator noise,
 * show live diagnostics for the current language instead.
 */
export function buildLanguageScopedLogView(
  logs: LogEntry[],
  scopeLanguage: string,
  liveErrors: ValidationMessage[],
  liveWarnings: ValidationMessage[]
): LogEntry[] {
  const nonValidator = logs.filter((log) => isLanguageAgnosticLogSource(log.source));
  const live = liveValidationToLogEntries(liveErrors, liveWarnings, scopeLanguage);
  return [...nonValidator, ...live];
}

/**
 * Unscoped log view: keep full history, but replace same-language Validator
 * lines with live diagnostics so chips/log stay in sync with the Code panel.
 */
export function buildUnscopedLogView(
  logs: LogEntry[],
  scopeLanguage: string,
  liveErrors: ValidationMessage[],
  liveWarnings: ValidationMessage[]
): LogEntry[] {
  const kept = logs.filter((log) => {
    if (log.source !== 'Validator') return true;
    // Drop current-language (and untagged) Validator history — live replaces them.
    if (!log.language || log.language === scopeLanguage) return false;
    return true;
  });
  const live = liveValidationToLogEntries(liveErrors, liveWarnings, scopeLanguage);
  return [...kept, ...live];
}

/** Count Validator errors/warnings in a log view (chips / status). */
export function countValidatorLogEntries(logs: LogEntry[]): {
  errorCount: number;
  warningCount: number;
} {
  let errorCount = 0;
  let warningCount = 0;
  for (const log of logs) {
    if (log.source !== 'Validator') continue;
    if (log.type === 'error') errorCount += 1;
    else if (log.type === 'warning') warningCount += 1;
  }
  return { errorCount, warningCount };
}
