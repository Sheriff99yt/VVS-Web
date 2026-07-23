import type { PinDefinition, FunctionSymbol, GraphBinding, TargetLanguage, ProjectEventDefinition } from '@vvs/graph-types';
import type { ProjectEnvironmentManifest } from '@vvs/environment-templates';
import { expandEnvironmentSymbols as expandEnvSymbols } from '@vvs/environment-templates';
import corePack from '../core-pack.json';

export type NodeSemantics =
  | 'event.entry.start'
  | 'event.entry.update'
  | 'event.custom'
  | 'event.define'
  | 'event.dispatch'
  | 'event.emit'
  | 'event.subscribe'
  | 'flow.branch'
  | 'flow.for'
  | 'flow.while'
  | 'flow.switch'
  | 'flow.sequence'
  | 'action.print'
  | 'action.input.blocking'
  | 'action.wait.sync'
  | 'action.wait.async'
  | 'convert.to_string'
  | 'convert.to_number'
  | 'math.binary'
  | 'variable.get'
  | 'variable.set'
  | 'variable.define'
  | 'class.define'
  | 'function.define'
  | 'function.declare'
  | 'function.implement'
  | 'event.member.define'
  | 'project.call'
  | 'project.import'
  | 'project.import_class'
  | 'env.call_native'
  | 'env.event_handler';

export type SymbolRole = 'declare' | 'implement' | 'invoke' | 'define';

export interface NodeKindDefinition {
  kindId: string;
  kindVersion: number;
  category: string;
  title: string;
  semantics: NodeSemantics;
  symbolRole?: SymbolRole;
  mathOp?: 'add' | 'subtract' | 'multiply' | 'divide';
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  propertySchema?: import('./propertySchema').PropertyFieldDefinition[];
  dynamic?: boolean;
}

export interface SpawnNodeTemplate {
  type: string;
  label: string;
  category: string;
  inputs: PinDefinition[];
  outputs: PinDefinition[];
  kindId: string;
  kindVersion: number;
  linkedGraphId?: string;
  linkKind?: GraphBinding['kind'];
  graphBinding?: GraphBinding;
}

export interface LibraryCategory {
  name: string;
  items: SpawnNodeTemplate[];
}

const EXEC_IN: PinDefinition = { id: 'exec_in', label: '', type: 'execution' };
const EXEC_OUT: PinDefinition = { id: 'exec_out', label: '', type: 'execution' };

const KIND_MAP = new Map<string, NodeKindDefinition>(
  corePack.kinds.map((k) => [k.kindId, k as NodeKindDefinition])
);

export function resolve(kindId: string, _version?: number): NodeKindDefinition | undefined {
  if (KIND_MAP.has(kindId)) return KIND_MAP.get(kindId);
  if (kindId.startsWith('call_function_')) {
    return KIND_MAP.get('vvs.project.call_function');
  }
  if (kindId.startsWith('import_module_')) {
    return KIND_MAP.get('vvs.project.import_module');
  }
  if (kindId.startsWith('use_macro_')) {
    return KIND_MAP.get('vvs.project.call_function');
  }
  return undefined;
}

const SPAWN_EXCLUDED_KINDS = new Set(['event_on_start', 'event_emit', 'event_subscribe']);

/** Dynamic kinds that still need a generic spawn row (instances use prefixed kindIds). */
const SPAWNABLE_DYNAMIC_KINDS = new Set(['vvs.project.import_module']);

export function listCoreKinds(): NodeKindDefinition[] {
  return [...KIND_MAP.values()].filter(
    (k) =>
      (!k.dynamic || SPAWNABLE_DYNAMIC_KINDS.has(k.kindId)) &&
      !SPAWN_EXCLUDED_KINDS.has(k.kindId)
  );
}

export interface ListRegistryOptions {
  currentGraphId: string;
  functions: FunctionSymbol[];
  events?: ProjectEventDefinition[];
  /** Symbols without a matching declare node on the class define chain. */
  functionsMissingDeclare?: FunctionSymbol[];
  eventsMissingDeclare?: ProjectEventDefinition[];
  filterPin?: PinDefinition;
  environmentId?: string;
  environmentManifest?: ProjectEnvironmentManifest;
  targetLanguage?: TargetLanguage;
  /** Naming convention for spawn menu labels (e.g., 'global', 'python', 'auto'). */
  namingConvention?: 'global' | 'python' | 'javascript' | 'cpp' | 'verse' | 'gdscript' | 'rust' | 'csharp' | 'auto';
}

function pinsMatchFilter(pin: PinDefinition, filter?: PinDefinition): boolean {
  if (!filter) return true;
  if (filter.type === 'execution') return pin.type === 'execution';
  if (pin.type === 'execution') return false;
  if (filter.type === 'data_any' || pin.type === 'data_any') return true;
  return pin.type === filter.type;
}

