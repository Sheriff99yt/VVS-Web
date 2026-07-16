import type { ClassSymbol, GraphContainer, VariableSymbol } from '@vvs/graph-types';
import type { SelectionState } from '@/contexts/ProjectContext';
import { classContainerId, classGraphTabId, symbolClassId } from '@/lib/classScope';

/** Resolved canvas tab + reference target for a class home graph. */
export interface ClassHomeGraphTarget {
  /** Tab id passed to `navigate({ graphTab })` — container id when present. */
  graphTab: string;
  /** Class document tab for references / breadcrumbs. */
  referenceTabId: string;
  container: GraphContainer | undefined;
}
import type { GraphDocument } from '@vvs/graph-types';

export function resolveClassHomeGraphTarget(
  cls: ClassSymbol,
  graphContainers: GraphContainer[],
  documents: Record<string, GraphDocument>,
  activeGraphTab: string
): ClassHomeGraphTarget {
  let targetTabId = activeGraphTab;

  // Search all documents for the class_define node
  for (const [tabId, doc] of Object.entries(documents)) {
    const hasDefine = doc.nodes.some(
      (n) => n.data.kindId === 'class_define' && n.data.properties?.symbolId === cls.id
    );
    if (hasDefine) {
      targetTabId = tabId;
      break;
    }
  }

  const container = graphContainers.find((c) => c.id === targetTabId);
  return {
    graphTab: targetTabId,
    referenceTabId: targetTabId,
    container,
  };
}

/** Navigation frame fields every tree-driven symbol open must pass atomically. */
export function canvasFocusFrame(
  graphTab: string,
  selection: SelectionState
): { graphTab: string; editorView: 'canvas'; selection: SelectionState } {
  return { graphTab, editorView: 'canvas', selection };
}

/** Navigation frame for compiler log / cross-panel jumps to a project variable. */
export function resolveVariableFocusFrame(
  variableId: string,
  variables: VariableSymbol[],
  classes: ClassSymbol[],
  graphContainers: GraphContainer[],
  documents: Record<string, GraphDocument>,
  activeGraphTab: string
): ReturnType<typeof canvasFocusFrame> | null {
  const variable = variables.find((v) => v.id === variableId);
  if (!variable) return null;

  const cls = classes.find((c) => c.id === symbolClassId(variable));
  if (!cls) return null;

  const { graphTab } = resolveClassHomeGraphTarget(cls, graphContainers, documents, activeGraphTab);
  return canvasFocusFrame(graphTab, { type: 'variable', id: variableId });
}
