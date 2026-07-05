import type { PinDefinition, FunctionSymbol, GraphBinding } from '@vvs/graph-types';
import corePack from '../core-pack.json';

export type NodeSemantics =
  | 'event.entry.start'
  | 'event.entry.update'
  | 'event.custom'
  | 'event.define'
  | 'event.dispatch'
  | 'flow.branch'
  | 'action.print'
  | 'math.binary'
  | 'variable.get'
  | 'variable.set'
  | 'project.call'
  | 'project.import'
  | 'project.macro';

export interface NodeKindDefinition {
  kindId: string;
  kindVersion: number;
  category: string;
  title: string;
  semantics: NodeSemantics;
  mathOp?: 'add' | 'subtract' | 'multiply' | 'divide';
  inputs: PinDefinition[];
  outputs: PinDefinition[];
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
    return KIND_MAP.get('vvs.project.use_macro');
  }
  return undefined;
}

export function listCoreKinds(): NodeKindDefinition[] {
  return [...KIND_MAP.values()].filter((k) => !k.dynamic);
}

export interface ListRegistryOptions {
  currentGraphId: string;
  functions: FunctionSymbol[];
  filterPin?: PinDefinition;
}

function pinsMatchFilter(pin: PinDefinition, filter?: PinDefinition): boolean {
  if (!filter) return true;
  if (filter.type === 'execution') return pin.type === 'execution';
  if (pin.type === 'execution') return false;
  if (filter.type === 'data_any' || pin.type === 'data_any') return true;
  return pin.type === filter.type;
}

function kindToSpawnTemplate(kind: NodeKindDefinition): SpawnNodeTemplate {
  return {
    type: kind.kindId,
    kindId: kind.kindId,
    kindVersion: kind.kindVersion,
    label: kind.title,
    category: kind.category,
    inputs: kind.inputs,
    outputs: kind.outputs,
  };
}

export function expandProjectSymbols(options: ListRegistryOptions): LibraryCategory[] {
  const categories: LibraryCategory[] = [];

  const callItems: SpawnNodeTemplate[] = options.functions
    .filter((fn) => fn.id !== options.currentGraphId)
    .map((fn) => ({
      type: 'vvs.project.call_function',
      kindId: 'vvs.project.call_function',
      kindVersion: 1,
      label: `Call ${fn.name}`,
      category: 'Project',
      inputs: [EXEC_IN],
      outputs: [EXEC_OUT],
      linkedGraphId: fn.id,
      linkKind: 'call_function' as const,
      graphBinding: { kind: 'call_function' as const, symbolId: fn.id },
    }));

  if (callItems.length > 0) {
    categories.push({ name: 'Project · Calls', items: callItems });
  }

  return categories;
}

export function list(options: ListRegistryOptions): LibraryCategory[] {
  const coreByCategory = new Map<string, SpawnNodeTemplate[]>();

  for (const kind of listCoreKinds()) {
    if (options.filterPin) {
      const hasMatch =
        kind.inputs.some((p) => pinsMatchFilter(p, options.filterPin)) ||
        kind.outputs.some((p) => pinsMatchFilter(p, options.filterPin));
      if (!hasMatch) continue;
    }
    const items = coreByCategory.get(kind.category) ?? [];
    items.push(kindToSpawnTemplate(kind));
    coreByCategory.set(kind.category, items);
  }

  const coreCategories: LibraryCategory[] = [...coreByCategory.entries()].map(([name, items]) => ({
    name,
    items,
  }));

  return [...coreCategories, ...expandProjectSymbols(options)];
}

export function inferKindIdFromLabel(label: string, category: string): string | undefined {
  if (label === 'On Start') return 'event_on_start';
  if (label === 'On Update') return 'event_on_update';
  if (label.startsWith('On ')) return 'event_define';
  if (label.startsWith('Dispatch ')) return 'event_dispatch';
  if (label === 'Branch') return 'flow_branch';
  if (label === 'Print String') return 'action_print';
  if (label === 'Math Add') return 'math_add';
  if (label === 'Math Subtract') return 'math_subtract';
  if (label === 'Math Multiply') return 'math_multiply';
  if (label === 'Math Divide') return 'math_divide';
  if (label.startsWith('Get ')) return 'variable_get';
  if (label.startsWith('Set ')) return 'variable_set';
  if (label.startsWith('Call ')) return 'vvs.project.call_function';
  if (label.startsWith('Import ')) return 'vvs.project.import_module';
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
    if (data.kindId.startsWith('use_macro_')) return 'vvs.project.use_macro';
    return data.kindId;
  }
  if (data.graphBinding?.kind === 'call_function' || data.linkKind === 'call_function') {
    return 'vvs.project.call_function';
  }
  if (data.graphBinding?.kind === 'import_module' || data.linkKind === 'import_module') {
    return 'vvs.project.import_module';
  }
  if (data.graphBinding?.kind === 'use_macro' || data.linkKind === 'use_macro') {
    return 'vvs.project.use_macro';
  }
  return inferKindIdFromLabel(data.label, data.category) ?? data.label;
}

export const CORE_NODE_REGISTRY: Record<string, NodeKindDefinition> = Object.fromEntries(
  corePack.kinds
    .filter((k) => !(k as NodeKindDefinition).dynamic)
    .map((k) => [k.kindId, k as NodeKindDefinition])
);
