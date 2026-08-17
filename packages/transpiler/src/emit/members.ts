import { type VariableSymbol, parseTypeRef, resolveTypeRef, targetLanguageToFamily } from '@vvs/graph-types';
import { isFeatureUnsupportedForLanguage, isFunctionRoleEffective, isNodeEffectiveForLanguage } from '@vvs/language-profiles';
import { renderTemplate, requireTemplate, resolvePrintProfile } from '@vvs/syntax-packs';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrMemberDecl, IrModule, IrModuleImport } from '../ir/types';
import {
  appendFunctionBody,
  appendImportStatement,
  formatFunctionDeclPrototype,
  formatFunctionDefHeader,
  formatFunctionDefOutOfLineHeader,
  functionNeedsAsync,
  printContextForIr,
} from './helpers';
import { emptyFunctionBodyLine } from './layout';
import {
  appendEventHandlerDefinition,
  functionRoleOf,
  renderFunctionOutOfLineClose,
  renderFunctionTabClose,
  resolveModifierSlots,
} from './shell';
import { typeNameForTypeRef } from './emitTypes';
import { formatEnumMemberAccess, parseLegacyEnumMember } from './enumAccess';
import { commentPrefixFromPack, memberChainIndentFor } from '../print/template';

export interface MemberState {
  cppVisibility: string;
  /** Class shell has been opened (ClassModuleOpen emitted). */
  classOpened?: boolean;
  /** Whether the class is effective for the target language (false if globally dimmed) */
  classEffective?: boolean;
  /** Rust: struct closed and `impl` opened. */
  rustImplOpened?: boolean;
  /** Rust static/const items already written (hoisted off the struct). */
  rustEmittedItemNodeIds?: Set<string>;
}

/** Rust cannot put `static` / `const` on a struct field — those become real items. */
export type RustVariableItemKind = 'field' | 'static' | 'const';

export function rustVariableItemKind(
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>
): RustVariableItemKind {
  const binding = String(member.properties?.binding ?? member.symbol.binding ?? 'instance');
  const isConst =
    Boolean(member.properties?.isConst) || Boolean(member.symbol.flags?.readonly);
  if (isConst) return 'const';
  if (binding === 'static') return 'static';
  return 'field';
}

function rustVariableIsMap(
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>
): boolean {
  const fromProps = parseTypeRef(member.properties?.typeRef);
  const ref = fromProps ?? resolveTypeRef(member.symbol);
  return ref?.kind === 'map';
}

function isRustHashMapUse(member: IrMemberDecl): boolean {
  if (member.kind !== 'ModuleImport') return false;
  const names = member.importNames ?? [];
  return member.moduleSlug === 'std::collections' && names.includes('HashMap');
}

export function rustHashMapImportAnchor(ir: IrModule): string | undefined {
  const found = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'VariableDecl' }> =>
      m.kind === 'VariableDecl' && rustVariableIsMap(m)
  );
  return found?.sourceGraphNodeId;
}

export function rustHashMapImportMember(anchorNodeId: string): IrModuleImport {
  return {
    kind: 'ModuleImport',
    sourceGraphNodeId: anchorNodeId,
    moduleSlug: 'std::collections',
    importStyle: 'from',
    importNames: ['HashMap'],
    displayLabel: 'HashMap',
    targetLanguages: ['rust'],
  };
}

/** Compiler-required `use std::collections::HashMap;` — tagged to the map field. */
export function withRustHashMapImport(ir: IrModule): IrModule {
  if (ir.targetLanguage !== 'rust') return ir;
  if (ir.members.some(isRustHashMapUse)) return ir;
  const anchor = rustHashMapImportAnchor(ir);
  if (!anchor) return ir;
  return { ...ir, members: [rustHashMapImportMember(anchor), ...ir.members] };
}

/** One file-top `use` for a merged multi-class rust module. */
export function withRustHashMapImportAtFileTop(irs: IrModule[]): IrModule[] {
  if (irs.length === 0 || irs[0]!.targetLanguage !== 'rust') return irs;
  if (irs.some((ir) => ir.members.some(isRustHashMapUse))) return irs;
  let anchor: string | undefined;
  for (const ir of irs) {
    anchor = rustHashMapImportAnchor(ir);
    if (anchor) break;
  }
  if (!anchor) return irs;
  const first = irs[0]!;
  return [{ ...first, members: [rustHashMapImportMember(anchor), ...first.members] }, ...irs.slice(1)];
}