function getSpawnNamingPrefix(
  type: 'Get' | 'Set' | 'Declare' | 'Define' | 'Call' | 'Dispatch' | 'On',
  namingConvention: string,
  targetLanguage?: string
): string {
  let convention = namingConvention;
  if (convention === 'auto') {
    convention = targetLanguage || 'global';
  }

  switch (convention) {
    case 'python':
      if (type === 'Define' || type === 'Declare') return 'def';
      if (type === 'On') return 'def on_';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'javascript':
    case 'typescript':
      if (type === 'Declare') return 'let';
      if (type === 'Define') return 'function';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'cpp':
      if (type === 'Declare') return 'declare';
      if (type === 'Define') return 'void';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'verse':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'def';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'gdscript':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'func';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'rust':
      if (type === 'Declare') return 'let';
      if (type === 'Define') return 'fn';
      if (type === 'On') return 'on';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
    case 'csharp':
      if (type === 'Declare') return 'var';
      if (type === 'Define') return 'void';
      if (type === 'On') return 'On';
      if (type === 'Get') return 'get';
      if (type === 'Set') return 'set';
      if (type === 'Call') return 'call';
      if (type === 'Dispatch') return 'dispatch';
      break;
  }
  return type;
}

function kindToSpawnTemplate(
  kind: NodeKindDefinition,
  namingConvention?: string,
  targetLanguage?: string
): SpawnNodeTemplate {
  let label = kind.title;
  
  if (namingConvention) {
    if (kind.kindId === 'variable_get') {
      const prefix = getSpawnNamingPrefix('Get', namingConvention, targetLanguage);
      label = `${prefix} Variable`;
    } else if (kind.kindId === 'var_define') {
      const prefix = getSpawnNamingPrefix('Declare', namingConvention, targetLanguage);
      label = `${prefix} Variable`;
    } else if (kind.kindId === 'function_define') {
      const prefix = getSpawnNamingPrefix('Declare', namingConvention, targetLanguage);
      label = `${prefix} Function`;
    } else if (kind.kindId === 'function_implement') {
      const prefix = getSpawnNamingPrefix('Define', namingConvention, targetLanguage);
      label = `${prefix} Function`;
    } else if (kind.kindId === 'class_define') {
      const prefix = getSpawnNamingPrefix('Declare', namingConvention, targetLanguage);
      label = `${prefix} Class`;
    } else if (kind.kindId === 'event_member_define') {
      const prefix = getSpawnNamingPrefix('Declare', namingConvention, targetLanguage);
      label = `${prefix} Event`;
    } else if (kind.kindId === 'variable_set') {
      const prefix = getSpawnNamingPrefix('Set', namingConvention, targetLanguage);
      label = `${prefix} Variable`;
    } else if (kind.kindId === 'vvs.project.call_function') {
      const prefix = getSpawnNamingPrefix('Call', namingConvention, targetLanguage);
      label = `${prefix} Function`;
    } else if (kind.kindId === 'event_define' || kind.kindId === 'event_custom' || kind.kindId === 'event_on_update') {
      const prefix = getSpawnNamingPrefix('On', namingConvention, targetLanguage);
      label = `${prefix} Event`;
    } else if (kind.kindId === 'event_dispatch') {
      const prefix = getSpawnNamingPrefix('Dispatch', namingConvention, targetLanguage);
      label = `${prefix} Event`;
    }
  }

  return {
    type: kind.kindId,
    kindId: kind.kindId,
    kindVersion: kind.kindVersion,
    label,
    category: kind.category,
    inputs: kind.inputs,
    outputs: kind.outputs,
  };
}

const DECLARATION_KIND_IDS = new Set([
  'class_define',
  'var_define',
  'function_define',
  'event_member_define',
]);

const HANDLER_KIND_IDS = new Set(['event_define', 'event_on_update', 'function_implement']);

function spawnCatalogCategory(kind: NodeKindDefinition): string {
  if (kind.kindId === 'function_define') return 'Declare';
  if (kind.kindId === 'function_implement') return 'Define';
  if (kind.symbolRole === 'declare') return 'Declare';
  if (kind.symbolRole === 'implement') return 'Handlers';
  if (kind.symbolRole === 'invoke') return kind.category;
  if (DECLARATION_KIND_IDS.has(kind.kindId)) return 'Declare';
  if (HANDLER_KIND_IDS.has(kind.kindId)) return 'Handlers';
  return kind.category;
}

function catalogCategoryOrder(name: string): number {
  if (name === 'Declare') return 0;
  if (name === 'Define') return 1;
  if (name === 'Handlers') return 2;
  if (name === 'Call') return 900;
  if (name === 'Dispatch') return 901;
  return 100;
}

