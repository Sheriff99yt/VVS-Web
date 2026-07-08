import type {
  ClassSymbol,
  FunctionSymbol,
  GraphContainer,
  GraphTab,
  ProjectEventDefinition,
  VariableSymbol,
} from '@vvs/graph-types';
import { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID, classHomeGraphId, classForHomeGraphId } from '@vvs/graph-types';

export { MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID, classHomeGraphId, classForHomeGraphId };

export function symbolClassId(item: { classId?: string }): string {
  return item.classId ?? MAIN_CLASS_ID;
}

export function classContainerId(cls: ClassSymbol): string {
  return cls.containerId ?? MAIN_GRAPH_CONTAINER_ID;
}

export function classesForContainer(classes: ClassSymbol[], containerId: string): ClassSymbol[] {
  return classes.filter((cls) => classContainerId(cls) === containerId);
}

export function symbolsForClass<T extends { classId?: string }>(
  items: T[],
  classId: string
): T[] {
  return items.filter((item) => symbolClassId(item) === classId);
}

export function activeClass(
  classes: ClassSymbol[],
  activeClassId: string
): ClassSymbol | undefined {
  return classes.find((c) => c.id === activeClassId) ?? classes[0];
}

export function defaultActiveClassId(classes: ClassSymbol[]): string {
  return classes[0]?.id ?? MAIN_CLASS_ID;
}

export function classScopedSymbols(
  classId: string,
  symbols: {
    variables: VariableSymbol[];
    functions: FunctionSymbol[];
    events: ProjectEventDefinition[];
  }
) {
  return {
    variables: symbolsForClass(symbols.variables, classId),
    functions: symbolsForClass(symbols.functions, classId),
    events: symbolsForClass(symbols.events, classId),
  };
}

export function classGraphTabId(cls: ClassSymbol): string {
  return classHomeGraphId(cls);
}

export function isOnClassHomeGraph(
  activeGraphTab: string,
  cls: ClassSymbol | undefined
): boolean {
  return cls != null && activeGraphTab === classHomeGraphId(cls);
}

/** @deprecated Use isOnClassHomeGraph */
export function isActiveClassGraphTab(
  activeGraphTab: string,
  cls: ClassSymbol | undefined
): boolean {
  return isOnClassHomeGraph(activeGraphTab, cls);
}

export function containerMatchesFilter(
  container: GraphContainer,
  classes: ClassSymbol[],
  query: string,
  matches: (value: string, query: string) => boolean
): boolean {
  if (matches(container.name, query)) return true;
  return classesForContainer(classes, container.id).some((cls) => matches(cls.name, query));
}