function markRustItemEmitted(state: MemberState, nodeId: string): void {
  if (!state.rustEmittedItemNodeIds) state.rustEmittedItemNodeIds = new Set();
  state.rustEmittedItemNodeIds.add(nodeId);
}

function rustItemAlreadyEmitted(state: MemberState, nodeId: string): boolean {
  return Boolean(state.rustEmittedItemNodeIds?.has(nodeId));
}

export interface MemberEmitHooks {
  /** Fired when walking a ClassDecl — open the class shell. */
  onClassDecl?: () => void;
  /** Before emitting a field (VariableDecl). */
  onBeforeField?: () => void;
  /** Before emitting a method body (FunctionDecl / EventDecl with handler). */
  onBeforeMethod?: () => void;
  /** Before any member whose sourceGraphNodeId is known — user Comment [C] attach point. */
  onBeforeMemberNode?: (sourceGraphNodeId: string, indent: string) => void;
  /** Before flow statements inside function / handler bodies. */
  onBeforeFlowNode?: (sourceGraphNodeId: string, indent: string) => void;
  /**
   * C++: queue FunctionDecl with emitBody for out-of-line emit after class close.
   * Return true when deferred (caller must not emit in-class).
   */
  deferCppOutOfLineMethod?: (
    member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>
  ) => boolean;
}

export function ensureCppVisibility(
  sink: CodeSink,
  ir: IrModule,
  state: MemberState,
  memberVisibility: string
): void {
  if (ir.targetLanguage !== 'cpp') return;
  const targetVis = memberVisibility.trim();
  if (!targetVis) return; // unset — do not invent `public:`
  if (state.cppVisibility !== targetVis) {
    state.cppVisibility = targetVis;
    const line = sink.lineCount + 1;
    sink.appendRaw(`${targetVis}:`);
    tagClassStructuralLine(sink, ir, line);
  }
}

function formatVariableDefault(
  variable: VariableSymbol,
  targetLanguage: IrModule['targetLanguage'],
  enumType?: string
): string {
  const val = variable.defaultValue;
  const resolvedEnum =
    (typeof enumType === 'string' && enumType.trim() ? enumType.trim() : undefined) ||
    enumNameFromVariable(variable);

  const typeRef = resolveTypeRef(variable);

  if (variable.type === 'data_array' || typeRef.kind === 'array') {
    if (targetLanguage === 'cpp') return '{}';
    if (targetLanguage === 'python') return '[]';
    if (targetLanguage === 'javascript') return '[]';
    if (targetLanguage === 'csharp') return 'new List<float>()';
    if (targetLanguage === 'rust') return 'Vec::new()';
    if (targetLanguage === 'gdscript') return '[]';
    if (targetLanguage === 'verse') return 'array{}';
    return '[]';
  }

  if (typeRef.kind === 'map') {
    if (targetLanguage === 'cpp') return '{}';
    if (targetLanguage === 'python') return '{}';
    if (targetLanguage === 'javascript') return 'new Map()';
    if (targetLanguage === 'csharp') return 'new Dictionary<string, string>()';
    if (targetLanguage === 'rust') return 'HashMap::new()';
    if (targetLanguage === 'gdscript') return '{}';
    if (targetLanguage === 'verse') return 'map{}';
    return '{}';
  }

  if (resolvedEnum && typeof val === 'string' && /^[A-Za-z_][\w]*$/.test(val)) {
    return formatEnumMemberAccess(resolvedEnum, val, targetLanguage);
  }

  if (typeof val === 'string') {
    const legacy = parseLegacyEnumMember(val);
    if (legacy) {
      return formatEnumMemberAccess(legacy.enumName, legacy.member, targetLanguage);
    }
  }

  if (typeRef.kind === 'class' && (val === null || val === undefined || val === '')) {
    if (targetLanguage === 'python') return 'None';
    if (targetLanguage === 'cpp') return '{}';
    if (targetLanguage === 'csharp') return 'null';
    if (targetLanguage === 'rust')
      return typeRef.name?.trim() ? `${typeRef.name.trim()}::new()` : 'Default::default()';
    if (targetLanguage === 'gdscript') return 'null';
    if (targetLanguage === 'verse') {
      // Archetype value (Type{}) — a default PIN value, not a constructor node.
      const className = typeNameForTypeRef(typeRef, 'verse').trim();
      return className ? `${className}{}` : '{}';
    }
    if (targetLanguage === 'javascript') return 'null';
    return 'null';
  }

  if (targetLanguage === 'python') {
    if (typeof val === 'string') return `"${val}"`;
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    return String(val ?? 0);
  }
  if (typeof val === 'string') return `"${val}"`;
  return String(val ?? 0);
}

