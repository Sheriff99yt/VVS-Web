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
import type { SymbolCategoryKey } from './constants';

export type SymbolCategoryIssueCounts = Record<SymbolCategoryKey, number>;

export function countSymbolCategoryIssues(
  documents: Record<string, GraphDocument> | null,
  activeClass: ClassSymbol | undefined,
  classes: ClassSymbol[],
  classFunctions: FunctionSymbol[],
  classEvents: ProjectEventDefinition[],
  classVariables: VariableSymbol[]
): SymbolCategoryIssueCounts {
  if (!documents || !activeClass) {
    return { classes: 0, functions: 0, events: 0, variables: 0 };
  }

  let classIssues = 0;
  for (const cls of classes) {
    const doc = documents[classHomeGraphId(cls)];
    if (classGraphHasDefineNodes(doc) && !hasDefineNodeForClass(documents, cls)) {
      classIssues += 1;
    }
  }

  return {
    classes: classIssues,
    functions: classFunctions.filter(
      (f) => !hasDefineNodeForFunction(documents, activeClass, f.id)
    ).length,
    events: classEvents.reduce((sum, event) => {
      let n = 0;
      if (!hasDefineNodeForEvent(documents, activeClass, event.id)) n += 1;
      if (!hasHandlerNodeForEvent(documents, event.id)) n += 1;
      return sum + n;
    }, 0),
    variables: classVariables.filter(
      (v) => !hasDefineNodeForVariable(documents, activeClass, v.id)
    ).length,
  };
}
