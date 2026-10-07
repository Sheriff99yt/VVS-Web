import { expect, test } from 'bun:test';
import { transpileGraph, transpileProject } from './generate';
import { normalizeProjectSnapshot, csharpLocalStylePatch, inferCSharpLocalForEdit } from '@vvs/graph-types';
import savedLocal from '../test/csharp-local.fixture.json';
import savedProject from '../../source-import/test/native-csharp-class.fixture.json';
import { CSHARP_LOCAL_GRAPHS, csharpLocalGraph } from '../test/csharpLocalGraphs';
import { IR_VERSION } from './ir/types';
import evidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
import savedAssignment from '../test/csharp-assignment.fixture.json';
import savedMutation from '../test/csharp-mutation.fixture.json';
import savedParameter from '../test/csharp-parameter-write.fixture.json';
import savedScope from '../test/csharp-scope.fixture.json';
import { nativeSignature } from '@vvs/graph-types';

test('saved C# lexical blocks print exact nested scopes and derive native context without provenance', () => {
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(savedScope)))!;
  for (const document of Object.values(snapshot.documents)) for (const node of document.nodes) {
    delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport;
  }
  const emit = () => transpileProject({ ...snapshot, projectEvents: snapshot.events });
  const result = emit();
  expect(result.files[0].content).toBe('class Scopes {\n    public static int Test(int Input) {\n        checked {\n            unchecked {\n                byte First = ((byte)256);\n                {\n                    const byte Limit = ((byte)257);\n                    First += Limit;\n                    Input = First;\n                }\n            }\n        }\n        return Input;\n    }\n}');
  const doc = snapshot.documents[snapshot.functions[0].id];
  for (const node of doc.nodes.filter(node => ['csharp_scope', 'var_define', 'variable_set', 'parameter_set'].includes(String(node.data.kindId)))) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
  const entry = doc.nodes.find(node => node.data.kindId === 'function_entry')!;
  const definition = snapshot.documents['main-graph'].nodes.find(node => node.data.kindId === 'function_implement')!;
  const local = doc.nodes.find(node => node.data.kindId === 'var_define' && node.data.properties?.name === 'First')!;
  expect(inferCSharpLocalForEdit(doc, nativeSignature(definition.data)!, entry.id, local.id)).toEqual({ type: 'byte' });
  const scope = doc.nodes.find(node => node.data.kindId === 'csharp_scope' && node.data.properties?.overflowContext === 'unchecked')!;
  scope.data.properties!.overflowContext = 'checked';
  expect(emit).toThrow();
  scope.data.properties!.overflowContext = 'unchecked';
  expect(emit().files).toEqual(result.files);
  local.data.properties!.scopeOwnerId = 'other-block';
  expect(emit).toThrow();
});

test('saved C# nested graph rejects escaped bindings, hidden body ownership and index drift', () => {
  for (const change of [
    (snapshot: NonNullable<ReturnType<typeof normalizeProjectSnapshot>>) => { snapshot.variables[0].scopedNodeId = undefined; },
    (snapshot: NonNullable<ReturnType<typeof normalizeProjectSnapshot>>) => {
      const doc = snapshot.documents[snapshot.functions[0].id];
      const scope = doc.nodes.find(node => node.data.kindId === 'csharp_scope')!;
      scope.data.inlineValues = { body_exec: 'hidden' };
    },
    (snapshot: NonNullable<ReturnType<typeof normalizeProjectSnapshot>>) => {
      const doc = snapshot.documents[snapshot.functions[0].id];
      const ret = doc.nodes.find(node => node.data.kindId === 'flow_return')!;
      const localRead = doc.nodes.find(node => node.data.kindId === 'variable_get' && node.data.properties?.variableName === 'Limit')!;
      const edge = doc.edges.find(edge => edge.target === ret.id && edge.data?.pinType !== 'execution')!;
      edge.source = localRead.id; edge.sourceHandle = localRead.data.outputs[0].id;
    },
  ]) {
    const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(savedScope)))!;
    change(snapshot);
    expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow();
  }
});

