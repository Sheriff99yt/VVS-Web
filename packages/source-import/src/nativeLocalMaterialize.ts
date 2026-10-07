import { analyzeNativeScalarFunctionGraph, nativeScalarLocalBinding, nativeScalarSignaturePin, type GraphDocument, type GraphNode, type NativeRuntimeGraphContext, type NativeScalarLocalBinding, type VVSNodeData, type VariableSymbol } from '@vvs/graph-types';
import type { NativeInventoryLanguage } from './nativeSyntaxInventory';
import type { NativeLocalSourceStatement } from './nativeLocalSourceBodies';
import type { NativeScalarSourceExpression } from './nativeScalarSourceExpression';
import { materializeNativeRuntimeExpression } from './nativeRuntimeMaterialize';
import { ImportFailure, type SourceSpan } from './contracts';

/** Atomic body construction; no worker receipt or project/lifecycle certification. */
export function materializeNativeLocalBody(statements: readonly NativeLocalSourceStatement[], language: NativeInventoryLanguage, entryDocument: GraphDocument, definition: VVSNodeData, context: NativeRuntimeGraphContext, sourceSha256: string, classId: string, groupedDeclarations = false, inferredDeclarations = false) {
  let doc = structuredClone(entryDocument);
  const fail = (at: SourceSpan, code: string): never => { throw new ImportFailure(`NATIVE_LOCAL_MATERIALIZE_${code}`, 'This body needs its visible native declaration/read/write contract.', at); };
  if (!statements.length || !/^[a-f0-9]{64}$/.test(sourceSha256) || doc.nodes.length !== 1 || doc.nodes[0].id !== context.entryId || doc.edges.length) fail(statements[0] ?? { start: 0, end: 0 }, 'ENTRY_DOCUMENT');
  const locals: Readonly<NativeScalarLocalBinding>[] = [], variables: VariableSymbol[] = [];
  const identities = new Map<string, string>(), groups = new Set<string>();
  const origin = (at: SourceSpan) => ({ ...at, sourceSha256, mappingId: `${language}.local-scalar`, mappingVersion: 1 });
  let previous = context.entryId;
  const remap = (tree: NativeScalarSourceExpression): NativeScalarSourceExpression => {
    if (tree.kind === 'local') {
      const bindingId = identities.get(tree.bindingId);
      if (!bindingId) return fail(tree, 'LOCAL_SOURCE_OWNER');
      return Object.freeze({ ...tree, bindingId });
    }
    if (tree.kind === 'binary') return Object.freeze({ ...tree, left: remap(tree.left), right: remap(tree.right) });
    if (tree.kind !== 'literal' && tree.kind !== 'parameter') return Object.freeze({ ...tree, operand: remap(tree.operand) });
    return tree;
  };
  for (const [index, statement] of statements.entries()) {
    if (statement.kind === 'declaration' && statement.inferenceMode && !inferredDeclarations) fail(statement, 'INFERRED_DECLARATION_MAPPING_REQUIRED');
    const sameGroup = (other: NativeLocalSourceStatement) => statement.kind === 'declaration' && other.kind === 'declaration'
      && other.declarationGroup.start === statement.declarationGroup.start && other.declarationGroup.end === statement.declarationGroup.end;
    const siblings = statement.kind === 'declaration' ? statements.filter(sameGroup) : [];
    const grouped = siblings.length > 1;
    const groupId = grouped ? `${context.symbolId}-declaration-group-${statements.findIndex(sameGroup)}` : undefined;
    let flowHandle = 'exec_out';
    if (grouped && (!groupedDeclarations || language !== 'cpp')) fail(statement, 'DECLARATION_GROUP_MAPPING_REQUIRED');
    if (grouped && siblings[0] === statement) {
      const declaration = statement as Extract<NativeLocalSourceStatement, { kind: 'declaration' }>;
      const group: GraphNode = { id: groupId!, type: 'vvs_standard_node', position: { x: (doc.nodes.length + 1) * 260, y: 0 }, data: {
        kindId: 'native_declaration_group', label: 'Declaration Group', category: 'Variables', inlineValues: {},
        inputs: [{ id: 'exec_in', label: '', type: 'execution' }], outputs: [{ id: 'declarations_exec', label: 'Declarators', type: 'execution' }, { id: 'exec_out', label: '', type: 'execution' }],
        properties: { nativeLocalLanguage: language, nativeOwnerId: context.symbolId, nativeType: declaration.nativeType, nativeAuthoredType: declaration.authoredType, ...(declaration.inferenceMode ? { nativeInferenceMode: declaration.inferenceMode } : {}), nativeMutable: declaration.binding.mutable, sourceOrigin: origin(declaration.declarationGroup) } } };
      doc.nodes.push(group); doc.edges.push({ id: `${groupId}-flow`, source: previous, sourceHandle: 'exec_out', target: groupId!, targetHandle: 'exec_in', data: { pinType: 'execution' }, sourceOrigin: origin(declaration.declarationGroup) });
      previous = groupId!; flowHandle = 'declarations_exec';
    }
    const tree = remap(statement.kind === 'declaration' ? statement.initializer : statement.value);
    const nativeType = statement.kind === 'return' ? context.returnType : statement.nativeType;
    const visible = [...new Map(locals.map(binding => [binding.name, binding])).values()];
    const expression = materializeNativeRuntimeExpression(tree, language, doc, { ...context, returnType: nativeType, locals: visible }, sourceSha256, `${context.symbolId}-local-expression-${index}`);
    doc = expression.document;
    const id = `${context.symbolId}-statement-${index}`, type = nativeScalarSignaturePin(nativeType, language)! as 'data_number' | 'data_boolean';
    if (doc.nodes.some(node => node.id === id)) fail(statement, 'ID_COLLISION');
    const node: GraphNode = { id, type: 'vvs_standard_node', position: { x: (doc.nodes.length + 1) * 260, y: 0 }, data: { label: '', category: 'Variables', inputs: [], outputs: [], inlineValues: {}, properties: { sourceOrigin: origin(statement) } } };
    let valueHandle = 'val';
    if (statement.kind === 'declaration') {
      const group = `${statement.declarationGroup.start}:${statement.declarationGroup.end}`;
      if (groups.has(group) && !grouped) fail(statement, 'DECLARATION_GROUP_MAPPING_REQUIRED');
      groups.add(group);
      const symbolId = `${context.symbolId}-local-${locals.length}`;
      const mutable = statement.binding.mutable;
      node.data.kindId = 'var_define'; node.data.label = `Declare ${statement.binding.name}`;
      node.data.inputs = [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'value', label: 'Initializer', type, required: true }];
      node.data.outputs = [{ id: 'exec_out', label: '', type: 'execution' }];
      node.data.properties = { ...node.data.properties, symbolId, name: statement.binding.name, type, hasInitializer: true, isConst: !mutable, declarationKind: mutable ? 'let' : 'const', nativeLocalStyle: `${language}-scalar`, nativeLocalLanguage: language, nativeOwnerId: context.symbolId, nativeType, nativeAuthoredType: statement.authoredType, ...(statement.inferenceMode ? { nativeInferenceMode: statement.inferenceMode } : {}), nativeMutable: mutable, sourceOrigin: origin(statement.declarationGroup) };
      if (grouped) { node.data.properties.groupOwnerId = groupId; node.data.properties.sourceOrigin = origin(statement); }
      variables.push({ kind: 'variable', id: symbolId, name: statement.binding.name, type, classId, binding: 'instance', visibility: 'private', graphTabId: context.symbolId, flags: { readonly: !mutable } });
      doc.nodes.push(node);
      identities.set(statement.binding.id, symbolId);
      locals.push(nativeScalarLocalBinding(node, language, context.symbolId)); valueHandle = 'value';
    } else if (statement.kind === 'assignment') {
      const symbolId = identities.get(statement.bindingId), binding = locals.find(binding => binding.id === symbolId);
      if (!binding) fail(statement, 'ASSIGNMENT_SOURCE_OWNER');
      node.data.kindId = 'variable_set'; node.data.label = `Set ${binding!.name}`;
      node.data.graphBinding = { kind: 'variable_ref', symbolId: symbolId! };
      node.data.properties = { ...node.data.properties, symbolId, name: binding!.name, variableName: binding!.name, assignmentOperator: '=' };
      node.data.inputs = [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'val', label: 'Value', type, required: true }];
      node.data.outputs = [{ id: 'exec_out', label: '', type: 'execution' }]; doc.nodes.push(node);
    } else {
      if (index !== statements.length - 1) fail(statement, 'RETURN_ORDER');
      node.data.kindId = 'flow_return'; node.data.label = 'Return'; node.data.category = 'Flow';
      node.data.inputs = [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'val', label: 'Value', type, required: true }];
      node.data.properties = { ...node.data.properties, nativeReturnLanguage: language, nativeReturnStyle: statement.style }; doc.nodes.push(node);
    }
    doc.edges.push({ id: `${id}-flow`, source: previous, sourceHandle: flowHandle, target: id, targetHandle: 'exec_in', data: { pinType: 'execution' }, sourceOrigin: origin(statement) });
    const outputType = doc.nodes.find(node => node.id === expression.rootId)!.data.outputs.find(pin => pin.id === expression.rootHandle)!.type;
    doc.edges.push({ id: `${id}-value`, source: expression.rootId, sourceHandle: expression.rootHandle, target: id, targetHandle: valueHandle, data: { pinType: outputType }, sourceOrigin: origin(tree) });
    previous = grouped && siblings.at(-1) === statement ? groupId! : id;
  }
  analyzeNativeScalarFunctionGraph(definition, doc, language);
  return { document: doc, variables, graphAdmission: 'blocked' as const };
}