function enumNameFromVariable(symbol: VariableSymbol): string | undefined {
  const ref = resolveTypeRef(symbol);
  if (ref.kind === 'enum') return ref.name;
  if (typeof symbol.defaultValue === 'string') {
    return parseLegacyEnumMember(symbol.defaultValue)?.enumName;
  }
  return undefined;
}

function enumTypeFromSymbolOrProps(
  symbol: VariableSymbol,
  properties?: Record<string, unknown>
): string | undefined {
  const fromProps = properties?.enumType;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  return enumNameFromVariable(symbol);
}

function formatTypeForLanguage(
  targetLanguage: IrModule['targetLanguage'],
  symbol: VariableSymbol,
  properties?: Record<string, unknown>
): string {
  const fromProps = properties?.enumType;
  if (typeof fromProps === 'string' && fromProps.trim()) return fromProps.trim();
  const fromPropsRef = parseTypeRef(properties?.typeRef);
  if (fromPropsRef) return typeNameForTypeRef(fromPropsRef, targetLanguage);
  return typeNameForTypeRef(resolveTypeRef(symbol), targetLanguage);
}

function appendRustItemDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>,
  kind: 'static' | 'const',
  indent: string
): void {
  const { symbol, sourceGraphNodeId } = member;
  const enumType = enumTypeFromSymbolOrProps(symbol, member.properties);
  const val = formatVariableDefault(symbol, ir.targetLanguage, enumType);
  const family = targetLanguageToFamily(ir.targetLanguage) ?? 'rust';
  const profile = resolvePrintProfile(family, ir.codegenTarget?.capabilities ?? []);
  const templateKey = kind === 'static' ? 'VarDefineStatic' : 'VarDefineConst';
  const row = requireTemplate(profile, templateKey, ir.targetLanguage);
  const mods = resolveModifierSlots(ir.targetLanguage, member.properties, symbol.visibility);
  const slots: Record<string, string> = {
    ...mods,
    name: symbol.name,
    default: val,
    type: formatTypeForLanguage(ir.targetLanguage, symbol, member.properties),
  };
  const rendered = renderTemplate(row, slots, profile.layout);
  const startLine = sink.lineCount + 1;
  sink.appendRaw(`${indent}${rendered.text}`);
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, symbol.name);
}

/** Module-level `static` items that belong on this class (not struct fields). */
export function appendRustHoistedStatics(
  sink: CodeSink,
  ir: IrModule,
  state: MemberState
): void {
  if (ir.targetLanguage !== 'rust') return;
  for (const member of ir.members) {
    if (member.kind !== 'VariableDecl') continue;
    if (rustVariableItemKind(member) !== 'static') continue;
    if (rustItemAlreadyEmitted(state, member.sourceGraphNodeId)) continue;
    appendRustItemDecl(sink, ir, member, 'static', '');
    markRustItemEmitted(state, member.sourceGraphNodeId);
  }
}

/** Associated `const` items inside `impl` (Rust has no const struct fields). */
export function appendRustAssociatedConsts(
  sink: CodeSink,
  ir: IrModule,
  state: MemberState
): void {
  if (ir.targetLanguage !== 'rust') return;
  const family = targetLanguageToFamily(ir.targetLanguage) ?? 'rust';
  const profile = resolvePrintProfile(family, ir.codegenTarget?.capabilities ?? []);
  const indent = profile.layout?.varDeclIndent ?? '    ';
  for (const member of ir.members) {
    if (member.kind !== 'VariableDecl') continue;
    if (rustVariableItemKind(member) !== 'const') continue;
    if (rustItemAlreadyEmitted(state, member.sourceGraphNodeId)) continue;
    appendRustItemDecl(sink, ir, member, 'const', indent);
    markRustItemEmitted(state, member.sourceGraphNodeId);
  }
}

function appendVariableDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>,
  state: MemberState
): void {
  const { symbol, sourceGraphNodeId } = member;
  const effective = isNodeEffectiveForLanguage(
    'variable_define',
    member.properties,
    ir.targetLanguage,
    { isGlobalScope: ir.activeClass?.isGlobalScope }
  );

  if (!effective) {
    if (ir.emitUnsupportedComments !== false) {
      const ctx = printContextForIr(ir, '', ir.environmentManifest);
      const indent = memberChainIndentFor(ctx);
      const prefix = commentPrefixFromPack(ctx);
      sink.appendTagged({
        nodeId: member.sourceGraphNodeId,
        text: `${indent}${prefix}(x) Declare ${symbol.name}`,
      });
    }
    return;
  }

  if (ir.targetLanguage === 'rust') {
    const itemKind = rustVariableItemKind(member);
    if (itemKind !== 'field') {
      if (rustItemAlreadyEmitted(state, sourceGraphNodeId)) return;
      // Module-scope static/const when the struct is not open (or already in impl).
      // Otherwise hoist at class/impl open — never invent `// static` on a field.
      if (itemKind === 'static' && !state.classOpened) {
        appendRustItemDecl(sink, ir, member, 'static', '');
        markRustItemEmitted(state, sourceGraphNodeId);
        return;
      }
      if (itemKind === 'const' && (!state.classOpened || state.rustImplOpened)) {
        const family = targetLanguageToFamily(ir.targetLanguage) ?? 'rust';
        const profile = resolvePrintProfile(family, ir.codegenTarget?.capabilities ?? []);
        const indent = state.rustImplOpened ? (profile.layout?.varDeclIndent ?? '    ') : '';
        appendRustItemDecl(sink, ir, member, 'const', indent);
        markRustItemEmitted(state, sourceGraphNodeId);
        return;
      }
      return;
    }
  }

  if (ir.targetLanguage === 'cpp') {
    const vis = String(member.properties?.visibility ?? symbol.visibility ?? '');
    ensureCppVisibility(sink, ir, state, vis);
  }
  const startLine = sink.lineCount + 1;
  const enumType = enumTypeFromSymbolOrProps(symbol, member.properties);
  const val = formatVariableDefault(symbol, ir.targetLanguage, enumType);

  const family = targetLanguageToFamily(ir.targetLanguage) ?? 'python';
  const profile = resolvePrintProfile(family, ir.codegenTarget?.capabilities ?? []);
  const row = requireTemplate(profile, 'VarDefine', ir.targetLanguage);

  const mods = resolveModifierSlots(ir.targetLanguage, member.properties, symbol.visibility);

  const slots: Record<string, string> = {
    ...mods,
    name: symbol.name,
    default: val,
  };

  slots.type = formatTypeForLanguage(ir.targetLanguage, symbol, member.properties);

  const rendered = renderTemplate(row, slots, profile.layout);
  const indent = profile.layout?.varDeclIndent ?? '    ';
  const line = `${indent}${rendered.text}`;
  sink.appendRaw(line);
  
  const anchor =
    ir.targetLanguage === 'python'
      ? `self.${symbol.name}`
      : ir.targetLanguage === 'javascript'
        ? `this.${symbol.name}`
        : symbol.name;
  sink.tagRange(sourceGraphNodeId, startLine, sink.lineCount, anchor);
}

function appendEventDefinition(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EventDecl' }>,
  onBeforeFlowNode?: (sourceGraphNodeId: string, indent: string) => void
): void {
  const handlerNodeId = member.handlerSourceGraphNodeId;
  if (!handlerNodeId) return;

  const handler: IrEventHandler = {
    kind: 'EventHandler',
    sourceGraphNodeId: handlerNodeId,
    handlerName: member.handlerName,
    paramNames: member.paramNames,
    body: member.body,
    isConstructor: false,
  };

  appendEventHandlerDefinition(sink, ir, handler, handlerNodeId, {
    leadingBlankLine: true,
    defineNodeId: member.sourceGraphNodeId,
    memberProperties: member.properties,
    paramTypes: member.symbol.parameters.map((p) => p.type),
    onBeforeFlowNode,
  });
}

