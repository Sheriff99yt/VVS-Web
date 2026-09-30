import {
  IMPORT_CONTEXT, ImportFailure, type ClassImportPlan, type DependencyObligation, type ExpressionPlan,
  type MappingContract, type MappingEvidence, type MethodPlan, type ParameterPlan, type SourceSpan, type StatementPlan,
} from './contracts';
import { parseJavaScript, validateSourceCoverage, type ImportRegion, type SourceImportPreview } from './parser';
import { requireMapped, resolveReverseMapping, type ReverseMapping } from './registry';

// Parser-specific structure stops here. Materialization never sees Babel AST nodes.
interface AstNode {
  type: string; start: number; end: number; name?: string; value?: string | number | boolean;
  operator?: string; left?: AstNode; right?: AstNode; argument?: AstNode; test?: AstNode;
  consequent?: AstNode; alternate?: AstNode; body?: AstNode[];
}
interface MappingScope { scopeId: string; parameters: ReadonlyMap<string, ParameterPlan>; dependencies: DependencyObligation[]; offset: number }
const span = (node: AstNode, scope: MappingScope): SourceSpan => ({ start: node.start + scope.offset, end: node.end + scope.offset });
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
export const JAVASCRIPT_MAPPING_CONTRACTS = [classContract, libraryClassContract, methodContract, literal, parameter, arithmetic, valueReturn, terminalBranch] as const;

