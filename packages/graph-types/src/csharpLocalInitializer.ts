import type { GraphDocument } from './symbols';
import { NATIVE_EXPRESSION_KINDS } from './nativeExpressions';
import { CSharpGraphExpressionError } from './csharpGraphExpressions';

/** Enabling exposes an empty required pin; disabling preserves shared data nodes. */
export function editCSharpLocalInitializer<TDocument extends GraphDocument>(doc: TDocument, declarationId: string, enabled: boolean): TDocument {
  const declaration = doc.nodes.find(node => node.id === declarationId);
  if (declaration?.data.kindId !== 'var_define' || declaration.data.properties?.nativeLocalStyle !== 'csharp-typed') throw new CSharpGraphExpressionError('LOCAL_INITIALIZER_STYLE');
  const pending = enabled ? [] : doc.edges.filter(edge => edge.target === declarationId && edge.targetHandle === 'value').map(edge => edge.source);
  let edges = enabled ? [...doc.edges] : doc.edges.filter(edge => !(edge.target === declarationId && edge.targetHandle === 'value'));
  const removed = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    const node = doc.nodes.find(node => node.id === id);
    if (!node || removed.has(id) || ![...NATIVE_EXPRESSION_KINDS, 'variable_get'].includes(String(node.data.kindId)) || edges.some(edge => edge.source === id)) continue;
    removed.add(id);
    pending.push(...edges.filter(edge => edge.target === id).map(edge => edge.source));
    edges = edges.filter(edge => edge.target !== id && edge.source !== id);
  }
  return { ...doc, edges, nodes: doc.nodes.filter(node => !removed.has(node.id)).map(node => node.id !== declarationId ? node : {
    ...node, data: { ...node.data, properties: { ...node.data.properties, hasInitializer: enabled }, inlineValues: {}, inputs: enabled
      ? [...node.data.inputs.filter(pin => pin.id !== 'value'), { id: 'value', label: 'Initializer', type: 'data_number', required: true }]
      : node.data.inputs.filter(pin => pin.id !== 'value') },
  }) } as TDocument;
}
