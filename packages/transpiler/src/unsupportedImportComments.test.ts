import { describe, expect, test } from 'bun:test';
import { transpileGraph, transpileProject } from './generate';
import { createSimpleSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest';
import { createComplexSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/complexUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('unsupported import comments (U66)', () => {
  test('Simple python emit has no leftover import comments', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
      emitUnsupportedComments: true,
    });
    const home = result.files.find((f) => f.content.includes('class Hello'));
    expect(home).toBeTruthy();
    expect(home!.content).not.toContain('(x) Import');
    expect(home!.content).not.toContain('#include');
  });

  test('Complex python with comments off still has no leftover imports', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
      emitUnsupportedComments: false,
    });
    const home = result.files.find((f) => f.content.includes('class Counter'));
    expect(home).toBeTruthy();
    expect(home!.content).not.toContain('(x) Import');
  });

  test('transpileGraph default emitUnsupportedComments is true (Simple)', () => {
    const snapshot = createSimpleSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: 'Hello',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: home.nodes,
      edges: home.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.classes![0]!.id,
    });
    expect(result.files[0]!.content).not.toContain('# (x) Import');
  });
});