function sortCatalogCategories(categories: LibraryCategory[]): LibraryCategory[] {
  return [...categories].sort(
    (a, b) =>
      catalogCategoryOrder(a.name) - catalogCategoryOrder(b.name) ||
      a.name.localeCompare(b.name)
  );
}

function expandMissingDeclareRows(options: ListRegistryOptions): SpawnNodeTemplate[] {
  const items: SpawnNodeTemplate[] = [];
  const { namingConvention, targetLanguage } = options;

  for (const fn of options.functionsMissingDeclare ?? []) {
    const prefix = namingConvention ? getSpawnNamingPrefix('Declare', namingConvention, targetLanguage) : 'Declare';
    items.push({
      type: 'function_define',
      kindId: 'function_define',
      kindVersion: 1,
      label: `${prefix} ${fn.name}`,
      category: 'Project',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      linkedGraphId: fn.id,
      linkKind: 'call_function',
      graphBinding: { kind: 'call_function', symbolId: fn.id },
    });
  }

  for (const event of options.eventsMissingDeclare ?? []) {
    const prefix = namingConvention ? getSpawnNamingPrefix('Declare', namingConvention, targetLanguage) : 'Declare';
    items.push({
      type: 'event_member_define',
      kindId: 'event_member_define',
      kindVersion: 1,
      label: `${prefix} ${event.name}`,
      category: 'Events',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
    });
  }

  return items;
}

export function expandProjectSymbols(options: ListRegistryOptions): LibraryCategory[] {
  const categories: LibraryCategory[] = [];
  const { namingConvention, targetLanguage } = options;

  const callPrefix = namingConvention ? getSpawnNamingPrefix('Call', namingConvention, targetLanguage) : 'Call';
  const dispatchPrefix = namingConvention ? getSpawnNamingPrefix('Dispatch', namingConvention, targetLanguage) : 'Dispatch';

  const callItems: SpawnNodeTemplate[] = options.functions
    .filter((fn) => fn.id !== options.currentGraphId)
    .map((fn) => ({
      type: 'vvs.project.call_function',
      kindId: 'vvs.project.call_function',
      kindVersion: 1,
      label: `${callPrefix} ${fn.name}`,
      category: 'Project',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      linkedGraphId: fn.id,
      linkKind: 'call_function' as const,
      graphBinding: { kind: 'call_function' as const, symbolId: fn.id },
    }));

  if (callItems.length > 0) {
    categories.push({ name: 'Call', items: callItems });
  }

  const dispatchItems: SpawnNodeTemplate[] = (options.events ?? []).map((event) => ({
    type: 'event_dispatch',
    kindId: 'event_dispatch',
    kindVersion: 1,
    label: `${dispatchPrefix} ${event.name}`,
    category: 'Project',
    inputs: [EXEC_IN],
    outputs: [EXEC_OUT],
    graphBinding: { kind: 'dispatch_event' as const, symbolId: event.id },
  }));

  if (dispatchItems.length > 0) {
    categories.push({ name: 'Dispatch', items: dispatchItems });
  }

  return categories;
}

export function list(options: ListRegistryOptions): LibraryCategory[] {
  const coreByCategory = new Map<string, SpawnNodeTemplate[]>();
  const { namingConvention, targetLanguage } = options;

  for (const kind of listCoreKinds()) {
    if (options.filterPin) {
      const hasMatch =
        kind.inputs.some((p) => pinsMatchFilter(p, options.filterPin)) ||
        kind.outputs.some((p) => pinsMatchFilter(p, options.filterPin));
      if (!hasMatch) continue;
    }
    const categoryName = spawnCatalogCategory(kind);
    const items = coreByCategory.get(categoryName) ?? [];
    items.push(kindToSpawnTemplate(kind, namingConvention, targetLanguage));
    coreByCategory.set(categoryName, items);
  }

  const missingDeclares = expandMissingDeclareRows(options);
  if (missingDeclares.length > 0) {
    const missingDefines = missingDeclares.filter((i) => i.kindId === 'function_define');
    const missingOther = missingDeclares.filter((i) => i.kindId !== 'function_define');
    if (missingDefines.length > 0) {
      const existing = coreByCategory.get('Declare') ?? [];
      coreByCategory.set('Declare', [...missingDefines, ...existing]);
    }
    if (missingOther.length > 0) {
      const existing = coreByCategory.get('Declare') ?? [];
      coreByCategory.set('Declare', [...missingOther, ...existing]);
    }
  }

  const coreCategories: LibraryCategory[] = [...coreByCategory.entries()].map(([name, items]) => ({
    name,
    items,
  }));

  return sortCatalogCategories([
    ...coreCategories,
    ...expandProjectSymbols(options),
    ...expandEnvironmentCategories(options),
  ]);
}

