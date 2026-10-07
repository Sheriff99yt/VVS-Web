import { GO_ASSIGN_OPERATORS, GO_SCALAR_PINS, goIntegerLiteral, goFloatLiteral, goValueAssignable, goValueConvert, goValueBinary, goValueUnary, goValueDefault, goValueConstant, goValueCompare, goValuesComparable, isGoIntegerValue, type GoValueFact, type GoWordBits } from '@vvs/graph-types';
import type { Node as SyntaxNode } from 'web-tree-sitter';
import { ImportFailure, type ClassImportPlan, type ExpressionPlan, type MethodPlan, type ParameterPlan, type StatementPlan, type LocalPlan } from './contracts';
import { checkSourceBudget, type SourceImportPreview } from './parser';
import { loadGoParser, parseGoTree } from './nativeParser';

const span = (node: SyntaxNode) => ({ start: node.startIndex, end: node.endIndex, mappingId: `go.${node.type}`, mappingVersion: 1 });
const types = GO_SCALAR_PINS;
const values = { float64: 'number', float32: 'number', string: 'string', bool: 'boolean', int: 'number', uint: 'number', uintptr: 'number', int8: 'number', int16: 'number', int32: 'number', int64: 'number', uint8: 'number', uint16: 'number', uint32: 'number', uint64: 'number', byte: 'number', rune: 'number' } as const;
type Scalar = keyof typeof types;
function nativeType(node: SyntaxNode | null): Scalar {
  if (!node || node.type !== 'type_identifier' || !Object.hasOwn(types, node.text)) throw new ImportFailure('GO_TYPE', 'This native type needs its own reviewed mapping.', node ? span(node) : undefined);
  return node.text as Scalar;
}
/** Whole-file inventory; candidate status still requires every construct to map and validate. */
export async function previewGoImport(source: string, goWordBits: GoWordBits = 64): Promise<SourceImportPreview> {
  checkSourceBudget(source);
  if (![32, 64].includes(goWordBits)) throw new ImportFailure('GO_WORD_SIZE', 'Choose a 32-bit or 64-bit Go target.');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const sourceSha256 = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    await loadGoParser();
    const tree = parseGoTree(source);
    try {
      const units = tree.rootNode.namedChildren;
      if (units[0]?.type !== 'package_clause' || units.length < 2 || units.length > 33 || units.slice(1).some(node => node.type !== 'function_declaration')) throw new ImportFailure('GO_UNIT', 'Package clauses and ordinary functions are mapped first; other file members need explicit contracts.');
      return { language: 'go', goWordBits, source, sourceSha256, diagnostics: [], regions: [{ kind: 'candidate', proposedKind: 'function-file', start: 0, end: source.length, text: source }] };
    } finally { tree.delete(); }
  } catch (error) {
    return { language: 'go', goWordBits, source, sourceSha256, diagnostics: [error instanceof Error ? error.message : String(error)], regions: [{ kind: 'unresolved', start: 0, end: source.length, text: source, reason: 'Go parser or compilation-unit mapping is unavailable.' }] };
  }
}
export function normalizedGoSyntax(source: string): string {
  const tree = parseGoTree(source);
  try {
    const visit = (node: SyntaxNode): unknown => {
      if (node.type === ';') return undefined;
      if (node.type === 'parenthesized_expression') return visit(node.namedChildren[0]);
      if (!node.childCount) return [node.type, node.text];
      return [node.type, node.children.map(visit).filter(value => value !== undefined)];
    };
    return JSON.stringify(visit(tree.rootNode));
  } finally { tree.delete(); }
}
export function planGoFile(preview: SourceImportPreview, fileName: string, entryPolicy: string, mapStart: boolean): ClassImportPlan {
  if (entryPolicy !== 'library' || mapStart) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Go source files require Library mode; main/init lifecycle mappings are separate.');
  const wordBits = preview.goWordBits ?? 64;
  if (![32, 64].includes(wordBits)) throw new ImportFailure('GO_WORD_SIZE', 'Choose a reviewed Go word size.');
  const tree = parseGoTree(preview.source);
  try {
    const units = tree.rootNode.namedChildren;
    if (units[0]?.type !== 'package_clause' || units.slice(1).some(node => node.type !== 'function_declaration')) throw new ImportFailure('GO_UNIT', 'Every file member requires a reviewed mapping.');
    const signatures = new Map<string, { id: string; parameters: (ParameterPlan & { nativeType: Scalar })[]; result: Scalar | 'void'; body: SyntaxNode; node: SyntaxNode }>();
    for (const [index, node] of units.slice(1).entries()) {
      const name = node.childForFieldName('name'), params = node.childForFieldName('parameters'), result = node.childForFieldName('result'), body = node.childForFieldName('body');
      if (!name || !params || !body || node.childForFieldName('type_parameters') || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name.text) || ['main', 'init', '_', 'true', 'false', 'nil', ...Object.keys(types)].includes(name.text) || signatures.has(name.text)) throw new ImportFailure('GO_SIGNATURE', 'Unique ordinary named functions need exact native signatures.', span(node));
      const id = `go-function-${index}`;
      const parameters: (ParameterPlan & { nativeType: Scalar })[] = params.namedChildren.map((parameter, parameterIndex) => {
        const names = parameter.childrenForFieldName('name');
        if (parameter.type !== 'parameter_declaration' || names.length !== 1 || ['_', 'true', 'false', 'nil'].includes(names[0].text) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(names[0].text)) throw new ImportFailure('GO_PARAMETER', 'Grouped, unnamed, generic and variadic parameters need separate mappings.', span(parameter));
        const scalar = nativeType(parameter.childForFieldName('type'));
        return { ...span(parameter), id: `go-param-${parameterIndex}`, name: names[0].text, scopeId: id, type: types[scalar], nativeType: scalar };
      });
      if (parameters.length > 32 || new Set(parameters.map(parameter => parameter.name)).size !== parameters.length) throw new ImportFailure('GO_PARAMETER', 'Duplicate or excessive parameter bindings.', span(params));
      signatures.set(name.text, { id, parameters, result: result ? nativeType(result) : 'void', body, node });
    }
    const dependencies: ClassImportPlan['dependencies'] = [];
    const methods: MethodPlan[] = [...signatures.entries()].map(([name, signature]) => {
      const scopes: Map<string, LocalPlan>[] = [new Map()];
      const locals: LocalPlan[] = [], readLocals = new Set<string>(), loops: number[] = [];
      const lookup = (name: string) => scopes.toReversed().map(scope => scope.get(name)).find(Boolean);
      const constantFacts = new Map<string, GoValueFact>();
      const facts = new WeakMap<ExpressionPlan, GoValueFact>();
      const fact = (value: ExpressionPlan): GoValueFact => {
        const previous = facts.get(value); if (previous) return previous;
        let result: GoValueFact = { type: 'unknown' };
        if (value.kind === 'compare') result = goValueCompare(value.operator, fact(value.left), fact(value.right), wordBits);
        if (value.kind === 'parameter') result = { type: signature.parameters.find(parameter => parameter.id === value.parameterId)?.nativeType ?? 'unknown' };
        if (value.kind === 'local') result = constantFacts.get(value.localId) ?? { type: locals.find(local => local.id === value.localId)?.nativeType as Scalar ?? 'unknown' };
        if (value.kind === 'call') { const type = [...signatures.values()].find(called => called.id === value.functionId)?.result; result = { type: type === 'void' || !type ? 'unknown' : type }; }
        if (value.kind === 'binary') result = goValueBinary(value.operator, fact(value.left), fact(value.right), wordBits);
        if (value.kind === 'literal') result = { type: value.valueType === 'string' ? 'untyped-string' : value.valueType === 'boolean' ? 'untyped-bool' : 'inline-number', constant: String(value.value) };
        if (value.kind === 'native') result = value.form === 'scalar' ? (value.domain === 'go-float' ? goFloatLiteral(value.payload!) : goIntegerLiteral(value.payload!)) : value.form === 'conversion' ? goValueConvert(fact(value.operands[0]), value.targetType as Scalar, wordBits) : value.form === 'unary' ? goValueUnary(value.operator!, fact(value.operands[0]), wordBits) : goValueBinary(value.operator!, fact(value.operands[0]), fact(value.operands[1]), wordBits);
        facts.set(value, result); return result;
      };
      const compatible = (value: ExpressionPlan, target: Scalar) => goValueAssignable(fact(value), target, wordBits);
      const terminates = (plan: StatementPlan): boolean => ['return', 'break', 'continue'].includes(plan.kind) || (plan.kind === 'sequence' && !!plan.statements.length && terminates(plan.statements.at(-1)!)) || (plan.kind === 'branch' && !!plan.alternate && terminates(plan.consequent) && terminates(plan.alternate));
      const returns = (plan: StatementPlan): boolean => plan.kind === 'return' || (plan.kind === 'sequence' && !!plan.statements.length && returns(plan.statements.at(-1)!)) || (plan.kind === 'branch' && !!plan.alternate && returns(plan.consequent) && returns(plan.alternate));
      const expression = (node: SyntaxNode, depth = 0): ExpressionPlan => {
        if (depth > 64) throw new ImportFailure('GO_DEPTH', 'Expression exceeds the reviewed depth.', span(node));
        const ev = span(node);
        if (node.type === 'parenthesized_expression') return expression(node.namedChildren[0], depth + 1);
        if (node.type === 'identifier') {
          const local = lookup(node.text);
          if (local) { readLocals.add(local.id); return { ...ev, kind: 'local', localId: local.id, scopeId: signature.id, valueType: local.valueType }; }
          const parameter = signature.parameters.find(parameter => parameter.name === node.text);
          if (!parameter) throw new ImportFailure('GO_BINDING', 'Name must resolve in the current function scope.', ev);
          dependencies.push({ ...ev, kind: 'parameter-read', scopeId: signature.id, symbolId: parameter.id, resolved: true });
          return { ...ev, kind: 'parameter', parameterId: parameter.id, scopeId: signature.id, valueType: values[parameter.nativeType!] };
        }
        if (['true', 'false'].includes(node.type)) return { ...ev, kind: 'literal', value: node.type === 'true', valueType: 'boolean' };
        if (node.type === 'int_literal') { goIntegerLiteral(node.text); return { ...ev, kind: 'native', language: 'go', form: 'scalar', domain: 'go-integer', payload: node.text, operands: [], valueType: 'number' }; }
        if (node.type === 'unary_expression') {
          const operand = expression(node.childForFieldName('operand')!, depth + 1), operator = node.childForFieldName('operator')?.text;
          if (!operator || !['+', '-', '^', '!'].includes(operator)) throw new ImportFailure('GO_UNARY', 'This unary operator requires a reviewed native mapping.', ev);
          goValueUnary(operator, fact(operand), wordBits);
          return { ...ev, kind: 'native', language: 'go', form: 'unary', domain: operand.valueType === 'boolean' ? 'go-bool' : isGoIntegerValue(fact(operand)) ? 'go-integer' : 'go-number', operator, operands: [operand], valueType: operand.valueType };
        }
        if (node.type === 'float_literal') { goFloatLiteral(node.text); return { ...ev, kind: 'native', language: 'go', form: 'scalar', domain: 'go-float', payload: node.text, operands: [], valueType: 'number' }; }
        if (node.type === 'interpreted_string_literal') {
          // JSON decoding is valid only for the overlapping Go escape subset.
          // Go rejects escaped surrogate code points even when JSON pairs them.
          for (let index = 1; index < node.text.length - 1; index++) if (node.text[index] === '\\') {
            const escape = node.text[++index];
            if (escape === '/' || (escape === 'u' && /^[dD][89a-fA-F]/.test(node.text.slice(index + 1, index + 5)))) throw new ImportFailure('GO_STRING_ESCAPE', 'The token contains a non-Go escape or surrogate code point.', ev);
            if (escape === 'u') index += 4;
          }
          try { const value: unknown = JSON.parse(node.text); if (typeof value === 'string' && !/(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/.test(value)) return { ...ev, kind: 'literal', value, valueType: 'string' }; } catch { /* Go-only escapes need native byte decoding. */ }
        }
        if (node.type === 'call_expression') {
          const callee = node.childForFieldName('function'), args = node.childForFieldName('arguments');
          if (callee?.type === 'identifier' && Object.hasOwn(types, callee.text) && !['string', 'bool'].includes(callee.text) && !lookup(callee.text) && !signature.parameters.some(parameter => parameter.name === callee.text)) {
            if (!args || args.namedChildCount !== 1) throw new ImportFailure('GO_CONVERSION_ARITY', 'Native numeric conversions require one visible operand.', ev);
            const operand = expression(args.namedChildren[0], depth + 1);
            goValueConvert(fact(operand), callee.text as Scalar, wordBits);
            return { ...ev, kind: 'native', language: 'go', form: 'conversion', domain: 'go-number', targetType: callee.text, operands: [operand], valueType: 'number' };
          }
          const called = callee?.type === 'identifier' && signatures.get(callee.text);
          if (!called || !args || args.namedChildCount !== called.parameters.length || (lookup(callee!.text) || signature.parameters.some(parameter => parameter.name === callee!.text))) throw new ImportFailure('GO_CALL_BINDING', 'Calls need an unshadowed same-file function and exact arguments.', ev);
          const arguments_ = args.namedChildren.map(argument => expression(argument, depth + 1));
          if (arguments_.some((argument, index) => !compatible(argument, called.parameters[index].nativeType!))) throw new ImportFailure('GO_CALL_TYPE', 'Call arguments and result must satisfy the declared native types.', ev);
          return { ...ev, kind: 'call', functionId: called.id, args: arguments_, valueType: called.result === 'void' ? 'unknown' : values[called.result] };
        }
        if (node.type === 'binary_expression') {
          const left = expression(node.childForFieldName('left')!, depth + 1), right = expression(node.childForFieldName('right')!, depth + 1), operator = node.childForFieldName('operator')?.text;
          if (operator && ['==', '!=', '<', '<=', '>', '>='].includes(operator) && goValuesComparable(fact(left), fact(right), wordBits) && left.valueType === right.valueType && left.valueType !== 'unknown' && (left.valueType !== 'boolean' || ['==', '!='].includes(operator))) return { ...ev, kind: 'compare', operator: operator as '==', mode: left.valueType, left, right, valueType: 'boolean' };
          if (operator && ((operator === '+' && left.valueType === 'string' && right.valueType === 'string') || (['&&', '||'].includes(operator) && left.valueType === 'boolean' && right.valueType === 'boolean'))) {
            goValueBinary(operator, fact(left), fact(right), wordBits);
            return { ...ev, kind: 'native', language: 'go', form: 'binary', domain: left.valueType === 'string' ? 'go-string' : 'go-bool', operator, operands: [left, right], valueType: left.valueType };
          }
          if (operator && ['+', '-', '*', '/', '%', '&', '|', '^', '&^', '<<', '>>'].includes(operator) && left.valueType === 'number' && right.valueType === 'number') {
            goValueBinary(operator, fact(left), fact(right), wordBits);
            return { ...ev, kind: 'native', language: 'go', form: 'binary', domain: isGoIntegerValue(fact(left)) && isGoIntegerValue(fact(right)) ? 'go-integer' : 'go-number', operator, operands: [left, right], valueType: 'number' };
          }
          if (operator && ['+', '-', '*', '/'].includes(operator) && left.valueType === 'number' && right.valueType === 'number') return { ...ev, kind: 'binary', nodeKind: ({ '+': 'math_add', '-': 'math_subtract', '*': 'math_multiply', '/': 'math_divide' } as Record<string, string>)[operator], operator: operator as '+', left, right, valueType: 'number' };
        }
        throw new ImportFailure('GO_EXPRESSION', `Native construct ${node.type} needs an explicit mapping.`, ev);
      };
      const declaration = (statement: SyntaxNode): StatementPlan & { kind: 'declare' } => {
        const short = statement.type === 'short_var_declaration', constant = statement.type === 'const_declaration';
        const spec = short ? statement : statement.namedChildren[0];
        if (!spec || (!short && (statement.namedChildCount !== 1 || statement.children.some(child => child.type === '(') || spec.type !== (constant ? 'const_spec' : 'var_spec')))) throw new ImportFailure('GO_LOCAL_GROUP', 'Grouped declarations need a separate scope contract.', span(statement));
        const names = short ? spec.childForFieldName('left')?.namedChildren : spec.childrenForFieldName('name');
        const initializers = spec.childForFieldName(short ? 'right' : 'value')?.namedChildren;
        const name = names?.[0];
        if (names?.length !== 1 || initializers?.length !== 1 || !name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name.text) || ['_', 'true', 'false', 'nil', ...Object.keys(types)].includes(name.text)) throw new ImportFailure('GO_LOCAL_SHAPE', 'Single initialized scalar declarations are mapped; native multi-binding/zero initialization remains open.', span(statement));
        if (scopes.at(-1)!.has(name.text) || (scopes.length === 1 && signature.parameters.some(parameter => parameter.name === name.text))) throw new ImportFailure('GO_REDECLARATION', 'Redeclaration requires a new binding and native multi-name contract.', span(statement));
        const value = expression(initializers[0]);
        const inferred = short ? goValueDefault(fact(value), wordBits).type : undefined;
        const untyped = constant && !spec.childForFieldName('type');
        const type = untyped ? 'untyped' : short ? (inferred && Object.hasOwn(types, inferred) ? inferred as Scalar : undefined) : nativeType(spec.childForFieldName('type'));
        if (!type || (type !== 'untyped' && !compatible(value, type))) throw new ImportFailure('GO_LOCAL_DOMAIN', 'Local initialization must preserve native inferred type and representable constant evidence.', span(statement));
        const local: LocalPlan = { ...span(statement), id: `${signature.id}-local-${locals.length}`, name: name.text, scopeId: signature.id, valueType: type === 'untyped' ? value.valueType : values[type], declarationKind: constant ? 'const' : 'var', nestedScope: scopes.length > 1, nativeLocalStyle: constant ? 'go-const' : short ? 'go-short' : 'go-var', nativeType: type };
        if (constant) constantFacts.set(local.id, goValueConstant(fact(value), type, wordBits));
        locals.push(local); scopes.at(-1)!.set(name.text, local);
        return { ...span(statement), kind: 'declare', local, value };
      };
      const assignment = (statement: SyntaxNode): StatementPlan & { kind: 'assign' } => {
        const update = ['inc_statement', 'dec_statement'].includes(statement.type);
        const names = update ? statement.namedChildren : statement.childForFieldName('left')?.namedChildren;
        const local = names?.length === 1 && names[0].type === 'identifier' && lookup(names[0].text);
        const operator = update ? (statement.type === 'inc_statement' ? '++' : '--') : statement.childForFieldName('operator')?.text;
        const arguments_ = statement.childForFieldName('right')?.namedChildren;
        if (local && local.declarationKind === 'const') throw new ImportFailure('GO_CONSTANT_ASSIGNMENT', 'Constants cannot be assigned or updated.', span(statement));
        if (!local || !operator || !GO_ASSIGN_OPERATORS.includes(operator as typeof GO_ASSIGN_OPERATORS[number]) || (!update && arguments_?.length !== 1)) throw new ImportFailure('GO_ASSIGNMENT', 'Assignments need one resolved local and an explicit reviewed operator.', span(statement));
        const value = !update ? expression(arguments_![0]) : undefined;
        if ((operator !== '=' && local.valueType !== 'number' && !(operator === '+=' && local.valueType === 'string')) || (value && !['<<=', '>>='].includes(operator) && !compatible(value, local.nativeType as Scalar))) throw new ImportFailure('GO_ASSIGNMENT_TYPE', 'Assigned scalar must match the native local type.', span(statement));
        if (value && operator !== '=') goValueBinary(operator.slice(0, -1), { type: local.nativeType as Scalar }, fact(value), wordBits);
        if (update || operator !== '=') readLocals.add(local.id);
        return { ...span(statement), kind: 'assign', localId: local.id, operator: operator as '=', value, prefix: false };
      };
      const body = (node: SyntaxNode, nested = true): StatementPlan => {
        if (nested) scopes.push(new Map());
        try {
          const statements = node.type === 'block' ? node.namedChildren.flatMap(child => child.type === 'statement_list' ? child.namedChildren : [child]) : [node];
          const plans: StatementPlan[] = [];
          for (const statement of statements) {
            if (plans.length && terminates(plans.at(-1)!)) throw new ImportFailure('GO_AFTER_TERMINATOR', 'Source after a terminating construct requires an unreachable-code contract.', span(statement));
            plans.push(planStatement(statement));
          }
          if (!plans.length) throw new ImportFailure('GO_EMPTY_BLOCK', 'Empty blocks require an explicit empty-body mapping.', span(node));
          return plans.length === 1 ? plans[0] : { ...span(node), kind: 'sequence', statements: plans };
        } finally { if (nested) scopes.pop(); }
      };
      const planStatement = (statement: SyntaxNode): StatementPlan => {
        const ev = span(statement);
        if (['short_var_declaration', 'var_declaration', 'const_declaration'].includes(statement.type)) return declaration(statement);
        if (['assignment_statement', 'inc_statement', 'dec_statement'].includes(statement.type)) return assignment(statement);
        if (statement.type === 'expression_statement' && statement.namedChildCount === 1) {
          const call = expression(statement.namedChildren[0]);
          if (call.kind === 'call') return { ...ev, kind: 'call', call };
        }
        if (statement.type === 'return_statement') {
          const results = statement.namedChildren.flatMap(child => child.type === 'expression_list' ? child.namedChildren : [child]);
          if (!results.length && signature.result === 'void') return { ...ev, kind: 'return' };
          if (results.length === 1 && signature.result !== 'void') {
            const value = expression(results[0]);
            if (!compatible(value, signature.result)) throw new ImportFailure('GO_RETURN_TYPE', 'Return must match the declared native type.', ev);
            return { ...ev, kind: 'return', value };
          }
          throw new ImportFailure('GO_RETURN', 'Multiple or empty results need a dedicated native result contract.', ev);
        }
        if (statement.type === 'if_statement') {
          const condition = expression(statement.childForFieldName('condition')!);
          const consequence = statement.childForFieldName('consequence'), alternate = statement.childForFieldName('alternative');
          if (statement.childForFieldName('initializer') || condition.valueType !== 'boolean' || !consequence) throw new ImportFailure('GO_BRANCH', 'Branches need a Boolean condition; initializer scope remains open.', ev);
          return { ...ev, kind: 'branch', condition, consequent: body(consequence), ...(alternate ? { alternate: body(alternate) } : {}) };
        }
        if (['break_statement', 'continue_statement'].includes(statement.type)) {
          if (!loops.length || statement.namedChildCount) throw new ImportFailure('GO_LOOP_TARGET', 'Unlabeled control needs its nearest enclosing loop.', ev);
          return { ...ev, kind: statement.type === 'break_statement' ? 'break' : 'continue', loopStart: loops.at(-1)! };
        }
        if (statement.type === 'for_statement') {
          const block = statement.childForFieldName('body');
          const header = statement.namedChildren.find(child => child !== block && child.type !== 'block');
          if (!block || !header || header.type === 'range_clause') throw new ImportFailure('GO_FOR_HEADER', 'Counted and Boolean condition loops are mapped; range and omitted headers require native contracts.', ev);
          scopes.push(new Map()); loops.push(statement.startIndex);
          try {
            if (header.type === 'for_clause') {
              const init = header.childForFieldName('initializer'), conditionNode = header.childForFieldName('condition'), update = header.childForFieldName('update');
              if (!init || init.type !== 'short_var_declaration' || !conditionNode || !update) throw new ImportFailure('GO_FOR_HEADER', 'Counted loops need visible short declaration, condition and update.', ev);
              const initializer = declaration(init), condition = expression(conditionNode), updatePlan = assignment(update);
              if (condition.valueType !== 'boolean' || updatePlan.localId !== initializer.local.id) throw new ImportFailure('GO_FOR_HEADER', 'The header update must bind its declared scalar index.', ev);
              return { ...ev, kind: 'for', initializer, condition, update: updatePlan, body: body(block) };
            }
            const condition = expression(header);
            if (condition.valueType !== 'boolean') throw new ImportFailure('GO_FOR_CONDITION', 'Go conditions require a Boolean value.', ev);
            return { ...ev, kind: 'while', condition, body: body(block) };
          } finally { scopes.pop(); loops.pop(); }
        }
        throw new ImportFailure('GO_STATEMENT', `Native statement ${statement.type} needs an explicit mapping.`, ev);
      };
      const plannedBody = body(signature.body, false);
      if (signature.result !== 'void' && !returns(plannedBody)) throw new ImportFailure('GO_MISSING_RETURN', 'Every native scalar result path needs an explicit return.', span(signature.body));
      if (locals.some(local => local.declarationKind !== 'const' && !readLocals.has(local.id))) throw new ImportFailure('GO_UNUSED_LOCAL', 'Native Go locals must have a resolved use.', span(signature.body));
      return { ...span(signature.node), id: signature.id, name, scopeId: signature.id, parameters: signature.parameters, role: 'method', isStatic: false, returnType: signature.result === 'void' ? 'void' : types[signature.result], nativeReturnType: signature.result, body: plannedBody };
    });
    const packageName = units[0].namedChildren[0].text;
    return { ...span(tree.rootNode), version: 1, name: fileName.replace(/\.go$/, ''), fileName, context: { language: 'go', version: '1.26', sourceMode: 'module', environment: 'none' }, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: preview.source, unitKind: 'standalone-function', entryPolicy: 'library', packageClause: { ...span(units[0]), name: packageName, wordBits }, methods, dependencies };
  } finally { tree.delete(); }
}