function irClassName(ir: IrModule): string {
  const classDecl = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl'
  );
  if (classDecl?.name?.trim()) return classDecl.name.trim();
  if (ir.activeClass?.name?.trim()) return ir.activeClass.name.trim();
  return ir.moduleName;
}

function functionRoleShouldSkip(ir: IrModule, properties?: Record<string, unknown>): boolean {
  const role = functionRoleOf(properties);
  if (role === 'function') return false;
  return !isFunctionRoleEffective(ir.targetLanguage, role);
}

function appendFunctionDeclare(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>,
  isAbstract: boolean
): void {
  const { symbol } = member;
  const nodeId = member.declareSourceGraphNodeId ?? member.sourceGraphNodeId;
  const label =
    (typeof member.properties?.name === 'string' && member.properties.name.trim()) ||
    symbol.name;
  const effective = isNodeEffectiveForLanguage(
    'function_define',
    member.properties,
    ir.targetLanguage,
    { isGlobalScope: ir.activeClass?.isGlobalScope }
  );

  const emitXComment = () => {
    if (ir.emitUnsupportedComments === false) return;
    const ctx = printContextForIr(ir, '', ir.environmentManifest);
    const indent = memberChainIndentFor(ctx);
    const prefix = commentPrefixFromPack(ctx);
    sink.appendTagged({
      nodeId,
      text: `${indent}${prefix}(x) Declare ${label}`,
    });
  };

  if (functionRoleShouldSkip(ir, member.properties) || !effective) {
    emitXComment();
    return;
  }

  for (const overload of member.overloads) {
    const props = { ...member.properties, overloadId: overload.id };
    const proto = formatFunctionDeclPrototype(symbol, ir.targetLanguage, props, irClassName(ir));
    if (proto) {
      const headerStartLine = sink.lineCount + 1;
      sink.appendRaw(proto);
      sink.tagRange(nodeId, headerStartLine, headerStartLine, symbol.name);
    }
  }
  return;

  // Effective abstract with no prototype form (Python, etc.) → honest comment.
  if (isAbstract) {
    const ctx = printContextForIr(ir, '', ir.environmentManifest);
    const indent = memberChainIndentFor(ctx);
    const prefix = commentPrefixFromPack(ctx);
    sink.appendTagged({
      nodeId,
      text: `${indent}${prefix}abstract ${label}`,
    });
    return;
  }

  // Effective but no prototype template — never silent-skip.
  emitXComment();
}

