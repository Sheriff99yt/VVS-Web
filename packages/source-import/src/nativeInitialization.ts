import type { Node as SyntaxNode } from 'web-tree-sitter';
import { IMPORT_LIMITS, type SourceSpan } from './contracts';
import { analyzeNativeLocalBindings, type NativeLocalBinding } from './nativeLocalBindings';
import { parseNativeTree } from './nativeParser';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
import { nativeScalarSourceConversion } from './nativeScalarSourceExpression';

type Diagnostic = SourceSpan & { code: string; status: 'invalid' | 'unsafe' | 'unsupported'; message: string };
export interface NativeInitializationRead extends SourceSpan { bindingId: string; initialized: boolean }
export interface NativeInitializationDeclaration extends SourceSpan {
  bindingId: string; origin: 'parameter' | 'explicit' | 'native-default' | 'deferred';
}
export interface NativeInitializationReport {
  analysisOnly: true; language: NativeInventoryLanguage; domain: 'ordinary-scalar-local-initialization';
  graphAdmission: 'blocked'; nativeValueStatus: 'unvalidated';
  declarations: readonly Readonly<NativeInitializationDeclaration>[];
  reads: readonly Readonly<NativeInitializationRead>[];
  diagnostics: readonly Readonly<Diagnostic>[];
}
type State = { definite: boolean; possible: boolean };
type Flow = { states: Map<string, State>; live: boolean };
const field = (node: SyntaxNode, name: string) => node.childForFieldName(name);
const children = (node: SyntaxNode) => node.namedChildren.filter(child => !['comment', 'line_comment', 'block_comment'].includes(child.type));
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });
const fork = (flow: Flow): Flow => ({ live: flow.live, states: new Map(flow.states) });
function scalarType(language: NativeInventoryLanguage, type?: string) {
  if (!type) return language !== 'cpp';
  if (language === 'rust') return /^(?:[iu](?:8|16|32|64|128|size)|bool|f32|f64)$/.test(type);
  if (language === 'gdscript') return ['int', 'bool', 'float', 'String', 'Variant'].includes(type);
  return /^(?:(?:signed|unsigned)\s+)?(?:char|short(?: int)?|int|long(?: long)?(?: int)?|float|double|bool|auto)$/.test(type);
}

