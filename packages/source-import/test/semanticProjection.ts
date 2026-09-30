import type { GraphDocument, GraphNode, ProjectSnapshot } from '@vvs/graph-types';

/** Independent test oracle: reads graph pins/bindings/order directly; no parser/importer/IR. */
export function semanticProjection(snapshot: ProjectSnapshot) {
  const home = Object.values(snapshot.documents).find(d => d.nodes.some(n => n.data.kindId === 'class_define'))!;
  const shell = home.nodes.find(n => n.data.kindId === 'class_define')!;
  const cls = snapshot.classes.find(c => c.id === shell.data.properties?.symbolId)!;
  function input(doc: GraphDocument, node: GraphNode, pin: string): unknown {
    const edge = doc.edges.find(e => e.target === node.id && e.targetHandle === pin);
    if (!edge) return ['literal', node.data.inlineValues[pin]];
    const source = doc.nodes.find(n => n.id === edge.source)!;
    if (source.data.kindId === 'function_entry' || source.data.kindId === 'event_define') {
      const parameter = source.data.outputs.find(p => p.id === edge.sourceHandle)!;
      return ['parameter', parameter.label];
    }
    const operators: Record<string, string> = { math_add: '+', math_subtract: '-', math_multiply: '*', math_divide: '/' };
    return [operators[source.data.kindId!], input(doc, source, 'a'), input(doc, source, 'b')];
  }
  function flow(doc: GraphDocument, from: GraphNode, output: string): unknown {
    const edge = doc.edges.find(e => e.source === from.id && e.sourceHandle === output);
    if (!edge) throw new Error('Missing control-flow edge');
    const node = doc.nodes.find(n => n.id === edge.target)!;
    if (node.data.kindId === 'flow_return') {
      const pin = node.data.inputs.find(p => p.type !== 'execution')!;
      return ['return', input(doc, node, pin.id)];
    }
    if (node.data.kindId !== 'flow_branch') throw new Error('Unsupported test projection node');
    return ['if', input(doc, node, 'condition'), flow(doc, node, 'true_exec'), flow(doc, node, 'false_exec')];
  }
  const methods: unknown[] = [];
  let member: GraphNode | undefined = shell;
  const visited = new Set<string>();
  while (member) {
    if (visited.has(member.id)) throw new Error('Member cycle'); visited.add(member.id);
    if (member.data.kindId === 'event_member_define') {
      const event = snapshot.events.find(e => e.id === member!.data.properties?.eventId)!;
      const entry = home.nodes.find(n => n.data.kindId === 'event_define' && n.data.properties?.eventId === event.id)!;
      methods.push([`on_${event.name}`, false, event.role, event.parameters.map(p => p.label), flow(home, entry, 'exec_out')]);
    }
    if (member.data.kindId === 'function_implement') {
      const fn = snapshot.functions.find(f => f.id === member!.data.graphBinding?.symbolId)!;
      const doc = snapshot.documents[fn.overloads[0]!.graphTabId ?? fn.id]!;
      const entry = doc.nodes.find(n => n.data.kindId === 'function_entry')!;
      methods.push([fn.name, member.data.properties?.isStatic === true, 'method', fn.overloads[0]!.parameters.map(p => p.label), flow(doc, entry, 'exec_out')]);
    }
    const edge = home.edges.find(e => e.source === member!.id && e.sourceHandle === 'exec_out');
    member = edge ? home.nodes.find(n => n.id === edge.target) : undefined;
  }
  return { className: cls.name, methods };
}
