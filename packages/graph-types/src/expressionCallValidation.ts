import type { AnalyzeProjectInput } from './analyze';
import type { Diagnostic } from './diagnostic';

/** A value call belongs to one expression path, never an eager execution chain. */
export function validateExpressionCallOwnership(input: AnalyzeProjectInput): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const [tabId, doc] of Object.entries(input.documents)) for (const call of doc.nodes.filter(node => node.data.kindId === 'vvs.project.call_function')) {
    const mode = call.data.properties?.callPlacement;
    const error = (message: string) => diagnostics.push({ level: 'error', source: 'semantic', code: 'NATIVE_CALL_OWNERSHIP', message, tabId, nodeId: call.id });
    if (mode !== undefined && mode !== 'statement' && mode !== 'expression') { error('Unreviewed call placement.'); continue; }
    if (mode !== 'expression') continue;
    if ((doc.metadata?.targetLanguage ?? input.targetLanguage) !== 'go') error('Expression-call ownership is currently reviewed for Go only.');
    if ([...call.data.inputs, ...call.data.outputs].some(pin => pin.type === 'execution') || doc.edges.some(edge => (edge.source === call.id || edge.target === call.id) && (edge.data?.pinType === 'execution' || ['exec_in', 'exec_out'].includes(String(edge.source === call.id ? edge.sourceHandle : edge.targetHandle))))) error('Expression calls cannot belong to an execution chain.');
    if (call.data.outputs.length !== 1 || call.data.outputs[0].type === 'execution') error('Expression calls require exactly one return value.');
    let cursor = call.id;
    const seen = new Set<string>();
    let owned = false;
    while (!seen.has(cursor) && seen.size <= 512) {
      seen.add(cursor);
      const consumers = doc.edges.filter(edge => edge.source === cursor && edge.data?.pinType !== 'execution');
      if (consumers.length !== 1) { error('Each expression path needs one consumer; shared calls must use separate occurrences or an explicit local value.'); break; }
      const sourcePin = doc.nodes.find(node => node.id === cursor)?.data.outputs.find(pin => pin.id === consumers[0].sourceHandle);
      if (!sourcePin || sourcePin.type === 'execution') { error('Expression use requires an existing return/value output.'); break; }
      const target = doc.nodes.find(node => node.id === consumers[0].target);
      const pin = target?.data.inputs.find(pin => pin.id === consumers[0].targetHandle);
      if (!target || !pin || pin.type === 'execution') { error('Expression owner requires an existing value input.'); break; }
      if (target.data.inputs.some(pin => pin.type === 'execution')) {
        const reachable = new Set(doc.nodes.filter(node => node.data.kindId === 'function_entry').map(node => node.id));
        const pending = [...reachable];
        while (pending.length) {
          const id = pending.shift()!;
          for (const edge of doc.edges.filter(edge => edge.source === id && edge.data?.pinType === 'execution')) if (!reachable.has(edge.target)) { reachable.add(edge.target); pending.push(edge.target); }
        }
        owned = reachable.has(target.id);
        break;
      }
      cursor = target.id;
    }
    if (!owned) error('Expression calls must terminate in a visible statement or loop-header evaluation.');
    const visit = (id: string, visited = new Set<string>()): void => {
      if (visited.has(id)) return; visited.add(id);
      if (visited.size > 512) { error('Expression dependency traversal exceeds the ownership budget.'); return; }
      const node = doc.nodes.find(node => node.id === id);
      if (node?.data.kindId === 'vvs.project.call_function' && node.data.properties?.callPlacement !== 'expression') error('An expression call cannot depend on an eager call occurrence.');
      for (const edge of doc.edges.filter(edge => edge.target === id && edge.data?.pinType !== 'execution')) visit(edge.source, visited);
    };
    for (const edge of doc.edges.filter(edge => edge.target === call.id && edge.data?.pinType !== 'execution')) visit(edge.source);
  }
  return diagnostics;
}
