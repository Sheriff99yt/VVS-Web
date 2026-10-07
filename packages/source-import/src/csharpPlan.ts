import type { Node as SyntaxNode } from 'web-tree-sitter';
import { CSHARP_ASSIGNMENT_OPERATORS, type CSharpAssignmentOperator, CSHARP_INTEGRAL_PINS, validCSharpBindingName, NATIVE_OPERATORS, type CSharpSignatureType } from '@vvs/graph-types';
import { ImportFailure, IMPORT_LIMITS, type ClassImportPlan, type ExpressionPlan, type MethodPlan, type ParameterPlan, type LocalPlan, type StatementPlan } from './contracts';
import { checkSourceBudget } from './parser';
import { loadCSharpParser, parseCSharpTree } from './nativeParser';
import { analyzeCSharpIntegralBindings } from './csharpBindings';

const span = (node: SyntaxNode) => ({ start: node.startIndex, end: node.endIndex, mappingId: `csharp.${node.type}`, mappingVersion: 1 });
const children = (node: SyntaxNode) => node.namedChildren;
const fail = (code: string, node: SyntaxNode): never => { throw new ImportFailure(`CSHARP_PLAN_${code}`, 'This source construct needs its own visible mapping contract.', span(node)); };
function name(node: SyntaxNode): string { if (!validCSharpBindingName(node.text)) return fail('IDENTIFIER', node); return node.text; }
function integerType(node: SyntaxNode): CSharpSignatureType {
  if (node.type !== 'predefined_type' || !Object.hasOwn(CSHARP_INTEGRAL_PINS, node.text)) return fail('TYPE', node);
  return node.text as CSharpSignatureType;
}
/** Typed source-to-graph planning foundation. This does not issue acceptance receipts. */
export async function planCSharpIntegralClass(source: string, fileName: string): Promise<ClassImportPlan> {
  checkSourceBudget(source);
  const bindings = await analyzeCSharpIntegralBindings(source);
  if (bindings.diagnostics.length) throw new ImportFailure(bindings.diagnostics[0].code, bindings.diagnostics[0].message, bindings.diagnostics[0]);
  await loadCSharpParser(); const tree = parseCSharpTree(source);
  const started = performance.now(); let count = 0;
  try {
    const nodes = children(tree.rootNode);
    if (nodes.length !== 1 || nodes[0].type !== 'class_declaration') return fail('UNIT', tree.rootNode);
    const cls = nodes[0];
    if (children(cls).some(node => !['modifier', 'identifier', 'declaration_list'].includes(node.type))) return fail('CLASS_CONTEXT', cls);
    const modifiers = children(cls).filter(node => node.type === 'modifier').map(node => node.text);
    if (modifiers.length > 1 || modifiers.length === 1 && modifiers[0] !== 'public') return fail('CLASS_MODIFIERS', cls);
    const className = name(cls.childForFieldName('name')!);
    const members = children(cls.childForFieldName('body')!);
    if (!members.length || members.length > IMPORT_LIMITS.methods || members.some(node => node.type !== 'method_declaration')) return fail('MEMBERS', cls);
    const dependencies: ClassImportPlan['dependencies'] = []; const seenNames = new Set<string>();
    const methods: MethodPlan[] = members.map((method, index) => {
      const methodName = name(method.childForFieldName('name')!); const identity = methodName.replace(/^@/, '');
      if (identity === className.replace(/^@/, '')) return fail('METHOD_CLASS_NAME', method);
      if (seenNames.has(identity)) return fail('OVERLOAD_GRAPH', method); seenNames.add(identity);
      const modifiers = children(method).filter(node => node.type === 'modifier').map(node => node.text).sort();
      if (modifiers.join(',') !== 'public,static' || children(method).some(node => !['modifier', 'predefined_type', 'identifier', 'parameter_list', 'block', 'arrow_expression_clause'].includes(node.type))) return fail('METHOD_CONTEXT', method);
      const id = `csharp-method-${index}`, scopeId = id;
      const parameters: ParameterPlan[] = children(method.childForFieldName('parameters')!).map((parameter, parameterIndex) => {
        if (parameter.type !== 'parameter' || children(parameter).some(node => !['predefined_type', 'identifier'].includes(node.type)) || parameter.children.some(child => child.type === '=')) return fail('PARAMETER', parameter);
        return { ...span(parameter), id: `${id}-parameter-${parameterIndex}`, name: name(parameter.childForFieldName('name')!), scopeId, mode: 'positional', type: 'data_number', nativeType: integerType(parameter.childForFieldName('type')!) };
      });
      if (parameters.length > 32 || new Set(parameters.map(p => p.name.replace(/^@/, ''))).size !== parameters.length) return fail('PARAMETER_BINDINGS', method);
      const returnsNode = method.childForFieldName('returns')!;
      const nativeReturnType = returnsNode.type === 'predefined_type' && ['void', 'bool'].includes(returnsNode.text) ? returnsNode.text as 'void' | 'bool' : integerType(returnsNode);
      let locals = new Map<string, LocalPlan>(); let localSerial = 0;
      const expression = (node: SyntaxNode, depth = 0): ExpressionPlan => {
        if (++count > IMPORT_LIMITS.nodes || depth > IMPORT_LIMITS.depth || performance.now() - started > IMPORT_LIMITS.elapsedMs) return fail('EXPRESSION_BUDGET', node);
        const native = (form: 'scalar' | 'binary' | 'unary' | 'conversion' | 'parentheses' | 'overflow', operands: ExpressionPlan[], options: { payload?: string; operator?: string; targetType?: string; boolean?: boolean } = {}): ExpressionPlan => {
          const { boolean, ...settings } = options;
          const isBoolean = boolean ?? (['parentheses', 'overflow'].includes(form) && operands[0]?.valueType === 'boolean');
          return { ...span(node), kind: 'native', language: 'csharp', form, domain: isBoolean ? 'csharp-bool' : 'csharp-integer', valueType: isBoolean ? 'boolean' : 'number', operands, ...settings };
        };
        const visit = (value: SyntaxNode) => expression(value, depth + 1);
        switch (node.type) {
          case 'integer_literal': return native('scalar', [], { payload: node.text });
          case 'boolean_literal': return native('scalar', [], { payload: node.text, boolean: true });
          case 'identifier': {
            const local = locals.get(name(node).replace(/^@/, ''));
            if (local) return { ...span(node), kind: 'local', localId: local.id, scopeId, valueType: 'number' };
            const binding = parameters.find(p => p.name.replace(/^@/, '') === name(node).replace(/^@/, ''));
            if (!binding) return fail('REFERENCE', node);
            dependencies.push({ ...span(node), kind: 'parameter-read', scopeId, symbolId: binding.id, resolved: true });
            return { ...span(node), kind: 'parameter', parameterId: binding.id, scopeId, valueType: 'number' };
          }
          case 'parenthesized_expression': return native('parentheses', [visit(children(node)[0])]);
          case 'checked_expression': return native('overflow', [visit(children(node)[0])], { payload: node.children[0].text });
          case 'cast_expression': return native('conversion', [visit(node.childForFieldName('value')!)], { targetType: integerType(node.childForFieldName('type')!) });
          case 'prefix_unary_expression': {
            const operator = node.children[0].text; if (!['+', '-', '~', '!'].includes(operator)) return fail('UNARY', node);
            return native('unary', [visit(children(node)[0])], { operator, boolean: operator === '!' });
          }
          case 'binary_expression': {
            const operator = node.childForFieldName('operator')!.text; if (!NATIVE_OPERATORS.csharp.includes(operator)) return fail('BINARY', node);
            const operands = [visit(node.childForFieldName('left')!), visit(node.childForFieldName('right')!)];
            return native('binary', operands, { operator, boolean: ['==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(operator) || operands.some(value => value.valueType === 'boolean') });
          }
          default: return fail('EXPRESSION', node);
        }
      };
      const body = method.childForFieldName('body')!;
      const terminates = (statement: StatementPlan): boolean => statement.kind === 'return' || statement.kind === 'scope' && terminates(statement.body) || statement.kind === 'sequence' && !!statement.statements.length && terminates(statement.statements.at(-1)!);
      const planStatements = (owner: SyntaxNode, nested = false): StatementPlan => {
        const statements = owner.type === 'arrow_expression_clause' ? [owner] : children(owner);
        const planned: StatementPlan[] = [];
        for (const statement of statements) {
          if (planned.length && terminates(planned.at(-1)!)) return fail('UNREACHABLE_REGION', statement);
          if (statement.type === 'block' || statement.type === 'checked_statement') {
            const previous = locals; locals = new Map(previous);
            const block = statement.type === 'block' ? statement : children(statement)[0];
            const overflowContext = statement.type === 'block' ? 'default' : statement.children[0].text === 'checked' ? 'checked' : 'unchecked';
            const scope: StatementPlan = { ...span(statement), kind: 'scope', overflowContext, body: planStatements(block, true) };
            locals = previous; planned.push(scope); continue;
          }
          if (statement.type === 'return_statement' || statement.type === 'arrow_expression_clause') {
            const valueNode = children(statement)[0];
            if (nativeReturnType === 'void' ? !!valueNode : !valueNode) return fail('RETURN', statement);
            planned.push({ ...span(statement), kind: 'return', ...(valueNode ? { value: expression(valueNode) } : {}) }); continue;
          }
        if (statement.type === 'expression_statement') {
          const assignment = children(statement)[0];
          const update = ['prefix_unary_expression', 'postfix_unary_expression'].includes(assignment?.type ?? '');
          const operator = update ? assignment.children.find(child => ['++', '--'].includes(child.text))?.text : assignment?.childForFieldName('operator')?.text;
          if (!operator || !CSHARP_ASSIGNMENT_OPERATORS.includes(operator as CSharpAssignmentOperator) || !update && assignment?.type !== 'assignment_expression') return fail('ASSIGNMENT_OPERATOR', statement);
          const left = update ? children(assignment)[0] : assignment.childForFieldName('left')!;
          if (left.type !== 'identifier') return fail('ASSIGNMENT_TARGET', left);
          const local = locals.get(name(left).replace(/^@/, ''));
          const parameter = parameters.find(parameter => parameter.name.replace(/^@/, '') === name(left).replace(/^@/, ''));
          if (!local && !parameter) return fail('LOCAL_ASSIGNMENT_BINDING', left);
          planned.push({ ...span(statement), ...(local ? { kind: 'assign' as const, localId: local.id } : { kind: 'assign-parameter' as const, parameterId: parameter!.id, scopeId }), operator: operator as CSharpAssignmentOperator, prefix: update && assignment.type === 'prefix_unary_expression', ...(update ? {} : { value: expression(assignment.childForFieldName('right')!) }) });
          continue;
        }
        if (statement.type !== 'local_declaration_statement' || children(statement).some(child => !['modifier', 'variable_declaration'].includes(child.type))) return fail('STATEMENTS', statement);
        const modifiers = children(statement).filter(child => child.type === 'modifier').map(child => child.text);
        if (modifiers.length > 1 || modifiers.length === 1 && modifiers[0] !== 'const') return fail('LOCAL_MODIFIERS', statement);
        const declaration = children(statement).find(child => child.type === 'variable_declaration')!;
        const variables = children(declaration).filter(child => child.type === 'variable_declarator');
        if (!variables.length || variables.length > 32) return fail('LOCAL_GROUP', declaration);
        const declarations: Extract<StatementPlan, { kind: 'declaration-group' }>['declarations'] = [];
        for (const variable of variables) {
        const nameNode = variable.childForFieldName('name')!;
        const initializer = children(variable).find(child => child.id !== nameNode.id);
        const initialized = !!initializer && variable.children.some(child => child.type === '=');
        const typeNode = declaration.childForFieldName('type')!;
        const inferred = typeNode.type === 'implicit_type' && typeNode.text === 'var';
        const value = initialized ? expression(initializer!) : undefined, constant = modifiers.length === 1;
        if (!initialized && (inferred || constant)) return fail('LOCAL_INITIALIZER', variable);
        const local: LocalPlan = { ...span(variables.length > 1 ? variable : statement), id: `${id}-local-${localSerial++}`, name: name(nameNode), scopeId, nestedScope: nested, valueType: 'number', declarationKind: constant ? 'const' : 'var', nativeLocalStyle: constant ? 'csharp-const' : inferred ? 'csharp-var' : 'csharp-typed', nativeType: inferred ? 'var' : integerType(typeNode) };
        locals.set(local.name.replace(/^@/, ''), local);
        declarations.push(value ? { ...span(variables.length > 1 ? variable : statement), kind: 'declare', local, value } : { ...span(variables.length > 1 ? variable : statement), kind: 'declare-uninitialized', local });
        }
        if (variables.length === 1) planned.push(declarations[0]);
        else planned.push({ ...span(statement), kind: 'declaration-group', nativeType: integerType(declaration.childForFieldName('type')!), groupStyle: modifiers.length ? 'const' : 'typed', declarations });
        }
        return { ...span(owner), kind: 'sequence', statements: planned };
      };
      const plannedBody = planStatements(body);
      if (nativeReturnType !== 'void' && !terminates(plannedBody)) return fail('STATEMENTS', body);
      return { ...span(method), id, scopeId, name: methodName, role: 'method', isStatic: true, parameters, nativeReturnType, returnType: nativeReturnType === 'void' ? 'void' : nativeReturnType === 'bool' ? 'data_boolean' : 'data_number', body: plannedBody };
    });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    const sourceSha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return { ...span(cls), version: 1, context: { language: 'csharp', version: '12', sourceMode: 'module', environment: 'none' }, name: className, classVisibility: modifiers.length ? 'public' : '', fileName, source, sourceSha256, selectedSource: cls.text, entryPolicy: 'library', methods, dependencies };
  } finally { tree.delete(); }
}
