import { describe, expect, test } from 'bun:test';
import { transpileGraphCode, transpileGraph, withProjectCodegenTarget } from './codegen';
import { createHelloWorldUsabilityTestSnapshot } from './usabilityExampleTests/helloWorldUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('transpileGraphCode', () => {
  test('emits python class from simple example', () => {
    const snapshot = createHelloWorldUsabilityTestSnapshot();
    const doc = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
    const code = transpileGraphCode({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: doc!.nodes,
      edges: doc!.edges,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      tabId: MAIN_GRAPH_CONTAINER_ID,
    });
    expect(code).toContain('class HelloWorld');
    expect(code).toContain('print(');
  });

  test('transpile result includes sourceMap for statement nodes', () => {
    const snapshot = createHelloWorldUsabilityTestSnapshot();
    const doc = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
    const result = transpileGraph({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: 'python',
      variables: [],
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: doc!.nodes,
      edges: doc!.edges,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      tabId: MAIN_GRAPH_CONTAINER_ID,
    });
    expect(Object.keys(result.sourceMap).length).toBeGreaterThan(0);
  });

  test('es2022 capability resolves via project codegen target', () => {
    const snapshot = createHelloWorldUsabilityTestSnapshot();
    const doc = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
    const ctx = withProjectCodegenTarget(
      {
        moduleName: snapshot.projectDetails.moduleName,
        extendsType: '',
        targetLanguage: 'javascript',
        variables: [],
        projectEvents: snapshot.events,
        functions: snapshot.functions,
        nodes: doc!.nodes,
        edges: doc!.edges,
        classes: snapshot.classes,
        activeClassId: snapshot.activeClassId,
        tabId: MAIN_GRAPH_CONTAINER_ID,
      },
      {
        targetLanguage: 'javascript',
        codegenCapabilities: { javascript: ['async', 'es2022'] },
      }
    );
    expect(ctx.codegenTarget?.capabilities).toContain('es2022');
  });
});