function expandEnvironmentCategories(options: ListRegistryOptions): LibraryCategory[] {
  if (!options.environmentManifest || !options.environmentId || !options.targetLanguage) {
    return [];
  }
  return expandEnvSymbols({
    environmentId: options.environmentId,
    manifest: options.environmentManifest,
    targetLanguage: options.targetLanguage,
    currentGraphId: options.currentGraphId,
  });
}

export { expandEnvSymbols as expandEnvironmentSymbols };

export function inferKindIdFromLabel(label: string, category: string): string | undefined {
  if (label === 'On Start') return 'event_on_start';
  if (label === 'On Update') return 'event_on_update';
  if (label.startsWith('On ')) return 'event_define';
  if (label.startsWith('Dispatch ')) return 'event_dispatch';
  if (label.startsWith('Emit ')) return 'event_emit';
  if (label.startsWith('Subscribe ')) return 'event_subscribe';
  if (label === 'Branch') return 'flow_branch';
  if (label === 'For Loop') return 'flow_for';
  if (label === 'While Loop') return 'flow_while';
  if (label === 'Switch') return 'flow_switch';
  if (label === 'Sequence') return 'flow_sequence';
  if (label === 'Print String') return 'action_print';
  if (label === 'Get User Input') return 'action_get_input';
  if (label === 'Wait') return 'action_wait';
  if (label === 'Await Wait') return 'action_await_wait';
  if (label === 'To String') return 'convert_to_string';
  if (label === 'To Number') return 'convert_to_number';
  if (label === 'Math Add') return 'math_add';
  if (label === 'Math Subtract') return 'math_subtract';
  if (label === 'Math Multiply') return 'math_multiply';
  if (label === 'Math Divide') return 'math_divide';
  if (label.startsWith('Declare Class')) return 'class_define';
  if (label.startsWith('Declare Variable')) return 'var_define';
  if (label.startsWith('Declare Function')) return 'function_define';
  if (label.startsWith('Declare Event')) return 'event_member_define';
  if (label.startsWith('Declare ') && category === 'Events') return 'event_member_define';
  if (label.startsWith('Declare ') && category === 'Variables') return 'var_define';
  if (label.startsWith('Declare ')) return 'function_define'; // legacy labels
  if (label.startsWith('Define Class')) return 'class_define';
  if (label.startsWith('Define Variable')) return 'var_define';
  if (label.startsWith('Define Function')) return 'function_implement';
  if (label.startsWith('Define Event')) return 'event_member_define';
  if (label.startsWith('Define ') && category === 'Events') return 'event_member_define';
  if (label.startsWith('Define ') && category === 'Variables') return 'var_define';
  if (label.startsWith('Define ') && category === 'Project') return 'function_implement';
  if (label.startsWith('Get ')) return 'variable_get';
  if (label.startsWith('Set ')) return 'variable_set';
  if (label.startsWith('Call ')) return 'vvs.project.call_function';
  if (label.startsWith('Import ')) return 'vvs.project.import_module';
  if (label.startsWith('Use ')) return 'vvs.project.call_function';
  if (category === 'Events' && label !== 'On Start' && label !== 'On Update') return 'event_define';
  return undefined;
}

export function resolveNodeKindId(data: {
  kindId?: string;
  label: string;
  category: string;
  linkKind?: string;
  linkedGraphId?: string;
  graphBinding?: GraphBinding;
}): string {
  if (data.kindId) {
    if (data.kindId.startsWith('call_function_')) return 'vvs.project.call_function';
    if (data.kindId.startsWith('import_module_')) return 'vvs.project.import_module';
    if (data.kindId.startsWith('use_macro_')) return 'vvs.project.call_function';
    return data.kindId;
  }
  if (data.graphBinding?.kind === 'call_function' || data.linkKind === 'call_function') {
    return 'vvs.project.call_function';
  }
  if (data.graphBinding?.kind === 'dispatch_event') {
    return 'event_dispatch';
  }
  if (data.graphBinding?.kind === 'import_module' || data.linkKind === 'import_module') {
    return 'vvs.project.import_module';
  }
  if (data.graphBinding?.kind === 'use_macro' || data.linkKind === 'use_macro') {
    return 'vvs.project.call_function';
  }
  if (data.graphBinding?.kind === 'env_native') return 'env.call_native';
  if (data.graphBinding?.kind === 'env_event') return 'env.event_handler';
  return inferKindIdFromLabel(data.label, data.category) ?? data.label;
}

export const CORE_NODE_REGISTRY: Record<string, NodeKindDefinition> = Object.fromEntries(
  corePack.kinds
    .filter((k) => !(k as NodeKindDefinition).dynamic)
    .map((k) => [k.kindId, k as NodeKindDefinition])
);
