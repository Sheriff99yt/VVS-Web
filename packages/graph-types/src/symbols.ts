import type { PinType } from './pins';
import type { GraphEdge, GraphNode } from './nodes';
import {
  legacyVariableTypeToDataType,
  portabilityFeaturesForDataType,
  type VariableDataType,
} from './variableTypes';

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
  | 'variable.module'
  | 'variable.readonly'
  | 'type.data_object'
  | 'type.data_array'
  | 'type.data_any'
  | 'event.multicast'
  | 'env.native';

export type FunctionBinding = 'instance' | 'static' | 'module';
export type SymbolVisibility = 'public' | 'private';
export type VariableBinding = 'instance' | 'static' | 'module';

/**
 * Future Cross Over Architecture mode — restrict authoring to features valid
 * across `allowedLanguages` so switching codegen target stays error-free.
 */
export interface CrossOverArchitectureMode {
  enabled: boolean;
  allowedLanguages: TargetLanguage[];
}

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

export interface VariableSymbol {
  kind: 'variable';
  id: string;
  name: string;
  type: VariableDataType;
  defaultValue?: unknown;
  binding: VariableBinding;
  visibility: SymbolVisibility;
  flags?: { readonly?: boolean };
}

/** @deprecated use VariableSymbol */
export type GraphVariable = VariableSymbol;

export function createVariableSymbol(
  name: string,
  options?: {
    id?: string;
    type?: VariableDataType;
    binding?: VariableBinding;
  }
): VariableSymbol {
  const type = options?.type ?? 'data_string';
  return {
    kind: 'variable',
    id: options?.id ?? `var-${Date.now()}`,
    name,
    type,
    binding: options?.binding ?? 'instance',
    visibility: 'public',
    defaultValue: undefined,
  };
}

export function migrateLegacyVariable(raw: unknown): VariableSymbol {
  if (!raw || typeof raw !== 'object') {
    return createVariableSymbol('Variable');
  }
  const item = raw as Record<string, unknown>;
  const readonly =
    item.readonly === true ||
    (item.flags &&
      typeof item.flags === 'object' &&
      (item.flags as { readonly?: boolean }).readonly === true);
  const type = legacyVariableTypeToDataType(
    typeof item.type === 'string' ? item.type : 'string'
  );
  return {
    kind: 'variable',
    id: typeof item.id === 'string' ? item.id : `var-${Date.now()}`,
    name: typeof item.name === 'string' ? item.name : 'Variable',
    type,
    defaultValue: item.defaultValue,
    binding:
      item.binding === 'static' || item.binding === 'module' || item.binding === 'instance'
        ? item.binding
        : 'instance',
    visibility: item.visibility === 'private' ? 'private' : 'public',
    flags: readonly ? { readonly: true } : undefined,
  };
}

export function normalizeVariableSymbols(raw: unknown): VariableSymbol[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (item && typeof item === 'object' && (item as VariableSymbol).kind === 'variable') {
      return migrateLegacyVariable(item);
    }
    return migrateLegacyVariable(item);
  });
}

export function portabilityFeaturesForVariable(variable: VariableSymbol): PortabilityFeature[] {
  const features: PortabilityFeature[] = [...portabilityFeaturesForDataType(variable.type)];
  if (variable.binding === 'static') features.push('variable.static');
  if (variable.binding === 'module') features.push('variable.module');
  if (variable.flags?.readonly) features.push('variable.readonly');
  return features;
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
  variables?: VariableSymbol[];
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
    for (const feature of portabilityFeaturesForVariable(variable)) {
      features.add(feature);
    }
  }
  return [...features];
}
