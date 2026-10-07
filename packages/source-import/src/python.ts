import { parser } from '@lezer/python';
type SyntaxNode = ReturnType<typeof parser.parse>['topNode'];
import { checkSourceBudget, type SourceImportPreview } from './parser';
import { ImportFailure, type ClassImportPlan, type ExpressionPlan, type StatementPlan, type MappingEvidence, type LocalPlan, type ParameterPlan } from './contracts';
import { nativeScalarPlan, decodePythonString } from './nativeLiteralMapping';
import { pythonNumericScalar } from './nativeValues';
import { NATIVE_OPERATORS, nativeCallBindingProblem } from '@vvs/graph-types';

const evidence = (node: SyntaxNode): MappingEvidence => ({ start: node.from, end: node.to, mappingId: `python.${node.name}`, mappingVersion: 1 });
function children(node: SyntaxNode): SyntaxNode[] {
  const result: SyntaxNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) result.push(child);
  return result;
}
interface PythonSignature { id: string; arity: number; minimum?: number; rest?: boolean; parameters?: { id: string; name: string; mode: 'positional' | 'rest'; defaultPin?: string }[] }
function parameterGroups(node: SyntaxNode): SyntaxNode[][] {
  const groups: SyntaxNode[][] = [[]];
  for (const child of children(node).filter(child => !['(', ')'].includes(child.name))) {
    if (child.name === ',') groups.push([]); else groups[groups.length - 1].push(child);
  }
  return groups.filter(group => group.length);
}
function parameterShape(node: SyntaxNode): { nameNode: SyntaxNode; defaultNode?: SyntaxNode; mode: 'positional' | 'rest' }[] {
  let sawDefault = false;
  return parameterGroups(node).map((group, index, groups) => {
    const rest = group.length === 2 && group[0].name === '*';
    const defaulted = group.length === 3 && group[1].name === 'AssignOp';
    const nameNode = group[rest ? 1 : 0];
    if (nameNode.name !== 'VariableName' || (!rest && !defaulted && group.length !== 1) || (rest && index !== groups.length - 1) || (!rest && !defaulted && sawDefault)) throw new ImportFailure('PYTHON_PARAMETERS', 'This parameter form requires a reviewed binding contract.', evidence(node));
    sawDefault ||= defaulted;
    return { nameNode, mode: rest ? 'rest' : 'positional', ...(defaulted ? { defaultNode: group[2] } : {}) };
  });
}
function cleanTree(source: string, allowGeneratedComments = false): SyntaxNode {
  checkSourceBudget(source);
  const tree = parser.parse(source);
  const cursor = tree.cursor(); let count = 0;
  do {
    if (++count > 16384 || cursor.type.isError) throw new ImportFailure('PYTHON_PARSE', 'Python syntax must parse completely without recovery.');
    if (cursor.name === 'Comment' && !allowGeneratedComments) throw new ImportFailure('PYTHON_CONTEXT', 'Embedded comments are outside this pilot.');
  } while (cursor.next());
  return tree.topNode;
}
/** Conservative whole-file pilot. No regex recognition, interpreter or uploaded execution. */
export async function previewPythonImport(source: string): Promise<SourceImportPreview> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const sourceSha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  try {
    const root = cleanTree(source);
    const units = children(root);
    if (!units.length || units.length > 32 || units.some(unit => !['FunctionDefinition', 'ClassDefinition'].includes(unit.name))) throw new ImportFailure('PYTHON_UNIT', 'Choose a bounded file of plain function definitions.');
    if (units.length === 1 && units[0].name === 'ClassDefinition') return { language: 'python', source, sourceSha256, diagnostics: [], regions: [{ kind: 'candidate', proposedKind: 'class', start: 0, end: source.length, text: source }] };
    if (units.length > 1) return { language: 'python', source, sourceSha256, diagnostics: [], regions: [{ kind: 'candidate', proposedKind: 'function-file', start: 0, end: source.length, text: source }] };
    const node = units[0];
    return { language: 'python', source, sourceSha256, diagnostics: [], regions: [
      ...(node.from ? [{ kind: 'trivia' as const, start: 0, end: node.from, text: source.slice(0, node.from) }] : []),
      { kind: 'candidate', proposedKind: 'standalone-function', start: node.from, end: node.to, text: source.slice(node.from, node.to) },
      ...(node.to < source.length ? [{ kind: 'trivia' as const, start: node.to, end: source.length, text: source.slice(node.to) }] : []),
    ] };
  } catch (error) { return { language: 'python', source, sourceSha256, regions: [], diagnostics: [error instanceof Error ? error.message : String(error)] }; }
}

