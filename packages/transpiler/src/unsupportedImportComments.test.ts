import { describe, expect, test } from 'bun:test';
import { transpileGraph, transpileProject } from './generate';
import { createCoverageLabUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('unsupported import comments (U66)', () => {
  test('python with comments on emits (x) for cpp-only iostream', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    const home = result.files.find((f) => f.content.includes('class Machine'));
    expect(home).toBeTruthy();
    const code = home!.content;
    expect(code).toContain('# (x) Import iostream');
    expect(code).toContain('# (x) Import System');
    expect(code).toContain('from enum import Enum');
    expect(code).not.toContain('#include');
    expect(result.sourceMap['lab-import-iostream']?.length).toBeGreaterThan(0);
  });

  test('python with comments off omits gated imports (silent skip)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    const home = result.files.find((f) => f.content.includes('class Machine'));
    expect(home).toBeTruthy();
    const code = home!.content;
    expect(code).not.toContain('(x) Import iostream');
    expect(code).not.toContain('(x) Import System');
    expect(code).toContain('from enum import Enum');
  });

  test('cpp emits real include for iostream and (x) for python Enum', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'cpp',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
      emitUnsupportedComments: true,
    });
    const home = result.files.find((f) => f.content.includes('class Machine'));
    expect(home).toBeTruthy();
    const code = home!.content;
    expect(code).toContain('#include <iostream>');
    expect(code).toContain('// (x) Import Enum');
    expect(code).not.toContain('from enum import');
  });

  test('transpileGraph default emitUnsupportedComments is true', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: 'Machine',
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
    expect(result.files[0]!.content).toContain('# (x) Import iostream');
  });
});
