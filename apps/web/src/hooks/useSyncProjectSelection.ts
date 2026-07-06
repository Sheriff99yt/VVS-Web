import { useCallback, startTransition } from 'react';
import { useOnSelectionChange, type OnSelectionChangeParams } from '@xyflow/react';
import type { SelectionState } from '@/contexts/ProjectContext';

interface UseSyncProjectSelectionOptions {
  isCanvasActive: boolean;
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>;
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
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
}: UseSyncProjectSelectionOptions) {
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (!isCanvasActive) return;

      startTransition(() => {
        const ids = selectedNodes.map((node) => node.id);

        setSelectedNodeIds((prev) => (nodeIdsEqual(prev, ids) ? prev : ids));

        if (selectedNodes.length > 0) {
          const id = selectedNodes[0]!.id;
          setSelection((prev) =>
            prev.type === 'node' && prev.id === id ? prev : { type: 'node', id }
          );
          return;
        }

        setSelection((prev) =>
          prev.type === 'graph' && prev.id === null ? prev : { type: 'graph', id: null }
        );
      });
    },
    [isCanvasActive, setSelection, setSelectedNodeIds]
  );

  useOnSelectionChange({ onChange: handleSelectionChange });
}
