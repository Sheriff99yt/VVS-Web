import { describe, expect, test } from 'bun:test';
import { transpileGraphCode, transpileGraph, withProjectCodegenTarget, transpileGraphOffThread, executeTranspileJob } from './codegen';
import { createSimpleSnapshot } from './usabilityExampleTests/simpleUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('transpileGraphCode', () => {
  test('emits python class from simple example', () => {
    const snapshot = createSimpleSnapshot();
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
    expect(code).toContain('class Hello');
    expect(code).toContain('def Greet');
    expect(code).toContain('def on_start');
  });

  test('transpile result includes sourceMap for statement nodes', () => {
    const snapshot = createSimpleSnapshot();
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
    const snapshot = createSimpleSnapshot();
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

describe('transpile worker fallback', () => {
  test('forceMainThread matches generate() output on a tiny snapshot', async () => {
    const snapshot = createSimpleSnapshot();
    const doc = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
    const ctx = {
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python' as const,
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: doc!.nodes,
      edges: doc!.edges,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      tabId: MAIN_GRAPH_CONTAINER_ID,
    };
    const sync = transpileGraph(ctx);
    const viaJob = executeTranspileJob({ kind: 'graph', input: ctx });
    const off = await transpileGraphOffThread(ctx, { forceMainThread: true });
    expect(viaJob.files[0]?.content).toBe(sync.files[0]?.content);
    expect(off.files[0]?.content).toBe(sync.files[0]?.content);
    expect(off.language).toBe(sync.language);
  });
});
