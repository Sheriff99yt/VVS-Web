import type { TargetLanguage } from '@/contexts/ProjectContext';
import type { SourceRange } from '@/types/transpile';

export interface CodeHighlightPalette {
  accent: string;
  lineBg: string;
  markBg: string;
}

/** Source range plus optional per-node highlight colors. */
export interface CodeHighlightRange extends SourceRange {
  colors?: CodeHighlightPalette;
}

/**
 * View contract for generated code — swappable editor implementation.
 * See docs/node_system.md §6 and §11.
 */
export interface GeneratedCodeViewProps {
  value: string;
  language: TargetLanguage;
  /** Line ranges to highlight (from TranspileResult.sourceMap). */
  highlightRanges?: CodeHighlightRange[];
  readOnly?: boolean;
  className?: string;
}
