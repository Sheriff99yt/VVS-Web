import type { PinType } from './pins';
import type { GraphEdge, GraphNode } from './nodes';

export type TargetLanguage = 'python' | 'javascript' | 'cpp' | 'verse' | 'json';

export type PortabilityFeature =
  | 'function.static'
  | 'function.overload'
  | 'function.module'
  | 'function.virtual'
  | 'function.async'
  | 'class.inheritance'
  | 'macro.inline'
  | 'variable.static'
  | 'event.multicast';

export type FunctionBinding = 'instance' | 'static' | 'module';
export type SymbolVisibility = 'public' | 'private';
export type VariableBinding = 'instance' | 'static';

export interface SymbolParameter {
  id: string;
  label: string;
  type: PinType;
  defaultValue?: unknown;
}

/** @deprecated use SymbolParameter */
export type EventParameter = SymbolParameter;

export interface FunctionOverload {
  id: string;
  parameters: SymbolParameter[];
  returnType: PinType | 'void';
  /** Graph tab id for this overload body (defaults to function id when single overload). */
  graphTabId?: string;
}

export interface FunctionSymbol {
  kind: 'function';
  id: string;
  name: string;
  binding: FunctionBinding;
  visibility: SymbolVisibility;
  overloads: FunctionOverload[];
  flags?: { virtual?: boolean; async?: boolean };
}

export interface GraphVariable {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: unknown;
  binding?: VariableBinding;
  readonly?: boolean;
}

export interface ProjectEventDefinition {
  id: string;
  name: string;
  parameters: SymbolParameter[];
}

export interface GraphTab {
  id: string;
  type: 'main' | 'function' | 'macro';
  name: string;
}

export interface GraphTabMetadata {
  moduleName: string;
  extendsType: string;
  description: string;
}

export interface GraphDocument {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata?: GraphTabMetadata;
}

export function createOverloadId(): string {
  return `ovl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultOverload(): FunctionOverload {
  return {
    id: createOverloadId(),
    parameters: [],
    returnType: 'void',
  };
}

/** Upgrade legacy `{ id, name }` function entries to FunctionSymbol. */
export function migrateLegacyFunction(entry: { id: string; name: string }): FunctionSymbol {
  return {
    kind: 'function',
    id: entry.id,
    name: entry.name,
    binding: 'instance',
    visibility: 'public',
    overloads: [
      {
        id: createOverloadId(),
        parameters: [],
        returnType: 'void',
        graphTabId: entry.id,
      },
    ],
  };
}

export function normalizeFunctionSymbols(
  raw: unknown
): FunctionSymbol[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (item && typeof item === 'object' && (item as FunctionSymbol).kind === 'function') {
      const fn = item as FunctionSymbol;
      return {
        ...fn,
        overloads:
          fn.overloads?.length > 0
            ? fn.overloads
            : [createDefaultOverload()],
      };
    }
    if (item && typeof item === 'object' && 'id' in item && 'name' in item) {
      return migrateLegacyFunction(item as { id: string; name: string });
    }
    return migrateLegacyFunction({ id: 'unknown', name: 'Unknown' });
  });
}

export function collectPortabilityFeatures(snapshot: {
  projectDetails: { extendsType: string };
  functions: FunctionSymbol[];
  variables?: GraphVariable[];
}): PortabilityFeature[] {
  const features = new Set<PortabilityFeature>();
  if (snapshot.projectDetails.extendsType) {
    features.add('class.inheritance');
  }
  for (const fn of snapshot.functions) {
    if (fn.binding === 'static') features.add('function.static');
    if (fn.binding === 'module') features.add('function.module');
    if (fn.overloads.length > 1) features.add('function.overload');
    if (fn.flags?.virtual) features.add('function.virtual');
    if (fn.flags?.async) features.add('function.async');
  }
  for (const variable of snapshot.variables ?? []) {
    if (variable.binding === 'static') features.add('variable.static');
  }
  return [...features];
}
