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

/** Default class id for v2→v3 migration and single-class projects. */
export const MAIN_CLASS_ID = 'main-class';

/** Default project-map graph container — first-class canvas at documents[MAIN_GRAPH_CONTAINER_ID]. */
export const MAIN_GRAPH_CONTAINER_ID = 'main-graph';

export const PROJECT_MAP_CONTAINER_NAME = 'Project map';

/** Virtual folder for grouping classes in the project tree — does not affect codegen. */
export interface GraphContainer {
  id: string;
  name: string;
}

export function createGraphContainerId(): string {
  return `graph-container-${Date.now()}`;
}

export function createGraphContainer(
  name: string,
  options?: { id?: string }
): GraphContainer {
  return {
    id: options?.id ?? createGraphContainerId(),
    name: name.trim() || 'New graph',
  };
}

function normalizeContainerDisplayName(container: GraphContainer): GraphContainer {
  if (
    container.id === MAIN_GRAPH_CONTAINER_ID &&
    (container.name === 'Main graph' || container.name.trim() === '')
  ) {
    return { ...container, name: PROJECT_MAP_CONTAINER_NAME };
  }
  return container;
}

export function normalizeGraphContainers(raw: unknown): GraphContainer[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [createGraphContainer(PROJECT_MAP_CONTAINER_NAME, { id: MAIN_GRAPH_CONTAINER_ID })];
  }
  const containers = raw
    .filter((item): item is GraphContainer => {
      return (
        item != null &&
        typeof item === 'object' &&
        typeof (item as GraphContainer).id === 'string' &&
        typeof (item as GraphContainer).name === 'string'
      );
    })
    .map((item) => normalizeContainerDisplayName({ id: item.id, name: item.name }));
  if (!containers.some((c) => c.id === MAIN_GRAPH_CONTAINER_ID)) {
    containers.unshift(
      createGraphContainer(PROJECT_MAP_CONTAINER_NAME, { id: MAIN_GRAPH_CONTAINER_ID })
    );
  }
  return containers;
}

export interface ClassSymbol {
  kind: 'class';
  id: string;
  name: string;
  extendsType?: string;
  description?: string;
  /** @deprecated Legacy canvas key — use containerId as the class home graph document. */
  graphTabId?: string;
  /** Graph canvas that hosts this class define chain and runtime nodes. */
  containerId?: string;
  visibility?: SymbolVisibility;
}

export function classHomeGraphId(cls: ClassSymbol): string {
  return cls.containerId ?? MAIN_GRAPH_CONTAINER_ID;
}

export function createClassId(): string {
  return `class-${Date.now()}`;
}

export function createClassSymbol(
  name: string,
  options?: {
    id?: string;
    extendsType?: string;
    description?: string;
    graphTabId?: string;
    containerId?: string;
    visibility?: SymbolVisibility;
  }
): ClassSymbol {
  const id = options?.id ?? createClassId();
  return {
    kind: 'class',
    id,
    name,
    extendsType: options?.extendsType,
    description: options?.description,
    graphTabId: options?.graphTabId,
    containerId: options?.containerId ?? MAIN_GRAPH_CONTAINER_ID,
    visibility: options?.visibility ?? 'public',
  };
}

export function normalizeClassSymbols(raw: unknown): ClassSymbol[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (item && typeof item === 'object' && (item as ClassSymbol).kind === 'class') {
      const cls = item as ClassSymbol;
      const id = typeof cls.id === 'string' ? cls.id : createClassId();
      return {
        kind: 'class' as const,
        id,
        name: typeof cls.name === 'string' ? cls.name : 'Untitled',
        extendsType: typeof cls.extendsType === 'string' ? cls.extendsType : undefined,
        description: typeof cls.description === 'string' ? cls.description : undefined,
        graphTabId: typeof cls.graphTabId === 'string' ? cls.graphTabId : undefined,
        containerId:
          typeof cls.containerId === 'string' ? cls.containerId : MAIN_GRAPH_CONTAINER_ID,
        visibility: cls.visibility === 'private' ? 'private' : 'public',
      };
    }
    return createClassSymbol('Untitled');
  });
}

export interface FunctionSymbol {
  kind: 'function';
  id: string;
  name: string;
  binding: FunctionBinding;
  visibility: SymbolVisibility;
  overloads: FunctionOverload[];
  flags?: { virtual?: boolean; async?: boolean };
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
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
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
}

/** @deprecated use VariableSymbol */
export type GraphVariable = VariableSymbol;

export function createVariableSymbol(
  name: string,
  options?: {
    id?: string;
    type?: VariableDataType;
    binding?: VariableBinding;
    classId?: string;
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
    classId: options?.classId,
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
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
}

export interface GraphTab {
  id: string;
  type: 'main' | 'function' | 'macro' | 'class' | 'graph' | 'container';
  name: string;
  /** Owning class for main, class, and auxiliary graph tabs. */
  classId?: string;
}

export function createGraphTabId(): string {
  return `graph-${Date.now()}`;
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

export function containerTabFor(container: GraphContainer): GraphTab {
  return { id: container.id, type: 'container', name: container.name };
}

export function isGraphContainerTabId(tabId: string, containers: GraphContainer[]): boolean {
  return containers.some((container) => container.id === tabId);
}

export function ensureContainerDocuments(
  containers: GraphContainer[],
  documents: Record<string, GraphDocument>
): Record<string, GraphDocument> {
  const next = { ...documents };
  for (const container of containers) {
    if (!next[container.id]) {
      next[container.id] = { nodes: [], edges: [] };
    }
  }
  return next;
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
