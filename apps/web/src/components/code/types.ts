import type { TargetLanguage } from '@/contexts/ProjectContext';
import type { SourceRange } from '@/types/transpile';

/**
 * View contract for generated code — swappable editor implementation.
 * See docs/node_system.md §6 and §11.
 */
export interface GeneratedCodeViewProps {
  value: string;
  language: TargetLanguage;
  /** Line ranges to highlight (from TranspileResult.sourceMap). */
  highlightRanges?: SourceRange[];
  readOnly?: boolean;
  className?: string;
}
