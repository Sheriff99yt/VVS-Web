import type { FunctionSymbol, ProjectEventDefinition } from '@vvs/graph-types';

export interface SymbolIndex {
  functionsById: Map<string, FunctionSymbol>;
  eventsById: Map<string, ProjectEventDefinition>;
  functionsByName: Map<string, FunctionSymbol>;
}

/** Stage A — snapshot symbol lookup for lowering. */
export function buildSymbolIndex(
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[]
): SymbolIndex {
  const functionsById = new Map(functions.map((f) => [f.id, f]));
  const functionsByName = new Map(functions.map((f) => [f.name.toLowerCase(), f]));
  const eventsById = new Map(events.map((e) => [e.id, e]));
  return { functionsById, functionsByName, eventsById };
}
