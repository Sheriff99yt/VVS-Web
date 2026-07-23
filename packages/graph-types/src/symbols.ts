import type { PinType } from './pins';
import type { GraphEdge, GraphNode } from './nodes';
import {
  legacyVariableTypeToDataType,
  portabilityFeaturesForDataType,
  type VariableDataType,
} from './variableTypes';
import {
  parseTypeRef,
  syncTypeFieldsFromRef,
  type TypeRef,
} from './typeRef';

export type TargetLanguage = 'python' | 'javascript' | 'cpp' | 'verse' | 'gdscript' | 'rust' | 'csharp' | 'go' | 'json';

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
export type SymbolVisibility = 'public' | 'protected' | 'private';
export type VariableBinding = 'instance' | 'static' | 'module';

/**
 * Cross Over Architecture mode — **deferred** (see docs/design/unified_symbol_model.md).
 * When shipped: restrict authoring to features valid across `allowedLanguages`.
 * Today: single-target portability via `@vvs/language-profiles` only.
 */
export interface CrossOverArchitectureMode {
  enabled: boolean;
  allowedLanguages: TargetLanguage[];
}

export interface SymbolParameter {
  id: string;
  label: string;
  type: PinType;
  typeRef?: TypeRef;
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

export const PROJECT_MAP_CONTAINER_NAME = 'Overview';

const LEGACY_PROJECT_MAP_NAMES = new Set(['Project map', 'Main graph', '']);

/** Virtual folder for grouping classes — output path prefix derived from folder name. */
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
    (LEGACY_PROJECT_MAP_NAMES.has(container.name.trim()) ||
      container.name === 'Project map')
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

/** Class whose home graph document id matches `graphId`. */
export function classForHomeGraphId(
  classes: ClassSymbol[],
  graphId: string
): ClassSymbol | undefined {
  return classes.find((cls) => classHomeGraphId(cls) === graphId);
}

export function isClassHomeGraph(classes: ClassSymbol[], graphId: string): boolean {
  return classForHomeGraphId(classes, graphId) != null;
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
  flags?: { abstract?: boolean; virtual?: boolean; override?: boolean; async?: boolean };
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
}

export interface VariableSymbol {
  kind: 'variable';
  id: string;
  name: string;
  type: VariableDataType;
  defaultValue?: unknown;
  /**
   * Canonical type identity (builtin / enum / class / array / map).
   * Prefer this over `type` + `enumType` when reading for emit or pickers.
   */
  typeRef?: TypeRef;
  /**
   * Legacy enum overlay — kept in sync from `typeRef` when kind is enum.
   * Default value should be the **member name** only (e.g. `OK`), not `Enum::OK`.
   * @deprecated Prefer `typeRef: { kind: 'enum', name }`
   */
  enumType?: string;
  binding: VariableBinding;
  visibility: SymbolVisibility;
  flags?: { readonly?: boolean; abstract?: boolean; virtual?: boolean; override?: boolean };
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
  /** If set, this variable is scoped to a specific function or event graph tab. */
  graphTabId?: string;
  /** If set, this variable is scoped to a specific control-flow block node (e.g. IF, Loop). */
  scopedNodeId?: string;
}

/** @deprecated use VariableSymbol */
export type GraphVariable = VariableSymbol;

export function createVariableSymbol(
  name: string,
  options?: {
    id?: string;
    type?: VariableDataType;
    typeRef?: TypeRef;
    binding?: VariableBinding;
    classId?: string;
    graphTabId?: string;
    scopedNodeId?: string;
  }
): VariableSymbol {
  const typeRef =
    options?.typeRef ??
    (options?.type ? ({ kind: 'builtin', id: options.type } as TypeRef) : { kind: 'builtin', id: 'data_string' });
  const synced = syncTypeFieldsFromRef(typeRef);
  return {
    kind: 'variable',
    id: options?.id ?? `var-${Date.now()}`,
    name,
    type: synced.type,
    typeRef: synced.typeRef,
    enumType: synced.enumType,
    binding: options?.binding ?? 'instance',
    visibility: 'public',
    defaultValue: undefined,
    classId: options?.classId,
    graphTabId: options?.graphTabId,
    scopedNodeId: options?.scopedNodeId,
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
  const enumType =
    typeof item.enumType === 'string' && item.enumType.trim() ? item.enumType.trim() : undefined;
  const typeRef =
    parseTypeRef(item.typeRef) ??
    (enumType
      ? ({ kind: 'enum', name: enumType } as TypeRef)
      : ({ kind: 'builtin', id: type } as TypeRef));
  const synced = syncTypeFieldsFromRef(typeRef);
  return {
    kind: 'variable',
    id: typeof item.id === 'string' ? item.id : `var-${Date.now()}`,
    name: typeof item.name === 'string' ? item.name : 'Variable',
    type: synced.type,
    typeRef: synced.typeRef,
    defaultValue: item.defaultValue,
    enumType: synced.enumType,
    binding:
      item.binding === 'static' || item.binding === 'module' || item.binding === 'instance'
        ? item.binding
        : 'instance',
    visibility: item.visibility === 'private' ? 'private' : 'public',
    flags: readonly ? { readonly: true } : undefined,
    classId: typeof item.classId === 'string' ? item.classId : undefined,
    graphTabId: typeof item.graphTabId === 'string' ? item.graphTabId : undefined,
    scopedNodeId: typeof item.scopedNodeId === 'string' ? item.scopedNodeId : undefined,
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

/** `entry` = program entry hook (emits `on_start`); `custom` or omitted = user event. */
export type ProjectEventRole = 'entry' | 'custom';

export interface ProjectEventDefinition {
  id: string;
  name: string;
  parameters: SymbolParameter[];
  /** `entry` events declare the host-callable program entry (`on_start`). */
  role?: ProjectEventRole;
  /** Planned: owning class — see ClassSymbol and docs/design/multi_class_symbols.md */
  classId?: string;
}

/** Handler stem for generated `on_{name}` methods — entry always maps to `start`. */
export function eventCodegenHandlerName(event: Pick<ProjectEventDefinition, 'name' | 'role'>): string {
  if (event.role === 'entry') return 'start';
  const stem = event.name
    .trim()
    .replace(/^on\s+/i, '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  return stem || 'event';
}

export function createProgramEntryEvent(options?: {
  id?: string;
  classId?: string;
}): ProjectEventDefinition {
  return {
    id: options?.id ?? 'evt-start',
    name: 'start',
    role: 'entry',
    parameters: [],
    classId: options?.classId,
  };
}

export function findProgramEntryEvent(
  events: ProjectEventDefinition[],
  classId?: string
): ProjectEventDefinition | undefined {
  return events.find(
    (e) => e.role === 'entry' && (!classId || !e.classId || e.classId === classId)
  );
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
  /** Per-graph codegen language; unset inherits project default at emit time. */
  targetLanguage?: TargetLanguage;
  /** Per-graph extension for this graph's target language. */
  targetFileExtension?: string;
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
