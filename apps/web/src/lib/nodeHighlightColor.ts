import type { CodeHighlightPalette } from '@/components/code/types';
import type { VVSNode } from '@/types/graph';

/** Accent hex values — mirror `graph-tokens.css` and node chrome fallbacks. */
const CATEGORY_ACCENT: Record<string, string> = {
  Events: '#ef4444',
  'Flow Control': '#6b7280',
  Math: '#22c55e',
  Action: '#3b82f6',
  Project: '#818cf8',
  Variables: '#6366f1',
  Imports: '#14b8a6',
};

export const DEFAULT_NODE_HIGHLIGHT: CodeHighlightPalette = {
  accent: '#818cf8',
  lineBg: 'rgba(99, 102, 241, 0.12)',
  markBg: 'rgba(99, 102, 241, 0.28)',
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function paletteFromAccent(accent: string): CodeHighlightPalette {
  return {
    accent,
    lineBg: hexToRgba(accent, 0.12),
    markBg: hexToRgba(accent, 0.28),
  };
}

/** Code-preview highlight palette for a graph node (category-colored). */
export function nodeHighlightColor(node: VVSNode): CodeHighlightPalette {
  const category = node.data?.category;
  if (!category) return DEFAULT_NODE_HIGHLIGHT;
  const accent = CATEGORY_ACCENT[category];
  if (!accent) return DEFAULT_NODE_HIGHLIGHT;
  return paletteFromAccent(accent);
}
