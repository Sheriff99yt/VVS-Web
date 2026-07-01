import { GraphTab } from '@/contexts/ProjectContext';
import { GraphDocument } from '@/lib/graphDefaults';
import { LibraryAsset } from '@/types/libraryAsset';
import { LIBRARY_GRAPH_FIXTURES } from './libraryCatalog';
import { createFunctionId, formatFunctionTabName } from './functionTabs';
import { createMacroId } from './graphTabs';

export interface LibraryImportPayload {
  tab: GraphTab;
  document: GraphDocument;
  functionEntry?: { id: string; name: string };
}

export function buildLibraryImport(asset: LibraryAsset): LibraryImportPayload | null {
  if (asset.importKind === 'node_pack_only') return null;

  const fixture = LIBRARY_GRAPH_FIXTURES[asset.id];
  if (!fixture) return null;

  const safeName = asset.title.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 24) || 'Imported';

  if (asset.importKind === 'function_graph') {
    const id = createFunctionId();
    return {
      tab: { id, type: 'function', name: formatFunctionTabName(safeName) },
      document: structuredClone(fixture),
      functionEntry: { id, name: safeName },
    };
  }

  if (asset.importKind === 'template_graph') {
    const id = createMacroId();
    return {
      tab: { id, type: 'macro', name: `Macro: ${safeName}` },
      document: structuredClone(fixture),
    };
  }

  return null;
}

export function dispatchLibraryImport(payload: LibraryImportPayload): void {
  window.dispatchEvent(new CustomEvent('vvs:import-library-graph', { detail: payload }));
}
