import { applyFunctionImplementBinding, applyFunctionEntryBinding, NATIVE_SCALAR_SIGNATURE_TYPES, nativeScalarSignaturePin, buildNativeConstantGraph, type NativeConstantExpression, type ProjectSnapshot, type VVSNodeData, type NativeScalarLanguage } from '@vvs/graph-types';

const data = (kindId: string): VVSNodeData => ({ label: kindId, kindId, category: 'Project', inputs: [], outputs: [], inlineValues: {}, properties: {} });

/** Complete saved graph projects, never source-body substitution. */
export function nativeScalarProjectFixture(language: NativeScalarLanguage): ProjectSnapshot {
  const snapshot: ProjectSnapshot = { version: 2, savedAt: '', projectDetails: { moduleName: 'NativeFunctions', extendsType: '', description: 'Native scalar saved graph proof' }, variables: [], events: [], functions: [], openTabs: [{ id: 'main-graph', type: 'container', name: 'NativeFunctions' }], activeGraphTab: 'main-graph', targetLanguage: language, autoCompile: false, autoSave: false, installedLibrary: [], classes: [{ kind: 'class', id: 'global-main-graph', name: 'Global', containerId: 'main-graph', visibility: 'public', isGlobalScope: true }], activeClassId: 'global-main-graph', graphContainers: [{ id: 'main-graph', name: 'NativeFunctions' }], documents: { 'main-graph': { nodes: [], edges: [] } } };
  const types = [...NATIVE_SCALAR_SIGNATURE_TYPES[language], language === 'rust' ? '()' : 'void'];
  snapshot.documents['main-graph'].metadata = { targetLanguage: language, compilationUnit: { version: 1, entryPolicy: 'library' } };
  for (const [index, nativeType] of types.entries()) {
    const id = `identity-${index}`, unit = ['void', '()'].includes(nativeType), pin = nativeScalarSignaturePin(nativeType, language);
    const fn = { kind: 'function' as const, id, name: `Identity_${index}`, classId: 'global-main-graph', binding: 'module' as const, overloads: [{ id: 'o1', parameters: unit ? [] : [{ id: 'value', label: 'Value', type: pin! }], returnType: unit ? 'void' as const : pin!, graphTabId: id }] };
    snapshot.functions.push(fn);
    const definition = data('function_implement');
    definition.properties = { nativeSignatureLanguage: language, functionName: fn.name, nativeParameters: unit ? [] : [{ id: 'value', name: 'Value', mode: 'positional', nativeType, authoredType: nativeType, mutable: language !== 'rust' }], nativeAuthoredReturnType: nativeType, nativeReturnType: nativeType };
    const home = snapshot.documents['main-graph'];
    home.nodes.push({ id: `${id}-define`, type: 'vvs_standard_node', position: { x: index * 220, y: 0 }, data: applyFunctionImplementBinding(definition, fn) });
    if (index) home.edges.push({ id: `member-${index}`, source: `identity-${index - 1}-define`, sourceHandle: 'exec_out', target: `${id}-define`, targetHandle: 'exec_in', data: { pinType: 'execution' } });
    const entry = data('function_entry'); entry.properties = { nativeSignatureLanguage: language };
    const body = { nodes: [{ id: `${id}-entry`, type: 'vvs_standard_node', position: { x: 0, y: 0 }, data: applyFunctionEntryBinding(entry, fn) }], edges: [] } as ProjectSnapshot['documents'][string];
    if (!unit) {
      body.nodes.push({ id: `${id}-return`, type: 'vvs_standard_node', position: { x: 300, y: 0 }, data: { ...data('flow_return'), inputs: [{ id: 'exec_in', label: '', type: 'execution' }, { id: 'val', label: 'Value', type: pin! }] } });
      body.edges.push({ id: `${id}-flow`, source: `${id}-entry`, sourceHandle: 'exec_out', target: `${id}-return`, targetHandle: 'exec_in', data: { pinType: 'execution' } }, { id: `${id}-value`, source: `${id}-entry`, sourceHandle: 'value', target: `${id}-return`, targetHandle: 'val', data: { pinType: pin! } });
    }
    snapshot.documents[id] = body;
    snapshot.openTabs.push({ id, type: 'function', name: fn.name });
  }
  return JSON.parse(JSON.stringify(snapshot));
}

export function nativeScalarConstantProjectFixture(language: NativeScalarLanguage, tree: NativeConstantExpression, nativeType: string): ProjectSnapshot {
  const project = nativeScalarProjectFixture(language), fn = project.functions[0];
  project.functions = [fn]; project.openTabs = project.openTabs.filter(tab => ['main-graph', fn.id].includes(tab.id));
  project.documents = { 'main-graph': project.documents['main-graph'], [fn.id]: project.documents[fn.id] };
  const home = project.documents['main-graph']; home.nodes = [home.nodes[0]]; home.edges = [];
  const pin = nativeScalarSignaturePin(nativeType, language)!;
  fn.overloads[0].parameters = []; fn.overloads[0].returnType = pin;
  home.nodes[0].data.properties = { ...home.nodes[0].data.properties, nativeParameters: [], nativeReturnType: nativeType, nativeAuthoredReturnType: nativeType, nativeModifiers: language === 'cpp' ? ['constexpr'] : language === 'rust' ? ['const'] : [] };
  home.nodes[0].data = applyFunctionImplementBinding(home.nodes[0].data, fn);
  const body = project.documents[fn.id];
  body.nodes[0].data = applyFunctionEntryBinding(body.nodes[0].data, fn);
  body.nodes[1].data.inputs[1].type = pin;
  body.edges = [body.edges[0]];
  const constant = buildNativeConstantGraph(tree, language);
  body.nodes.push(...constant.document.nodes); body.edges.push(...constant.document.edges);
  body.edges.push({ id: 'constant-return', source: constant.rootId, sourceHandle: 'result', target: body.nodes[1].id, targetHandle: 'val', data: { pinType: pin } });
  return JSON.parse(JSON.stringify(project));
}
