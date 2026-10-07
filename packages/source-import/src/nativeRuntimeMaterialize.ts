import { analyzeNativeRuntimeGraph, analyzeNativeConstantGraph, nativeScalarSignaturePin, canonicalNativeScalarSignatureType, type GraphDocument, type NativeRuntimeGraphContext } from '@vvs/graph-types';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
import type { NativeScalarSourceExpression as NativeRuntimeSourceTree } from './nativeScalarSourceExpression';
import { ImportFailure } from './contracts';

/** Build visible constructs from a source-owned tree; context and graph are rechecked. */
export function materializeNativeRuntimeExpression(tree: NativeRuntimeSourceTree, language: NativeInventoryLanguage, entryDocument: GraphDocument, context: NativeRuntimeGraphContext, sourceSha256: string, prefix = 'native-runtime') {
  const doc = structuredClone(entryDocument);
  const active = new Set<object>();
  const fail = (node: NativeRuntimeSourceTree, code: string): never => { throw new ImportFailure(`NATIVE_RUNTIME_MATERIALIZE_${code}`, 'This expression needs its visible native source/graph contract.', node); };
  if (!/^[a-f0-9]{64}$/.test(sourceSha256) || !/^[A-Za-z0-9_-]{1,100}$/.test(prefix)) fail(tree, 'IDENTITY');
  const entry = doc.nodes.find(node => node.id === context.entryId);
  const expected = [['exec_out', 'execution'], ...context.parameters.map(p => [p.id, nativeScalarSignaturePin(p.nativeType, language)])];
  if (!entry || entry.data.kindId !== 'function_entry' || !context.symbolId || entry.data.graphBinding?.symbolId !== context.symbolId || entry.data.graphBinding?.kind !== 'call_function'
    || entry.data.properties?.nativeSignatureLanguage !== language || entry.data.inputs.length || Object.keys(entry.data.inlineValues ?? {}).length
    || new Set(context.parameters.map(p => p.id)).size !== context.parameters.length
    || context.parameters.some(p => canonicalNativeScalarSignatureType(p.authoredType, language) !== p.nativeType)
    || JSON.stringify(entry.data.outputs.map(p => [p.id, p.type])) !== JSON.stringify(expected)) fail(tree, 'ENTRY_CONTEXT');
  const domain = (node: NativeRuntimeSourceTree): 'native-integer' | 'native-bool' => {
    if (node.kind === 'parameter' || node.kind === 'local' || node.kind === 'convert') return node.nativeType === 'bool' ? 'native-bool' : 'native-integer';
    if (node.kind === 'literal') return ['true', 'false'].includes(node.token) ? 'native-bool' : 'native-integer';
    if (node.kind === 'group') return domain(node.operand);
    if (node.kind === 'unary') return node.operator === '!' && (language !== 'rust' || domain(node.operand) === 'native-bool') ? 'native-bool' : 'native-integer';
    return ['==', '!=', '<', '<=', '>', '>=', '&&', '||', 'and', 'or'].includes(node.operator) || language === 'rust' && ['&', '|', '^'].includes(node.operator) && domain(node.left) === 'native-bool' && domain(node.right) === 'native-bool' ? 'native-bool' : 'native-integer';
  };
  const origin = (node: NativeRuntimeSourceTree) => ({ start: node.start, end: node.end, sourceSha256, mappingId: `${language}.runtime-scalar`, mappingVersion: 1 });
  const add = (node: NativeRuntimeSourceTree, depth: number): { id: string; handle: string } => {
    if (depth > 128 || doc.nodes.length >= 4096 || active.has(node)) return fail(node, 'BUDGET_OR_CYCLE');
    if (node.kind === 'parameter') {
      const parameter = context.parameters[node.slot];
      if (!parameter || parameter.nativeType !== node.nativeType) return fail(node, 'PARAMETER_SLOT');
      return { id: context.entryId, handle: parameter.id };
    }
    if (node.kind === 'local') {
      const binding = context.locals?.find(binding => binding.id === node.bindingId);
      if (!binding || binding.nativeType !== node.nativeType) return fail(node, 'LOCAL_BINDING');
      const id = `${prefix}-${doc.nodes.length}`;
      if (doc.nodes.some(item => item.id === id)) return fail(node, 'ID_COLLISION');
      doc.nodes.push({ id, type: 'vvs_standard_node', position: { x: doc.nodes.length * 260, y: 180 }, data: {
        label: `Get ${binding.name}`, category: 'Variables', kindId: 'variable_get', inputs: [], outputs: [{ id: 'val', label: 'Value', type: nativeScalarSignaturePin(binding.nativeType, language)! }], inlineValues: {},
        graphBinding: { kind: 'variable_ref', symbolId: binding.id }, properties: { symbolId: binding.id, name: binding.name, variableName: binding.name, sourceOrigin: origin(node) },
      } });
      return { id, handle: 'val' };
    }
    if (language === 'gdscript' && node.kind === 'unary' && node.operator === '!' && node.spelling !== 'not') return fail(node, 'OPERATOR_SPELLING');
    if (node.kind === 'convert' && node.spelling !== node.nativeType) return fail(node, 'CONVERSION_SPELLING');
    active.add(node);
    try {
      const operands = node.kind === 'binary' ? [node.left, node.right] : node.kind === 'literal' ? [] : [node.operand];
      const inputs = operands.map(child => add(child, depth + 1));
      const id = `${prefix}-${doc.nodes.length}`;
      if (doc.nodes.some(item => item.id === id)) return fail(node, 'ID_COLLISION');
      const nativeDomain = domain(node);
      const nativeForm = node.kind === 'literal' ? 'scalar' : node.kind === 'group' ? 'parentheses' : node.kind === 'convert' ? 'conversion' : node.kind;
      doc.nodes.push({ id, type: 'vvs_standard_node', position: { x: doc.nodes.length * 260, y: 180 }, data: {
        label: nativeForm, category: 'Native Values', kindId: node.kind === 'literal' ? 'expr_native_literal' : 'expr_native_operator',
        inputs: inputs.map((_, i) => ({ id: `operand-${i}`, label: `Operand ${i + 1}`, type: 'data_any', required: true })),
        outputs: [{ id: 'result', label: 'Result', type: nativeDomain === 'native-bool' ? 'data_boolean' : 'data_number' }], inlineValues: {},
        properties: { nativeLanguage: language, nativeForm, nativeDomain, operandCount: inputs.length, sourceOrigin: origin(node),
          ...(node.kind === 'literal' ? { payload: node.token } : {}), ...(node.kind === 'convert' ? { nativeTargetType: node.nativeType } : {}), ...('operator' in node ? { operator: node.operator } : {}) },
      } });
      inputs.forEach((input, index) => {
        const pinType = doc.nodes.find(item => item.id === input.id)?.data.outputs.find(pin => pin.id === input.handle)?.type;
        if (!pinType || pinType === 'execution') return fail(operands[index], 'OPERAND_PORT');
        const edgeId = `${prefix}-edge-${doc.edges.length}`;
        if (doc.edges.some(edge => edge.id === edgeId)) return fail(node, 'ID_COLLISION');
        doc.edges.push({ id: edgeId, source: input.id, sourceHandle: input.handle, target: id, targetHandle: `operand-${index}`, data: { pinType }, sourceOrigin: origin(operands[index]) });
      });
      return { id, handle: 'result' };
    } finally { active.delete(node); }
  };
  const root = add(tree, 0);
  if (root.id === context.entryId) {
    const parameter = context.parameters.find(parameter => parameter.id === root.handle)!;
    if (!nativeScalarSignaturePin(parameter.nativeType, language)) fail(tree, 'PARAMETER_TYPE');
    return { document: doc, rootId: root.id, rootHandle: root.handle, graphAdmission: 'blocked' as const };
  }
  const dynamic = (node: NativeRuntimeSourceTree): boolean => node.kind === 'parameter' || node.kind === 'local' || (node.kind === 'binary' ? dynamic(node.left) || dynamic(node.right) : node.kind === 'literal' ? false : dynamic(node.operand));
  if (dynamic(tree)) analyzeNativeRuntimeGraph(doc, root.id, language, context);
  else analyzeNativeConstantGraph(doc, root.id, language, context.returnType);
  return { document: doc, rootId: root.id, rootHandle: root.handle, graphAdmission: 'blocked' as const };
}
