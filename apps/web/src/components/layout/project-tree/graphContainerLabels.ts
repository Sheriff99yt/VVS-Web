import { MAIN_GRAPH_CONTAINER_ID, PROJECT_MAP_CONTAINER_NAME } from '@vvs/graph-types';
import type { GraphContainer } from '@vvs/graph-types';

/** User-facing label for a graph container (canvas tab + class output grouping). */
export function graphContainerLabel(container: Pick<GraphContainer, 'id' | 'name'>): string {
  if (container.id === MAIN_GRAPH_CONTAINER_ID) {
    return PROJECT_MAP_CONTAINER_NAME;
  }
  return container.name;
}

export function graphContainerClassMeta(count: number): string | undefined {
  if (count === 0) return undefined;
  return `${count} class${count === 1 ? '' : 'es'}`;
}
