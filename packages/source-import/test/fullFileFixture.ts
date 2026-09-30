import {
  createEmptyProjectSnapshot, createClassSymbol, MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID,
  applyFunctionDefineBinding, applyFunctionImplementBinding, applyFunctionEntryBinding, applyFunctionReturnBinding, applyEventDefineBinding,
  type FunctionSymbol, type GraphDocument, type GraphNode, type ProjectSnapshot,
} from '@vvs/graph-types';
import { resolve } from '@vvs/syntax-registry';

export interface FullFileFixture {
  name: string; className: string; source: string; expected: { className: string; methods: unknown[] };
  functions: FunctionSymbol[];
  homeNodes: { id: string; kindId: string; symbolId?: string; isStatic?: boolean; values?: Record<string, string | number | boolean> }[];
  documents: Record<string, { nodes: FullFileFixture['homeNodes']; edges: string[][] }>;
  homeEdges: string[][];
}
/** Test harness supplies exactly the checked-in explicit class/entry contract. Never infer on_start. */
export function fullFileSnapshot(fixture: FullFileFixture): ProjectSnapshot {
  const snapshot = createEmptyProjectSnapshot();
  snapshot.classes = [createClassSymbol(fixture.className, { id: MAIN_CLASS_ID, containerId: MAIN_GRAPH_CONTAINER_ID })];
  snapshot.activeClassId = MAIN_CLASS_ID; snapshot.targetLanguage = 'javascript';
  snapshot.projectDetails = { moduleName: fixture.className, extendsType: '', description: '' };
  snapshot.functions = structuredClone(fixture.functions); snapshot.variables = [];
  snapshot.events = [{ id: 'entry-slot', name: 'start', role: 'entry', classId: MAIN_CLASS_ID, parameters: [] }];
  function document(nodes: FullFileFixture['homeNodes'], edges: string[][]): GraphDocument {
    return { metadata: { moduleName: fixture.className, extendsType: '', description: '', targetLanguage: 'javascript' }, nodes: nodes.map((spec, index) => {
      const kind = resolve(spec.kindId)!;
      const node: GraphNode = { id: spec.id, type: 'vvs_standard_node', position: { x: index * 240, y: 0 }, data: {
        kindId: kind.kindId, kindVersion: kind.kindVersion, label: kind.title, category: kind.category, inputs: structuredClone(kind.inputs), outputs: structuredClone(kind.outputs), inlineValues: spec.values ?? {},
      } };
      if (spec.kindId === 'class_define') node.data.properties = { symbolId: MAIN_CLASS_ID, classId: MAIN_CLASS_ID, name: fixture.className };
      if (spec.kindId === 'event_member_define') node.data.properties = { symbolId: 'entry-slot', eventId: 'entry-slot', name: 'start', role: 'entry' };
      if (spec.kindId === 'event_define') node.data = applyEventDefineBinding(node.data, snapshot.events[0]!);
      if (spec.symbolId) {
        const fn = snapshot.functions.find(f => f.id === spec.symbolId)!;
        const bind = { function_define: applyFunctionDefineBinding, function_implement: applyFunctionImplementBinding, function_entry: applyFunctionEntryBinding, flow_return: applyFunctionReturnBinding }[spec.kindId];
        if (bind) node.data = bind(node.data, fn, 'o1');
        if (spec.kindId === 'function_implement') node.data.properties = { ...node.data.properties, isStatic: spec.isStatic ?? false };
      }
      return node;
    }), edges: edges.map(([source, sourceHandle, target, targetHandle], index) => ({ id: `edge-${index}`, source: source!, sourceHandle, target: target!, targetHandle, type: 'vvs_standard_edge', data: { pinType: sourceHandle?.endsWith('exec') || sourceHandle === 'exec_out' ? 'execution' : sourceHandle === 'result' ? 'data_number' : 'data_any' } })) };
  }
  snapshot.documents = { [MAIN_GRAPH_CONTAINER_ID]: document(fixture.homeNodes, fixture.homeEdges) };
  for (const [id, body] of Object.entries(fixture.documents)) snapshot.documents[id] = document(body.nodes, body.edges);
  return snapshot;
}
