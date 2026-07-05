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
}

export { runProjectAnalysis } from './projectAnalysis';
