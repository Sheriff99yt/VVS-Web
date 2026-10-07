import {
  IMPORT_CONTEXT, IMPORT_LIMITS, ImportFailure, type ClassImportPlan, type DependencyObligation, type ExpressionPlan,
  type MappingContract, type MappingEvidence, type MethodPlan, type ParameterPlan, type SourceSpan, type StatementPlan, type LocalPlan,
} from './contracts';
import { parseJavaScript, validateSourceCoverage, type ImportRegion, type SourceImportPreview } from './parser';
import { requireMapped, resolveReverseMapping, type ReverseMapping } from './registry';
import { nativeScalarPlan } from './nativeLiteralMapping';
import { NATIVE_OPERATORS } from '@vvs/graph-types';

// Parser-specific structure stops here. Materialization never sees Babel AST nodes.
interface AstNode {
  type: string; start: number; end: number; name?: string; value?: string | number | boolean;
  operator?: string; left?: AstNode; right?: AstNode; argument?: AstNode; test?: AstNode;
  consequent?: AstNode; alternate?: AstNode; body?: AstNode[];
  kind?: 'let' | 'const' | 'var'; declarations?: { id: AstNode; init?: AstNode }[]; expression?: AstNode;
  callee?: AstNode; arguments?: AstNode[];
  init?: AstNode; update?: AstNode; prefix?: boolean; object?: AstNode; property?: AstNode; computed?: boolean; directives?: { value: { value: string }; start: number; end: number }[];
  elements?: (AstNode | null)[]; properties?: AstNode[]; key?: AstNode; shorthand?: boolean;
}
interface MappingScope { source?: string; scopeId: string; parameters: ReadonlyMap<string, ParameterPlan>; dependencies: DependencyObligation[]; offset: number; locals?: Map<string, LocalPlan>; functions?: ReadonlyMap<string, { id: string; arity: number; minimum?: number; rest?: boolean }>; reservedLocals?: ReadonlySet<string>; closedUnit?: boolean; loopStart?: number; fields?: ReadonlyMap<string, { id: string; valueType: LocalPlan['valueType'] }>; parent?: ClassImportPlan; blockDepth?: number; receiverMethods?: ReadonlyMap<string, { id: string; arity: number; minimum?: number; rest?: boolean }>; }
const span = (node: SourceSpan, scope: MappingScope): SourceSpan => ({ start: node.start + scope.offset, end: node.end + scope.offset });
const contract = (id: string, astShape: string, preconditions: string[], targets: string[], failures: string[], dependencies: string[] = []): MappingContract => ({
  id, version: 1, context: IMPORT_CONTEXT, astShape, preconditions,
  targets: targets.map(kindId => ({ kindId, kindVersion: 1, options: 'Explicit static/entry roles only; no casts or inferred modifiers.', pinsAndEdges: 'Literal on consumer value pin; parameter uses declared entry output; binary uses a/b→result; branch true/false→terminal return; members linked by exec order.' })),
  failures, dependencies, evidence: ['full-file.literal-return', 'full-file.static-arithmetic', 'full-file.terminal-branch', 'handwritten-adversarial'],
});
const evidence = (mapping: MappingContract, node: AstNode, scope: MappingScope): MappingEvidence => ({ ...span(node, scope), mappingId: mapping.id, mappingVersion: mapping.version });
const fail = (code: string, message: string, node: AstNode, scope: MappingScope): never => { throw new ImportFailure(code, message, span(node, scope)); };

