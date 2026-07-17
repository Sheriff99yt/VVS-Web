import { useCallback, startTransition } from 'react';
import { useOnSelectionChange, type OnSelectionChangeParams } from '@xyflow/react';
import type { SelectionState, TreeSymbolSelectionKey } from '@/contexts/ProjectContext';
import { selectionFromCanvasNodes } from '@/lib/projectSelection';
import {
  ACTIVITY_GROUP,
  logActivity,
  selectionActivityLabel,
} from '@/lib/actionActivityLog';

interface UseSyncProjectSelectionOptions {
  isCanvasActive: boolean;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedTreeSymbols?: React.Dispatch<React.SetStateAction<TreeSymbolSelectionKey[]>>;
}

function nodeIdsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Mirrors React Flow node selection into ProjectContext for the floating inspector
 * and code preview multi-highlight. Keeps graph selection logic out of GraphCanvas render body.
 */
export function useSyncProjectSelection({
  isCanvasActive,
  setSelection,
  setSelectedNodeIds,
  setSelectedTreeSymbols,
}: UseSyncProjectSelectionOptions) {
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (!isCanvasActive) return;

      startTransition(() => {
        const ids = selectedNodes.map((node) => node.id);

        setSelectedNodeIds((prevIds) => {
          const unchanged = nodeIdsEqual(prevIds, ids);
          setSelection((prev) => {
            // Keep code-preview inspector when RF re-emits the same selection.
            if (unchanged && prev.type === 'code') return prev;
            return selectionFromCanvasNodes(prev, ids);
          });
          if (ids.length > 0) setSelectedTreeSymbols?.([]);
          if (!unchanged) {
            logActivity('select', selectionActivityLabel(ids.length), {
              group: ACTIVITY_GROUP.selection,
            });
          }
          return unchanged ? prevIds : ids;
        });
      });
    },
    [isCanvasActive, setSelection, setSelectedNodeIds, setSelectedTreeSymbols]
  );

  useOnSelectionChange({ onChange: handleSelectionChange });
}
