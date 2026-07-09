import type { ClassSymbol, FunctionSymbol, GraphContainer } from '@vvs/graph-types';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import {
  classGraphTabId,
  classContainerId,
  classesForContainer,
  symbolClassId,
} from '@/lib/classScope';

/** Tab ids whose emitted files belong under a graph container folder. */
export function tabIdsForContainer(
  containerId: string,
  classes: ClassSymbol[],
  functions: FunctionSymbol[]
): Set<string> {
  const tabIds = new Set<string>();
  for (const cls of classesForContainer(classes, containerId)) {
    tabIds.add(classGraphTabId(cls));
  }
  for (const fn of functions) {
    const classId = symbolClassId(fn);
    const cls = classes.find((c) => c.id === classId);
    if (cls && classContainerId(cls) === containerId) {
      tabIds.add(fn.id);
    }
  }
  return tabIds;
}

export function outputFilesForContainer(
  containerId: string,
  classes: ClassSymbol[],
  functions: FunctionSymbol[],
  fileOwners: Record<string, string>,
  filePaths: string[]
): string[] {
  const tabIds = tabIdsForContainer(containerId, classes, functions);
  return filePaths.filter((path) => {
    const owner = fileOwners[path];
    return owner != null && tabIds.has(owner);
  });
}

export function outputFilesForClass(
  cls: ClassSymbol,
  functions: FunctionSymbol[],
  fileOwners: Record<string, string>,
  filePaths: string[]
): string[] {
  const homeTab = classGraphTabId(cls);
  const fnTabs = functions
    .filter((fn) => symbolClassId(fn) === cls.id)
    .map((fn) => fn.id);
  const owners = new Set([homeTab, ...fnTabs]);
  return filePaths.filter((path) => {
    const owner = fileOwners[path];
    return owner != null && owners.has(owner);
  });
}

export function containerEmitHint(container: GraphContainer): string | undefined {
  if (container.id === MAIN_GRAPH_CONTAINER_ID) return undefined;
  const slug = container.name.trim().replace(/[^a-zA-Z0-9_-]+/g, '_');
  return slug ? `emit: ${slug}/` : undefined;
}
