import { inferCSharpGraphExpression, inferCSharpGraphValueExpression, CSharpGraphExpressionError } from './csharpGraphExpressions';
import { inferCSharpLinearLocals } from './csharpLocalSemantics';
import { NATIVE_EXPRESSION_KINDS } from './nativeExpressions';
import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';
import { nativeSignature, CSHARP_RETURN_PINS } from './nativeSignatures';
import { csharpIntegerAssignable, CSharpIntegerError, type CSharpIntegerType } from './csharpIntegerSemantics';

/** Initial graph integration: integral static methods with graph-owned return expressions.
 * Other body forms require their own native facts before they can use this signature.
 */
export function validateCSharpSignatureBodies(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const home of Object.values(input.documents)) for (const definition of home.nodes) {
    if (definition.data.properties?.nativeSignatureLanguage !== 'csharp') continue;
    const signature = nativeSignature(definition.data); if (!signature) continue;
    const symbol = input.functions.find(fn => fn.id === (definition.data.graphBinding?.symbolId ?? definition.data.properties?.symbolId));
    const overload = symbol?.overloads.find(o => o.id === (definition.data.graphBinding?.overloadId ?? definition.data.properties?.overloadId)) ?? symbol?.overloads[0];
    const tabId = overload?.graphTabId ?? symbol?.id; const doc = tabId && input.documents[tabId];
    const error = (code: string, message: string, nodeId = definition.id) => diagnostics.push({ level: 'error', source: 'semantic', code, message, tabId: tabId || undefined, nodeId });
    if (!doc) { error('NATIVE_CSHARP_BODY_MISSING', 'Native C# method requires its visible body graph.'); continue; }
    const result = definition.data.properties.nativeReturnType;
    if (result !== 'void' && !Object.hasOwn(CSHARP_RETURN_PINS, String(result))) continue;
    if (doc.nodes.some(node => !['function_entry', 'flow_return', 'var_define', 'variable_get', 'variable_set', 'parameter_set', 'csharp_scope', 'csharp_declaration_group', ...NATIVE_EXPRESSION_KINDS].includes(String(node.data.kindId)) && !['vvs_comment_node', 'vvs_reroute_node'].includes(node.type))) { error('NATIVE_CSHARP_BODY_UNSUPPORTED', 'This C# body needs its native value and evaluation contract.'); continue; }
    const entries = doc.nodes.filter(node => node.data.kindId === 'function_entry');
    const returns = doc.nodes.filter(node => node.data.kindId === 'flow_return');
    if (result === 'void' && doc.nodes.length === 0) continue;
    if (entries.length !== 1 || returns.length > 1 || result !== 'void' && returns.length !== 1) { error('NATIVE_CSHARP_BODY_FLOW', 'Native C# method requires one visible entry and a valid return or void completion path.'); continue; }
    const ret = returns[0];
    if (entries[0].data.properties?.nativeSignatureLanguage !== 'csharp' || (entries[0].data.graphBinding?.symbolId ?? entries[0].data.properties?.symbolId) !== symbol?.id || signature.some(parameter => !entries[0].data.outputs.some(pin => pin.id === parameter.id && pin.type === 'data_number'))) { error('NATIVE_CSHARP_ENTRY_BINDING', 'Native C# entry must match the method and its visible integral parameter pins.', entries[0].id); continue; }
    const executionEdges = doc.edges.filter(edge => edge.data?.pinType === 'execution');
    const returnPins = (ret?.data.inputs ?? []).filter(pin => pin.type !== 'execution');
    if (result !== 'void' && (returnPins.length !== 1 || !['return_val', 'value'].includes(returnPins[0].id))) { error('NATIVE_CSHARP_BODY_FLOW', 'C# method requires one return value pin.'); continue; }
    const edges = doc.edges.filter(edge => ret && edge.target === ret.id && ['return_val', 'value'].includes(String(edge.targetHandle)));
    if (result === 'void' ? edges.length || Object.keys(ret?.data.inlineValues ?? {}).length : edges.length !== 1 || !edges[0].sourceHandle || Object.keys(ret?.data.inlineValues ?? {}).length) { error('NATIVE_CSHARP_RETURN_UNSUPPORTED', 'C# return must match its declared native result.', ret?.id ?? entries[0].id); continue; }
    try {
      const locals = inferCSharpLinearLocals(doc, signature, entries[0].id, result === 'void');
      if (locals.returnId !== ret?.id || executionEdges.length !== locals.statements.length + (ret ? 1 : 0) || doc.nodes.filter(node => ['var_define', 'variable_set', 'parameter_set', 'csharp_scope', 'csharp_declaration_group'].includes(String(node.data.kindId))).length !== locals.statements.length) throw new CSharpGraphExpressionError('LOCAL_FLOW');
      const visited = locals.visited;
      if (result !== 'void') {
        if (result === 'bool') {
          const fact = inferCSharpGraphValueExpression(doc, signature, entries[0].id, edges[0].source, edges[0].sourceHandle!, locals.overflowContext, visited, new Set(), locals.bindings);
          if (fact.type !== 'bool' || returnPins[0].type !== 'data_boolean') throw new CSharpGraphExpressionError('BOOLEAN_RETURN');
        } else {
          const fact = inferCSharpGraphExpression(doc, signature, entries[0].id, edges[0].source, edges[0].sourceHandle!, locals.overflowContext, visited, new Set(), locals.bindings);
          csharpIntegerAssignable(fact, result as CSharpIntegerType);
        }
      }
      if (doc.nodes.some(node => ([...NATIVE_EXPRESSION_KINDS, 'variable_get'].includes(String(node.data.kindId))) && !visited.has(node.id))) error('NATIVE_CSHARP_EXPRESSION_ORPHAN', 'Native C# expressions require a visible initializer or return owner.');
    } catch (failure) {
      if (!(failure instanceof CSharpIntegerError) && !(failure instanceof CSharpGraphExpressionError)) throw failure;
      error('NATIVE_CSHARP_RETURN_TYPE', failure.message, ret?.id ?? entries[0].id);
    }
  }
  return diagnostics;
}
