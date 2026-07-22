import type { TargetLanguage } from '@/contexts/ProjectContext';
import type { SourceRange } from '@/types/transpile';

export interface CodeHighlightPalette {
  accent: string;
  lineBg: string;
  markBg: string;
}

export interface CodeHighlightRange extends SourceRange {
  colors?: CodeHighlightPalette;
  /** When true, this range is for code-line hovering and must not trigger auto-scroll. */
  isCodeHover?: boolean;
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
  /** Explicit scroll request — scrolls once when sequenceId increments. */
  scrollToLine?: { line: number; sequenceId: number } | null;
  readOnly?: boolean;
  className?: string;
  /**
   * U71: double-click a line → reverse-select the representing canvas node.
   * Receives 1-based line and column from the click position.
   */
  onReverseSelectLine?: (line: number, col: number) => void;
  onHoverSourceLocation?: (line: number, col: number) => void;
  onHoverSourceLeave?: () => void;
  onSelectionRangeChange?: (
    selection: { startLine: number; startCol: number; endLine: number; endCol: number } | null
  ) => void;
}
