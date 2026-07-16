import { GraphTab } from '@/contexts/ProjectContext';
import { GraphDocument } from '@/lib/graphDefaults';
import { LibraryAsset } from '@/types/libraryAsset';
import { LIBRARY_GRAPH_FIXTURES } from './libraryCatalog';
import { createFunctionSymbol } from './functionTabs';
import type { ClassSymbol, FunctionSymbol } from '@vvs/graph-types';
import { loadEnvironmentManifest } from '@vvs/environment-templates';
import { linkEnvironmentManifest } from './environmentCatalog';
import type { TargetLanguage } from '@vvs/graph-types';
import { activeClass } from '@/lib/classScope';
import { insertDefineNodeForFunction } from '@/lib/defineNodeSync';

export interface LibraryImportPayload {
  tab: GraphTab;
  document: GraphDocument;
  functionEntry?: FunctionSymbol;
}

export interface EnvironmentLinkPayload {
  kind: 'environment';
  environmentId: string;
  environmentVersion: string;
  targetLanguage: TargetLanguage;
  projectDetails: {
    moduleName: string;
    extendsType: string;
    description: string;
  };
}

export type LibraryOpenPayload = LibraryImportPayload | EnvironmentLinkPayload;

export function buildLibraryImport(asset: LibraryAsset): LibraryOpenPayload | null {
  if (asset.importKind === 'node_pack_only') return null;

  if (asset.importKind === 'environment' && asset.environmentId) {
    const manifest = loadEnvironmentManifest(asset.environmentId);
    if (!manifest) return null;
    const link = linkEnvironmentManifest(manifest, manifest.defaultTarget);
    return {
      kind: 'environment',
      environmentId: link.environmentId,
      environmentVersion: link.environmentVersion,
      targetLanguage: link.targetLanguage,
      projectDetails: link.projectDetails,
    };
  }

  const fixture = LIBRARY_GRAPH_FIXTURES[asset.id];
  if (!fixture) return null;

  const safeName = asset.title.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 24) || 'Imported';

  if (asset.importKind === 'function_graph' || asset.importKind === 'template_graph') {
    const func = createFunctionSymbol(safeName);
    return {
      tab: { id: func.id, type: 'function', name: `Function: ${safeName}` },
      document: structuredClone(fixture),
      functionEntry: func,
    };
  }

  return null;
}

export function dispatchLibraryImport(payload: LibraryImportPayload): void {
  window.dispatchEvent(new CustomEvent('vvs:import-library-graph', { detail: payload }));
}

export function dispatchEnvironmentLink(payload: EnvironmentLinkPayload): void {
  window.dispatchEvent(new CustomEvent('vvs:link-environment', { detail: payload }));
}

export function isEnvironmentLinkPayload(
  payload: LibraryOpenPayload
): payload is EnvironmentLinkPayload {
  return 'kind' in payload && payload.kind === 'environment';
}

export function dispatchLibraryOpen(payload: LibraryOpenPayload): void {
  if (isEnvironmentLinkPayload(payload)) {
    dispatchEnvironmentLink(payload);
    return;
  }
  dispatchLibraryImport(payload);
}

/** Dual-write function_define on the class home graph when importing a function tab. */
export function dualWriteLibraryImportDefines(
  documents: Record<string, GraphDocument>,
  classes: ClassSymbol[],
  activeClassId: string,
  payload: LibraryImportPayload
): Record<string, GraphDocument> {
  if (!payload.functionEntry) return documents;
  const cls = activeClass(classes, activeClassId);
  if (!cls) return documents;
  return insertDefineNodeForFunction(documents, cls, payload.functionEntry);
}