const literal = contract('js.literal', 'NumericLiteral | StringLiteral | BooleanLiteral', ['Finite literal, JSON-persistable without loss'], [], ['LITERAL_UNSUPPORTED']);
const parameter = contract('js.parameter-read', 'Identifier', ['Resolved in current method parameter scope'], ['function_entry', 'event_define'], ['UNRESOLVED_BINDING'], ['parameter symbol in same scope']);
const arithmetic = contract('js.number-arithmetic', 'BinaryExpression(+ | - | * | /)', ['Both operands provably Number literal trees; no dynamic ToPrimitive or BigInt'], ['math_add', 'math_subtract', 'math_multiply', 'math_divide'], ['JS_DYNAMIC_OPERATOR']);
const valueReturn = contract('js.return', 'ReturnStatement(argument)', ['Exactly one terminal statement per block'], ['flow_return'], ['RETURN_REQUIRED']);
const terminalBranch = contract('js.terminal-if', 'IfStatement(BlockStatement, BlockStatement)', ['Condition provably Boolean; both blocks terminal; preserve polarity'], ['flow_branch'], ['JS_TRUTHINESS', 'TERMINAL_BLOCK_REQUIRED']);
export const classContract = contract('js.plain-class', 'ClassDeclaration(ClassMethod*)', ['Named plain class; closed parameter-only bodies; explicit existing entry consent'], ['class_define', 'function_define', 'function_implement', 'event_member_define', 'event_define'], ['ENTRY_CONSENT', 'ENTRY_MISSING', 'SIGNATURE_UNSUPPORTED']);
export const libraryClassContract = contract('js.library-class', 'ClassDeclaration(ClassMethod*)', ['Named plain class; explicit library unit policy; all methods retain ordinary roles; closed parameter-only bodies'], ['class_define', 'function_define', 'function_implement'], ['ENTRY_POLICY_CONFLICT', 'SIGNATURE_UNSUPPORTED']);
export const methodContract = contract('js.ordinary-method', 'ClassMethod(kind=method, identifiers)', ['No constructor/getter/async/generator/decorator/default/rest; declaration pass precedes reads'], ['function_define', 'function_implement', 'function_entry'], ['SIGNATURE_UNSUPPORTED']);
export const standaloneFunctionContract = contract('js.standalone-function', 'FunctionDeclaration(identifier, identifiers, BlockStatement)', ['Explicit Library file; synchronous named function; parameter-only closure; no directives, comments or captures'], ['function_define', 'function_implement', 'function_entry'], ['LIBRARY_POLICY_REQUIRED', 'SIGNATURE_UNSUPPORTED', 'UNRESOLVED_BINDING']);
standaloneFunctionContract.evidence = ['standaloneUnit.test.ts: fixed canonical file-owned graph', 'standaloneUnit.test.ts: standalone full-file and persistence round trip', 'standaloneUnit.test.ts: unsupported semantics and mutations'];
export const JAVASCRIPT_MAPPING_CONTRACTS = [standaloneFunctionContract, classContract, libraryClassContract, methodContract, literal, parameter, arithmetic, valueReturn, terminalBranch] as const;
export const JAVASCRIPT_CONTROL_MAPPING_CONTRACTS = [
  contract('js.comparison', 'BinaryExpression(=== | !== | < | <= | > | >=)', ['Strict identity allows unknown operands; ordering requires matching proven Number/String values'], ['expr_compare'], ['COMPARISON_OPERANDS'], ['exact operand bindings and native operator mode']),
  contract('js.scoped-assignment', 'AssignmentExpression | UpdateExpression', ['Initialized mutable local; stable Number operands for compound/update; preserve prefix/postfix syntax'], ['variable_set'], ['CONST_ASSIGNMENT', 'LOCAL_TYPE_CHANGE']),
  contract('js.structured-control', 'IfStatement | WhileStatement | ForStatement', ['Explicit blocks; proven Boolean conditions; repeated loop conditions/updates are pure; independent continuation; no loop-local escape'], ['flow_branch', 'flow_while', 'flow_for', 'var_define'], ['LOOP_CONDITION', 'FOR_HEADER', 'UNREACHABLE_SOURCE']),
] as const;