export function planPythonFunction(preview: SourceImportPreview, fileName: string, entryPolicy: string, mapStart: boolean, unitIndex?: number, signatures?: ReadonlyMap<string, PythonSignature>, classContext?: { units: SyntaxNode[]; fields: NonNullable<ClassImportPlan['fields']>; methods: ReadonlyMap<string, PythonSignature> }): ClassImportPlan {
  if (entryPolicy !== 'library' || mapStart) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Python functions require explicit Library mode.');
  const root = cleanTree(preview.source);
  const units = classContext?.units ?? children(root);
  if (!units.length || units.length > 32 || units.some(unit => unit.name !== 'FunctionDefinition')) throw new ImportFailure('PYTHON_UNIT', 'Only complete ordinary function definitions are supported.');
  if (unitIndex === undefined && units.length > 1) {
    const signatures = new Map<string, PythonSignature>();
    units.forEach((unit, index) => {
      const parts = children(unit), name = preview.source.slice(parts[1]?.from, parts[1]?.to);
      if (parts.length !== 4 || parts[1]?.name !== 'VariableName' || parts[2]?.name !== 'ParamList' || signatures.has(name)) throw new ImportFailure('PYTHON_SIGNATURE', 'Unique plain function signatures are required.', evidence(unit));
      const shape = parameterShape(parts[2]);
      signatures.set(name, { id: `python-function-${index + 1}`, arity: shape.length, minimum: shape.filter(parameter => !parameter.defaultNode && parameter.mode !== 'rest').length, rest: shape.some(parameter => parameter.mode === 'rest'), parameters: shape.map((parameter, index) => ({ id: `python-parameter-${index}`, name: preview.source.slice(parameter.nameNode.from, parameter.nameNode.to), mode: parameter.mode, ...(parameter.defaultNode ? { defaultPin: `default-python-parameter-${index}` } : {}) })) });
    });
    const plans = units.map((_, index) => planPythonFunction(preview, fileName, entryPolicy, mapStart, index, signatures));
    return { ...plans[0], start: 0, end: preview.source.length, selectedSource: preview.source, mappingId: 'python.function-file', methods: plans.flatMap(plan => plan.methods), dependencies: plans.flatMap(plan => plan.dependencies) };
  }
  const unit = units[unitIndex ?? 0], parts = children(unit);
  if (parts.length !== 4 || parts[0].name !== 'def' || parts[1].name !== 'VariableName' || parts[2].name !== 'ParamList' || parts[3].name !== 'Body') throw new ImportFailure('PYTHON_SIGNATURE', 'Decorators, async, annotations and alternate signatures are unsupported.');
  const text = (node: SyntaxNode) => preview.source.slice(node.from, node.to);
  const name = text(parts[1]);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new ImportFailure('PYTHON_NAME', 'This pilot supports ASCII identifiers only; original spans remain UTF-16.');
  const allParameters = parameterShape(parts[2]);
  if (classContext && (text(allParameters[0]?.nameNode) !== 'self' || allParameters[0].defaultNode || allParameters[0].mode !== 'positional')) throw new ImportFailure('PYTHON_RECEIVER', 'Instance methods need an explicit self receiver.');
  const rawParameters = classContext ? allParameters.slice(1) : allParameters;
  if (rawParameters.some(parameter => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(text(parameter.nameNode)) || (classContext && (parameter.defaultNode || parameter.mode !== 'positional' || text(parameter.nameNode) === 'self')))) throw new ImportFailure('PYTHON_PARAMETERS', 'These native signature variants require a separate class mapping.');
  const scopeId = `python-function-${(unitIndex ?? 0) + 1}`;
  const parameters: ParameterPlan[] = rawParameters.map((parameter, index) => ({ id: `python-parameter-${index}`, name: text(parameter.nameNode), scopeId, start: parameter.nameNode.from, end: parameter.defaultNode?.to ?? parameter.nameNode.to, mode: parameter.mode }));
  if (parameters.length > 32 || new Set(parameters.map(parameter => parameter.name)).size !== parameters.length) throw new ImportFailure('PYTHON_PARAMETERS', 'Duplicate or excessive parameters.');
  const dependencies: ClassImportPlan['dependencies'] = [];
  const locals = new Map<string, LocalPlan>();
  signatures ??= new Map([[name, { id: scopeId, arity: parameters.length, minimum: rawParameters.filter(parameter => !parameter.defaultNode && parameter.mode !== 'rest').length, rest: parameters.some(parameter => parameter.mode === 'rest'), parameters: rawParameters.map((parameter, index) => ({ id: parameters[index].id, name: parameters[index].name, mode: parameter.mode, ...(parameter.defaultNode ? { defaultPin: `default-${parameters[index].id}` } : {}) })) }]]);
  const reservedLocals = new Set<string>();
  const collectBindings = (node: SyntaxNode): void => {
    const parts = children(node);
    if (node.name === 'ForStatement' && parts[1]?.name === 'VariableName') reservedLocals.add(text(parts[1]));
    if (node.name === 'AssignStatement' && parts[0]?.name === 'VariableName') reservedLocals.add(text(parts[0]));
    for (const child of parts) collectBindings(child);
  };
  collectBindings(parts[3]);
  const integer = (plan: ExpressionPlan): boolean => plan.kind === 'native' ? (plan.form === 'scalar' && plan.domain === 'python-integer') || (plan.form === 'unary' && integer(plan.operands[0])) : plan.kind === 'literal' ? typeof plan.value === 'number' && Number.isSafeInteger(plan.value) : plan.kind === 'local' ? [...locals.values()].some(local => local.id === plan.localId && local.numberDomain === 'python-integer') : plan.kind === 'binary' && plan.numberDomain === 'python-integer';
  const expression = (node: SyntaxNode, depth = 0): ExpressionPlan => {
    if (depth > 64) throw new ImportFailure('PYTHON_DEPTH', 'Expression exceeds depth limit.');
    const ev = evidence(node), value = text(node);
    const native = (form: import('@vvs/graph-types').NativeExpressionSettings['form'], operands: ExpressionPlan[], extra: Partial<ExpressionPlan & { kind: 'native' }> = {}): ExpressionPlan => ({ ...ev, kind: 'native', language: 'python', form, operands, valueType: 'unknown', ...extra });
    if (node.name === 'UnaryExpression' && children(node).length === 2 && children(node)[1].name === 'Number' && !/^-[1-9][0-9]*$/.test(value)) return native('unary', [expression(children(node)[1], depth + 1)], { operator: text(children(node)[0]), valueType: 'number' });
    if (['ArrayExpression', 'DictionaryExpression', 'TupleExpression', 'SetExpression'].includes(node.name)) {
      const groups: SyntaxNode[][] = [[]];
      for (const child of children(node).filter(child => !['[', ']', '{', '}', '(', ')'].includes(child.name))) {
        if (child.name === ',') groups.push([]); else groups[groups.length - 1].push(child);
      }
      const items = groups.filter(group => group.length).map(group => {
        const itemEvidence = { start: group[0].from, end: group[group.length - 1].to, mappingId: 'python.native-entry', mappingVersion: 1 };
        if (group.length === 2 && ['*', '**'].includes(group[0].name)) return { ...itemEvidence, kind: 'native' as const, language: 'python' as const, form: group[0].name === '**' ? 'dict-spread' as const : 'spread' as const, operands: [expression(group[1], depth + 1)], valueType: 'unknown' as const };
        if (node.name === 'DictionaryExpression' && group.length === 3 && group[1].name === ':') return { ...itemEvidence, kind: 'native' as const, language: 'python' as const, form: 'dict-entry' as const, operands: [expression(group[0], depth + 1), expression(group[2], depth + 1)], valueType: 'unknown' as const };
        if (group.length !== 1 || node.name === 'DictionaryExpression') throw new ImportFailure('PYTHON_COLLECTION_VARIANT', 'Comprehensions and alternate collection entries need separate mappings.', itemEvidence);
        return expression(group[0], depth + 1);
      });
      return native(({ ArrayExpression: 'list', DictionaryExpression: 'dict', TupleExpression: 'tuple', SetExpression: 'set' } as const)[node.name as 'ArrayExpression' | 'DictionaryExpression' | 'TupleExpression' | 'SetExpression'], items);
    }
    if (node.name === 'MemberExpression') {
      const parts = children(node);
      if (parts.length === 4 && parts[1].name === '[') return native('index', [expression(parts[0], depth + 1), expression(parts[2], depth + 1)]);
      if (parts[1]?.name === '[' && parts.some(part => part.name === ':')) {
        const bounds: (SyntaxNode | undefined)[] = [undefined];
        for (const part of parts.slice(2, -1)) {
          if (part.name === ':') bounds.push(undefined);
          else { if (bounds[bounds.length - 1]) throw new ImportFailure('PYTHON_SLICE', 'Multi-dimensional slices need a separate mapping.', ev); bounds[bounds.length - 1] = part; }
        }
        return native('slice', [expression(parts[0], depth + 1), ...bounds.flatMap(bound => bound ? [expression(bound, depth + 1)] : [])], { payload: bounds.map(bound => bound ? '1' : '0').join('') });
      }
      if (parts.length === 3 && parts[1].name === '.' && text(parts[0]) !== 'self') return native('member', [expression(parts[0], depth + 1)], { name: text(parts[2]) });
    }
    if (node.name === 'MemberExpression' && classContext) {
      const parts = children(node), name = parts[2] && text(parts[2]);
      const field = classContext.fields.find(field => field.name === name);
      if (parts.length !== 3 || text(parts[0]) !== 'self' || !field) throw new ImportFailure('PYTHON_FIELD', 'Receiver read requires an inventoried instance field.', ev);
      return { ...ev, kind: 'field', fieldId: field.id, valueType: field.valueType };
    }
    if (node.name === 'CallExpression') {
      const parts = children(node), callee = parts[0] && text(parts[0]);
      if (classContext && parts[0]?.name === 'MemberExpression' && parts[1]?.name === 'ArgList') {
        const receiver = children(parts[0]), signature = classContext.methods.get(text(receiver[2]));
        const args = children(parts[1]).filter(node => !['(', ')', ','].includes(node.name));
        if (text(receiver[0]) !== 'self' || !signature || args.length !== signature.arity) throw new ImportFailure('PYTHON_RECEIVER_CALL', 'Receiver calls require an exact instance method signature.', ev);
        return { ...ev, kind: 'call', functionId: signature.id, args: args.map(argument => expression(argument, depth + 1)), valueType: 'unknown' };
      }
      if (parts.length === 2 && parts[0].name === 'VariableName' && parts[1].name === 'ArgList' && ['str', 'float'].includes(callee) && !reservedLocals.has(callee) && !locals.has(callee) && !parameters.some(parameter => parameter.name === callee) && !signatures?.has(callee)) {
        const args = children(parts[1]).filter(node => !['(', ')', ','].includes(node.name));
        if (args.length !== 1) throw new ImportFailure('PYTHON_CONVERSION_ARITY', 'Explicit conversions require exactly one argument.', ev);
        return { ...ev, kind: 'convert', nodeKind: callee === 'str' ? 'convert_to_string' : 'convert_to_number', value: expression(args[0], depth + 1), valueType: callee === 'str' ? 'string' : 'number' };
      }
      const signature = signatures?.get(callee);
      if (parts.length !== 2 || parts[0].name !== 'VariableName' || parts[1].name !== 'ArgList' || !signature || reservedLocals.has(callee) || locals.has(callee) || parameters.some(parameter => parameter.name === callee)) throw new ImportFailure('PYTHON_CALL_BINDING', 'Calls require an unshadowed same-file function.', ev);
      const groups = parameterGroups(parts[1]);
      const names = groups.map(group => group.length === 3 && group[0].name === 'VariableName' && group[1].name === 'AssignOp' ? text(group[0]) : '');
      if (groups.some((group, index) => names[index] ? group.length !== 3 : group.length !== 1)) throw new ImportFailure('PYTHON_CALL_ARGUMENTS', 'Call unpacking requires a separate explicit binding contract.', ev);
      const arguments_ = groups.map((group, index) => group[names[index] ? 2 : 0]);
      const bindingProblem = signature.parameters ? nativeCallBindingProblem(signature.parameters, arguments_.length, names, 'python') : arguments_.length !== signature.arity || names.some(Boolean) ? 'Only exact positional method arguments are mapped.' : undefined;
      if (bindingProblem) throw new ImportFailure('PYTHON_CALL_ARITY', bindingProblem, ev);
      return { ...ev, kind: 'call', functionId: signature.id, args: arguments_.map(argument => expression(argument, depth + 1)), nativeArguments: signature.minimum !== undefined, ...(names.some(Boolean) ? { nativeArgumentNames: names } : {}), valueType: 'unknown' };

    }
    if (node.name === 'ParenthesizedExpression') {
      const nested = children(node).filter(child => !['(', ')'].includes(child.name));
      if (nested.length !== 1) throw new ImportFailure('PYTHON_EXPRESSION', 'Unsupported parenthesized expression.');
      return expression(nested[0], depth + 1);
    }
    if (node.name === 'VariableName') {
      const local = locals.get(value);
      if (local) return { ...ev, kind: 'local', localId: local.id, scopeId, valueType: local.valueType };
      if (reservedLocals.has(value)) throw new ImportFailure('PYTHON_LOCAL_BEFORE_DECLARATION', 'Function-local binding is read before assignment.', ev);
      const parameter = parameters.find(parameter => parameter.name === value);
      if (!parameter) throw new ImportFailure('PYTHON_CAPTURE', 'Unresolved names and captures are unsupported.', ev);
      dependencies.push({ kind: 'parameter-read', scopeId, symbolId: parameter.id, resolved: true, start: node.from, end: node.to });
      return { ...ev, kind: 'parameter', parameterId: parameter.id, scopeId, valueType: 'unknown' };
    }
    if (node.name === 'UnaryExpression' && /^-[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value))) return { ...ev, kind: 'literal', value: Number(value), valueType: 'number' };
    if (node.name === 'Number' && /^(0|[1-9][0-9]*)$/.test(value) && Number.isSafeInteger(Number(value))) return { ...ev, kind: 'literal', value: Number(value), valueType: 'number' };
    if (node.name === 'Boolean') return { ...ev, kind: 'literal', value: value === 'True', valueType: 'boolean' };
    if (node.name === 'String' && /^(['"])[^\\\r\n]*\1$/.test(value) && !value.slice(1, -1).includes('"') && !value.startsWith("'''" ) && !value.startsWith('"""')) return { ...ev, kind: 'literal', value: value.slice(1, -1), valueType: 'string' };
    if (['Number', 'None', 'String'].includes(node.name) || (node.name === 'UnaryExpression' && children(node).length === 2 && children(node)[1].name === 'Number')) return nativeScalarPlan(value, 'python.3.11', ev);
    if (node.name === 'BinaryExpression') {
      const parts = children(node), operator = parts.slice(1, -1).map(text).join(' ');
      if (parts.length === 3 && ['==', '!=', '<', '<=', '>', '>='].includes(operator)) {
        const left = expression(parts[0], depth + 1), right = expression(parts[2], depth + 1);
        if (left.valueType === 'unknown' || left.valueType !== right.valueType || (!['==', '!='].includes(operator) && left.valueType === 'boolean')) return native('binary', [left, right], { operator, valueType: 'boolean' });
        return { ...ev, kind: 'compare', operator: operator as '==' | '!=' | '<' | '<=' | '>' | '>=', mode: left.valueType, left, right, valueType: 'boolean' };
      }
      if (![3, 4].includes(parts.length) || (parts.length === 4 && !['is not', 'not in'].includes(operator)) || !NATIVE_OPERATORS.python.includes(operator)) throw new ImportFailure('PYTHON_OPERATOR', 'This operator requires a separate control/effect mapping.', ev);
      const left = expression(parts[0], depth + 1), right = expression(parts[parts.length - 1], depth + 1);
      if (!['+', '-', '*'].includes(operator) || left.valueType !== 'number' || right.valueType !== 'number' || !integer(left) || !integer(right)) return native('binary', [left, right], { operator, valueType: ['in', 'not in', 'is', 'is not'].includes(operator) ? 'boolean' : left.valueType === 'number' && right.valueType === 'number' ? 'number' : 'unknown' });
      const plan: ExpressionPlan = { ...ev, kind: 'binary', nodeKind: ({ '+': 'math_add', '-': 'math_subtract', '*': 'math_multiply' } as Record<string, string>)[operator], operator: operator as '+' | '-' | '*', left, right, valueType: 'number' };
      if (!integer(left) || !integer(right)) throw new ImportFailure('PYTHON_INTEGER_DOMAIN', 'Arithmetic requires native Python integer operands, not float or unknown Number values.', ev);
      plan.numberDomain = 'python-integer'; return plan;
    }
    throw new ImportFailure('PYTHON_EXPRESSION', `Unsupported expression ${node.name}.`, ev);
  };
  // Defaults execute in the enclosing definition scope, never the function's parameter scope.
  const defaultIsClosed = (plan: ExpressionPlan): boolean => plan.kind === 'literal' || (plan.kind === 'native' && plan.operands.every(defaultIsClosed)) || (plan.kind === 'binary' && defaultIsClosed(plan.left) && defaultIsClosed(plan.right));
  for (const [index, parameter] of rawParameters.entries()) if (parameter.defaultNode) {
    const value = expression(parameter.defaultNode);
    if (!defaultIsClosed(value)) throw new ImportFailure('PYTHON_DEFAULT_SCOPE', 'Default binding/effects require an enclosing definition-scope mapping.', evidence(parameter.defaultNode));
    parameters[index].default = value;
  }
  const completes = (plan: StatementPlan): boolean => plan.kind === 'return' || plan.kind === 'break' || plan.kind === 'continue' || (plan.kind === 'sequence' && completes(plan.statements[plan.statements.length - 1])) || (plan.kind === 'branch' && !!plan.alternate && completes(plan.consequent) && completes(plan.alternate));
  const body = (node: SyntaxNode, depth = 0, loopStart?: number): StatementPlan => {
    if (depth > 64) throw new ImportFailure('PYTHON_DEPTH', 'Control flow exceeds depth limit.');
    const statements = children(node).filter(child => child.name !== ':');
    if (!statements.length) throw new ImportFailure('PYTHON_BODY', 'An explicit terminal return or if/else is required.');
    const plans: StatementPlan[] = [];
    for (const statement of statements) {
      if (plans.length && completes(plans[plans.length - 1])) throw new ImportFailure('PYTHON_UNREACHABLE', 'Statements after an unconditional completion require an explicit mapping.', evidence(statement));
      const parts = children(statement), ev = evidence(statement);
      if (statement.name === 'BreakStatement' || statement.name === 'ContinueStatement') {
        if (loopStart === undefined) throw new ImportFailure('PYTHON_LOOP_TARGET', 'Loop control requires an enclosing loop.', ev);
        plans.push({ ...ev, kind: statement.name === 'BreakStatement' ? 'break' : 'continue', loopStart }); continue;
      }
      if (classContext && statement.name === 'AssignStatement' && parts.length === 3 && parts[0].name === 'MemberExpression' && text(parts[1]) === '=') {
        const receiver = children(parts[0]), field = classContext.fields.find(field => field.name === text(receiver[2]));
        if (text(receiver[0]) !== 'self' || !field) throw new ImportFailure('PYTHON_FIELD', 'Assignment requires an inventoried instance field.', ev);
        plans.push({ ...ev, kind: 'assign', localId: field.id, value: expression(parts[2]) }); continue;
      }
      if (statement.name === 'AssignStatement' && parts.length === 3 && parts[0].name === 'VariableName' && parts[1].name === 'AssignOp' && text(parts[1]) === '=') {
        const name = text(parts[0]);
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || (classContext && name === 'self') || parameters.some(parameter => parameter.name === name) || signatures?.has(name)) throw new ImportFailure('PYTHON_LOCAL_BINDING', 'Parameter/function shadowing and non-ASCII bindings need a separate mapping.', ev);
        const value = expression(parts[2]);
        const local = locals.get(name);
        if (local) {
          if (local.valueType !== value.valueType) throw new ImportFailure('PYTHON_LOCAL_TYPE_CHANGE', 'Changing local value types needs a reviewed mapping.', ev);
          plans.push({ ...ev, kind: 'assign', localId: local.id, value });
        } else {
          const local: LocalPlan = { ...ev, id: `${scopeId}-local-${ev.start}`, name, scopeId, valueType: value.valueType, declarationKind: 'assignment', ...(integer(value) ? { numberDomain: 'python-integer' as const } : {}) };
          locals.set(name, local); plans.push({ ...ev, kind: 'declare', local, value });
        }
        continue;
      }
      if (statement.name === 'ExpressionStatement' && parts.length === 1 && parts[0].name === 'CallExpression') {
        const call = expression(parts[0]);
        if (call.kind !== 'call') throw new ImportFailure('PYTHON_CALL_BINDING', 'An explicit resolved call is required.', ev);
        plans.push({ ...ev, kind: 'call', call }); continue;
      }
      if (statement.name === 'ReturnStatement' && parts.length === 2) plans.push({ ...ev, kind: 'return', value: expression(parts[1]) });
      else if (statement.name === 'IfStatement' && (parts.length === 3 || (parts.length === 5 && parts[3].name === 'else')) && parts[0].name === 'if') {
        const condition = expression(parts[1]);
        if (condition.valueType !== 'boolean') throw new ImportFailure('PYTHON_TRUTHINESS', 'The condition must have a proven Boolean value; implicit truthiness needs a separate mapping.', evidence(parts[1]));
        plans.push({ ...ev, kind: 'branch', condition, consequent: body(parts[2], depth + 1, loopStart), ...(parts[4] ? { alternate: body(parts[4], depth + 1, loopStart) } : {}) });
      }
      else if (statement.name === 'ForStatement' && parts.length === 5 && parts[1].name === 'VariableName' && parts[3].name === 'CallExpression') {
        const rangeParts = children(parts[3]), callee = text(rangeParts[0]);
        const name = text(parts[1]);
        if (callee !== 'range' || reservedLocals.has('range') || parameters.some(parameter => parameter.name === 'range' || parameter.name === name) || signatures?.has('range') || locals.has(name)) throw new ImportFailure('PYTHON_RANGE_BINDING', 'Range loops require an unshadowed native range and a fresh index binding.', ev);
        const args = children(rangeParts[1]).filter(node => !['(', ')', ','].includes(node.name)).map(node => expression(node));
        if (args.length < 1 || args.length > 3 || args.some(argument => !integer(argument)) || (args[2]?.kind === 'literal' && args[2].value === 0)) throw new ImportFailure('PYTHON_RANGE_ARGUMENTS', 'Range requires one to three native integer arguments and a nonzero literal step.', ev);
        const local: LocalPlan = { ...evidence(parts[1]), id: `${scopeId}-range-${ev.start}`, name, scopeId, valueType: 'number', numberDomain: 'python-integer', declarationKind: 'assignment', nestedScope: true };
        locals.set(name, local);
        const nestedBody = body(parts[4], depth + 1, ev.start);
        locals.delete(name);
        plans.push({ ...ev, kind: 'range', local, args, body: nestedBody });
      }
      else if (statement.name === 'WhileStatement' && parts.length === 3 && parts[0].name === 'while') {
        const condition = expression(parts[1]);
        if (condition.valueType !== 'boolean') throw new ImportFailure('PYTHON_LOOP_CONDITION', 'While requires a pure proven Boolean condition.', ev);
        plans.push({ ...ev, kind: 'while', condition, body: body(parts[2], depth + 1, ev.start) });
      }
      else throw new ImportFailure('PYTHON_CONTROL', 'Only terminal Boolean-literal if/else is supported.', ev);
    }
    const last = plans[plans.length - 1];
    if (depth === 0 && !(classContext && name === '__init__') && !completes(last)) throw new ImportFailure('PYTHON_BODY', 'An explicit terminal return or complete if/else is required.');
    return plans.length === 1 ? plans[0] : { ...evidence(node), kind: 'sequence', statements: plans };
  };
  const statement = body(parts[3]);
  return { ...evidence(unit), version: 1, context: { language: 'python', version: '3.11', sourceMode: 'module', environment: 'none' }, name, fileName, source: preview.source, sourceSha256: preview.sourceSha256, selectedSource: text(unit), entryPolicy: 'library', unitKind: 'standalone-function', dependencies,
    methods: [{ ...evidence(unit), id: scopeId, name, scopeId, isStatic: false, role: classContext && name === '__init__' ? 'constructor' : 'method', parameters, body: statement }] };
}
/** Constructor-owned instance fields are indexed by visible Declare nodes; initialization stays in the constructor body. */
export function planPythonClass(preview: SourceImportPreview, fileName: string, entryPolicy: string, mapStart: boolean): ClassImportPlan {
  if (entryPolicy !== 'library' || mapStart) throw new ImportFailure('LIBRARY_POLICY_REQUIRED', 'Python classes currently require Library mode.');
  const units = children(cleanTree(preview.source));
  const cls = units[0], parts = cls && children(cls);
  if (units.length !== 1 || cls.name !== 'ClassDefinition' || parts.length !== 3 || parts[1].name !== 'VariableName') throw new ImportFailure('PYTHON_CLASS', 'Only one plain class with resolved instance methods is supported.');
  const text = (node: SyntaxNode) => preview.source.slice(node.from, node.to);
  const methods = children(parts[2]).filter(node => node.name !== ':');
  if (!methods.length || methods.some(node => node.name !== 'FunctionDefinition')) throw new ImportFailure('PYTHON_CLASS_MEMBER', 'Class attributes, decorators and alternate members need explicit mappings.');
  const signatures = new Map<string, PythonSignature>();
  const fields: NonNullable<ClassImportPlan['fields']> = [];
  methods.forEach((method, index) => {
    const parts = children(method), name = text(parts[1]);
    if (signatures.has(name)) throw new ImportFailure('DUPLICATE_BINDING', 'Duplicate Python method name.');
    signatures.set(name, { id: `python-function-${index + 1}`, arity: children(parts[2]).filter(node => node.name === 'VariableName').length - 1 });
    if (name === '__init__') for (const statement of children(parts[3])) {
      const parts = children(statement);
      if (statement.name === 'AssignStatement' && parts[0]?.name === 'MemberExpression') {
        const receiver = children(parts[0]);
        if (receiver.length !== 3 || text(receiver[0]) !== 'self' || text(parts[1]) !== '=') throw new ImportFailure('PYTHON_FIELD', 'Fields must initialize through explicit self.name assignment.');
        const name = text(receiver[2]);
        if (!fields.some(field => field.name === name)) fields.push({ ...evidence(statement), id: `python-field-${fields.length}`, name, isStatic: false, valueType: 'unknown' });
      }
    }
  });
  const plans = methods.map((_, index) => planPythonFunction(preview, fileName, entryPolicy, mapStart, index, new Map(), { units: methods, fields, methods: signatures }));
  return { ...plans[0], ...evidence(cls), mappingId: 'python.class', name: text(parts[1]), selectedSource: preview.source, start: 0, end: preview.source.length, unitKind: undefined, fields, methods: plans.flatMap(plan => plan.methods), dependencies: plans.flatMap(plan => plan.dependencies) };
}

/** Independent generated-tree shape comparison; generated declaration comments are trivia. */
export function normalizedPythonSyntax(source: string): string {
  const root = cleanTree(source, true);
  const project = (node: SyntaxNode): unknown => {
    if (node.name === 'Comment') return undefined;
    if (node.name === 'ParenthesizedExpression') return project(children(node).filter(child => !['(', ')'].includes(child.name))[0]);
    const nodes = children(node).map(project).filter(value => value !== undefined);
    if (node.name === 'String') return ['String', decodePythonString(source.slice(node.from, node.to))];
    if (node.name === 'Number') { const scalar = pythonNumericScalar(source.slice(node.from, node.to)); return scalar ? ['Number', scalar.domain, scalar.payload] : ['Number', source.slice(node.from, node.to)]; }
    return nodes.length ? [node.name, nodes] : [node.name, source.slice(node.from, node.to)];
  };
  return JSON.stringify(project(root));
}
