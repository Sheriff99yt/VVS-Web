import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';
import { goFloatLiteral } from './goRationalSemantics';
import { goIntegerLiteral, type GoWordBits } from './goIntegerSemantics';
import { goValueAssignable, goValueConvert, goValueBinary, goValueUnary, goValueDefault, goValueConstant, goValueCompare, goValuePinType, goValuesComparable, isGoIntegerValue, type GoValueFact } from './goValueSemantics';
import { nativeExpressionSettings } from './nativeExpressions';
import { nativeSignature, GO_ASSIGN_OPERATORS, GO_SCALAR_PINS, type GoScalarType } from './nativeSignatures';

/** Numeric pin shape never proves Go native type identity. Validate the generated body. */
export function validateGoScalarBindings(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const definitions = Object.values(input.documents).flatMap(document => document.nodes).filter(node => node.data.kindId === 'function_implement' && node.data.properties?.nativeSignatureLanguage === 'go');
  const definitionFor = (id: unknown) => definitions.find(node => node.data.graphBinding?.symbolId === id);
  for (const [tabId, doc] of Object.entries(input.documents)) {
    if ((doc.metadata?.targetLanguage ?? input.targetLanguage) !== 'go') continue;
    const fn = input.functions.find(fn => fn.overloads.some(overload => overload.graphTabId === tabId));
    const definition = definitionFor(fn?.id); if (!definition) continue;
    const owningFile = Object.values(input.documents).find(document => document.nodes.some(node => node.id === definition.id));
    const packageNode = owningFile?.nodes.find(node => node.data.kindId === 'source_package');
    const context = packageNode?.data.properties?.goWordBits;
    const wordBits = Number(context ?? 64) as GoWordBits;
    const signature = nativeSignature(definition.data) ?? [];
    const localType = (id: unknown) => doc.nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.symbolId === id)?.data.properties?.nativeType as GoScalarType | undefined;
    const scalar = (value: unknown): GoScalarType | undefined => typeof value === 'string' && Object.hasOwn(GO_SCALAR_PINS, value) ? value as GoScalarType : undefined;
    const infer = (id: string, handle: string | null | undefined, seen = new Set<string>()): GoValueFact => {
      if (seen.has(id) || seen.size >= 64) throw new Error('NATIVE_GO_EVIDENCE_CYCLE: Numeric evidence must be acyclic and within its depth budget.'); seen.add(id);
      const node = doc.nodes.find(node => node.id === id); if (!node) return { type: 'unknown' };
      if (node.data.kindId === 'expr_compare') return goValueCompare(String(node.data.properties?.operator), operand(id, 'a', new Set(seen)), operand(id, 'b', new Set(seen)), wordBits);
      if (node.data.kindId === 'function_entry') return { type: scalar(signature.find(parameter => parameter.id === handle)?.nativeType) ?? 'unknown' };
      if (node.data.kindId === 'variable_get') {
        const declaration = doc.nodes.find(candidate => candidate.data.kindId === 'var_define' && candidate.data.properties?.symbolId === node.data.graphBinding?.symbolId);
        if (declaration?.data.properties?.nativeLocalStyle === 'go-const') {
          if (seen.has(declaration.id)) throw new Error('NATIVE_GO_CONSTANT_CYCLE');
          seen.add(declaration.id);
          const target = declaration.data.properties.nativeType === 'untyped' ? 'untyped' : scalar(declaration.data.properties.nativeType);
          if (!target) throw new Error('NATIVE_GO_CONSTANT_TYPE');
          return goValueConstant(operand(declaration.id, 'value', seen), target, wordBits);
        }
        return { type: scalar(localType(node.data.graphBinding?.symbolId)) ?? 'unknown' };
      }
      if (node.data.kindId === 'vvs.project.call_function') return { type: scalar(definitionFor(node.data.graphBinding?.symbolId)?.data.properties?.nativeReturnType) ?? 'unknown' };
      if (['math_add', 'math_subtract', 'math_multiply', 'math_divide'].includes(node.data.kindId ?? '')) {
        const operands = ['a', 'b'].map(pin => operand(id, pin, new Set(seen)));
        return goValueBinary(({ math_add: '+', math_subtract: '-', math_multiply: '*', math_divide: '/' } as Record<string, string>)[node.data.kindId!], operands[0], operands[1], wordBits);
      }
      if (node.data.properties?.nativeLanguage === 'go') {
        const settings = nativeExpressionSettings(node.data);
        if (settings.form === 'scalar') return settings.domain === 'go-float' ? goFloatLiteral(settings.payload) : goIntegerLiteral(settings.payload);
        const values = node.data.inputs.map(pin => operand(id, pin.id, new Set(seen)));
        if (['&&', '||'].includes(settings.operator)) {
          const containsCall = (id: string, visited = new Set<string>()): boolean => {
            if (visited.has(id)) return false; visited.add(id);
            const call = doc.nodes.find(candidate => candidate.id === id);
            if (call?.data.kindId === 'vvs.project.call_function' && call.data.properties?.callPlacement !== 'expression') return true;
            return doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution').some(edge => containsCall(edge.source, visited));
          };
          if (doc.edges.filter(edge => edge.target === id && edge.targetHandle === 'operand-1').some(edge => containsCall(edge.source))) throw new Error('NATIVE_GO_SHORT_CIRCUIT_CALL');
        }
        if (settings.domain === 'go-integer' && !values.every(isGoIntegerValue)) throw new Error('NATIVE_GO_INTEGER_OPERAND: Native integer operator operands require integer evidence.');
        if (settings.form === 'conversion') {
          if (signature.some(parameter => parameter.name === settings.targetType) || owningFile?.nodes.some(owner => owner.data.kindId === 'function_implement' && input.functions.some(fn => fn.id === owner.data.graphBinding?.symbolId && fn.name === settings.targetType))) throw new Error('NATIVE_GO_CONVERSION_SHADOWED: A numeric type conversion cannot resolve to a parameter or function binding.');
          return goValueConvert(values[0], settings.targetType as GoScalarType, wordBits);
        }
        const result = settings.form === 'unary' ? goValueUnary(settings.operator, values[0], wordBits) : goValueBinary(settings.operator, values[0], values[1], wordBits);
        if (goValuePinType(result) !== node.data.outputs[0]?.type) throw new Error('NATIVE_GO_OPERATOR_DOMAIN');
        return result;
      }
      return { type: 'unknown' };
    };
    const operand = (id: string, pin: string, seen = new Set<string>()): GoValueFact => {
      const edges = doc.edges.filter(edge => edge.target === id && edge.targetHandle === pin);
      if (edges.length) return edges.length === 1 ? infer(edges[0].source, edges[0].sourceHandle, seen) : { type: 'unknown' };
      const value = doc.nodes.find(node => node.id === id)?.data.inlineValues?.[pin];
      return { ...(typeof value === 'number' && Number.isFinite(value) ? { constant: String(value) } : {}), ...(typeof value === 'boolean' || typeof value === 'string' ? { constant: String(value) } : {}), type: typeof value === 'number' && Number.isFinite(value) ? 'inline-number' : typeof value === 'string' ? 'untyped-string' : typeof value === 'boolean' ? 'untyped-bool' : 'unknown' };
    };
    for (const node of doc.nodes) {
      const error = (message: string) => diagnostics.push({ level: 'error', source: 'semantic', code: 'NATIVE_GO_SCALAR_BINDING', message, tabId, nodeId: node.id });
      const check = (pin: string, type: unknown) => { const target = scalar(type); if (!target || !goValueAssignable(operand(node.id, pin), target, wordBits)) error('Go values must match their native type and constant representability.'); };
      try {
      if ((context !== undefined && !['32', '64'].includes(context as string)) || (context === undefined && (['int', 'uint', 'uintptr'].includes(String(definition.data.properties?.nativeReturnType)) || signature.some(parameter => ['int', 'uint', 'uintptr'].includes(parameter.nativeType ?? '')) || doc.nodes.some(candidate => candidate.data.properties?.nativeLanguage === 'go' || ['int', 'uint', 'uintptr'].includes(String(candidate.data.properties?.nativeType)))))) throw new Error('NATIVE_GO_WORD_SIZE: Integer tokens/default inference and word-sized types require visible 32/64-bit package context.');
      if (node.data.kindId === 'var_define' && node.data.properties?.nativeLocalStyle === 'go-const') {
        const target = node.data.properties.nativeType === 'untyped' ? 'untyped' : scalar(node.data.properties.nativeType);
        if (!target) throw new Error('NATIVE_GO_CONSTANT_TYPE');
        const value = goValueConstant(operand(node.id, 'value', new Set([node.id])), target, wordBits);
        if (goValuePinType(value) !== node.data.inputs.find(pin => pin.id === 'value')?.type) throw new Error('NATIVE_GO_CONSTANT_PIN');
      } else if (node.data.kindId === 'var_define') { check('value', node.data.properties?.nativeType); if (node.data.properties?.nativeLocalStyle === 'go-short' && !goValueAssignable(goValueDefault(operand(node.id, 'value'), wordBits), scalar(node.data.properties?.nativeType)!, wordBits)) error('Go short declaration must retain the native inferred type.'); }
      if (node.data.kindId === 'variable_set' && doc.nodes.some(declaration => declaration.data.kindId === 'var_define' && declaration.data.properties?.symbolId === node.data.graphBinding?.symbolId && declaration.data.properties?.nativeLocalStyle === 'go-const')) throw new Error('NATIVE_GO_CONSTANT_ASSIGNMENT');
      if (node.data.kindId === 'variable_set' && node.data.inputs.some(pin => pin.id === 'val') && !['<<=', '>>='].includes(String(node.data.properties?.assignmentOperator))) check('val', localType(node.data.graphBinding?.symbolId));
      if (node.data.kindId === 'flow_return' && definition.data.properties?.nativeReturnType !== 'void') for (const pin of node.data.inputs.filter(pin => pin.type !== 'execution')) check(pin.id, definition.data.properties?.nativeReturnType);
      if (node.data.kindId === 'vvs.project.call_function') {
        const parameters = nativeSignature(definitionFor(node.data.graphBinding?.symbolId)?.data ?? { label: '', category: '', inputs: [], outputs: [], inlineValues: {} }) ?? [];
        parameters.forEach((parameter, index) => check(node.data.properties?.nativeArgumentCount === undefined ? parameter.id : `arg-${index}`, parameter.nativeType));
      }
      if (['math_add', 'math_subtract', 'math_multiply', 'math_divide', 'expr_compare'].includes(node.data.kindId ?? '')) {
        const left = operand(node.id, 'a'), right = operand(node.id, 'b');
        if (node.data.kindId === 'expr_compare') { if (!goValuesComparable(left, right, wordBits)) error('Go comparison operands require native type compatibility.'); } else infer(node.id, 'result');
      }
      if (node.data.properties?.nativeLanguage === 'go') infer(node.id, 'result');
      if (node.data.kindId === 'variable_set' && GO_ASSIGN_OPERATORS.filter(operator => !['=', '++', '--'].includes(operator)).includes(node.data.properties?.assignmentOperator as typeof GO_ASSIGN_OPERATORS[number])) goValueBinary(String(node.data.properties?.assignmentOperator).slice(0, -1), { type: scalar(localType(node.data.graphBinding?.symbolId)) ?? 'unknown' }, operand(node.id, 'val'), wordBits);
      } catch (problem) { error(problem instanceof Error ? problem.message : 'Invalid native Go numeric evidence.'); }
    }
  }
  return diagnostics;
}
