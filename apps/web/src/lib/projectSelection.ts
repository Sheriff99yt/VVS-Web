import type { SelectionState, SelectionType } from '@/contexts/ProjectContext';

const TREE_SYMBOL_TYPES: ReadonlySet<SelectionType> = new Set([
  'event',
  'variable',
  'function',
  'class',
]);

/** Tree-driven symbol focus (not canvas node picks). */
export function isTreeSymbolSelection(type: SelectionType): boolean {
  return TREE_SYMBOL_TYPES.has(type);
}

/**
 * Clear canvas node selection while preserving tree symbol focus.
 * Used when the active graph tab changes or React Flow deselects all nodes.
 */
export function clearCanvasSelectionKeepTreeSymbol(prev: SelectionState): SelectionState {
  if (isTreeSymbolSelection(prev.type)) return prev;
  if (prev.type === 'node') return { type: 'graph', id: null };
  if (prev.type === 'graph' && prev.id === null) return prev;
  return { type: 'graph', id: null };
}

/** Canvas node picks override tree symbol focus; deselect preserves tree symbols. */
export function selectionFromCanvasNodes(
  prev: SelectionState,
  selectedNodeIds: string[]
): SelectionState {
  if (selectedNodeIds.length === 0) return clearCanvasSelectionKeepTreeSymbol(prev);
  const id = selectedNodeIds[0]!;
  if (prev.type === 'node' && prev.id === id) return prev;
  return { type: 'node', id };
}

/** Prefer live canvas node ids over tree symbol codegen link when both are present. */
export function resolveCodePreviewHighlightNodeIds(
  selection: SelectionState,
  selectedNodeIds: string[],
  symbolHighlightNodeIds: string[] | undefined
): string[] {
  if (selectedNodeIds.length > 0) return selectedNodeIds;
  if (isTreeSymbolSelection(selection.type)) return symbolHighlightNodeIds ?? [];
  if (selection.type === 'node') return selectedNodeIds;
  return symbolHighlightNodeIds ?? [];
}
