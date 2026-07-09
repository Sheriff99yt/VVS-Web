import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { createProjectFromEnvironment } from '@vvs/environment-templates';
import { transpileGraph } from './generate';
import { withTestEntryGraph } from './testEntryGraph';

describe('environment multi-file transpile', () => {
  test('python console app emits module and main.py', () => {
    const snapshot = createProjectFromEnvironment('env.python.console-app');
    expect(snapshot).not.toBeNull();

    const main = snapshot!.documents[MAIN_GRAPH_CONTAINER_ID];
    if (!main) throw new Error(`missing ${MAIN_GRAPH_CONTAINER_ID}`);
    const result = transpileGraph({
      moduleName: snapshot!.projectDetails.moduleName,
      extendsType: snapshot!.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot!.variables,
      projectEvents: snapshot!.events,
      functions: snapshot!.functions,
      nodes: main.nodes,
      edges: main.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot!.documents,
      classes: snapshot!.classes,
      activeClassId: snapshot!.activeClassId,
      environmentId: snapshot!.environmentId,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    const moduleFile = result.files.find((f) => f.path.endsWith('.py') && f.path.toLowerCase().includes('app'));
    const hostFile = result.files.find((f) => f.path === 'main.py');
    expect(moduleFile?.content).toContain('class App');
    expect(hostFile?.content).toContain('App().on_start()');
  });

  test('javascript browser app emits host index.html and main.js', () => {
    const snapshot = createProjectFromEnvironment('env.javascript.browser-app');
    expect(snapshot).not.toBeNull();

    const main = snapshot!.documents[MAIN_GRAPH_CONTAINER_ID];
    if (!main) throw new Error(`missing ${MAIN_GRAPH_CONTAINER_ID}`);
    const result = transpileGraph({
      moduleName: 'App',
      extendsType: 'Object',
      targetLanguage: 'javascript',
      variables: snapshot!.variables,
      projectEvents: snapshot!.events,
      functions: snapshot!.functions,
      nodes: main.nodes,
      edges: main.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot!.documents,
      classes: snapshot!.classes,
      activeClassId: snapshot!.activeClassId,
      environmentId: 'env.javascript.browser-app',
    });

    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('index.html');
    expect(paths).toContain('main.js');
    expect(result.files.find((f) => f.path === 'main.js')?.content).toContain('new App()');
  });
});

describe('env.call_native emission', () => {
  test('print native expands to manifest callExpr', () => {
    const printNative = {
      id: 'print-native',
      type: 'vvs_standard_node' as const,
      position: { x: 200, y: 0 },
      data: {
        label: 'print()',
        category: 'From environment',
        kindId: 'env.call_native',
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'msg', label: 'Message', type: 'data_string' as const },
        ],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: { msg: 'hello' },
        properties: { manifestMethodId: 'native.print' },
        graphBinding: { kind: 'env_native' as const, symbolId: 'native.print', manifestMethodId: 'native.print' },
      },
    };

    const result = transpileGraph(
      withTestEntryGraph({
        moduleName: 'App',
        extendsType: 'object',
        targetLanguage: 'python',
        variables: [],
        functions: [],
        nodes: [printNative],
        edges: [],
        environmentId: 'env.python.console-app',
      })
    );

    expect(result.files[0]?.content).toContain('print("hello")');
  });
});