function appendFunctionDefinition(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>,
  onBeforeFlowNode?: (sourceGraphNodeId: string, indent: string) => void
): void {
  const { symbol } = member;
  const emptyLine = emptyFunctionBodyLine(ir.targetLanguage);

  if (sink.lineCount > 0) sink.appendRaw('');

  const isAbstract = !!(
    member.properties?.isAbstract || member.symbol.flags?.abstract
  );

  // Declare-only (no body): prototype, abstract comment, or U66 (x).
  if (!member.emitBody) {
    appendFunctionDeclare(sink, ir, member, isAbstract);
    return;
  }

  if (functionRoleShouldSkip(ir, member.properties)) {
    if (ir.emitUnsupportedComments !== false) {
      const ctx = printContextForIr(ir, '', ir.environmentManifest);
      const indent = memberChainIndentFor(ctx);
      const prefix = commentPrefixFromPack(ctx);
      const label = (typeof member.properties?.name === 'string' && member.properties.name.trim()) || symbol.name;
      sink.appendTagged({
        nodeId: member.implementSourceGraphNodeId ?? member.sourceGraphNodeId,
        text: `${indent}${prefix}(x) Implement ${label}`,
      });
    }
    return;
  }

  const effective = isNodeEffectiveForLanguage(
    'function_implement',
    member.properties,
    ir.targetLanguage,
    { isGlobalScope: ir.activeClass?.isGlobalScope }
  );

  if (!effective) {
    if (ir.emitUnsupportedComments !== false) {
      const ctx = printContextForIr(ir, '', ir.environmentManifest);
      const indent = memberChainIndentFor(ctx);
      const prefix = commentPrefixFromPack(ctx);
      const label = (typeof member.properties?.name === 'string' && member.properties.name.trim()) || symbol.name;
      sink.appendTagged({
        nodeId: member.implementSourceGraphNodeId ?? member.sourceGraphNodeId,
        text: `${indent}${prefix}(x) Implement ${label}`,
      });
    }
    return;
  }

  const defineNodeId =
    member.implementSourceGraphNodeId ?? member.sourceGraphNodeId;
  const overloadUnsupported =
    member.overloads.length > 1 &&
    isFeatureUnsupportedForLanguage('function.overload', ir.targetLanguage);

  for (let i = 0; i < member.overloads.length; i++) {
    const overload = member.overloads[i]!;
    if (overloadUnsupported && i > 0) {
      if (ir.emitUnsupportedComments !== false) {
        const ctx = printContextForIr(ir, '', ir.environmentManifest);
        const indent = memberChainIndentFor(ctx);
        const prefix = commentPrefixFromPack(ctx);
        const label =
          (typeof member.properties?.name === 'string' && member.properties.name.trim()) ||
          symbol.name;
        sink.appendTagged({
          nodeId: defineNodeId,
          text: `${indent}${prefix}(x) Implement ${label}`,
        });
      }
      continue;
    }
    const props = { ...member.properties, overloadId: overload.id };
    const header = formatFunctionDefHeader(
      symbol,
      ir.targetLanguage,
      functionNeedsAsync(ir, symbol.id),
      props,
      irClassName(ir)
    );

    const headerStartLine = sink.lineCount + 1;
    sink.appendRaw(header);

    // Define owns the emitted header + body. Declare only maps to its own emit
    // (C++ prototype or U66 `(x) Declare`), never the Define `def` / method line.
    sink.tagRange(defineNodeId, headerStartLine, headerStartLine, symbol.name);

    appendFunctionBody(sink, ir, overload.tabId, emptyLine, ir.environmentManifest, defineNodeId, undefined, {
      onBeforeNode: onBeforeFlowNode,
    });
  }

  const tabClose = renderFunctionTabClose(ir.targetLanguage);
  if (tabClose) {
    sink.appendRaw(tabClose);
  }
}

/**
 * C++ out-of-line method after class close: `void Class::Name() { … }`
 * Body indent is file-scope (4 spaces), not in-class (8 spaces).
 */
export function appendCppOutOfLineFunction(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>,
  className: string,
  onBeforeFlowNode?: (sourceGraphNodeId: string, indent: string) => void
): void {
  const { symbol } = member;
  if (functionRoleShouldSkip(ir, member.properties)) {
    return;
  }

  const defineNodeId =
    member.implementSourceGraphNodeId ?? member.sourceGraphNodeId;
  const overloads =
    member.overloads.length > 0 ? member.overloads : [{ id: '', tabId: symbol.id }];

  for (const overload of overloads) {
    if (sink.lineCount > 0) sink.appendRaw('');

    const props = overload.id
      ? { ...member.properties, overloadId: overload.id }
      : member.properties;
    const header = formatFunctionDefOutOfLineHeader(
      symbol,
      className,
      'cpp',
      functionNeedsAsync(ir, symbol.id),
      props
    );
    const headerStartLine = sink.lineCount + 1;
    sink.appendRaw(header);

    // Out-of-line header + body → Define only (Declare already tagged the prototype).
    sink.tagRange(defineNodeId, headerStartLine, headerStartLine, symbol.name);

    appendFunctionBody(
      sink,
      ir,
      overload.tabId,
      '    // empty',
      ir.environmentManifest,
      defineNodeId,
      '    ',
      { onBeforeNode: onBeforeFlowNode }
    );

    sink.appendRaw(renderFunctionOutOfLineClose('cpp'));
    sink.tagRange(defineNodeId, headerStartLine, sink.lineCount, symbol.name);
  }
}

