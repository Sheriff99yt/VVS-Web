import type {
  ClassSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
  VariableSymbol,
} from '@vvs/graph-types';
import { classGraphHasDefineNodes, classHomeGraphId } from '@vvs/graph-types';
import type { GraphDocument } from '@/lib/graphDefaults';
import {
  hasDefineNodeForClass,
  hasDefineNodeForEvent,
  hasDefineNodeForFunction,
  hasDefineNodeForVariable,
  hasHandlerNodeForEvent,
} from '@/lib/defineNodeSync';
import { symbolClassId } from '@/lib/classScope';

export function countMissingDeclaresForClass(
  documents: Record<string, GraphDocument> | null,
  cls: ClassSymbol,
  variables: VariableSymbol[],
  functions: FunctionSymbol[],
  events: ProjectEventDefinition[]
): number {
  if (!documents) return 0;

  let missing = 0;
  const homeDoc = documents[classHomeGraphId(cls)];
  if (classGraphHasDefineNodes(homeDoc) && !hasDefineNodeForClass(documents, cls)) {
    missing += 1;
  }

  for (const variable of variables.filter((v) => symbolClassId(v) === cls.id)) {
    if (!hasDefineNodeForVariable(documents, cls, variable.id)) missing += 1;
  }
  for (const func of functions.filter((f) => symbolClassId(f) === cls.id)) {
    if (!hasDefineNodeForFunction(documents, cls, func.id)) missing += 1;
  }
  for (const event of events.filter((e) => symbolClassId(e) === cls.id)) {
    if (!hasDefineNodeForEvent(documents, cls, event.id)) missing += 1;
    if (!hasHandlerNodeForEvent(documents, event.id)) missing += 1;
  }

  return missing;
}
