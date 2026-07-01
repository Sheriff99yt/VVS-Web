import { GraphTab } from '@/contexts/ProjectContext';
import { LibraryCategory } from '@/types/ui';
import { graphDisplayName } from './graphTabs';
import { listMacroEntries } from './projectTree';

const EXEC_FLOW_INPUTS = [
  { id: 'exec_in', label: '', type: 'execution' as const },
];

const EXEC_FLOW_OUTPUTS = [
  { id: 'exec_out', label: '', type: 'execution' as const },
];

export interface ProjectNodeCatalogInput {
  currentGraphId: string;
  functions: { id: string; name: string }[];
  openTabs: GraphTab[];
}

interface ImportableGraph {
  id: string;
  name: string;
}

function listImportableGraphs({
  currentGraphId,
  functions,
  openTabs,
}: ProjectNodeCatalogInput): ImportableGraph[] {
  const entries: ImportableGraph[] = [];

  if (currentGraphId !== 'main') {
    entries.push({ id: 'main', name: 'Main graph' });
  }

  for (const func of functions) {
    if (func.id === currentGraphId) continue;
    entries.push({ id: func.id, name: func.name });
  }

  for (const macro of listMacroEntries(openTabs)) {
    if (macro.id === currentGraphId) continue;
    entries.push({ id: macro.id, name: macro.name });
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

/** Dynamic Project palette — Call Function nodes. */
export function buildCallFunctionCategories(input: ProjectNodeCatalogInput): LibraryCategory[] {
  const items = input.functions
    .filter((func) => func.id !== input.currentGraphId)
    .map((func) => ({
      type: `call_function_${func.id}`,
      label: `Call ${func.name}`,
      category: 'Project',
      linkedGraphId: func.id,
      linkKind: 'call_function' as const,
      inputs: EXEC_FLOW_INPUTS,
      outputs: EXEC_FLOW_OUTPUTS,
    }));

  if (items.length === 0) return [];
  return [{ name: 'Project · Calls', items }];
}

/** Dynamic Imports palette — module import nodes at a specific exec position. */
export function buildImportModuleCategories(input: ProjectNodeCatalogInput): LibraryCategory[] {
  const items = listImportableGraphs(input).map((graph) => ({
    type: `import_module_${graph.id}`,
    label: `Import ${graph.name}`,
    category: 'Imports',
    linkedGraphId: graph.id,
    linkKind: 'import_module' as const,
    inputs: EXEC_FLOW_INPUTS,
    outputs: EXEC_FLOW_OUTPUTS,
  }));

  if (items.length === 0) return [];
  return [{ name: 'Project · Imports', items }];
}

/** All dynamic graph-link node categories for the canvas context menu. */
export function buildProjectNodeCategories(input: ProjectNodeCatalogInput): LibraryCategory[] {
  return [...buildCallFunctionCategories(input), ...buildImportModuleCategories(input)];
}

export function resolveImportableGraphName(
  graphId: string,
  functions: { id: string; name: string }[],
  openTabs: GraphTab[]
): string | undefined {
  if (graphId === 'main') return 'Main graph';
  const func = functions.find((f) => f.id === graphId);
  if (func) return func.name;
  const tab = openTabs.find((t) => t.id === graphId);
  if (tab) return graphDisplayName(tab);
  return undefined;
}