export function appendEnumDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EnumDecl' }>
): void {
  const startLine = sink.lineCount + 1;
  const body = member.members.map((m) => `    ${m}`).join(',\n');
  if (ir.targetLanguage === 'go') {
    const consts = member.members.map((m, i) => i === 0 ? `\t${member.name}_${m} ${member.name} = iota` : `\t${member.name}_${m}`).join('\n');
    sink.appendRaw(`type ${member.name} int\nconst (\n${consts}\n)`);
  } else if (ir.targetLanguage === 'cpp') {
    sink.appendRaw(`enum class ${member.name} {\n${body}\n};`);
  } else if (ir.targetLanguage === 'csharp') {
    sink.appendRaw(`public enum ${member.name} {\n${body}\n}`);
  } else if (ir.targetLanguage === 'python') {
    sink.appendRaw(`class ${member.name}(Enum):\n` + member.members.map((m, i) => `    ${m} = ${i + 1}`).join('\n'));
  } else if (ir.targetLanguage === 'javascript') {
    const entries = member.members.map((m, i) => `  ${m}: ${i + 1}`).join(',\n');
    sink.appendRaw(`const ${member.name} = Object.freeze({\n${entries}\n});`);
  } else if (ir.targetLanguage === 'rust') {
    sink.appendRaw(`pub enum ${member.name} {\n${member.members.map((m) => `    ${m}`).join(',\n')}\n}`);
  } else if (ir.targetLanguage === 'gdscript') {
    sink.appendRaw(`enum ${member.name} { ${member.members.join(', ')} }`);
  } else if (ir.targetLanguage === 'verse') {
    sink.appendRaw(`${member.name} := enum:\n` + member.members.map((m) => `    ${m}`).join('\n'));
  } else {
    sink.appendRaw(`// enum ${member.name}`);
  }
  sink.appendRaw('');
  sink.tagRange(member.sourceGraphNodeId, startLine, sink.lineCount - 1, `enum ${member.name}`);
}


