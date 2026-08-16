import type {
  ClassSymbol,
  FunctionSymbol,
  ProjectEventDefinition,
  TargetLanguage,
  VariableSymbol,
} from './symbols';
import { MAIN_CLASS_ID, classExtendsNames } from './symbols';

/** Depth 1 = direct parent. Reusable for emit projection (CL-010) and canvas listing. */
export interface InheritedMember<T> {
  symbol: T;
  inheritedDepth: number;
  inheritedFromClassId: string;
  inheritedFromClassName: string;
}

export function symbolClassId(item: { classId?: string }): string {
  return item.classId ?? MAIN_CLASS_ID;
}

/** Resolve Extends by class name (emit / Coverage Lab) or id. */
export function resolveExtendsClass(
  classes: ClassSymbol[],
  extendsType: string | undefined | null
): ClassSymbol | undefined {
  const raw = typeof extendsType === 'string' ? extendsType.trim() : '';
  if (!raw) return undefined;
  const exactName = classes.find((cls) => cls.name === raw);
  if (exactName) return exactName;
  const exactId = classes.find((cls) => cls.id === raw);
  if (exactId) return exactId;
  const lower = raw.toLowerCase();
  return classes.find((cls) => cls.name.toLowerCase() === lower);
}

export function extendsTypeIsSet(extendsType: string | undefined | null): boolean {
  return typeof extendsType === 'string' && extendsType.trim().length > 0;
}

/**
 * Walk parent classes from nearest to farthest.
 * Stops on missing parent, self-reference, or cycle.
 */
export function listClassAncestors(
  classes: ClassSymbol[],
  classId: string
): InheritedMember<ClassSymbol>[] {
  const byId = new Map(classes.map((cls) => [cls.id, cls]));
  const start = byId.get(classId);
  if (!start) return [];

  const ancestors: InheritedMember<ClassSymbol>[] = [];
  const visited = new Set<string>([classId]);
  let current: ClassSymbol | undefined = start;
  let depth = 0;

  while (current) {
    if (!extendsTypeIsSet(current.extendsType)) break;
    const parent = resolveExtendsClass(classes, current.extendsType);
    if (!parent) break;
    if (visited.has(parent.id)) break;
    visited.add(parent.id);
    depth += 1;
    ancestors.push({
      symbol: parent,
      inheritedDepth: depth,
      inheritedFromClassId: parent.id,
      inheritedFromClassName: parent.name,
    });
    current = parent;
  }

  return ancestors;
}

export type ExtendsListUiMode = 'hidden' | 'single' | 'multi';

/** Go/Rust hide the list. Python/C++ can add extra bases. Others: one row. */
export function extendsListUiMode(lang?: TargetLanguage | string): ExtendsListUiMode {
  if (lang === 'go' || lang === 'rust') return 'hidden';
  if (lang === 'python' || lang === 'cpp') return 'multi';
  return 'single';
}

/**
 * Walk every stored Extends name (first + extras) as a directed graph.
 * Used for cycle checks only — Super / inherited members still use first parent.
 */
export function wouldCreateExtendsCycle(
  classes: ClassSymbol[],
  childClassId: string,
  parentRef: string
): boolean {
  const parent = resolveExtendsClass(classes, parentRef);
  if (!parent) return false;
  if (parent.id === childClassId) return true;
  const visited = new Set<string>();
  const stack = [parent.id];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    if (id === childClassId) return true;
    const cls = classes.find((item) => item.id === id);
    if (!cls) continue;
    for (const ref of classExtendsNames(cls)) {
      const next = resolveExtendsClass(classes, ref);
      if (next && !visited.has(next.id)) stack.push(next.id);
    }
  }
  return false;
}

function isClassFieldSymbol(item: { graphTabId?: string; scopedNodeId?: string }): boolean {
  return !item.graphTabId && !item.scopedNodeId;
}

