import { expect, test } from 'bun:test';
import { analyzeNativeRuntimeGraph, analyzeNativeScalarFunctionGraph, nativeScalarSignaturePin, type GraphDocument, type NativeRuntimeGraphContext, type VVSNodeData } from '@vvs/graph-types';
import { analyzeNativeRuntimeSource } from './nativeRuntimeSource';
import { materializeNativeRuntimeExpression } from './nativeRuntimeMaterialize';
import { analyzeNativeSourceSignatures } from './nativeSourceSignatures';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeRuntimeSourceFixtures } from '../test/nativeRuntimeSourceFixtures';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`source/runtime graph materialization and function ownership ${language}`, async () => {
  const source = nativeRuntimeSourceFixtures[language];
  const report = await analyzeNativeRuntimeSource(source, language), headers = await analyzeNativeSourceSignatures(source, language);
  for (const [index, record] of report.records.entries()) {
    const signature = headers.signatures[index];
    const parameters = signature.parameters.map((p, slot) => ({ ...p, id: `parameter-${slot}` }));
    const context: NativeRuntimeGraphContext = { entryId: 'entry', symbolId: signature.name, parameters, returnType: signature.nativeReturnType };
    const initial: GraphDocument = { nodes: [{ id: 'entry', type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: { label: 'Entry', category: 'Functions', kindId: 'function_entry', inputs: [], outputs: [{ id: 'exec_out', label: '', type: 'execution' }, ...parameters.map(p => ({ id: p.id, label: p.name, type: nativeScalarSignaturePin(p.nativeType, language)! }))], inlineValues: {}, graphBinding: { kind: 'call_function', symbolId: context.symbolId }, properties: { nativeSignatureLanguage: language } } }], edges: [] };
    const result = materializeNativeRuntimeExpression(record.expression!, language, initial, context, report.sourceSha256);
    expect(initial.nodes).toHaveLength(1); expect(initial.edges).toEqual([]);
    expect(result.graphAdmission).toBe('blocked');
    const read = analyzeNativeRuntimeGraph(result.document, result.rootId, language, context);
    expect(read.nativeType).toBe(record.fact!.nativeType);
    for (const node of result.document.nodes.slice(1)) {
      expect(node.data.properties!.sourceOrigin).toMatchObject({ sourceSha256: report.sourceSha256 });
      const origin = node.data.properties!.sourceOrigin as { start: number; end: number };
      expect(source.slice(origin.start, origin.end).length).toBeGreaterThan(0);
      expect(node.data.properties!.nativeLiteralType).toBeUndefined();
    }
    const doc = JSON.parse(JSON.stringify(result.document)) as GraphDocument;
    doc.nodes.push({ id: 'return', type: 'vvs_standard_node', position: { x: 2200, y: 0 }, data: { label: 'Return', category: 'Flow', kindId: 'flow_return', inputs: [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'val', label: '', type: nativeScalarSignaturePin(context.returnType, language)! }], outputs: [], inlineValues: {} } });
    doc.edges.push({ id: 'flow', source: 'entry', sourceHandle: 'exec_out', target: 'return', targetHandle: 'exec_in', data: { pinType: 'execution' } }, { id: 'value', source: result.rootId, sourceHandle: result.rootHandle, target: 'return', targetHandle: 'val', data: { pinType: nativeScalarSignaturePin(context.returnType, language)! } });
    const definition: VVSNodeData = { kindId: 'function_implement', label: signature.name, category: 'Functions', inputs: [], outputs: [], inlineValues: {}, graphBinding: { kind: 'call_function', symbolId: context.symbolId }, properties: { functionName: signature.name, nativeSignatureLanguage: language, nativeParameters: parameters, nativeReturnType: signature.nativeReturnType, nativeAuthoredReturnType: signature.authoredReturnType } };
    expect(analyzeNativeScalarFunctionGraph(definition, doc, language).valueType).toBe(context.returnType);
    const parameterEdge = doc.edges.find(edge => edge.source === 'entry' && edge.data?.pinType !== 'execution')!;
    parameterEdge.sourceHandle = 'missing';
    expect(() => analyzeNativeScalarFunctionGraph(definition, doc, language)).toThrow('NATIVE_RUNTIME_GRAPH_');
    expect(() => materializeNativeRuntimeExpression(record.expression!, language, initial, { ...context, parameters: [] }, report.sourceSha256)).toThrow('ENTRY_CONTEXT');
    const forged = structuredClone(initial); forged.nodes[0].data.graphBinding!.symbolId = 'other';
    expect(() => materializeNativeRuntimeExpression(record.expression!, language, forged, context, report.sourceSha256)).toThrow('ENTRY_CONTEXT');
  }
});
