export type DiagnosticLevel = 'error' | 'warning' | 'info';

export interface Diagnostic {
  level: DiagnosticLevel;
  message: string;
  code?: string;
  tabId?: string;
  nodeId?: string;
  edgeId?: string;
  symbolId?: string;
  source?: 'structural' | 'semantic' | 'portability';
}

export interface AnalysisResult {
  ok: boolean;
  diagnostics: Diagnostic[];
}

export function diagnosticsToValidationMessages(
  diagnostics: Diagnostic[]
): Array<{
  level: 'error' | 'warning';
  message: string;
  tabId?: string;
  nodeId?: string;
  symbolId?: string;
  code?: string;
}> {
  return diagnostics
    .filter((d) => d.level === 'error' || d.level === 'warning')
    .map((d) => ({
      level: d.level as 'error' | 'warning',
      message: d.message,
      tabId: d.tabId,
      nodeId: d.nodeId,
      symbolId: d.symbolId,
      code: d.code,
    }));
}
