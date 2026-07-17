export interface ValidationMessage {
  level: 'error' | 'warning';
  message: string;
  tabId?: string;
  nodeId?: string;
  code?: string;
  symbolId?: string;
}

export interface ValidationResult {
  ok: boolean;
  messages: ValidationMessage[];
  /** Target language these messages were produced for (U87 log scoping). */
  language?: string;
}

export { runProjectAnalysis } from './projectAnalysis';
