import type { ClassSymbol, FunctionSymbol, GraphContainer, ProjectFolderPathEntry } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID, VVS_DIR, containerEmitSubdir } from '@vvs/graph-types';
import { buildGeneratedFileTree, type GeneratedFileTreeNode } from '@/lib/generatedFileTree';
import { classGraphTabId, classesForContainer, symbolClassId } from '@/lib/classScope';
import { tabIdsForContainer } from '@/lib/structureOutputFiles';

export type GraphTabKind = 'class' | 'function' | 'container';

/** Strip a single top-level directory when it only repeats the container emit folder name. */
export function unwrapEmitContainerRoot(
  tree: GeneratedFileTreeNode[],
  container: GraphContainer
): GeneratedFileTreeNode[] {
  const prefix = containerEmitSubdir(container);
  if (!prefix || tree.length !== 1) return tree;
  const root = tree[0];
  if (root?.kind === 'directory' && root.name === prefix) {
    return root.children ?? [];
  }
  return tree;
}

/** Build emit tree without duplicating the container folder name under the container row. */
export function displayEmitTreeForContainer(
  container: GraphContainer,
  classes: ClassSymbol[],
  functions: FunctionSymbol[],
  fileOwners: Record<string, string>,
  allPaths: string[]
): GeneratedFileTreeNode[] {
  return unwrapEmitContainerRoot(
    buildContainerEmitTree(container, classes, functions, fileOwners, allPaths),
    container
  );
}

/** Paths under `.vvs/` with the prefix removed for display under a single `.vvs` header. */
export function vvsRelativePaths(paths: string[]): string[] {
  return paths
    .map((path) => {
      if (path.startsWith(`${VVS_DIR}/`)) return path.slice(VVS_DIR.length + 1);
      if (path === VVS_DIR) return '';
      return path;
    })
    .filter(Boolean);
}

export function vvsDisplayTree(paths: string[]): GeneratedFileTreeNode[] {
  return buildGeneratedFileTree(vvsRelativePaths(paths));
}

export function resolveGraphTabKind(
  tabId: string,
  classes: ClassSymbol[],
  functions: FunctionSymbol[],
  graphContainers: GraphContainer[]
): GraphTabKind | undefined {
  if (graphContainers.some((c) => c.id === tabId)) return 'container';
  if (classes.some((cls) => classGraphTabId(cls) === tabId)) return 'class';
  if (functions.some((fn) => fn.id === tabId)) return 'function';
  return undefined;
}

export function emitPathForTab(
  tabId: string,
  fileOwners: Record<string, string>
): string | undefined {
  return Object.entries(fileOwners).find(([, owner]) => owner === tabId)?.[0];
}

export function pathsForContainer(
  container: GraphContainer,
  classes: ClassSymbol[],
  functions: FunctionSymbol[],
  fileOwners: Record<string, string>,
  allPaths: string[]
): string[] {
  const prefix = containerEmitSubdir(container);
  const tabIds = tabIdsForContainer(container.id, classes, functions);
  return allPaths.filter((path) => {
    const owner = fileOwners[path];
    if (owner && tabIds.has(owner)) return true;
    if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) return true;
    return false;
  });
}

export function buildContainerEmitTree(
  container: GraphContainer,
  classes: ClassSymbol[],
  functions: FunctionSymbol[],
  fileOwners: Record<string, string>,
  allPaths: string[]
): GeneratedFileTreeNode[] {
  return buildGeneratedFileTree(
    pathsForContainer(container, classes, functions, fileOwners, allPaths)
  );
}

export function vvsFolderEntries(entries: ProjectFolderPathEntry[]): ProjectFolderPathEntry[] {
  return entries.filter((entry) => entry.path.startsWith(`${VVS_DIR}/`) || entry.path === `${VVS_DIR}`);
}

export function rootOrphanEntries(
  entries: ProjectFolderPathEntry[],
  fileOwners: Record<string, string>,
  graphContainers: GraphContainer[],
  classes: ClassSymbol[],
  functions: FunctionSymbol[]
): ProjectFolderPathEntry[] {
  const claimed = new Set<string>();
  for (const entry of entries) {
    if (entry.path.startsWith(`${VVS_DIR}/`)) claimed.add(entry.path);
  }
  for (const container of graphContainers) {
    for (const path of pathsForContainer(
      container,
      classes,
      functions,
      fileOwners,
      entries.map((e) => e.path)
    )) {
      claimed.add(path);
    }
  }
  return entries.filter((entry) => !claimed.has(entry.path) && entry.kind !== 'vvs');
}

export function classForTab(
  tabId: string,
  classes: ClassSymbol[]
): ClassSymbol | undefined {
  return classes.find((cls) => classGraphTabId(cls) === tabId);
}

export function functionForTab(
  tabId: string,
  functions: FunctionSymbol[]
): FunctionSymbol | undefined {
  return functions.find((fn) => fn.id === tabId);
}

export function draggableClassForTab(
  tabId: string,
  classes: ClassSymbol[],
  functions: FunctionSymbol[]
): ClassSymbol | undefined {
  const cls = classForTab(tabId, classes);
  if (cls) return cls;
  const fn = functionForTab(tabId, functions);
  if (!fn) return undefined;
  return classes.find((c) => c.id === symbolClassId(fn));
}

export function isOrgOnlyContainer(
  container: GraphContainer,
  classes: ClassSymbol[]
): boolean {
  return (
    container.id === MAIN_GRAPH_CONTAINER_ID &&
    classesForContainer(classes, container.id).length === 0
  );
}
