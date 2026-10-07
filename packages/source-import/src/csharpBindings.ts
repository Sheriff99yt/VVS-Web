import type { Node as SyntaxNode } from 'web-tree-sitter';
import { CSHARP_INTEGER_TYPES, CSharpIntegerError, csharpIntegralLocal, csharpIntegralMutation, CSHARP_ASSIGNMENT_OPERATORS, type CSharpAssignmentOperator, csharpIntegerLiteral, csharpIntegerNegatedLiteral, csharpIntegerUnary, csharpIntegerBinary, csharpIntegerAssignable, csharpIntegerConvert, type CSharpIntegerFact, type CSharpIntegerType, type CSharpIntegerOperator, type CSharpOverflowContext } from '@vvs/graph-types';
import { ImportFailure, IMPORT_LIMITS, type SourceSpan, type ImportDiagnostic } from './contracts';
import { checkSourceBudget } from './parser';
import { loadCSharpParser, parseCSharpTree } from './nativeParser';
import { csharpIntegerComparison, csharpBooleanBinary, csharpBooleanUnary, type CSharpBooleanFact, type CSharpComparisonOperator } from '@vvs/graph-types';

export interface CSharpIntegralBinding extends SourceSpan {
  id: string; name: string; scopeId: string; type: CSharpIntegerType; isConst: boolean;
  fact: CSharpIntegerFact; initialized: boolean; hasInitializer?: boolean;
}
export interface CSharpBoundCall extends SourceSpan {
  methodId: string; name: string; parameterTypes: CSharpIntegerType[];
}
/** Lexical ownership is source evidence, never an editable graph or receipt. */
export interface CSharpIntegralScope extends SourceSpan {
  id: string; methodId: string; parentScopeId?: string;
  kind: 'parameters' | 'block' | 'checked' | 'unchecked';
  overflowContext: CSharpOverflowContext; declaredBindingIds: string[];
}
export interface CSharpIntegralReference extends SourceSpan {
  bindingId: string; scopeId: string; access: 'read' | 'write';
  overflowContext: CSharpOverflowContext;
}
export interface CSharpBindingObservation extends SourceSpan {
  name: string; methodId: string; initializer: SourceSpan; expression: CSharpIntegerFact;
  converted: CSharpIntegerFact; declaredType: CSharpIntegerType; calls: CSharpBoundCall[];
}
export interface CSharpIntegralBindingReport {
  analysisOnly: true;
  scope: 'predefined-integral-method-bindings';
  bindings: CSharpIntegralBinding[];
  scopes: CSharpIntegralScope[];
  references: CSharpIntegralReference[];
  flow: CSharpBindingFlow[];
  observations: CSharpBindingObservation[];
  diagnostics: (ImportDiagnostic & { status: 'invalid' | 'unsupported' })[];
}
/** Assignment evidence for a source statement, not a visible graph mapping. */
export interface CSharpBindingFlow extends SourceSpan {
  methodId: string; scopeId: string; kind: string;
  reachable: boolean; endReachable: boolean;
  entryAssignedBindingIds: string[]; exitAssignedBindingIds: string[];
  condition?: SourceSpan & CSharpBooleanFact;
}
type Signature = { id: string; owner: number; name: string; parameters: { name: string; type: CSharpIntegerType; node: SyntaxNode }[]; returns: CSharpIntegerType | 'bool' | 'object' | 'void'; node: SyntaxNode };
type Environment = { id: string; parent?: Environment; reserved: Set<string>; bindings: Map<string, CSharpIntegralBinding>; reachable: boolean };
function forkEnvironment(env: Environment): Environment {
  return { ...env, parent: env.parent && forkEnvironment(env.parent), bindings: new Map([...env.bindings].map(([name, binding]) => [name, { ...binding }])) };
}
function assignmentIds(env: Environment, unreachable = !env.reachable): string[] {
  return [...(env.parent ? assignmentIds(env.parent, unreachable) : []), ...[...env.bindings.values()].filter(binding => unreachable || binding.initialized).map(binding => binding.id)];
}
const children = (node: SyntaxNode) => node.namedChildren.filter(child => child.type !== 'comment');
const span = (node: SyntaxNode): SourceSpan => ({ start: node.startIndex, end: node.endIndex });
const invalid = (code: string, message: string, node: SyntaxNode): never => { throw new ImportFailure(`CSHARP_${code}`, message, span(node)); };
const unsupported = (code: string, node: SyntaxNode): never => { throw new ImportFailure(`CSHARP_UNSUPPORTED_${code}`, 'This native binding needs its own contract.', span(node)); };
function identifier(node: SyntaxNode): string {
  // Escapes and formatting-category normalization need independent native evidence.
  if (!/^@?[A-Za-z_][A-Za-z0-9_]*$/.test(node.text)) return unsupported('IDENTIFIER', node);
  return node.text.replace(/^@/, '');
}
function nativeType(node: SyntaxNode): CSharpIntegerType {
  if (node.type !== 'predefined_type' || !CSHARP_INTEGER_TYPES.includes(node.text as CSharpIntegerType)) return unsupported('TYPE', node);
  return node.text as CSharpIntegerType;
}
function visibleBinding(env: Environment, name: string): CSharpIntegralBinding | undefined {
  return env.bindings.get(name) ?? (env.parent && visibleBinding(env.parent, name));
}
function hasReserved(env: Environment | undefined, name: string): boolean {
  return !!env && (env.reserved.has(name) || hasReserved(env.parent, name));
}
function canAssign(fact: CSharpIntegerFact, target: CSharpIntegerType): boolean {
  try { csharpIntegerAssignable(fact, target); return true; }
  catch (error) { if (error instanceof CSharpIntegerError) return false; throw error; }
}
function betterTarget(argument: CSharpIntegerFact, a: CSharpIntegerType, b: CSharpIntegerType): number {
  if (a === b) return 0;
  if (argument.type === a) return 1;
  if (argument.type === b) return -1;
  const ab = canAssign({ type: a }, b), ba = canAssign({ type: b }, a);
  if (ab !== ba) return ab ? 1 : -1;
  const signed: Partial<Record<CSharpIntegerType, CSharpIntegerType[]>> = {
    sbyte: ['byte', 'ushort', 'uint', 'ulong'], short: ['ushort', 'uint', 'ulong'], int: ['uint', 'ulong'], long: ['ulong'],
  };
  return signed[a]?.includes(b) ? 1 : signed[b]?.includes(a) ? -1 : 0;
}
/** Source binding analysis only. No graph acceptance, full compiler validity or purity claim. */
export async function analyzeCSharpIntegralBindings(source: string): Promise<CSharpIntegralBindingReport> {
  checkSourceBudget(source); await loadCSharpParser();
  const tree = parseCSharpTree(source);
  const report: CSharpIntegralBindingReport = { analysisOnly: true, scope: 'predefined-integral-method-bindings', bindings: [], scopes: [], references: [], flow: [], observations: [], diagnostics: [] };
  const started = performance.now();
  const record = (error: unknown, node: SyntaxNode) => {
    if (!(error instanceof ImportFailure) && !(error instanceof CSharpIntegerError)) throw error;
    if (report.diagnostics.length >= IMPORT_LIMITS.diagnostics) return;
    const code = error instanceof ImportFailure ? error.code : error.message;
    report.diagnostics.push({ ...span(node), ...(error instanceof ImportFailure ? error.span : {}), code, message: error.message, status: code.includes('UNSUPPORTED') ? 'unsupported' : 'invalid' });
  };
  try {
    const methods: { node: SyntaxNode; owner: SyntaxNode }[] = [];
    let namedVarType = false;
    const queue = [tree.rootNode];
    while (queue.length) {
      const node = queue.pop()!;
      if (['class_declaration', 'struct_declaration', 'interface_declaration', 'record_declaration', 'enum_declaration'].includes(node.type) && node.childForFieldName('name')?.text.replace(/^@/, '') === 'var') namedVarType = true;
      if (node.type === 'using_directive' && /\bvar\s*=/.test(node.text)) namedVarType = true;
      if (node.type === 'method_declaration') {
        const owner = node.parent?.parent;
        if (owner?.type !== 'class_declaration') { record(new ImportFailure('CSHARP_UNSUPPORTED_OWNER', 'Native owner needs a reviewed contract.', span(node)), node); continue; }
        methods.push({ node, owner });
      }
      queue.push(...children(node));
    }
    methods.sort((a, b) => a.node.startIndex - b.node.startIndex);
    if (methods.length > IMPORT_LIMITS.methods) throw new ImportFailure('CSHARP_METHOD_BUDGET', 'Too many method bindings.');
    const signatures: Signature[] = [];
    const unavailable = new Set<string>();
    for (const { node, owner } of methods) {
      const nameNode = node.childForFieldName('name')!;
      try {
        const name = identifier(nameNode);
        if (node.childForFieldName('type_parameters') || !children(node).some(child => child.type === 'modifier' && child.text === 'static') || children(owner).some(child => ['base_list', 'type_parameter_list'].includes(child.type) || child.type === 'modifier' && child.text === 'partial')) unsupported('SIGNATURE_CONTEXT', node);
        const parameters = children(node.childForFieldName('parameters')!).map(parameter => {
          if (parameter.type !== 'parameter' || children(parameter).some(child => child.type === 'modifier' || child.type === 'attribute_list') || parameter.children.some(child => child.type === '=')) unsupported('PARAMETER', parameter);
          return { name: identifier(parameter.childForFieldName('name')!), type: nativeType(parameter.childForFieldName('type')!), node: parameter };
        });
        if (new Set(parameters.map(parameter => parameter.name)).size !== parameters.length) invalid('DUPLICATE_PARAMETER', 'Parameter bindings must be unique.', node);
        const returnsNode = node.childForFieldName('returns')!;
        const returns = ['object', 'void', 'bool'].includes(returnsNode.text) && returnsNode.type === 'predefined_type' ? returnsNode.text as 'object' | 'void' | 'bool' : nativeType(returnsNode);
        if (signatures.some(signature => signature.owner === owner.startIndex && signature.name === name && signature.parameters.map(parameter => parameter.type).join(',') === parameters.map(parameter => parameter.type).join(','))) invalid('DUPLICATE_METHOD', 'Overload signatures must be unique.', node);
        signatures.push({ id: `csharp-method-${node.startIndex}`, owner: owner.startIndex, name, parameters, returns, node });
      } catch (error) { unavailable.add(`${owner.startIndex}:${nameNode.text.replace(/^@/, '')}`); record(error, node); }
    }
    for (const signature of signatures) {
      const calls: CSharpBoundCall[] = [];
      const root: Environment = { id: signature.id, reserved: new Set(signature.parameters.map(parameter => parameter.name)), bindings: new Map(), reachable: true };
      const parameterScope: CSharpIntegralScope = { ...span(signature.node.childForFieldName('parameters')!), id: root.id, methodId: signature.id, kind: 'parameters', overflowContext: 'default', declaredBindingIds: [] };
      report.scopes.push(parameterScope);
      const reference = (node: SyntaxNode, env: Environment, binding: CSharpIntegralBinding, access: 'read' | 'write', context: CSharpOverflowContext) => {
        report.references.push({ ...span(node), bindingId: binding.id, scopeId: env.id, access, overflowContext: context });
      };
      for (const parameter of signature.parameters) {
        const nameNode = parameter.node.childForFieldName('name')!;
        const binding: CSharpIntegralBinding = { ...span(nameNode), id: `csharp-binding-${nameNode.startIndex}`, scopeId: root.id, name: parameter.name, type: parameter.type, isConst: false, initialized: true, fact: { type: parameter.type } };
        root.bindings.set(parameter.name, binding); report.bindings.push(binding);
        parameterScope.declaredBindingIds.push(binding.id);
      }
      const expression = (node: SyntaxNode, env: Environment, context: CSharpOverflowContext): CSharpIntegerFact => {
        if (performance.now() - started > IMPORT_LIMITS.elapsedMs) throw new ImportFailure('CSHARP_BINDING_BUDGET', 'Binding analysis exceeded its time budget.', span(node));
        switch (node.type) {
          case 'integer_literal': return csharpIntegerLiteral(node.text);
          case 'identifier': {
            const name = identifier(node), binding = visibleBinding(env, name);
            if (!binding) return hasReserved(env, name) ? invalid('LOCAL_NOT_INITIALIZED', 'A local cannot be read before its declaration.', node) : unsupported('MEMBER_OR_EXTERNAL_BINDING', node);
            if (env.reachable && !binding.initialized) return invalid('LOCAL_NOT_INITIALIZED', 'A local must be definitely assigned before this read.', node);
            reference(node, env, binding, 'read', context);
            return { ...binding.fact };
          }
          case 'parenthesized_expression': return expression(children(node)[0], env, context);
          case 'checked_expression': return expression(children(node)[0], env, node.children[0].text === 'checked' ? 'checked' : 'unchecked');
          case 'cast_expression': return csharpIntegerConvert(expression(node.childForFieldName('value')!, env, context), nativeType(node.childForFieldName('type')!), context);
          case 'prefix_unary_expression': {
            const operand = children(node)[0], operator = node.children[0].text;
            if (!['+', '-', '~'].includes(operator)) return unsupported('UNARY_OPERATOR', node);
            return operator === '-' && operand.type === 'integer_literal' ? csharpIntegerNegatedLiteral(operand.text, context) : csharpIntegerUnary(operator as '+' | '-' | '~', expression(operand, env, context), context);
          }
          case 'binary_expression': {
            const operator = node.childForFieldName('operator')!.text;
            if (!['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>', '>>>'].includes(operator)) return unsupported('NON_INTEGRAL_OPERATOR', node);
            return csharpIntegerBinary(operator as CSharpIntegerOperator, expression(node.childForFieldName('left')!, env, context), expression(node.childForFieldName('right')!, env, context), context);
          }
          case 'invocation_expression': {
            const callee = node.childForFieldName('function')!;
            if (callee.type !== 'identifier') return unsupported('CALL_TARGET', callee);
            const name = identifier(callee);
            if (visibleBinding(env, name) || hasReserved(env, name)) return invalid('CALL_LOCAL', 'A local value is not a native method binding.', callee);
            if (unavailable.has(`${signature.owner}:${name}`)) return unsupported('OVERLOAD_CONTEXT', callee);
            const args = children(node.childForFieldName('arguments')!).map(argument => {
              if (argument.type !== 'argument' || argument.childForFieldName('name') || argument.children.some(child => ['ref', 'out', 'in'].includes(child.type))) return unsupported('ARGUMENT_MODE', argument);
              return expression(children(argument)[0], env, context);
            });
            const named = signatures.filter(candidate => candidate.owner === signature.owner && candidate.name === name);
            if (!named.length) return unsupported('CALL_BINDING', callee);
            const candidates = named.filter(candidate => candidate.parameters.length === args.length && candidate.parameters.every((parameter, index) => canAssign(args[index], parameter.type)));
            const best = candidates.filter(candidate => candidates.every(other => {
              if (candidate === other) return true;
              const comparisons = args.map((arg, index) => betterTarget(arg, candidate.parameters[index].type, other.parameters[index].type));
              return comparisons.every(value => value >= 0) && comparisons.some(value => value > 0);
            }));
            if (best.length !== 1) return invalid('OVERLOAD_RESOLUTION', 'A unique applicable native method is required.', node);
            const target = best[0];
            if (target.returns === 'object' || target.returns === 'void' || target.returns === 'bool') return unsupported('CALL_VALUE', node);
            calls.push({ ...span(node), methodId: target.id, name, parameterTypes: target.parameters.map(parameter => parameter.type) });
            return { type: target.returns };
          }
          default: return unsupported('EXPRESSION', node);
        }
      };
      const conditions = new Map<number, SourceSpan & CSharpBooleanFact>();
      const booleanSyntax = (node: SyntaxNode): boolean => node.type === 'boolean_literal'
        || node.type === 'parenthesized_expression' && booleanSyntax(children(node)[0])
        || node.type === 'prefix_unary_expression' && node.children[0].text === '!'
        || node.type === 'binary_expression' && ['==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(node.childForFieldName('operator')!.text);
      const condition = (node: SyntaxNode, env: Environment, context: CSharpOverflowContext): CSharpBooleanFact => {
        if (node.type === 'boolean_literal') return { type: 'bool', constant: node.text === 'true' };
        if (node.type === 'parenthesized_expression') return condition(children(node)[0], env, context);
        if (node.type === 'checked_expression') return condition(children(node)[0], env, node.children[0].text === 'checked' ? 'checked' : 'unchecked');
        if (node.type === 'prefix_unary_expression' && node.children[0].text === '!') return csharpBooleanUnary(condition(children(node)[0], env, context));
        if (node.type === 'binary_expression') {
          const operator = node.childForFieldName('operator')!.text, left = node.childForFieldName('left')!, right = node.childForFieldName('right')!;
          if (['&&', '||', '&', '|', '^', '==', '!='].includes(operator) && (booleanSyntax(left) || booleanSyntax(right) || ['&&', '||'].includes(operator))) {
            const a = condition(left, env, context), rightEnv = forkEnvironment(env);
            if (operator === '&&' && a.constant === false || operator === '||' && a.constant === true) rightEnv.reachable = false;
            return csharpBooleanBinary(operator as Parameters<typeof csharpBooleanBinary>[0], a, condition(right, rightEnv, context));
          }
          if (['==', '!=', '<', '<=', '>', '>='].includes(operator)) return csharpIntegerComparison(operator as CSharpComparisonOperator, expression(left, env, context), expression(right, env, context));
        }
        // Resolve integral operands first, so unassigned/name errors retain their
        // native cause rather than being mistaken for an unsupported Boolean form.
        expression(node, env, context);
        return invalid('CONDITION_TYPE', 'An if condition requires a predefined Boolean expression.', node);
      };
      const step = (statement: SyntaxNode, env: Environment, scope: CSharpIntegralScope, context: CSharpOverflowContext): boolean => {
        const reachable = env.reachable, entryAssignedBindingIds = assignmentIds(env);
        const endReachable = visit(statement, env, scope, context) && reachable;
        env.reachable = endReachable;
        report.flow.push({ ...span(statement), methodId: signature.id, scopeId: env.id, kind: statement.type, reachable, endReachable,
          entryAssignedBindingIds, exitAssignedBindingIds: assignmentIds(env), ...(conditions.has(statement.startIndex) ? { condition: conditions.get(statement.startIndex)! } : {}) });
        return endReachable;
      };
      const block = (node: SyntaxNode, parent: Environment, context: CSharpOverflowContext, kind: CSharpIntegralScope['kind'] = 'block', owner = node): boolean => {
        const env: Environment = { id: `csharp-scope-${node.startIndex}`, parent, reserved: new Set(), bindings: new Map(), reachable: parent.reachable };
        const scope: CSharpIntegralScope = { ...span(owner), id: env.id, methodId: signature.id, parentScopeId: parent.id, kind, overflowContext: context, declaredBindingIds: [] };
        report.scopes.push(scope);
        for (const statement of children(node)) if (statement.type === 'local_declaration_statement') {
          const declaration = children(statement).find(child => child.type === 'variable_declaration')!;
          for (const variable of children(declaration).filter(child => child.type === 'variable_declarator')) {
            const name = identifier(variable.childForFieldName('name')!);
            if (env.reserved.has(name) || hasReserved(parent, name)) invalid('DECLARATION_SPACE', 'C# local declaration spaces cannot shadow an ancestor binding.', variable);
            env.reserved.add(name);
          }
        }
        for (const statement of children(node)) step(statement, env, scope, context);
        return env.reachable;
      };
      const visit = (statement: SyntaxNode, env: Environment, scope: CSharpIntegralScope, context: CSharpOverflowContext): boolean => {
          if (statement.type === 'block') return block(statement, env, context);
          if (statement.type === 'checked_statement') {
            const overflow = statement.children[0].text === 'checked' ? 'checked' : 'unchecked';
            return block(children(statement)[0], env, overflow, overflow, statement);
          }
          if (statement.type === 'if_statement') {
            const test = statement.childForFieldName('condition')!, fact = condition(test, env, context);
            conditions.set(statement.startIndex, { ...span(test), ...fact });
            const thenEnv = forkEnvironment(env), elseEnv = forkEnvironment(env);
            thenEnv.reachable = env.reachable && fact.constant !== false;
            elseEnv.reachable = env.reachable && fact.constant !== true;
            const thenNode = statement.childForFieldName('consequence')!, elseNode = statement.childForFieldName('alternative');
            const thenEnd = step(thenNode, thenEnv, scope, context);
            const elseEnd = elseNode ? step(elseNode, elseEnv, scope, context) : elseEnv.reachable;
            const paths = [thenEnd && thenEnv, elseEnd && elseEnv].filter((path): path is Environment => !!path);
            for (let current: Environment | undefined = env; current; current = current.parent) for (const binding of current.bindings.values()) {
              binding.initialized = paths.length === 0 || paths.every(path => visibleBinding(path, binding.name)?.initialized === true);
            }
            return paths.length > 0;
          }
          if (statement.type === 'empty_statement') return env.reachable;
          if (statement.type === 'return_statement') {
            const value = children(statement)[0];
            if (!value && signature.returns !== 'void') invalid('RETURN_VALUE_REQUIRED', 'A value-returning method requires a return expression.', statement);
            if (value) {
              if (signature.returns === 'bool') { condition(value, env, context); return false; }
              const fact = expression(value, env, context);
              if (signature.returns !== 'object' && signature.returns !== 'void') csharpIntegerAssignable(fact, signature.returns);
              else if (signature.returns === 'void') invalid('RETURN_VALUE', 'A void method cannot return an integral value.', statement);
            }
            return false;
          }
          if (statement.type === 'expression_statement') {
            const assignment = children(statement)[0];
            const update = ['prefix_unary_expression', 'postfix_unary_expression'].includes(assignment?.type ?? '');
            const operator = update ? assignment.children.find(child => ['++', '--'].includes(child.text))?.text : assignment?.childForFieldName('operator')?.text;
            if (!operator || !CSHARP_ASSIGNMENT_OPERATORS.includes(operator as CSharpAssignmentOperator) || !update && assignment?.type !== 'assignment_expression') return unsupported('ASSIGNMENT_OPERATOR', statement);
            const left = update ? children(assignment)[0] : assignment.childForFieldName('left')!;
            if (left.type !== 'identifier') return unsupported('ASSIGNMENT_TARGET', left);
            const binding = visibleBinding(env, identifier(left));
            if (!binding) return invalid('ASSIGNMENT_BINDING', 'Assignment requires a preceding visible integral declaration.', left);
            if (env.reachable && operator !== '=' && !binding.initialized) return invalid('LOCAL_NOT_INITIALIZED', 'Compound assignments and updates read their target before writing.', left);
            csharpIntegralMutation(binding.type, binding.isConst, operator, update ? undefined : expression(assignment.childForFieldName('right')!, env, context), context);
            binding.initialized = true;
            if (operator !== '=') reference(left, env, binding, 'read', context);
            reference(left, env, binding, 'write', context);
            return env.reachable;
          }
          if (statement.type !== 'local_declaration_statement') { unsupported('STATEMENT', statement); }
          const declaration = children(statement).find(child => child.type === 'variable_declaration')!;
          const variables = children(declaration).filter(child => child.type === 'variable_declarator');
          const typeNode = declaration.childForFieldName('type')!;
          const inferred = typeNode.type === 'implicit_type' && typeNode.text === 'var';
          if (inferred && namedVarType) unsupported('VAR_TYPE_CONTEXT', typeNode);
          const isConst = children(statement).some(child => child.type === 'modifier' && child.text === 'const');
          if (inferred && (variables.length !== 1 || isConst)) invalid('VAR_DECLARATION', 'var needs one initialized non-const binding.', declaration);
          for (const variable of variables) {
            const nameNode = variable.childForFieldName('name')!, name = identifier(nameNode);
            const initializer = children(variable).find(child => child.id !== nameNode.id);
            if (!initializer || !variable.children.some(child => child.type === '=')) {
              if (inferred || isConst) invalid('LOCAL_INITIALIZER_REQUIRED', 'var and const declarations require an initializer.', variable);
              const type = nativeType(typeNode);
              const binding: CSharpIntegralBinding = { ...span(nameNode), id: `csharp-binding-${nameNode.startIndex}`, scopeId: env.id, name, type, isConst: false, initialized: false, hasInitializer: false, fact: { type } };
              env.bindings.set(name, binding); report.bindings.push(binding); scope.declaredBindingIds.push(binding.id); continue;
            }
            const callStart = calls.length, fact = expression(initializer, env, context);
            const type = inferred ? fact.type : nativeType(typeNode);
            let local: ReturnType<typeof csharpIntegralLocal>;
            try { local = csharpIntegralLocal(inferred ? 'var' : type, isConst, fact); }
            catch (error) {
              if (error instanceof CSharpIntegerError && error.message === 'NATIVE_CSHARP_INTEGER_CONST_INITIALIZER') invalid('CONST_INITIALIZER', 'const requires a native constant expression.', initializer);
              throw error;
            }
            const converted = local.converted;
            const binding: CSharpIntegralBinding = { ...span(nameNode), id: `csharp-binding-${nameNode.startIndex}`, scopeId: env.id, name, type: local.declaredType, isConst, initialized: true, hasInitializer: true, fact: local.read };
            env.bindings.set(name, binding); report.bindings.push(binding);
            scope.declaredBindingIds.push(binding.id);
            report.observations.push({ ...span(nameNode), name, methodId: signature.id, initializer: span(initializer), expression: fact, converted, declaredType: type, calls: calls.slice(callStart) });
          }
        return env.reachable;
      };
      try {
        const body = signature.node.childForFieldName('body');
        if (!body) unsupported('METHOD_BODY', signature.node);
        if (body!.type === 'block') {
          const endReachable = block(body!, root, 'default');
          if (endReachable && signature.returns !== 'void') invalid('RETURN_PATH_REQUIRED', 'Every reachable method exit requires a return value.', body!);
        }
        else if (body!.type === 'arrow_expression_clause') {
          if (signature.returns === 'bool') { condition(children(body!)[0], root, 'default'); continue; }
          const fact = expression(children(body!)[0], root, 'default');
          if (signature.returns !== 'object' && signature.returns !== 'void') csharpIntegerAssignable(fact, signature.returns);
          else if (signature.returns === 'void') invalid('RETURN_VALUE', 'An integral expression cannot implement a void method.', body!);
        } else unsupported('METHOD_BODY', body!);
      } catch (error) { record(error, signature.node); }
    }
    report.bindings.forEach(binding => { Object.freeze(binding.fact); Object.freeze(binding); });
    report.scopes.forEach(scope => { Object.freeze(scope.declaredBindingIds); Object.freeze(scope); });
    report.references.forEach(Object.freeze);
    report.flow.forEach(flow => { Object.freeze(flow.entryAssignedBindingIds); Object.freeze(flow.exitAssignedBindingIds); if (flow.condition) Object.freeze(flow.condition); Object.freeze(flow); });
    report.observations.forEach(observation => {
      Object.freeze(observation.expression); Object.freeze(observation.converted); Object.freeze(observation.initializer);
      observation.calls.forEach(call => { Object.freeze(call.parameterTypes); Object.freeze(call); });
      Object.freeze(observation.calls); Object.freeze(observation);
    });
    report.diagnostics.forEach(Object.freeze);
    Object.freeze(report.bindings); Object.freeze(report.scopes); Object.freeze(report.references); Object.freeze(report.flow); Object.freeze(report.observations); Object.freeze(report.diagnostics);
    return Object.freeze(report);
  } finally { tree.delete(); }
}
