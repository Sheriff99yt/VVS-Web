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
  /**
   * U71: double-click a line → reverse-select the representing canvas node.
   * Receives 1-based line and column from the click position.
   */
  onReverseSelectLine?: (line: number, col: number) => void;
  /**
   * Hover a line → highlight the matching node on the current graph only
   * (no selection / camera). `null` when leaving the editor or no mapping.
   */
  onHoverSourceLocation?: (line: number, col: number) => void;
  onHoverSourceLeave?: () => void;
}
