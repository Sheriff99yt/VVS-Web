import { describe, expect, test } from 'bun:test';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileGraph, transpileProject } from './generate';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';

function transpileCoverageLabRust() {
  const snapshot = createCoverageLabUsabilityTestSnapshot();
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
  const snapshot = createCoverageLabUsabilityTestSnapshot();
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

function transpileSensorRust() {
  const snapshot = createCoverageLabUsabilityTestSnapshot();
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return transpileGraph({
    moduleName: 'Sensor',
    extendsType: 'Machine',
    targetLanguage: 'rust',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: home.nodes,
    edges: home.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: SENSOR_CLASS.id,
  });
}

describe('CL-008 rust static / const items', () => {
  test('Coverage Lab Serial is a real static item, not a struct field or // static', () => {
    const result = transpileMachineRust();
    const code = result.files[0]!.content;
    expect(code).toMatch(/^pub static Serial: f32 = 0;/m);
    expect(code).toMatch(/^    pub const MaxPower: f32 = 100;/m);
    expect(code).not.toMatch(/^\s+pub Serial: f32,/m);
    expect(code).not.toMatch(/^\s+pub MaxPower: f32,/m);
    expect(code).not.toContain('// static');
    expect(code).not.toContain('// const');
    expect(code).not.toMatch(/Serial:\s*0/);
    expect(code).not.toMatch(/MaxPower:\s*100/);

    const lines = code.split('\n');
    const staticLine = lines.findIndex((l) => l.includes('pub static Serial')) + 1;
    const constLine = lines.findIndex((l) => l.includes('pub const MaxPower')) + 1;
    expect(staticLine).toBeGreaterThan(0);
    expect(constLine).toBeGreaterThan(0);
    expect(result.sourceMap['lab-var-serial']?.some((r) => r.startLine === staticLine)).toBe(true);
    expect(result.sourceMap['lab-var-max']?.some((r) => r.startLine === constLine)).toBe(true);
  });

  test('fn new initializes instance fields only', () => {
    const code = transpileMachineRust().files[0]!.content;
    const ctor = code.match(/pub fn new\(\) -> Self \{[\s\S]*?^    \}/m)?.[0] ?? '';
    expect(ctor).toMatch(/Power:\s*0/);
    expect(ctor).toMatch(/Ready:\s*false/);
    expect(ctor).not.toMatch(/Serial:/);
    expect(ctor).not.toMatch(/MaxPower:/);
  });
});

describe('CL-009 rust HashMap import', () => {
  test('Sensor-only emit adds a visible use tagged to Tags', () => {
    const result = transpileSensorRust();
    const code = result.files[0]!.content;
    expect(code).toContain('use std::collections::HashMap;');
    expect(code).toContain('pub Tags: HashMap<String, String>,');
    expect(code).toContain('Tags: HashMap::new()');
    expect(code).not.toContain('vvs::HashMap');
    expect(code).not.toContain('VvsHashMap');

    const lines = code.split('\n');
    const useLine = lines.findIndex((l) => l.includes('use std::collections::HashMap;')) + 1;
    expect(useLine).toBeGreaterThan(0);
    expect(result.sourceMap['lab-var-tags']?.some((r) => r.startLine === useLine)).toBe(true);
  });

  test('merged Coverage Lab rust file has one HashMap use at the top', () => {
    const result = transpileCoverageLabRust();
    const code = result.files.find((f) => f.path.includes('CoverageLab'))?.content ?? '';
    const uses = code.match(/use std::collections::HashMap;/g) ?? [];
    expect(uses).toHaveLength(1);
    const firstReal = code
      .split('\n')
      .find((l) => l.trim() && !l.trim().startsWith('//'));
    expect(firstReal).toBe('use std::collections::HashMap;');
    expect(code).toContain('pub Tags: HashMap<String, String>,');
    expect(code).toMatch(/^pub static Serial: f32 = 0;/m);
    expect(code).toMatch(/^    pub const MaxPower: f32 = 100;/m);

    const lines = code.split('\n');
    const useLine = lines.findIndex((l) => l.includes('use std::collections::HashMap;')) + 1;
    expect(result.sourceMap['lab-var-tags']?.some((r) => r.startLine === useLine)).toBe(true);
  });
});