/** Initialization only. Type inference, aliasing, effects and graph acceptance need separate contracts. */
export async function analyzeNativeInitialization(source: string, language: NativeInventoryLanguage): Promise<NativeInitializationReport> {
  const bindings = await analyzeNativeLocalBindings(source, language);
  const declarations: NativeInitializationDeclaration[] = [], reads: NativeInitializationRead[] = [];
  const diagnostics: Diagnostic[] = bindings.diagnostics.map(item => ({ start: item.start ?? 0, end: item.end ?? 0, code: item.code, status: item.status, message: item.message }));
  const tree = parseNativeTree(source, language), started = performance.now();
  const add = (node: SyntaxNode, suffix: string, status: Diagnostic['status'], message: string) => {
    if (diagnostics.length < IMPORT_LIMITS.diagnostics) diagnostics.push({ ...span(node), code: `${language.toUpperCase()}_${suffix}`, status, message });
  };
  const bindingAt = (node: SyntaxNode): NativeLocalBinding | undefined => bindings.bindings.find(binding => binding.start === node.startIndex && binding.end === node.endIndex);
  const referenceAt = (node: SyntaxNode) => bindings.references.find(reference => reference.start === node.startIndex && reference.end === node.endIndex);
  const read = (node: SyntaxNode, flow: Flow) => {
    const reference = referenceAt(node); if (!reference) return;
    const initialized = flow.states.get(reference.bindingId)?.definite === true;
    reads.push({ ...span(node), bindingId: reference.bindingId, initialized });
    if (!initialized) add(node, 'UNINITIALIZED_READ', language === 'cpp' ? 'unsafe' : 'invalid', 'This read is not definitely initialized on every live path.');
  };
  const write = (node: SyntaxNode, flow: Flow) => {
    const reference = referenceAt(node); if (!reference) return;
    const binding = bindings.bindings.find(item => item.id === reference.bindingId)!;
    const before = flow.states.get(binding.id);
    if (!binding.mutable && (language !== 'rust' || before?.possible)) add(node, 'READONLY_ASSIGNMENT', 'invalid', 'This binding cannot be assigned on this path.');
    flow.states.set(binding.id, { definite: true, possible: true });
  };
  const literalKinds = new Set(['integer_literal', 'float_literal', 'number_literal', 'boolean_literal', 'true', 'false', 'integer', 'float', 'string', 'string_literal', 'char_literal']);
  const wrappers = new Set(['binary_expression', 'binary_operator', 'unary_expression', 'unary_operator', 'parenthesized_expression', 'condition_clause']);
  const expression = (node: SyntaxNode, flow: Flow, discarded = false): void => {
    if (node.type === 'identifier') { if (!(language === 'cpp' && discarded)) read(node, flow); return; }
    const conversion = nativeScalarSourceConversion(node, language);
    if (conversion) { expression(conversion.operand, flow); return; }
    if (literalKinds.has(node.type)) return;
    if (wrappers.has(node.type)) {
      const operands = children(node);
      if (['unary_expression', 'unary_operator'].includes(node.type)) {
        const operator = operands[0] ? source.slice(node.startIndex, operands[0].startIndex).trim() : '';
        if (!['!', '-', '+', '~', ...(language === 'gdscript' ? ['not'] : [])].includes(operator)) { add(node, 'UNSUPPORTED_INITIALIZATION_EXPRESSION', 'unsupported', 'Borrow/dereference effects need native ownership contracts.'); return; }
      }
      for (const child of operands) expression(child, flow, discarded && node.type === 'parenthesized_expression'); return;
    }
    add(node, 'UNSUPPORTED_INITIALIZATION_EXPRESSION', 'unsupported', 'This expression requires its native evaluation-order/effect contract.');
  };
  const assign = (node: SyntaxNode, flow: Flow) => {
    const left = field(node, 'left'), right = field(node, 'right');
    if (!left || !right || left.type !== 'identifier') { add(node, 'UNSUPPORTED_INITIALIZATION_TARGET', 'unsupported', 'Only an ordinary local assignment is reviewed.'); return; }
    const operator = source.slice(left.endIndex, right.startIndex).trim();
    if (operator !== '=') read(left, flow);
    expression(right, flow); write(left, flow);
  };
  const declareLocal = (node: SyntaxNode, flow: Flow) => {
    const declarators = language === 'cpp' ? node.childrenForFieldName('declarator') : [node];
    for (const declarator of declarators) {
      const identifier = language === 'cpp' ? (declarator.type === 'init_declarator' ? field(declarator, 'declarator') : declarator) : field(node, language === 'rust' ? 'pattern' : 'name');
      if (!identifier) continue;
      const binding = bindingAt(identifier); if (!binding) continue;
      if (language === 'cpp' && children(node).some(child => child.type === 'type_qualifier' && child.text !== 'const')) add(identifier, 'UNSUPPORTED_INITIALIZATION_QUALIFIER', 'unsupported', 'Volatile scalar reads require a separate native effect contract.');
      // := is an authored inference marker, not an aggregate type. This only
      // establishes initializer timing; result typing remains a separate gate.
      const inferredGdscript = language === 'gdscript' && field(node, 'type')?.type === 'inferred_type' && binding.declaredType === ':=' && !!field(node, 'value');
      if (!scalarType(language, binding.declaredType) && !inferredGdscript) add(identifier, 'UNSUPPORTED_INITIALIZATION_TYPE', 'unsupported', 'Objects, references and aggregate initialization require native lifetime/type contracts.');
      const initializer = field(declarator, 'value');
      flow.states.set(binding.id, { definite: false, possible: false });
      if (initializer) expression(initializer, flow);
      const initialized = !!initializer || language === 'gdscript';
      flow.states.set(binding.id, { definite: initialized, possible: initialized });
      declarations.push({ ...span(identifier), bindingId: binding.id, origin: initializer ? 'explicit' : language === 'gdscript' ? 'native-default' : 'deferred' });
      if (language === 'cpp' && !binding.mutable && !initializer) add(identifier, 'CONST_INITIALIZER_REQUIRED', 'invalid', 'An ordinary const scalar requires initialization.');
    }
  };
  const join = (target: Flow, paths: Flow[]) => {
    const live = paths.filter(path => path.live); target.live = live.length > 0;
    for (const id of target.states.keys()) {
      target.states.set(id, { definite: live.length > 0 && live.every(path => path.states.get(id)?.definite), possible: live.some(path => path.states.get(id)?.possible) });
    }
  };
  const block = (node: SyntaxNode, flow: Flow): void => {
    for (const child of children(node)) {
      if (!flow.live) { add(child, 'UNSUPPORTED_UNREACHABLE_INITIALIZATION', 'unsupported', 'Dead source requires its native unreachable-region ownership contract.'); break; }
      statement(child, flow);
    }
  };
  const statement = (node: SyntaxNode, flow: Flow): void => {
    if (performance.now() - started > IMPORT_LIMITS.elapsedMs) { add(node, 'UNSUPPORTED_INITIALIZATION_BUDGET', 'unsupported', 'Initialization analysis exceeded its elapsed budget.'); return; }
    if (['declaration', 'let_declaration', 'variable_statement', 'const_statement'].includes(node.type)) { declareLocal(node, flow); return; }
    if (['compound_statement', 'block', 'body'].includes(node.type)) { block(node, flow); return; }
    if (['assignment_expression', 'compound_assignment_expr', 'assignment', 'augmented_assignment'].includes(node.type)) { assign(node, flow); return; }
    if (node.type === 'update_expression') {
      const operand = children(node)[0]; if (operand?.type === 'identifier') { read(operand, flow); write(operand, flow); }
      else add(node, 'UNSUPPORTED_INITIALIZATION_TARGET', 'unsupported', 'Only ordinary local updates are reviewed.');
      return;
    }
    if (['expression_statement', 'return_statement', 'return_expression'].includes(node.type)) {
      for (const child of children(node)) {
        if (['assignment_expression', 'compound_assignment_expr', 'assignment', 'augmented_assignment', 'update_expression', 'if_expression', 'return_expression', 'block'].includes(child.type)) statement(child, flow);
        else expression(child, flow, node.type === 'expression_statement');
      }
      if (['return_statement', 'return_expression'].includes(node.type)) flow.live = false;
      return;
    }
    if (['if_statement', 'if_expression'].includes(node.type)) {
      const condition = field(node, 'condition'); if (!condition) { add(node, 'UNSUPPORTED_INITIALIZATION_CONDITION', 'unsupported', 'No reviewed condition is available.'); return; }
      expression(condition, flow);
      const arms = children(node).filter(child => child.id !== condition.id);
      const paths: Flow[] = [];
      for (const arm of arms) {
        const path = fork(flow);
        if (arm.type === 'else_clause') { for (const child of children(arm)) statement(child, path); }
        else statement(arm, path);
        paths.push(path);
      }
      if (arms.length === 1) paths.push(fork(flow));
      join(flow, paths); return;
    }
    if (node.type === 'empty_statement' || node.type === 'pass_statement') return;
    expression(node, flow);
  };
  try {
    const functions = tree.rootNode.namedChildren.filter(node => node.type === (language === 'rust' ? 'function_item' : 'function_definition'));
    for (const [ordinal, fn] of functions.entries()) {
      const methodId = `${language}:method:${ordinal}`, body = field(fn, 'body'); if (!body) continue;
      const flow: Flow = { live: true, states: new Map() };
      for (const binding of bindings.bindings.filter(item => item.methodId === methodId && item.kind === 'parameter')) {
        flow.states.set(binding.id, { definite: true, possible: true });
        declarations.push({ start: binding.start, end: binding.end, bindingId: binding.id, origin: 'parameter' });
        if (!scalarType(language, binding.declaredType)) add(fn, 'UNSUPPORTED_INITIALIZATION_TYPE', 'unsupported', 'This parameter requires native non-scalar contracts.');
      }
      block(body, flow);
    }
    return Object.freeze({ analysisOnly: true, language, domain: 'ordinary-scalar-local-initialization', graphAdmission: 'blocked', nativeValueStatus: 'unvalidated',
      declarations: Object.freeze(declarations.map(item => Object.freeze(item))), reads: Object.freeze(reads.map(item => Object.freeze(item))), diagnostics: Object.freeze(diagnostics.map(item => Object.freeze(item))) });
  } finally { tree.delete(); }
}