function collectInheritedOf<T extends { classId?: string; graphTabId?: string; scopedNodeId?: string }>(
  classes: ClassSymbol[],
  classId: string,
  items: T[],
  classFieldsOnly: boolean
): InheritedMember<T>[] {
  const out: InheritedMember<T>[] = [];
  const seen = new Set<string>();
  for (const ancestor of listClassAncestors(classes, classId)) {
    for (const symbol of items) {
      if (symbolClassId(symbol) !== ancestor.symbol.id) continue;
      if (classFieldsOnly && !isClassFieldSymbol(symbol)) continue;
      const key = 'id' in symbol && typeof (symbol as { id?: string }).id === 'string'
        ? (symbol as { id: string }).id
        : undefined;
      if (key) {
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push({
        symbol,
        inheritedDepth: ancestor.inheritedDepth,
        inheritedFromClassId: ancestor.inheritedFromClassId,
        inheritedFromClassName: ancestor.inheritedFromClassName,
      });
    }
  }
  return out;
}

export function inheritedVariables(
  classes: ClassSymbol[],
  classId: string,
  variables: VariableSymbol[]
): InheritedMember<VariableSymbol>[] {
  return collectInheritedOf(classes, classId, variables, true);
}

export function inheritedFunctions(
  classes: ClassSymbol[],
  classId: string,
  functions: FunctionSymbol[]
): InheritedMember<FunctionSymbol>[] {
  return collectInheritedOf(classes, classId, functions, false);
}

export function inheritedEvents(
  classes: ClassSymbol[],
  classId: string,
  events: ProjectEventDefinition[]
): InheritedMember<ProjectEventDefinition>[] {
  return collectInheritedOf(classes, classId, events, false);
}

export interface ClassVisibleSymbols {
  variables: VariableSymbol[];
  functions: FunctionSymbol[];
  events: ProjectEventDefinition[];
  inherited: Map<
    string,
    { inheritedDepth: number; inheritedFromClassId: string; inheritedFromClassName: string }
  >;
}

/** Own class members first, then inherited (nearest parent first). Locals excluded from variables. */
export function classVisibleSymbols(
  classId: string,
  classes: ClassSymbol[],
  symbols: {
    variables: VariableSymbol[];
    functions: FunctionSymbol[];
    events: ProjectEventDefinition[];
  }
): ClassVisibleSymbols {
  const inherited = new Map<
    string,
    { inheritedDepth: number; inheritedFromClassId: string; inheritedFromClassName: string }
  >();

  const ownVariables = symbols.variables.filter(
    (item) => symbolClassId(item) === classId && isClassFieldSymbol(item)
  );
  const ownFunctions = symbols.functions.filter((item) => symbolClassId(item) === classId);
  const ownEvents = symbols.events.filter((item) => symbolClassId(item) === classId);

  const inheritedVars = inheritedVariables(classes, classId, symbols.variables);
  const inheritedFns = inheritedFunctions(classes, classId, symbols.functions);
  const inheritedEvts = inheritedEvents(classes, classId, symbols.events);

  for (const entry of [...inheritedVars, ...inheritedFns, ...inheritedEvts]) {
    inherited.set(entry.symbol.id, {
      inheritedDepth: entry.inheritedDepth,
      inheritedFromClassId: entry.inheritedFromClassId,
      inheritedFromClassName: entry.inheritedFromClassName,
    });
  }

  return {
    variables: [...ownVariables, ...inheritedVars.map((entry) => entry.symbol)],
    functions: [...ownFunctions, ...inheritedFns.map((entry) => entry.symbol)],
    events: [...ownEvents, ...inheritedEvts.map((entry) => entry.symbol)],
    inherited,
  };
}

export function classExtendsMissingNames(
  classes: ClassSymbol[],
  cls: ClassSymbol
): string[] {
  return classExtendsNames(cls).filter((ref) => resolveExtendsClass(classes, ref) == null);
}

export function classExtendsTargetMissing(
  classes: ClassSymbol[],
  cls: ClassSymbol
): boolean {
  return classExtendsMissingNames(classes, cls).length > 0;
}
