import {
  createClassSymbol, createEmptyProjectSnapshot, MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID,
  applyFunctionDefineBinding, applyFunctionEntryBinding, applyFunctionImplementBinding, applyFunctionReturnBinding, applyEventDefineBinding,
  type FunctionSymbol, type GraphDocument, type GraphNode, type PinType, type ProjectSnapshot,
} from '@vvs/graph-types';
import { resolve } from '@vvs/syntax-registry';
import { ImportFailure, IMPORT_LIMITS, type ClassImportPlan, type ExpressionPlan, type MappingEvidence, type StatementPlan } from './contracts';

/** Transactional deterministic builder. Only typed plans, never parser AST or editor state. */
export function materializeImportPlan(plan: ClassImportPlan): ProjectSnapshot {
  const snapshot = createEmptyProjectSnapshot();
  // An isolated candidate is unsaved. The existing project save boundary assigns its timestamp.
  snapshot.savedAt = '';
  const cls = createClassSymbol(plan.name, { id: MAIN_CLASS_ID, containerId: MAIN_GRAPH_CONTAINER_ID });
  snapshot.classes = [cls]; snapshot.activeClassId = cls.id;
  snapshot.projectDetails = { moduleName: cls.name, extendsType: '', description: `Imported from ${plan.fileName}` };
  snapshot.targetLanguage = 'javascript'; snapshot.events = []; snapshot.variables = []; snapshot.functions = []; snapshot.documents = {};
  const home: GraphDocument = { nodes: [], edges: [], metadata: { moduleName: cls.name, extendsType: '', description: '', targetLanguage: 'javascript' } };
  if (plan.entryPolicy === 'library') home.metadata!.compilationUnit = { version: 1, entryPolicy: 'library' };
  snapshot.documents[MAIN_GRAPH_CONTAINER_ID] = home;
  let serial = 0;
  function spawn(doc: GraphDocument, kindId: string, x: number, y: number, evidence: MappingEvidence): GraphNode {
    const definition = resolve(kindId);
    if (!definition) throw new ImportFailure('REGISTRY_KIND_MISSING', `Missing registry kind ${kindId}.`, evidence);
    if (++serial > IMPORT_LIMITS.nodes) throw new ImportFailure('NODE_BUDGET', 'Import at most 512 nodes in one class.', evidence);
    const node: GraphNode = { id: `import-node-${serial}`, type: 'vvs_standard_node', position: { x, y }, data: {
      kindId, kindVersion: definition.kindVersion, label: definition.title, category: definition.category,
      inputs: structuredClone(definition.inputs), outputs: structuredClone(definition.outputs), inlineValues: {},
      properties: { sourceOrigin: { start: evidence.start, end: evidence.end, mappingId: evidence.mappingId, mappingVersion: evidence.mappingVersion, sourceSha256: plan.sourceSha256 } },
    } };
    doc.nodes.push(node); return node;
  }
  function wire(doc: GraphDocument, from: GraphNode, output: string, to: GraphNode, input: string, pinType: PinType) {
    doc.edges.push({ id: `import-edge-${doc.edges.length}-${from.id}-${to.id}`, source: from.id, target: to.id,
      sourceHandle: output, targetHandle: input, type: 'vvs_standard_edge', data: { pinType } });
  }
  const classNode = spawn(home, 'class_define', 0, 0, plan);
  classNode.data.label = `Declare ${cls.name}`;
  classNode.data.properties = { ...classNode.data.properties, symbolId: cls.id, classId: cls.id, name: cls.name, extendsType: '', visibility: 'public',
    sourceImport: { version: 1, language: 'javascript', languageVersion: 'es2022', sourceMode: 'script', environment: 'none', fileName: plan.fileName,
      source: plan.source, sourceSha256: plan.sourceSha256, start: plan.start, end: plan.end, mappingId: plan.mappingId, mappingVersion: plan.mappingVersion } };
  let previousMember = classNode;
  for (const [methodIndex, method] of plan.methods.entries()) {
    const parameters = method.parameters.map(p => ({ id: p.id, label: p.name, type: 'data_any' as PinType }));
    const func: FunctionSymbol = { kind: 'function', id: method.id, name: method.name, classId: cls.id, binding: method.isStatic ? 'static' : 'instance', visibility: 'public',
      overloads: [{ id: 'o1', parameters, returnType: 'data_any', graphTabId: method.id }] };
    const isEntry = method.role === 'entry';
    const body: GraphDocument = isEntry ? home : { nodes: [], edges: [], metadata: { moduleName: method.name, extendsType: '', description: '' } };
    let entry: GraphNode;
    if (isEntry) {
      const event = { id: 'import-entry', name: 'start', role: 'entry' as const, parameters, classId: cls.id };
      snapshot.events.push(event);
      const declarationNode = spawn(home, 'event_member_define', (methodIndex + 1) * 520, 0, method);
      declarationNode.data.properties = { ...declarationNode.data.properties, symbolId: event.id, eventId: event.id, name: event.name, role: 'entry' };
      declarationNode.data.label = 'Declare start';
      wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution'); previousMember = declarationNode;
      entry = spawn(home, 'event_define', 0, 400, method); entry.data = applyEventDefineBinding(entry.data, event);
    } else {
      snapshot.functions.push(func);
      const declarationNode = spawn(home, 'function_define', (methodIndex + 1) * 520, 0, method);
      declarationNode.data = applyFunctionDefineBinding(declarationNode.data, func, 'o1');
      const define = spawn(home, 'function_implement', (methodIndex + 1) * 520 + 240, 0, method);
      define.data = applyFunctionImplementBinding(define.data, func, 'o1'); define.data.properties = { ...define.data.properties, isStatic: method.isStatic };
      wire(home, previousMember, 'exec_out', declarationNode, 'exec_in', 'execution'); wire(home, declarationNode, 'exec_out', define, 'exec_in', 'execution'); previousMember = define;
      snapshot.documents[func.id] = body; snapshot.openTabs.push({ id: func.id, type: 'function', name: `Function: ${method.name}` });
      entry = spawn(body, 'function_entry', 0, 0, method); entry.data = applyFunctionEntryBinding(entry.data, func, 'o1');
    }
    let column = 0;
    function expression(value: ExpressionPlan, target: GraphNode, pin: string, row: number): void {
      if (value.kind === 'literal') { target.data.inlineValues[pin] = value.value; return; }
      if (value.kind === 'parameter') {
        if (value.scopeId !== method.scopeId || !method.parameters.some(p => p.id === value.parameterId)) throw new ImportFailure('SEMANTIC_CLOSURE', 'Parameter read must resolve in its own method scope.', value);
        wire(body, entry, value.parameterId, target, pin, 'data_any'); return;
      }
      const math = spawn(body, value.nodeKind, (++column) * 240, row + 160, value);
      expression(value.left, math, 'a', row + 160); expression(value.right, math, 'b', row + 160);
      wire(body, math, 'result', target, pin, 'data_number');
    }
    function statement(value: StatementPlan, from: GraphNode, output: string, row: number): void {
      if (value.kind === 'return') {
        const ret = spawn(body, 'flow_return', (++column) * 240, row, value);
        if (!isEntry) ret.data = applyFunctionReturnBinding(ret.data, func, 'o1');
        wire(body, from, output, ret, 'exec_in', 'execution');
        expression(value.value, ret, ret.data.inputs.find(p => p.type !== 'execution')!.id, row); return;
      }
      const branch = spawn(body, 'flow_branch', (++column) * 240, row, value);
      wire(body, from, output, branch, 'exec_in', 'execution'); expression(value.condition, branch, 'condition', row);
      statement(value.consequent, branch, 'true_exec', row); statement(value.alternate, branch, 'false_exec', row + 340);
    }
    statement(method.body, entry, 'exec_out', isEntry ? 400 : 0);
  }
  return snapshot;
}
