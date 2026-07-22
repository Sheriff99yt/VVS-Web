import { useCallback, useRef, startTransition } from 'react';
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
 *
 * The `logActivity` side effect runs **after** the React state settles (via a queued
 * microtask + ids ref) instead of inside the `setSelectedNodeIds` updater. Calling
 * `logActivity` from within a setState updater notifies the activity-log external
 * store synchronously, which re-renders subscribers such as `CompactActionHistory`
 * while a parent (e.g. `ProjectProvider`) is still rendering — React 19 surfaces this
 * as "Cannot update a component while rendering a different component". Pulling the
 * notification out of the updater keeps it strictly post-render.
 */
export function useSyncProjectSelection({
  isCanvasActive,
  setSelection,
  setSelectedNodeIds,
  setSelectedTreeSymbols,
}: UseSyncProjectSelectionOptions) {
  // Latest prevIds seen by the updater; read by the queued side effect below.
  const lastPrevIdsRef = useRef<string[] | null>(null);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const ids = selectedNodes.map((node) => node.id);
      if (!isCanvasActive && ids.length === 0) return;

      startTransition(() => {
        lastPrevIdsRef.current = null;

        setSelectedNodeIds((prevIds) => {
          lastPrevIdsRef.current = prevIds;
          const unchanged = nodeIdsEqual(prevIds, ids);
          setSelection((prev) => {
            // Keep code-preview inspector when RF re-emits the same selection.
            if (unchanged && prev.type === 'code') return prev;
            return selectionFromCanvasNodes(prev, ids);
          });
          if (ids.length > 0) setSelectedTreeSymbols?.([]);
          return unchanged ? prevIds : ids;
        });

        // Side effect moved out of the setState updater: queue a microtask so it
        // runs after React commits the render, never synchronously mid-render.
        queueMicrotask(() => {
          const prevIds = lastPrevIdsRef.current;
          if (prevIds == null) return;
          if (!nodeIdsEqual(prevIds, ids)) {
            logActivity('select', selectionActivityLabel(ids.length), {
              group: ACTIVITY_GROUP.selection,
            });
          }
          lastPrevIdsRef.current = null;
        });
      });
    },
    [isCanvasActive, setSelection, setSelectedNodeIds, setSelectedTreeSymbols]
  );

  useOnSelectionChange({ onChange: handleSelectionChange });
}
