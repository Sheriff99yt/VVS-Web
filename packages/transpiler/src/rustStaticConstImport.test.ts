import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileGraph, transpileProject } from './generate';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';

function transpileAdvancedRust() {
  const snapshot = createAdvancedSnapshot();
  return transpileProject({
    projectDetails: snapshot.projectDetails,
    targetLanguage: 'rust',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    documents: snapshot.documents!,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
    openTabs: snapshot.openTabs,
    integration: snapshot.integration,
  });
}

function transpileMachineRust() {
  const snapshot = createAdvancedSnapshot();
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return transpileGraph({
    moduleName: 'Machine',
    extendsType: '',
    targetLanguage: 'rust',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: home.nodes,
    edges: home.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: MACHINE_CLASS.id,
  });
}

describe('CL-008 rust instance fields (Advanced)', () => {
  test('Machine Label is an instance field, not a leftover static comment', () => {
    const result = transpileMachineRust();
    const code = result.files[0]!.content;
    expect(code).toContain('Label');
    expect(code).not.toContain('// static');
    expect(code).not.toContain('// const');
    expect(code).toMatch(/pub fn new\(\)\s*->\s*Self/);
  });

  test('fn new initializes instance Label', () => {
    const code = transpileMachineRust().files[0]!.content;
    const ctor = code.match(/pub fn new\(\) -> Self \{[\s\S]*?^    \}/m)?.[0] ?? '';
    expect(ctor).toMatch(/Label:/);
  });
});

describe('CL-009 rust merged Advanced file', () => {
  test('merged Advanced rust file has Machine and Sensor', () => {
    const result = transpileAdvancedRust();
    const code = result.files.find((f) => f.path.includes('Advanced'))?.content ?? '';
    expect(code).toContain('struct Machine');
    expect(code).toContain('struct Sensor');
    expect(code).toContain('base: Machine::new()');
  });
});