test('saved C# parameter mutation has local syntax, stable ownership and mutable reads', () => {
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(savedParameter)))!;
  const doc = snapshot.documents[snapshot.functions[0].id];
  for (const document of Object.values(snapshot.documents)) for (const node of document.nodes) {
    delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport;
  }
  const emit = () => transpileProject({ ...snapshot, projectEvents: snapshot.events });
  const result = emit();
  expect(result.files[0].content).toBe('class Assignments {\n    public static byte Change(byte Input, int Count) {\n        Input += 1;\n        Input <<= Count;\n        ++Input;\n        Input--;\n        return Input;\n    }\n}');
  expect(snapshot.variables).toHaveLength(0);
  const setter = doc.nodes.find(node => node.data.kindId === 'parameter_set')!;
  for (const node of doc.nodes.filter(node => node.data.kindId === 'parameter_set')) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
  setter.data.properties!.prefix = 'true';
  expect(emit).toThrow();
  setter.data.properties!.prefix = false;
  setter.data.graphBinding!.parameterId = 'other-method-parameter';
  expect(emit).toThrow();
});

test('saved C# compound and update nodes own exact Code-panel statements after reload', () => {
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(savedMutation)))!;
  const doc = snapshot.documents[snapshot.functions[0].id];
  const setters = doc.nodes.filter(node => node.data.kindId === 'variable_set');
  const code = () => transpileProject({ ...snapshot, projectEvents: snapshot.events });
  const result = code();
  expect(result.files[0].content).toBe('class Mutations {\n    public static byte Change(byte Input, int Count) {\n        byte Value = Input;\n        Value += 1;\n        Value >>>= Count;\n        ++Value;\n        Value--;\n        return Value;\n    }\n}');
  for (const node of setters) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
  const update = setters.find(node => node.data.properties?.assignmentOperator === '++')!;
  expect(update.data.inputs.map(pin => pin.id)).toEqual(['exec_in']);
  update.data.properties!.prefix = false;
  expect(code().files[0].content).toContain('Value++;');
  update.data.inlineValues.val = 1;
  expect(code).toThrow();
  delete update.data.inlineValues.val;
  const compound = setters.find(node => node.data.properties?.assignmentOperator === '+=')!;
  const rhs = doc.edges.find(edge => edge.target === compound.id && edge.targetHandle === 'val')!.source;
  doc.nodes.find(node => node.id === rhs)!.data.properties!.payload = '256';
  expect(code).toThrow();
});

test('fixed saved C# assignment prints an existing local with visible statement and expression spans', () => {
  const snapshot = normalizeProjectSnapshot(JSON.parse(JSON.stringify(savedAssignment)))!;
  const doc = snapshot.documents[snapshot.functions[0].id];
  const setter = doc.nodes.find(node => node.data.kindId === 'variable_set')!;
  const rhs = doc.edges.find(edge => edge.target === setter.id && edge.targetHandle === 'val')!.source;
  for (const document of Object.values(snapshot.documents)) for (const node of document.nodes) {
    delete node.data.properties?.sourceOrigin;
    delete node.data.properties?.sourceImport;
  }
  const result = transpileProject({ ...snapshot, projectEvents: snapshot.events });
  expect(result.files[0].content).toBe('class Assignments {\n    public static byte Change() {\n        byte Value = 0;\n        Value = 255;\n        return Value;\n    }\n}');
  expect(result.sourceMap[setter.id]?.length).toBeGreaterThan(0);
  expect(result.sourceMap[rhs]?.length).toBeGreaterThan(0);
  doc.nodes.find(node => node.id === rhs)!.data.properties!.payload = '256';
  expect(() => transpileProject({ ...snapshot, projectEvents: snapshot.events })).toThrow();
});

test('C# declaration-style edits preserve inferred width and readonly ownership through reload', () => {
  const graph = csharpLocalGraph(CSHARP_LOCAL_GRAPHS[0]);
  const doc = graph.documents!['identity-int'];
  const first = doc.nodes.find(node => node.id === 'local-0-define')!;
  const second = doc.nodes.find(node => node.id === 'local-1-define')!;
  const edit = (node: typeof first, index: number, style: 'csharp-typed' | 'csharp-var' | 'csharp-const') => {
    const fact = node.data.properties!.nativeType === 'var' ? inferCSharpLocalForEdit(doc, [], 'identity-int-entry', node.id) : undefined;
    const patch = csharpLocalStylePatch(node.data.properties!, style, fact?.type);
    Object.assign(node.data.properties!, patch); graph.variables[index].flags!.readonly = patch.isConst;
  };
  edit(first, 0, 'csharp-typed');
  expect(transpileGraph(graph).files[0].content).toContain('byte @First =');
  edit(first, 0, 'csharp-var');
  expect(transpileGraph(graph).files[0].content).toContain('var @First =');
  edit(first, 0, 'csharp-const');
  expect(first.data.properties!.nativeType).toBe('byte');
  expect(transpileGraph(graph).files[0].content).toContain('const byte @First =');
  edit(second, 1, 'csharp-const');
  expect(transpileGraph(JSON.parse(JSON.stringify(graph))).files[0].content).toContain('const byte Second = @First;');
  edit(first, 0, 'csharp-typed');
  expect(() => transpileGraph(graph)).toThrow(); // Mutable First cannot initialize const Second.
  edit(second, 1, 'csharp-typed');
  expect(transpileGraph(graph).files[0].content).toContain('byte Second = @First;');
  doc.nodes.find(node => node.id === 'local-2-define')!.data.properties!.nativeType = 'sbyte';
  expect(inferCSharpLocalForEdit(doc, [], 'identity-int-entry', second.id).type).toBe('byte');
  expect(() => transpileGraph(graph)).toThrow();
});

