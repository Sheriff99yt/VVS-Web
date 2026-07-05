import { describe, expect, test } from 'bun:test';
import { createProjectFromEnvironment } from '@vvs/environment-templates';
import { generateMockTranspileResult } from './generate';

describe('environment multi-file transpile', () => {
  test('python console app emits module and main.py', () => {
    const snapshot = createProjectFromEnvironment('env.python.console-app');
    expect(snapshot).not.toBeNull();

    const main = snapshot!.documents.main;
    const result = generateMockTranspileResult({
      moduleName: snapshot!.projectDetails.moduleName,
      extendsType: snapshot!.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot!.variables,
      projectEvents: snapshot!.events,
      functions: snapshot!.functions,
      nodes: main.nodes,
      edges: main.edges,
      tabId: 'main',
      environmentId: snapshot!.environmentId,
    });

    expect(result.files.length).toBeGreaterThanOrEqual(2);
    const moduleFile = result.files.find((f) => f.path.endsWith('.py') && f.path.includes('App'));
    const hostFile = result.files.find((f) => f.path === 'main.py');
    expect(moduleFile?.content).toContain('class App');
    expect(hostFile?.content).toContain('App().on_start()');
  });

  test('javascript browser app emits host index.html and main.js', () => {
    const snapshot = createProjectFromEnvironment('env.javascript.browser-app');
    expect(snapshot).not.toBeNull();

    const main = snapshot!.documents.main;
    const result = generateMockTranspileResult({
      moduleName: 'App',
      extendsType: 'Object',
      targetLanguage: 'javascript',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes: main.nodes,
      edges: main.edges,
      tabId: 'main',
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
    const nodes = [
      {
        id: 'start',
        type: 'vvs_standard_node' as const,
        position: { x: 0, y: 0 },
        data: {
          label: 'On Start',
          category: 'Events',
          kindId: 'event_on_start',
          inputs: [],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
          inlineValues: {},
        },
      },
      {
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
      },
    ];
    const edges = [
      {
        id: 'e1',
        source: 'start',
        target: 'print-native',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        data: { pinType: 'execution' as const },
      },
    ];

    const result = generateMockTranspileResult({
      moduleName: 'App',
      extendsType: 'object',
      targetLanguage: 'python',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes,
      edges,
      tabId: 'main',
      environmentId: 'env.python.console-app',
    });

    expect(result.files[0]?.content).toContain('print("hello")');
  });
});