export const javascriptExpressionMappings: readonly ReverseMapping<AstNode, MappingScope, ExpressionPlan>[] = [
  { contract: literal, matches: n => ['NumericLiteral', 'StringLiteral', 'BooleanLiteral'].includes(n.type), map: (n, s) => {
    if (n.value === undefined || (typeof n.value === 'number' && (!Number.isFinite(n.value) || Object.is(n.value, -0)))) return fail('LITERAL_UNSUPPORTED', 'Literal cannot be preserved through JSON persistence.', n, s);
    return { ...evidence(literal, n, s), kind: 'literal', value: n.value, valueType: typeof n.value as 'number' | 'string' | 'boolean' };
  } },
  { contract: parameter, matches: n => n.type === 'Identifier', map: (n, s) => {
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
  return requireMapped(resolveReverseMapping(javascriptExpressionMappings, node, scope, span(node, scope)));
}
export const javascriptStatementMappings: readonly ReverseMapping<AstNode, MappingScope, StatementPlan>[] = [
  { contract: valueReturn, matches: n => n.type === 'ReturnStatement', map: (n, s) => {
    if (!n.argument) return fail('RETURN_REQUIRED', 'A visible return value is required.', n, s);
    return { ...evidence(valueReturn, n, s), kind: 'return', value: mapExpression(n.argument, s) };
  } },
  { contract: terminalBranch, matches: n => n.type === 'IfStatement', map: (n, s) => {
    if (n.consequent?.type !== 'BlockStatement' || n.alternate?.type !== 'BlockStatement') return fail('TERMINAL_BLOCK_REQUIRED', 'Complete if/else blocks with terminal statements are required.', n, s);
    const condition = mapExpression(n.test!, s);
    if (condition.valueType !== 'boolean') return fail('JS_TRUTHINESS', 'Dynamic JavaScript truthiness needs an explicit semantic variant; Boolean pins must not imply a cast.', n, s);
    return { ...evidence(terminalBranch, n, s), kind: 'branch', condition, consequent: mapBlock(n.consequent, s), alternate: mapBlock(n.alternate, s) };
  } },
];
function mapBlock(block: AstNode, scope: MappingScope): StatementPlan {
  const statements = block.body?.filter(statement => statement.type !== 'EmptyStatement');
  if (statements?.length !== 1) return fail('TERMINAL_BLOCK_REQUIRED', 'Each method or branch needs exactly one value return or complete terminal if/else.', block, scope);
  const node = statements[0]!;
  return requireMapped(resolveReverseMapping(javascriptStatementMappings, node, scope, span(node, scope)));
}

/** Declare scope identities before definition/use wiring. No ambient name lookup. */
export function planJavaScriptClass(preview: SourceImportPreview, region: ImportRegion, fileName: string, mapStartAsEntry: boolean, entryPolicy: 'program' | 'library' = 'program'): ClassImportPlan {
  validateSourceCoverage(preview);
  if (!preview.regions.includes(region) || region.kind !== 'candidate') throw new ImportFailure('STALE_SOURCE', 'Select a candidate from the current source preview.');
  if (region.proposedKind !== 'class') throw new ImportFailure('MODULE_SCOPE_REQUIRED', 'Standalone functions require a reviewed module-scope design.', region);
  if (!['program', 'library'].includes(entryPolicy)) throw new ImportFailure('ENTRY_POLICY_INVALID', 'Select an explicit program or library policy.', region);
  if (entryPolicy === 'library' && mapStartAsEntry) throw new ImportFailure('ENTRY_POLICY_CONFLICT', 'Library import retains ordinary methods without assigning a program-entry role.', region);
  if (entryPolicy === 'program' && !mapStartAsEntry) throw new ImportFailure('ENTRY_CONSENT', 'Confirm the explicit mapping of on_start to the VVS program entry event.', region);
  const ast = parseJavaScript(region.text);
  const declaration = ast.program.body[0];
  if (ast.program.body.length !== 1 || declaration?.type !== 'ClassDeclaration' || !declaration.id || declaration.superClass || declaration.decorators?.length || ast.comments?.length) throw new ImportFailure('CLASS_UNSUPPORTED', 'Expected one plain named class without embedded comments.', region);
  if (declaration.body.body.length > 32) throw new ImportFailure('METHOD_BUDGET', 'Import at most 32 methods in one class.', region);
  const names = new Set<string>();
  const declarations = declaration.body.body.map((member, i) => {
    if (member.type !== 'ClassMethod' || member.kind !== 'method' || member.computed || member.async || member.generator || member.decorators?.length || member.key.type !== 'Identifier' || member.params.some(p => p.type !== 'Identifier') || member.body.directives.length) throw new ImportFailure('SIGNATURE_UNSUPPORTED', 'Only ordinary methods with named parameters and no directives are supported.', region);
    const name = member.key.name;
    if (names.has(name)) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate method names need an explicit mapping.', region);
    names.add(name);
    const scopeId = `method-${i}`;
    const parameters: ParameterPlan[] = member.params.map((p, index) => ({ id: `param-${index}`, name: (p as { name: string }).name, scopeId, start: p.start! + region.start, end: p.end! + region.start }));
    if (new Set(parameters.map(p => p.name)).size !== parameters.length) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate parameter binding.', region);
    return { member, name, scopeId, parameters, id: `import-function-${i}` };
  });
  if (entryPolicy === 'program' && !declarations.some(d => d.name === 'on_start' && !d.member.static)) throw new ImportFailure('ENTRY_MISSING', 'An ordinary on_start method is required; no entry will be invented.', region);
  const dependencies: DependencyObligation[] = [];
  const methods: MethodPlan[] = declarations.map(d => {
    const scope: MappingScope = { scopeId: d.scopeId, parameters: new Map(d.parameters.map(p => [p.name, p])), dependencies, offset: region.start };
    return { ...evidence(methodContract, d.member as unknown as AstNode, scope), id: d.id, name: d.name, scopeId: d.scopeId,
      isStatic: d.member.static, role: entryPolicy === 'program' && d.name === 'on_start' && !d.member.static ? 'entry' : 'method', parameters: d.parameters,
      body: mapBlock(d.member.body as unknown as AstNode, scope) };
  });
  return { version: 1, context: IMPORT_CONTEXT, mappingId: entryPolicy === 'library' ? libraryClassContract.id : classContract.id, mappingVersion: 1, start: region.start, end: region.end,
    name: declaration.id.name, fileName, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: region.text, methods, dependencies,
    ...(entryPolicy === 'library' ? { entryPolicy } : {}) };
}