for (const spec of CSHARP_LOCAL_GRAPHS) test(`C# native local graph prints authored declarations and survives reload: ${spec.id}`, () => {
  const graph = csharpLocalGraph(spec);
  const result = transpileGraph(graph); const code = result.files[0].content;
  expect(IR_VERSION).toBe(21);
  expect(code).toContain(spec.constant ? 'const ' : 'int @First =');
  if (spec.chain) { expect(code).toContain('var Second = @First;'); expect(code).toContain('Third = Second;'); expect(code).toContain('return Third;'); }
  else expect(code).toContain('return @First;');
  expect(transpileGraph(JSON.parse(JSON.stringify(graph))).files).toEqual(result.files);
  for (const node of graph.documents!['identity-int'].nodes.filter(node => node.data.kindId === 'var_define' || node.data.kindId === 'variable_get')) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
  expect(evidence.observations.find(row => row.id === `compiled-local-${spec.id}`)?.ok).toBe(true);
  graph.documents!['main-graph'] = { nodes: graph.nodes, edges: graph.edges };
  const doc = graph.documents!['identity-int'];
  expect(transpileGraph({ ...graph, nodes: doc.nodes, edges: doc.edges, tabId: 'identity-int' }).files[0].content).toContain('return ' + (spec.chain ? 'Third' : '@First') + ';');
});

test('C# local graph/index/type/order mutations block generation independently of provenance', () => {
  for (const change of [
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.variables[0].flags!.readonly = false; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.variables[0].name = 'Changed'; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.variables[0].name = 'Changed'; graph.documents!['identity-int'].nodes.find(node => node.id === 'local-0-define')!.data.properties!.name = 'Changed'; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.variables[0].graphTabId = 'elsewhere'; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.documents!['identity-int'].nodes.find(node => node.id === 'local-1-define')!.data.properties!.nativeType = 'int'; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { const doc = graph.documents!['identity-int']; doc.edges.find(edge => edge.target === 'local-0-define' && edge.targetHandle === 'value')!.source = 'local-1-get'; },
    (graph: ReturnType<typeof csharpLocalGraph>) => { graph.documents!['identity-int'].nodes.find(node => node.id === 'local-0-define')!.data.properties!.nativeType = 'go-int'; },
  ]) {
    const graph = csharpLocalGraph(CSHARP_LOCAL_GRAPHS[0]); change(graph);
    for (const doc of Object.values(graph.documents!)) for (const node of doc.nodes) { delete node.data.properties?.sourceOrigin; delete node.data.properties?.sourceImport; }
    expect(() => transpileGraph(graph)).toThrow();
  }
});

test('fixed C# local graph retains native statements and bindings through project normalization', () => {
  expect(savedLocal).toEqual(csharpLocalGraph(CSHARP_LOCAL_GRAPHS[0]));
  const graph = structuredClone(savedLocal) as unknown as ReturnType<typeof csharpLocalGraph>;
  const snapshot = normalizeProjectSnapshot({ ...structuredClone(savedProject), projectDetails: { ...savedProject.projectDetails, moduleName: graph.moduleName }, variables: graph.variables, functions: graph.functions, classes: graph.classes, activeClassId: graph.activeClassId, activeGraphTab: 'main-graph', documents: { ...graph.documents, 'main-graph': { nodes: graph.nodes, edges: graph.edges } }, graphContainers: [{ id: 'main-graph', name: graph.moduleName }], openTabs: [{ id: 'main-graph', type: 'container', name: graph.moduleName }, { id: 'identity-int', type: 'function', name: 'Function: Evaluate' }] });
  expect(snapshot).toBeDefined();
  const code = transpileProject({ ...snapshot!, projectEvents: snapshot!.events }).files[0].content;
  expect(code).toBe(transpileGraph(graph).files[0].content);
  expect(snapshot!.variables.find(variable => variable.id === 'local-0')?.flags?.readonly).toBe(true);
});