export const javascriptExpressionMappings: readonly ReverseMapping<AstNode, MappingScope, ExpressionPlan>[] = [
  { contract: literal, matches: n => ['NumericLiteral', 'StringLiteral', 'BooleanLiteral'].includes(n.type), map: (n, s) => {
    if (n.value === undefined || (typeof n.value === 'number' && (!Number.isFinite(n.value) || Object.is(n.value, -0)))) return fail('LITERAL_UNSUPPORTED', 'Literal cannot be preserved through JSON persistence.', n, s);
    return { ...evidence(literal, n, s), kind: 'literal', value: n.value, valueType: typeof n.value as 'number' | 'string' | 'boolean' };
  } },
  { contract: parameter, matches: n => n.type === 'Identifier', map: (n, s) => {
    const local = s.locals?.get(n.name!);
    if (local) return { ...evidence(parameter, n, s), kind: 'local', localId: local.id, scopeId: s.scopeId, valueType: local.valueType };
    if (s.reservedLocals?.has(n.name!)) return fail('LOCAL_BEFORE_DECLARATION', 'Read before initialization needs temporal-dead-zone semantics.', n, s);
    const binding = s.parameters.get(n.name!);
    if (!binding) return fail('UNRESOLVED_BINDING', `Unresolved identifier ${n.name}; captures and globals are not represented.`, n, s);
    s.dependencies.push({ ...span(n, s), kind: 'parameter-read', scopeId: s.scopeId, symbolId: binding.id, resolved: true });
    return { ...evidence(parameter, n, s), kind: 'parameter', parameterId: binding.id, scopeId: s.scopeId, valueType: 'unknown' };
  } },
  { contract: arithmetic, matches: n => n.type === 'BinaryExpression' && ['+', '-', '*', '/'].includes(n.operator!), map: (n, s) => {
    const left = mapExpression(n.left!, s), right = mapExpression(n.right!, s);
    if (left.valueType !== 'number' || right.valueType !== 'number') return fail('JS_DYNAMIC_OPERATOR', 'Dynamic JavaScript operators need explicit ToPrimitive/Number/BigInt semantics; numeric Math pins cannot claim this mapping.', n, s);
    const kinds = { '+': 'math_add', '-': 'math_subtract', '*': 'math_multiply', '/': 'math_divide' };
    const operator = n.operator as keyof typeof kinds;
    return { ...evidence(arithmetic, n, s), kind: 'binary', nodeKind: kinds[operator], operator, left, right, valueType: 'number' };
  } },
];
function mapExpression(node: AstNode, scope: MappingScope): ExpressionPlan {
  const native = (form: import('@vvs/graph-types').NativeExpressionSettings['form'], operands: ExpressionPlan[], extra: Partial<ExpressionPlan & { kind: 'native' }> = {}): ExpressionPlan => ({ ...span(node, scope), mappingId: `js.native-${form}`, mappingVersion: 1, kind: 'native', language: 'javascript', form, operands, valueType: 'unknown', ...extra });
  if (node.type === 'UnaryExpression' && ['-', '+'].includes(node.operator!) && ['NumericLiteral', 'BigIntLiteral'].includes(node.argument?.type ?? '')) return native('unary', [mapExpression(node.argument!, scope)], { operator: node.operator, valueType: node.argument?.type === 'NumericLiteral' ? 'number' : 'unknown' });
  if (['BigIntLiteral', 'NullLiteral'].includes(node.type) || (node.type === 'NumericLiteral' && !Number.isFinite(node.value as number)) || (node.type === 'StringLiteral' && /["\\\x00-\x1f]/.test(String(node.value)))) {
    const source = scope.source;
    if (!source) return fail('NATIVE_SOURCE_CONTEXT', 'Exact literal source is required.', node, scope);
    return nativeScalarPlan(source.slice(node.start + scope.offset, node.end + scope.offset), 'javascript.es2022', { ...span(node, scope), mappingId: 'js.native-scalar', mappingVersion: 1 });
  }
  if (node.type === 'ArrayExpression') {
    let cursor = node.start + 1; let previousWasValue = false;
    const operands = (node.elements ?? []).map(element => {
      if (element) { cursor = element.end; previousWasValue = true; return mapExpression(element, scope); }
      const source = scope.source ?? '';
      if (previousWasValue) cursor = source.indexOf(',', cursor + scope.offset) - scope.offset + 1;
      const comma = source.indexOf(',', cursor + scope.offset);
      if (comma < cursor + scope.offset || comma >= node.end + scope.offset) fail('ARRAY_HOLE_ORIGIN', 'Hole must own its exact delimiter.', node, scope);
      cursor = comma - scope.offset + 1; previousWasValue = false;
      return { start: comma, end: comma + 1, mappingId: 'js.array-hole', mappingVersion: 1, kind: 'native' as const, language: 'javascript' as const, form: 'hole' as const, operands: [], valueType: 'unknown' as const };
    });
    return native('array', operands);
  }
  if (node.type === 'ObjectExpression') return native('object', (node.properties ?? []).map(property => mapExpression(property, scope)));
  if (node.type === 'SpreadElement') return native('spread', [mapExpression(node.argument!, scope)]);
  if (node.type === 'ObjectProperty') {
    const value = mapExpression(node.value as unknown as AstNode, scope);
    if (node.shorthand && node.key?.type === 'Identifier') return native('shorthand-entry', [value], { name: node.key.name });
    if (!node.computed && node.key?.type === 'Identifier') return native('named-entry', [value], { name: node.key.name });
    return native(node.computed ? 'computed-entry' : 'quoted-entry', [mapExpression(node.key!, scope), value]);
  }
  if (node.type === 'MemberExpression' && node.object?.type !== 'ThisExpression' && node.object?.type !== 'Super') return node.computed ? native('index', [mapExpression(node.object!, scope), mapExpression(node.property!, scope)]) : native('member', [mapExpression(node.object!, scope)], { name: node.property?.name });
  if (node.type === 'BinaryExpression' && NATIVE_OPERATORS.javascript.includes(node.operator!)) {
    const left = mapExpression(node.left!, scope), right = mapExpression(node.right!, scope);
    const comparison = ['==', '!=', '===', '!==', '<', '<=', '>', '>=', 'in', 'instanceof'].includes(node.operator!);
    if (['+', '-', '*', '/'].includes(node.operator!) && left.valueType === 'number' && right.valueType === 'number') return { ...span(node, scope), mappingId: 'js.number-arithmetic', mappingVersion: 1, kind: 'binary', nodeKind: ({ '+': 'math_add', '-': 'math_subtract', '*': 'math_multiply', '/': 'math_divide' } as Record<string,string>)[node.operator!], operator: node.operator as '+' | '-' | '*' | '/', left, right, valueType: 'number' };
    if (['===', '!=='].includes(node.operator!) || (['<', '<=', '>', '>='].includes(node.operator!) && left.valueType === right.valueType && ['number','string'].includes(left.valueType))) return { ...span(node, scope), mappingId: 'js.comparison', mappingVersion: 1, kind: 'compare', operator: node.operator as '===' | '!==' | '<' | '<=' | '>' | '>=', mode: ['===','!=='].includes(node.operator!) ? 'js-strict' : left.valueType as 'number' | 'string', left, right, valueType: 'boolean' };
    return native('binary', [left, right], { operator: node.operator, valueType: comparison ? 'boolean' : 'unknown' });
  }
  if (node.type === 'MemberExpression' && node.object?.type === 'ThisExpression' && !node.computed && node.property?.type === 'Identifier') {
    const field = scope.fields?.get(node.property.name!);
    if (!field) return fail('RECEIVER_FIELD_UNRESOLVED', 'Receiver access must resolve to a declared instance field.', node, scope);
    return { ...span(node, scope), mappingId: 'js.receiver-field', mappingVersion: 1, kind: 'field', fieldId: field.id, valueType: field.valueType };
  }
  if (node.type === 'CallExpression') {
    if (node.callee?.type === 'MemberExpression' && node.callee.object?.type === 'ThisExpression' && !node.callee.computed && node.callee.property?.type === 'Identifier') {
      const method = scope.receiverMethods?.get(node.callee.property.name!);
      if (!method || method.arity !== node.arguments?.length) return fail('RECEIVER_CALL_UNRESOLVED', 'Receiver call requires an exact declared instance-method signature.', node, scope);
      return { ...span(node, scope), mappingId: 'js.receiver-call', mappingVersion: 1, kind: 'call', functionId: method.id, args: node.arguments!.map(argument => mapExpression(argument, scope)), valueType: 'unknown' };
    }
    if (node.callee?.type === 'Super' || (node.callee?.type === 'MemberExpression' && node.callee.object?.type === 'Super' && !node.callee.computed && node.callee.property?.type === 'Identifier')) {
      const constructor = node.callee.type === 'Super';
      const target = scope.parent?.methods.find(method => constructor ? method.role === 'constructor' : method.name === node.callee?.property?.name && !method.isStatic);
      if (!target || target.parameters.length !== node.arguments?.length) return fail('PARENT_SIGNATURE', 'Parent calls require an explicit resolved method/constructor signature.', node, scope);
      return { ...span(node, scope), mappingId: 'js.parent-call', mappingVersion: 1, kind: 'call', functionId: target.id, isSuper: true, isSuperConstructor: constructor, args: node.arguments!.map(argument => mapExpression(argument, scope)), valueType: 'unknown' };
    }
    const name = node.callee?.name;
    if (node.callee?.type === 'Identifier' && ['String', 'Number', 'parseFloat'].includes(name!) && scope.closedUnit && !scope.parameters.has(name!) && !scope.reservedLocals?.has(name!) && !scope.locals?.has(name!) && !scope.functions?.has(name!)) {
      if (node.arguments?.length !== 1) return fail('CONVERSION_ARITY', 'Built-in conversions require exactly one explicit argument.', node, scope);
      return { ...span(node, scope), mappingId: 'js.explicit-conversion', mappingVersion: 1, kind: 'convert', nodeKind: name === 'String' ? 'convert_to_string' : 'convert_to_number', value: mapExpression(node.arguments[0], scope), ...(name === 'String' ? {} : { strategy: name === 'Number' ? 'number' as const : 'parseFloat' as const }), valueType: name === 'String' ? 'string' : 'number' };
    }
    if (node.callee?.type !== 'Identifier' || scope.parameters.has(node.callee.name!) || scope.reservedLocals?.has(node.callee.name!) || scope.locals?.has(node.callee.name!)) return fail('CALL_BINDING_UNRESOLVED', 'Calls must resolve to an unshadowed function in this file.', node, scope);
    const fn = scope.functions?.get(node.callee.name!);
    if (!fn || (node.arguments?.length ?? 0) < (fn.minimum ?? fn.arity) || (!fn.rest && (node.arguments?.length ?? 0) > fn.arity)) return fail('CALL_SIGNATURE_UNRESOLVED', 'A same-file function and exact argument count are required.', node, scope);
    return { ...span(node, scope), mappingId: 'js.resolved-call', mappingVersion: 1, kind: 'call', functionId: fn.id, args: node.arguments!.map(argument => mapExpression(argument, scope)), nativeArguments: fn.minimum !== undefined || fn.rest === true, valueType: 'unknown' };
  }
  return requireMapped(resolveReverseMapping(javascriptExpressionMappings, node, scope, span(node, scope)));
}
function nativeParameters(params: readonly unknown[], scopeId: string, preview: SourceImportPreview, offset: number): ParameterPlan[] {
  return params.map((raw, index) => {
    const node = raw as AstNode;
    const binding = node.type === 'AssignmentPattern' ? node.left : node.type === 'RestElement' ? node.argument : node;
    if (binding?.type !== 'Identifier' || !binding.name) throw new ImportFailure('PARAMETER_PATTERN', 'This binding pattern requires its own visible pattern mapping.', span(node, { offset } as MappingScope));
    const parameter: ParameterPlan = { id: `param-${index}`, name: binding.name, scopeId, ...span(node, { offset } as MappingScope), mode: node.type === 'RestElement' ? 'rest' : 'positional' };
    if (node.type === 'AssignmentPattern') parameter.default = mapExpression(node.right!, { scopeId, parameters: new Map(), dependencies: [], offset, source: preview.source, closedUnit: true });
    if (parameter.mode === 'rest' && index !== params.length - 1) throw new ImportFailure('PARAMETER_REST_POSITION', 'Rest must be the final native parameter.', parameter);
    return parameter;
  });
}
function signatureFor(id: string, parameters: ParameterPlan[]) {
  return { id, arity: parameters.length, minimum: parameters.reduce((minimum, parameter, index) => !parameter.default && parameter.mode !== 'rest' ? index + 1 : minimum, 0), rest: parameters.some(parameter => parameter.mode === 'rest') };
}
export const javascriptStatementMappings: readonly ReverseMapping<AstNode, MappingScope, StatementPlan>[] = [
  { contract: valueReturn, matches: n => n.type === 'ReturnStatement', map: (n, s) => {
    if (!n.argument) return fail('RETURN_REQUIRED', 'A visible return value is required.', n, s);
    return { ...evidence(valueReturn, n, s), kind: 'return', value: mapExpression(n.argument, s) };
  } },
  { contract: terminalBranch, matches: n => n.type === 'IfStatement', map: (n, s) => {
    if (n.consequent?.type !== 'BlockStatement' || (n.alternate && n.alternate.type !== 'BlockStatement')) return fail('TERMINAL_BLOCK_REQUIRED', 'Explicit branch blocks are required.', n, s);
    const condition = mapExpression(n.test!, s);
    if (condition.valueType !== 'boolean') return fail('JS_TRUTHINESS', 'Dynamic JavaScript truthiness needs an explicit semantic variant; Boolean pins must not imply a cast.', n, s);
    return { ...evidence(terminalBranch, n, s), kind: 'branch', condition, consequent: mapBlock(n.consequent, s, false), ...(n.alternate ? { alternate: mapBlock(n.alternate, s, false) } : {}) };
  } },
];
function completes(value: StatementPlan | undefined): boolean {
  if (!value) return false;
  return value.kind === 'return' || value.kind === 'break' || value.kind === 'continue' || (value.kind === 'sequence' && completes(value.statements[value.statements.length - 1])) || (value.kind === 'branch' && !!value.alternate && completes(value.consequent) && completes(value.alternate));
}
function hasCall(value: ExpressionPlan): boolean {
  return (value.kind === 'native' && value.operands.some(hasCall)) || value.kind === 'call' || (value.kind === 'convert' && hasCall(value.value)) || ((value.kind === 'binary' || value.kind === 'compare') && (hasCall(value.left) || hasCall(value.right)));
}
function mapAssignment(node: AstNode, scope: MappingScope): StatementPlan & { kind: 'assign' } {
  const update = node.type === 'UpdateExpression', name = update ? node.argument?.name : node.left?.name;
  const target = update ? node.argument : node.left;
  const field = target?.type === 'MemberExpression' && target.object?.type === 'ThisExpression' && !target.computed && target.property?.type === 'Identifier' ? scope.fields?.get(target.property.name!) : undefined;
  const local = field ? { id: field.id, valueType: field.valueType, declarationKind: 'let' } : scope.locals?.get(name!);
  if (!local || (!field && target?.type !== 'Identifier')) return fail('LOCAL_ASSIGNMENT_UNRESOLVED', 'Update must resolve to an initialized local.', node, scope);
  if (local.declarationKind === 'const') return fail('CONST_ASSIGNMENT', 'A const binding cannot be assigned.', node, scope);
  if (!['=', '+=', '-=', '*=', '/=', '++', '--'].includes(node.operator!)) return fail('UPDATE_OPERATOR', 'Unsupported assignment operator.', node, scope);
  const value = update ? undefined : mapExpression(node.right!, scope);
  if (node.operator === '=' ? value!.valueType !== local.valueType : local.valueType !== 'number' || (value && value.valueType !== 'number')) return fail('LOCAL_TYPE_CHANGE', 'Updates require stable proven numeric operands; ordinary assignment must preserve the type.', node, scope);
  return { ...span(node, scope), mappingId: 'js.scoped-assignment', mappingVersion: 1, kind: 'assign', localId: local.id, value, operator: node.operator as '=' | '+=' | '-=' | '*=' | '/=' | '++' | '--', prefix: node.prefix };
}
function mapBlock(block: AstNode, scope: MappingScope, requireTerminal = true): StatementPlan {
  const statements = block.body?.filter(statement => statement.type !== 'EmptyStatement');
  if (!statements?.length && !requireTerminal) return { ...span(block, scope), mappingId: 'js.empty-body', mappingVersion: 1, kind: 'sequence', statements: [] };
  if (!statements?.length) return fail('TERMINAL_BLOCK_REQUIRED', 'An explicit terminal return or if/else is required.', block, scope);
  const reservedLocals = new Set(scope.reservedLocals);
  const blockBindings = new Set<string>();
  for (const statement of statements) for (const declaration of statement.declarations ?? []) if (declaration.id.type === 'Identifier') { reservedLocals.add(declaration.id.name!); blockBindings.add(declaration.id.name!); }
  const nested: MappingScope = { ...scope, locals: new Map(scope.locals), reservedLocals, blockDepth: (scope.blockDepth ?? -1) + 1 };
  for (const name of blockBindings) nested.locals!.delete(name);
  const declaredHere = new Set<string>();
  const mapped: StatementPlan[] = (block.directives ?? []).map(directive => ({ ...span(directive, scope), mappingId: 'js.directive', mappingVersion: 1, kind: 'directive', value: directive.value.value }));
  for (const node of statements) {
    if (mapped.length && completes(mapped[mapped.length - 1])) return fail('UNREACHABLE_SOURCE', 'Statements after an unconditional completion require explicit unreachable-code support.', node, scope);
    const ev = { ...span(node, scope), mappingId: 'js.scoped-statement', mappingVersion: 1 };
    if (node.type === 'BreakStatement' || node.type === 'ContinueStatement') {
      if (nested.loopStart === undefined) return fail('LOOP_TARGET_REQUIRED', 'Loop control requires its nearest enclosing loop.', node, scope);
      mapped.push({ ...ev, kind: node.type === 'BreakStatement' ? 'break' : 'continue', loopStart: nested.loopStart });
    } else if (node.type === 'VariableDeclaration') {
      if (node.declarations?.length !== 1 || node.declarations[0]?.id.type !== 'Identifier' || !node.declarations[0].init || !['let', 'const'].includes(node.kind!)) return fail('LOCAL_DECLARATION_UNSUPPORTED', 'Use one initialized let/const binding; var hoisting and destructuring need separate mappings.', node, scope);
      const declaration = node.declarations[0], name = declaration.id.name!;
      if (declaredHere.has(name) || (nested.blockDepth === 0 && nested.parameters.has(name))) return fail('LOCAL_SHADOWING', 'Shadowed local/parameter bindings need explicit nested-scope support.', node, scope);
      const value = mapExpression(declaration.init!, nested);
      const local: LocalPlan = { ...ev, id: `${scope.scopeId}-local-${ev.start}`, name, scopeId: scope.scopeId, valueType: value.valueType, declarationKind: node.kind!, nestedScope: nested.blockDepth! > 0 };
      declaredHere.add(name);
      nested.locals!.set(name, local); mapped.push({ ...ev, kind: 'declare', local, value });
    } else if (node.type === 'ExpressionStatement' && ['AssignmentExpression', 'UpdateExpression'].includes(node.expression?.type ?? '')) {
      mapped.push(mapAssignment(node.expression!, nested));
    } else if (node.type === 'WhileStatement') {
      const condition = mapExpression(node.test!, nested);
      if (condition.valueType !== 'boolean' || (node.body as unknown as AstNode)?.type !== 'BlockStatement') return fail('LOOP_CONDITION', 'While requires a pure Boolean condition and explicit body block.', node, scope);
      mapped.push({ ...ev, kind: 'while', condition, body: mapBlock(node.body as unknown as AstNode, { ...nested, loopStart: ev.start }, false) });
    } else if (node.type === 'ForStatement') {
      if (!node.init || !node.test || !node.update || node.init.type !== 'VariableDeclaration' || node.init.kind !== 'let' || (node.body as unknown as AstNode)?.type !== 'BlockStatement') return fail('FOR_HEADER', 'Counted For requires one initialized let local, condition, update and body block.', node, scope);
      const loopScope = { ...nested, locals: new Map(nested.locals), reservedLocals: new Set(nested.reservedLocals) };
      const initializer = mapBlock({ ...node, type: 'BlockStatement', body: [node.init] }, loopScope, false);
      if (initializer.kind !== 'declare' || initializer.value.valueType !== 'number' || hasCall(initializer.value)) return fail('FOR_INITIALIZER', 'Counted For initializer must be a pure proven Number local.', node, scope);
      loopScope.locals!.set(initializer.local.name, initializer.local);
      const condition = mapExpression(node.test, loopScope), update = mapAssignment(node.update, loopScope);
      if (condition.valueType !== 'boolean' || (update.value && hasCall(update.value)) || update.localId !== initializer.local.id) return fail('FOR_HEADER', 'For requires a pure Boolean condition and pure update of its own loop local.', node, scope);
      mapped.push({ ...ev, kind: 'for', initializer, condition, update, body: mapBlock(node.body as unknown as AstNode, { ...loopScope, loopStart: ev.start }, false) });
    } else if (node.type === 'ExpressionStatement' && node.expression?.type === 'CallExpression') {
      const call = mapExpression(node.expression, nested);
      if (call.kind !== 'call') return fail('CALL_BINDING_UNRESOLVED', 'An explicit resolved call is required.', node, scope);
      mapped.push({ ...ev, kind: 'call', call });
    } else {
      mapped.push(requireMapped(resolveReverseMapping(javascriptStatementMappings, node, nested, span(node, scope))));
    }
  }
  const last = mapped[mapped.length - 1];
  if (requireTerminal && !completes(last)) return fail('TERMINAL_BLOCK_REQUIRED', 'The function must end with an explicit return or complete if/else.', block, scope);
  return mapped.length === 1 ? mapped[0] : { ...span(block, scope), mappingId: 'js.statement-sequence', mappingVersion: 1, kind: 'sequence', statements: mapped };
}

/** Declare scope identities before definition/use wiring. No ambient name lookup. */
export function planJavaScriptClass(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry: boolean, entryPolicy: 'program' | 'library' = 'program', options: { declarationIndex?: number; idPrefix?: string; parent?: ClassImportPlan } = {}): ClassImportPlan {
  validateSourceCoverage(preview);
  if (!preview.regions.includes(region) || region.kind !== 'candidate') throw new ImportFailure('STALE_SOURCE', 'Select a candidate from the current source preview.');
  if (!['class', 'class-file'].includes(region.proposedKind ?? '')) throw new ImportFailure('MODULE_SCOPE_REQUIRED', 'Standalone functions require a reviewed module-scope design.', region);
  if (!['program', 'library'].includes(entryPolicy)) throw new ImportFailure('ENTRY_POLICY_INVALID', 'Select an explicit program or library policy.', region);
  if (entryPolicy === 'library' && mapStartAsEntry) throw new ImportFailure('ENTRY_POLICY_CONFLICT', 'Library import retains ordinary methods without assigning a program-entry role.', region);
  if (entryPolicy === 'program' && !mapStartAsEntry) throw new ImportFailure('ENTRY_CONSENT', 'Confirm the explicit mapping of on_start to the VVS program entry event.', region);
  const ast = parseJavaScript(region.text);
  const declaration = ast.program.body[options.declarationIndex ?? 0];
  if ((options.declarationIndex === undefined && ast.program.body.length !== 1) || declaration?.type !== 'ClassDeclaration' || !declaration.id || (declaration.superClass && (declaration.superClass.type !== 'Identifier' || declaration.superClass.name !== options.parent?.name)) || declaration.decorators?.length || ast.comments?.length) throw new ImportFailure('CLASS_UNSUPPORTED', 'Expected one plain named class without embedded comments.', region);
  if (declaration.body.body.length > 32) throw new ImportFailure('METHOD_BUDGET', 'Import at most 32 methods in one class.', region);
  const fields: NonNullable<ClassImportPlan['fields']> = [];
  const fieldNames = new Set<string>();
  for (const member of declaration.body.body) if (member.type === 'ClassProperty') {
    if (member.computed || member.key.type !== 'Identifier' || !member.value || fieldNames.has(member.key.name)) throw new ImportFailure('FIELD_UNSUPPORTED', 'Fields need unique plain names and explicit initializers.', region);
    const value = mapExpression(member.value as unknown as AstNode, { scopeId: 'fields', parameters: new Map(), dependencies: [], offset: region.start, source: preview.source });
    if (value.kind !== 'literal') throw new ImportFailure('FIELD_INITIALIZER', 'Field initializer effects need an ordered member expression contract.', region);
    fieldNames.add(member.key.name);
    fields.push({ ...span(member as unknown as AstNode, { offset: region.start, source: preview.source } as MappingScope), mappingId: 'js.field', mappingVersion: 1, id: `${options.idPrefix ?? ''}import-field-${fields.length}`, name: member.key.name, isStatic: member.static, value, valueType: value.valueType });
  }
  const names = new Set<string>();
  const declarations = declaration.body.body.filter(member => member.type !== 'ClassProperty').map((member, i) => {
    if (member.type !== 'ClassMethod' || !['method', 'constructor'].includes(member.kind) || member.computed || member.async || member.generator || member.decorators?.length || member.key.type !== 'Identifier' || member.params.some(p => p.type !== 'Identifier') || member.body.directives.length) throw new ImportFailure('SIGNATURE_UNSUPPORTED', 'Only ordinary methods with named parameters and no directives are supported.', region);
    const name = member.key.name;
    if (names.has(name)) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate method names need an explicit mapping.', region);
    names.add(name);
    const scopeId = `${options.idPrefix ?? ''}method-${i}`;
    const parameters: ParameterPlan[] = member.params.map((p, index) => ({ id: `param-${index}`, name: (p as { name: string }).name, scopeId, start: p.start! + region.start, end: p.end! + region.start }));
    if (new Set(parameters.map(p => p.name)).size !== parameters.length) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate parameter binding.', region);
    return { member, name, scopeId, parameters, id: `${options.idPrefix ?? ''}import-function-${i}` };
  });
  if (entryPolicy === 'program' && !declarations.some(d => d.name === 'on_start' && !d.member.static)) throw new ImportFailure('ENTRY_MISSING', 'An ordinary on_start method is required; no entry will be invented.', region);
  const dependencies: DependencyObligation[] = [];
  const methods: MethodPlan[] = declarations.map(d => {
    const scope: MappingScope = { scopeId: d.scopeId, parameters: new Map(d.parameters.map(p => [p.name, p])), dependencies, offset: region.start, source: preview.source, parent: options.parent, closedUnit: preview.regions.every(part => part === region || part.kind === 'trivia'), functions: new Map(ast.program.body.filter(statement => statement.type === 'ClassDeclaration' && statement.id).map(statement => [(statement as { id: { name: string } }).id.name, { id: 'class-binding', arity: -1 }])), fields: d.member.static ? undefined : new Map([...(options.parent?.fields ?? []), ...fields].filter(field => !field.isStatic).map(field => [field.name, { id: field.id, valueType: field.valueType }])), receiverMethods: d.member.static ? undefined : new Map([...((options.parent?.methods ?? []).filter(method => method.role === 'method' && !method.isStatic).map(method => [method.name, { id: method.id, arity: method.parameters.length }] as const)), ...declarations.filter(method => !method.member.static && method.member.kind === 'method' && !(entryPolicy === 'program' && method.name === 'on_start')).map(method => [method.name, { id: method.id, arity: method.parameters.length }] as const)]) };
    return { ...evidence(methodContract, d.member as unknown as AstNode, scope), id: d.id, name: d.name, scopeId: d.scopeId,
      isStatic: d.member.static, role: d.member.kind === 'constructor' ? 'constructor' : entryPolicy === 'program' && d.name === 'on_start' && !d.member.static ? 'entry' : 'method', parameters: d.parameters,
      body: mapBlock(d.member.body as unknown as AstNode, scope, d.member.kind !== 'constructor') };
  });
  return { version: 1, context: IMPORT_CONTEXT, mappingId: entryPolicy === 'library' ? libraryClassContract.id : classContract.id, mappingVersion: 1, start: region.start, end: region.end,
    name: declaration.id.name, fileName, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: options.declarationIndex === undefined ? region.text : region.text.slice(declaration.start!, declaration.end!), extendsType: options.parent?.name, fields, methods, dependencies,
    ...(entryPolicy === 'library' ? { entryPolicy } : {}) };
}

/** Conservative file-owned function pilot; reuses reviewed expression/flow mappings. */
export function planJavaScriptFunction(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry: boolean, entryPolicy: 'program' | 'library'): ClassImportPlan {
  validateSourceCoverage(preview);
  if (!preview.regions.includes(region) || region.kind !== 'candidate' || region.proposedKind !== 'standalone-function') throw new ImportFailure('STALE_SOURCE', 'Select a standalone function from the current preview.', region);
  if (entryPolicy !== 'library' || mapStartAsEntry) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Standalone functions require Library mode without an entry mapping.', region);
  const ast = parseJavaScript(region.text);
  const fn = ast.program.body[0];
  if (ast.program.body.length !== 1 || fn?.type !== 'FunctionDeclaration' || !fn.id || fn.async || fn.generator || fn.body.directives.length || ast.comments?.length) throw new ImportFailure('SIGNATURE_UNSUPPORTED', 'Only named synchronous functions with plain parameters and no directives or embedded comments are supported.', region);
  const scopeId = 'function-0';
  const parameters = nativeParameters(fn.params, scopeId, preview, region.start);
  if (new Set(parameters.map(p => p.name)).size !== parameters.length) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate parameters are not supported.', region);
  const dependencies: DependencyObligation[] = [];
  const scope: MappingScope = { scopeId, parameters: new Map(parameters.map(p => [p.name, p])), dependencies, offset: region.start, source: preview.source, closedUnit: preview.regions.every(part => part === region || part.kind === 'trivia'), functions: new Map([[fn.id.name, signatureFor('import-function-0', parameters)]]) };
  const method: MethodPlan = { ...evidence(standaloneFunctionContract, fn as unknown as AstNode, scope), id: 'import-function-0', name: fn.id.name, scopeId, isStatic: false, role: 'method', parameters, body: mapBlock(fn.body as unknown as AstNode, scope) };
  return { ...evidence(standaloneFunctionContract, fn as unknown as AstNode, scope), version: 1, context: IMPORT_CONTEXT, name: fn.id.name, fileName, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: region.text, methods: [method], dependencies, entryPolicy: 'library', unitKind: 'standalone-function' };
}

/** Complete same-file function set: signatures resolve before any body is mapped. */
export function planJavaScriptFunctionFile(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry: boolean, entryPolicy: 'program' | 'library', importedSignatures: ReadonlyMap<string, { id: string; arity: number; minimum?: number; rest?: boolean }> = new Map(), idPrefix = ''): ClassImportPlan {
  validateSourceCoverage(preview);
  if (!preview.regions.includes(region) || region.kind !== 'candidate' || !['function-file', 'module-file'].includes(region.proposedKind ?? '') || entryPolicy !== 'library' || mapStartAsEntry) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'A complete function file requires Library mode.', region);
  const ast = parseJavaScript(region.text, region.proposedKind === 'module-file' ? 'module' : 'script');
  if (ast.program.body.length > IMPORT_LIMITS.methods) throw new ImportFailure('FUNCTION_FILE_CONTEXT', 'Comments, directives and oversized function files need separate mappings.', region);
  const signatures = new Map<string, { id: string; arity: number; minimum?: number; rest?: boolean }>(importedSignatures);
  const imports: NonNullable<ClassImportPlan['imports']> = ast.program.body.filter(statement => statement.type === 'ImportDeclaration').map(statement => {
    if (statement.type !== 'ImportDeclaration') throw new ImportFailure('MODULE_IMPORT', 'Expected an import.');
    const bindings = statement.specifiers.map(specifier => {
      if (specifier.type !== 'ImportSpecifier' || specifier.imported.type !== 'Identifier') throw new ImportFailure('MODULE_IMPORT_VARIANT', 'Only named function imports have reviewed dependency signatures.', region);
      const signature = importedSignatures.get(specifier.local.name);
      if (!signature) throw new ImportFailure('MODULE_DEPENDENCY_REQUIRED', 'Include the imported file in the reviewed module set.', region);
      return { local: specifier.local.name, functionId: signature.id, arity: signature.arity };
    });
    return { ...span(statement as unknown as AstNode, { offset: region.start, source: preview.source } as MappingScope), mappingId: 'js.module-import', mappingVersion: 1, modulePath: statement.source.value, names: statement.specifiers.map(specifier => specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' ? specifier.imported.name === specifier.local.name ? specifier.local.name : `${specifier.imported.name} as ${specifier.local.name}` : ''), bindings };
  });
  const functionNodes = ast.program.body.filter(statement => statement.type !== 'ImportDeclaration');
  const declarations = functionNodes.map((statement, i) => {
    const exported = statement.type === 'ExportNamedDeclaration';
    const fn = exported ? statement.declaration : statement;
    if (!fn) throw new ImportFailure('EXPORT_UNSUPPORTED', 'Only explicit named function exports are mapped.', region);
    if (fn.type !== 'FunctionDeclaration' || !fn.id || fn.async || fn.generator) throw new ImportFailure('SIGNATURE_UNSUPPORTED', 'Only ordinary named functions with positional parameters are supported.', region);
    if (signatures.has(fn.id.name)) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate file-owned function name.', region);
    const id = `${idPrefix}import-function-${i}`, scopeId = `${idPrefix}function-${i}`;
    const parameters = nativeParameters(fn.params, scopeId, preview, region.start);
    if (new Set(parameters.map(p => p.name)).size !== parameters.length) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate parameters.', region);
    signatures.set(fn.id.name, signatureFor(id, parameters));
    return { fn, id, scopeId, parameters, exported };
  });
  const dependencies: DependencyObligation[] = [];
  const methods: MethodPlan[] = declarations.map(({ fn, id, scopeId, parameters, exported }) => {
    const scope: MappingScope = { scopeId, parameters: new Map(parameters.map(parameter => [parameter.name, parameter])), dependencies, offset: region.start, source: preview.source, functions: signatures, closedUnit: true };
    return { ...evidence(standaloneFunctionContract, fn as unknown as AstNode, scope), id, name: fn.id!.name, scopeId, parameters, isExported: exported, isStatic: false, role: 'method', body: mapBlock(fn.body as unknown as AstNode, scope) };
  });
  return { version: 1, mappingId: 'js.function-file', mappingVersion: 1, start: region.start, end: region.end, name: methods[0]?.name ?? fileName.replace(/\.[^.]+$/, ''), fileName, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: region.text, methods, imports, directives: ast.program.directives.map(directive => ({ ...span(directive as unknown as AstNode, { offset: region.start, source: preview.source } as MappingScope), mappingId: 'js.directive', mappingVersion: 1, value: directive.value.value })), comments: (ast.comments ?? []).map(comment => ({ ...span(comment as unknown as AstNode, { offset: region.start, source: preview.source } as MappingScope), mappingId: 'js.comment', mappingVersion: 1, text: comment.value })), dependencies, context: { ...IMPORT_CONTEXT, sourceMode: region.proposedKind === 'module-file' ? 'module' : 'script' }, entryPolicy: 'library', unitKind: 'standalone-function' };
}
