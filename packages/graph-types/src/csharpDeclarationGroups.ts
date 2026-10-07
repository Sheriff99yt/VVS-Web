import type { GraphDocument, VariableSymbol } from './symbols';
import { CSHARP_INTEGRAL_PINS } from './nativeSignatures';
import { CSharpGraphExpressionError } from './csharpGraphExpressions';
import type { CSharpIntegerType } from './csharpIntegerSemantics';

/** Declarators stay visible; the group owns their shared keyword/type and order. */
export function csharpGroupDeclarations(doc: GraphDocument, groupId: string) {
  const group = doc.nodes.find(node => node.id === groupId);
  if (group?.data.kindId !== 'csharp_declaration_group') throw new CSharpGraphExpressionError('GROUP_OWNER');
  const declarations: GraphDocument['nodes'] = [], seen = new Set<string>([groupId]);
  let current = groupId, handle = 'declarations_exec';
  for (;;) {
    const edges = doc.edges.filter(edge => edge.source === current && edge.sourceHandle === handle && edge.data?.pinType === 'execution');
    if (!edges.length) break;
    if (edges.length !== 1 || edges[0].targetHandle !== 'exec_in' || seen.has(edges[0].target) || declarations.length >= 32) throw new CSharpGraphExpressionError('GROUP_FLOW');
    const node = doc.nodes.find(node => node.id === edges[0].target);
    if (node?.data.kindId !== 'var_define' || node.data.properties?.groupOwnerId !== groupId || doc.edges.filter(edge => edge.target === node.id && edge.data?.pinType === 'execution').length !== 1) throw new CSharpGraphExpressionError('GROUP_DECLARATOR');
    declarations.push(node); seen.add(node.id); current = node.id; handle = 'exec_out';
  }
  if (declarations.length < 2) throw new CSharpGraphExpressionError('GROUP_ARITY');
  return declarations;
}

/** Pure atomic projection for a shared type/readonly inspector edit. */
export function editCSharpDeclarationGroup<TDocument extends GraphDocument>(doc: TDocument, variables: VariableSymbol[], groupId: string, nativeType: CSharpIntegerType, groupStyle: 'typed' | 'const') {
  if (!Object.hasOwn(CSHARP_INTEGRAL_PINS, nativeType) || !['typed', 'const'].includes(groupStyle)) throw new CSharpGraphExpressionError('GROUP_TYPE');
  const members = csharpGroupDeclarations(doc, groupId);
  const ids = new Set(members.map(node => node.id));
  const symbols = new Set(members.map(node => node.data.properties?.symbolId));
  if (symbols.size !== members.length || members.some(node => !variables.some(variable => variable.id === node.data.properties?.symbolId))) throw new CSharpGraphExpressionError('GROUP_BINDING');
  const isConst = groupStyle === 'const';
  return {
    document: { ...doc, nodes: doc.nodes.map(node => node.id === groupId
      ? { ...node, data: { ...node.data, properties: { ...node.data.properties, nativeType, groupStyle } } }
      : ids.has(node.id) ? { ...node, data: { ...node.data, properties: { ...node.data.properties, nativeType, nativeLocalStyle: isConst ? 'csharp-const' : 'csharp-typed', isConst, declarationKind: isConst ? 'const' : 'var' } } } : node) } as TDocument,
    variables: variables.map(variable => symbols.has(variable.id) ? { ...variable, flags: { ...variable.flags, readonly: isConst } } : variable),
  };
}
