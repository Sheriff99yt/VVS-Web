import type { TargetLanguage } from './symbols';

export interface SourceRange {
  filePath: string;
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface TranspileResult {
  language: TargetLanguage;
  files: GeneratedFile[];
  sourceMap: Record<string, SourceRange[]>;
  fragments?: Record<string, string>;
}

export interface TranspileContext {
  moduleName: string;
  extendsType: string;
  targetLanguage: TargetLanguage;
  variables: import('./symbols').GraphVariable[];
  projectEvents: import('./symbols').ProjectEventDefinition[];
  functions: import('./symbols').FunctionSymbol[];
  nodes: import('./nodes').GraphNode[];
  edges: import('./nodes').GraphEdge[];
  tabLabel?: string;
  tabId?: string;
  documents?: Record<string, import('./symbols').GraphDocument>;
}