/** Rust composition: every class with a shell gets `fn new()` so `Parent::new()` / `Type::new()` compile. */
export function appendRustNewConstructor(sink: CodeSink, ir: IrModule): void {
  if (ir.targetLanguage !== 'rust') return;
  const classDecl = ir.members.find(
    (m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl'
  );
  if (!classDecl) return;
  const form = classDecl.properties?.form;
  if (form === 'trait') return;

  const extendsType = (classDecl.extendsType || ir.extendsType || '').trim();
  const fields = ir.members.filter(
    (m): m is Extract<IrMemberDecl, { kind: 'VariableDecl' }> =>
      m.kind === 'VariableDecl' && rustVariableItemKind(m) === 'field'
  );

  const family = targetLanguageToFamily(ir.targetLanguage) ?? 'rust';
  const profile = resolvePrintProfile(family, ir.codegenTarget?.capabilities ?? []);
  const row = requireTemplate(profile, 'ConstructorOpen', ir.targetLanguage);
  const header = renderTemplate(
    row,
    { linePrefix: '    ', paramList: '' },
    profile.layout
  ).text;

  const startLine = sink.lineCount + 1;
  sink.appendRaw(header);
  sink.appendRaw('        Self {');
  if (extendsType) {
    sink.appendRaw(`            base: ${extendsType}::new(),`);
  }
  for (const field of fields) {
    const enumType = enumTypeFromSymbolOrProps(field.symbol, field.properties);
    const val = formatVariableDefault(field.symbol, ir.targetLanguage, enumType);
    sink.appendRaw(`            ${field.symbol.name}: ${val},`);
  }
  sink.appendRaw('        }');
  sink.appendRaw('    }');
  sink.tagRange(classDecl.sourceGraphNodeId, startLine, sink.lineCount, 'fn new');
}

/**
 * Emit members in canvas define-chain order (1:1 visual → text).
 * C++ Defers FunctionDecl with emitBody to after class close (out-of-line).
 * Non-C++ non-abstract Declare → U66 `(x) Declare …` (or omit when comments off).
 */
export function appendIrMembersInOrder(
  sink: CodeSink,
  ir: IrModule,
  state: MemberState,
  hooks: MemberEmitHooks = {}
): void {
  for (const member of ir.members) {
    const nodeId =
      'sourceGraphNodeId' in member && typeof member.sourceGraphNodeId === 'string'
        ? member.sourceGraphNodeId
        : undefined;
    if (nodeId) {
      // Match indent of the emitted construct (fields/methods are member-chain indented).
      const indent =
        member.kind === 'VariableDecl' ||
        member.kind === 'FunctionDecl' ||
        member.kind === 'EventDecl'
          ? memberChainIndentFor(printContextForIr(ir, '', ir.environmentManifest))
          : '';
      hooks.onBeforeMemberNode?.(nodeId, indent);
    }

    switch (member.kind) {
      case 'ModuleImport':
      case 'ImportClass':
        // File-scope at chain position — before/between classes as drawn on canvas.
        appendImportStatement(sink, ir, member);
        break;
      case 'ClassDecl':
        hooks.onClassDecl?.();
        break;
      case 'EnumDecl':
        // File-scope / nested at chain position — do not hoist ahead of earlier members.
        appendEnumDecl(sink, ir, member);
        break;
      case 'VariableDecl':
        hooks.onBeforeField?.();
        appendVariableDecl(sink, ir, member, state);
        break;
      case 'FunctionDecl': {
        // C++: queue bodies for out-of-line after class close.
        if (
          ir.targetLanguage === 'cpp' &&
          member.emitBody &&
          hooks.deferCppOutOfLineMethod?.(member)
        ) {
          break;
        }
        hooks.onBeforeMethod?.();
        if (ir.targetLanguage === 'cpp') {
          const vis = String(
            member.properties?.visibility ??
              (member.symbol as { visibility?: string }).visibility ??
              ''
          );
          // Visibility sections only for in-class prototypes / events — skip for (x) comments.
          const isAbstract = !!(
            member.properties?.isAbstract || member.symbol.flags?.abstract
          );
          const needsVis =
            member.emitBody ||
            isAbstract ||
            isNodeEffectiveForLanguage(
              'function_define',
              member.properties,
              ir.targetLanguage,
              { isGlobalScope: ir.activeClass?.isGlobalScope }
            );
          if (needsVis) {
            ensureCppVisibility(sink, ir, state, vis);
          }
        }
        appendFunctionDefinition(sink, ir, member, hooks.onBeforeFlowNode);
        break;
      }
      case 'EventDecl': {
        const effective = isNodeEffectiveForLanguage(
          'event_member_define',
          member.properties,
          ir.targetLanguage,
          { isGlobalScope: ir.activeClass?.isGlobalScope, eventHasHandler: !!member.handlerSourceGraphNodeId }
        );

        if (!effective) {
          if (ir.emitUnsupportedComments !== false) {
            const ctx = printContextForIr(ir, '', ir.environmentManifest);
            const indent = memberChainIndentFor(ctx);
            const prefix = commentPrefixFromPack(ctx);
            const label =
              (typeof member.properties?.name === 'string' && member.properties.name.trim()) ||
              member.symbol.name;
            sink.appendTagged({
              nodeId: member.sourceGraphNodeId,
              text: `${indent}${prefix}(x) Declare ${label}`,
            });
          }
          break;
        }
        hooks.onBeforeMethod?.();
        if (ir.targetLanguage === 'cpp') {
          const vis = String(
            member.properties?.visibility ??
              (member.symbol as { visibility?: string }).visibility ??
              ''
          );
          ensureCppVisibility(sink, ir, state, vis);
        }
        appendEventDefinition(sink, ir, member, hooks.onBeforeFlowNode);
        break;
      }
    }
  }
}

export function tagClassDeclLine(sink: CodeSink, ir: IrModule, classLineStart: number): void {
  const classDecl = ir.members.find((m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl');
  if (!classDecl) return;
  sink.tagRange(classDecl.sourceGraphNodeId, classLineStart, classLineStart, `class ${ir.moduleName}`);
}

/** Tag a structural class shell line (e.g. C++ `public:`, closing `};`) to the class define node. */
export function tagClassStructuralLine(sink: CodeSink, ir: IrModule, line: number): void {
  const classDecl = ir.members.find((m): m is Extract<IrMemberDecl, { kind: 'ClassDecl' }> => m.kind === 'ClassDecl');
  if (!classDecl) return;
  sink.tagRange(classDecl.sourceGraphNodeId, line, line);
}
