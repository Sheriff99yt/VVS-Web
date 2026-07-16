import { type VariableSymbol, parseTypeRef, resolveTypeRef, targetLanguageToFamily } from '@vvs/graph-types';
import { renderTemplate, requireTemplate, resolvePrintProfile } from '@vvs/syntax-packs';
import { CodeSink } from '../codeSink';
import type { IrEventHandler, IrMemberDecl, IrModule } from '../ir/types';
import {
  appendFunctionBody,
  appendImportStatement,
  formatFunctionDeclPrototype,
  formatFunctionDefHeader,
  functionNeedsAsync,
} from './helpers';
import { emptyFunctionBodyLine } from './layout';
import { appendEventHandlerDefinition,
  resolveModifierSlots } from './shell';
import { typeNameForTypeRef } from './emitTypes';
import { formatEnumMemberAccess, parseLegacyEnumMember } from './enumAccess';

export interface MemberState {
  cppVisibility: string;
  /** Class shell has been opened (ClassModuleOpen emitted). */
  classOpened?: boolean;
  /** Rust: struct closed and `impl` opened. */
  rustImplOpened?: boolean;
}

export interface MemberEmitHooks {
  /** Fired when walking a ClassDecl — open the class shell. */
  onClassDecl?: () => void;
  /** Before emitting a field (VariableDecl). */
  onBeforeField?: () => void;
  /** Before emitting a method body (FunctionDecl / EventDecl with handler). */
  onBeforeMethod?: () => void;
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

  if (variable.type === 'data_array') {
    if (targetLanguage === 'cpp') return '{}';
    if (targetLanguage === 'python') return '[]';
    if (targetLanguage === 'javascript') return '[]';
    if (targetLanguage === 'csharp') return 'new List<float>()';
    if (targetLanguage === 'rust') return 'Vec::new()';
    if (targetLanguage === 'gdscript') return '[]';
    if (targetLanguage === 'verse') return 'array{}';
    return '[]';
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

  const typeRef = resolveTypeRef(variable);
  if (typeRef.kind === 'class' && (val === null || val === undefined || val === '')) {
    if (targetLanguage === 'python') return 'None';
    if (targetLanguage === 'cpp') return '{}';
    if (targetLanguage === 'csharp') return 'null';
    if (targetLanguage === 'rust') return 'Default::default()';
    if (targetLanguage === 'gdscript') return 'null';
    if (targetLanguage === 'verse') return 'false'; // placeholder — class refs rare in Verse samples
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

function appendVariableDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'VariableDecl' }>,
  state: MemberState
): void {
  const { symbol, sourceGraphNodeId } = member;
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
  member: Extract<IrMemberDecl, { kind: 'EventDecl' }>
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
  });
}

function appendFunctionDefinition(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'FunctionDecl' }>
): void {
  const { symbol } = member;
  const emptyLine = emptyFunctionBodyLine(ir.targetLanguage);

  if (sink.lineCount > 0) sink.appendRaw('');

  const isAbstract = member.properties?.isAbstract || member.symbol.flags?.abstract;
  if (isAbstract) {
    const proto = formatFunctionDeclPrototype(symbol, ir.targetLanguage, member.properties);
    if (proto) {
      const headerStartLine = sink.lineCount + 1;
      sink.appendRaw(proto);
      if (ir.targetLanguage === 'cpp' || ir.targetLanguage === 'csharp') {
        sink.tagRange(member.sourceGraphNodeId, headerStartLine, headerStartLine, symbol.name);
      }
    } else {
      // Abstract is ineffective for this language — emit a tagged comment, do not invent a body.
      const headerStartLine = sink.lineCount + 1;
      const comment =
        ir.targetLanguage === 'python' || ir.targetLanguage === 'gdscript' || ir.targetLanguage === 'verse'
          ? `    # abstract ${symbol.name}`
          : `    // abstract ${symbol.name}`;
      sink.appendRaw(comment);
      sink.tagRange(member.sourceGraphNodeId, headerStartLine, headerStartLine, symbol.name);
    }
    return;
  }

  const header = formatFunctionDefHeader(
    symbol,
    ir.targetLanguage,
    functionNeedsAsync(ir, symbol.id),
    member.properties
  );
  
  const headerStartLine = sink.lineCount + 1;
  sink.appendRaw(header);
  
  sink.tagRange(member.sourceGraphNodeId, headerStartLine, headerStartLine, symbol.name);
  
  appendFunctionBody(sink, ir, symbol.id, emptyLine, ir.environmentManifest);

  const { renderFunctionTabClose } = require('./shell');
  const tabClose = renderFunctionTabClose(ir.targetLanguage);
  if (tabClose) {
    sink.appendRaw(tabClose);
  }
}

export function appendEnumDecl(
  sink: CodeSink,
  ir: IrModule,
  member: Extract<IrMemberDecl, { kind: 'EnumDecl' }>
): void {
  const startLine = sink.lineCount + 1;
  const body = member.members.map((m) => `    ${m}`).join(',\n');
  if (ir.targetLanguage === 'cpp') {
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

/**
 * Emit members in canvas define-chain order (1:1 visual → text).
 * Each FunctionDecl / EventDecl emits its full definition at its chain position —
 * no declare-stub phase and no deferred implementation pass.
 */
export function appendIrMembersInOrder(
  sink: CodeSink,
  ir: IrModule,
  state: MemberState,
  hooks: MemberEmitHooks = {}
): void {
  for (const member of ir.members) {
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
        hooks.onBeforeMethod?.();
        if (ir.targetLanguage === 'cpp') {
          const vis = String(
            member.properties?.visibility ??
              (member.symbol as { visibility?: string }).visibility ??
              ''
          );
          ensureCppVisibility(sink, ir, state, vis);
        }
        appendFunctionDefinition(sink, ir, member);
        break;
      }
      case 'EventDecl': {
        // event_member without an On handler has no text construct (handler owns the method).
        if (!member.handlerSourceGraphNodeId) break;
        hooks.onBeforeMethod?.();
        if (ir.targetLanguage === 'cpp') {
          const vis = String(
            member.properties?.visibility ??
              (member.symbol as { visibility?: string }).visibility ??
              ''
          );
          ensureCppVisibility(sink, ir, state, vis);
        }
        appendEventDefinition(sink, ir, member);
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
