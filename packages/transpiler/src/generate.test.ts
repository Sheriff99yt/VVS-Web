import { describe, expect, test } from 'bun:test';
import {
  transpileGraphCode,
  transpileGraph,
  transpileProject,
  type CodegenContext,
} from './generate';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/coverageLabUsabilityTest';
import { createFirstGraphUsabilityTestSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/firstGraphUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function machineCtx(
  snapshot: ReturnType<typeof createCoverageLabUsabilityTestSnapshot>,
  overrides: Partial<CodegenContext> = {}
): CodegenContext {
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return {
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
    activeClassId: MACHINE_CLASS.id,
    ...overrides,
  };
}

describe('transpileGraphCode', () => {
  test('coverage lab Machine emits Boot, branch, and dispatch', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const code = transpileGraphCode(machineCtx(snapshot));

    expect(code).toContain('def Boot(self):');
    expect(code).toContain('self.Boot()');
    expect(code).toContain('if ');
    expect(code).toContain('self.on_pulse()');
    expect(code).toContain('async def Shutdown(self):');
    expect(code).not.toContain('# Declare');
  });

  test('canvas define chain emits members in graph order (1:1)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const code = transpileGraphCode(machineCtx(snapshot));
    const lines = code.split('\n');

    const lineClass = lines.findIndex((l) => l.includes('class Machine'));
    const linePower = lines.findIndex((l) => /Power\s*=/.test(l));
    const lineBoot = lines.findIndex((l) => l.includes('def Boot(self):'));
    const lineOnStart = lines.findIndex((l) => l.includes('def on_start(self):'));

    expect(lineClass).toBeGreaterThan(-1);
    expect(linePower).toBeGreaterThan(lineClass);
    expect(lineBoot).toBeGreaterThan(linePower);
    expect(lineOnStart).toBeGreaterThan(lineBoot);
  });

  test('var_define nodes map to declaration lines in sourceMap', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot));

    expect(result.sourceMap['lab-var-power']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['lab-machine-class']?.length).toBeGreaterThan(0);
  });

  test('event member define maps to method signature', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot));
    const content = result.files[0]!.content;
    const handlerLine =
      content.split('\n').findIndex((l) => l.includes('def on_pulse(self')) + 1;

    expect(result.sourceMap['lab-evt-pulse-mem']?.[0]?.startLine).toBe(handlerLine);
    expect(result.sourceMap['lab-on-pulse']?.length).toBeGreaterThan(0);
  });

  test('On Start maps to on_start handler not run', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot));
    const content = result.files[0]!.content;
    expect(content).toContain('def on_start(self):');
    expect(content).not.toContain('def run(self):');
  });

  test('function tab emits Boot body with cross-class Sensor tick dispatch', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const bootTab = snapshot.documents!['fn-boot']!;
    const code = transpileGraphCode({
      moduleName: 'Boot',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: bootTab.nodes,
      edges: bootTab.edges,
      tabId: 'fn-boot',
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: MACHINE_CLASS.id,
    });
    expect(code).toContain('def Boot');
    expect(code).toContain('Booted');
    expect(code).toContain('Sensor().on_tick()');
    expect(code).not.toContain('self.on_tick()');
  });

  test('transpileProject emits one CoverageLab module with Machine and Sensor', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const paths = result.files.map((f) => f.path).sort();
    expect(paths).toContain('src/CoverageLab.py');
    expect(paths).not.toContain('machine.py');
    expect(paths).not.toContain('sensor.py');
    expect(paths.some((p) => p.includes('Boot'))).toBe(true);
  });

  test('Sensor module has enum and extends Machine', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const code = transpileGraphCode({
      ...machineCtx(snapshot),
      moduleName: 'Sensor',
      activeClassId: SENSOR_CLASS.id,
      nodes: home.nodes,
      edges: home.edges,
    });
    expect(code).toContain('class SensorStatus(Enum)');
    expect(code).toContain('class Sensor(Machine)');
    expect(code).toContain('async def Sample');
    expect(code).toContain('def on_tick(self)');
    expect(code).not.toContain('Machine start');
  });

  test('async function flag emits async def in python', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const code = transpileGraphCode(machineCtx(snapshot));
    expect(code).toContain('async def Shutdown(self):');
  });

  test('Advanced Machine C++ golden — modifiers and 1:1 order', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot, { targetLanguage: 'cpp' }));
    const code = result.files[0]!.content;

    expect(code).toContain('class Machine {');
    expect(code).toContain('protected:');
    expect(code).toContain('inline static float Serial');
    expect(code).toContain('const float MaxPower');
    expect(code).toContain('virtual void Boot(');
    expect(code).toContain('virtual void Diagnose() = 0');
    expect(code).not.toContain('// Declare');
    expect(code.indexOf('Power')).toBeLessThan(code.indexOf('void Boot'));
    expect(code.indexOf('void Boot')).toBeLessThan(code.indexOf('void on_start'));
  });

  test('class home graph uses per-graph extension in output path', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const homeId = MAIN_GRAPH_CONTAINER_ID;
    const documents = structuredClone(snapshot.documents!);
    documents[homeId] = {
      ...documents[homeId]!,
      metadata: {
        ...documents[homeId]!.metadata!,
        targetLanguage: 'cpp',
        targetFileExtension: 'c',
      },
    };

    const result = transpileGraph({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'cpp',
      targetFileExtensions: { cpp: 'c' },
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: documents[homeId]!.nodes,
      edges: documents[homeId]!.edges,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      tabId: homeId,
      tabLabel: 'FirstGraph',
    });

    expect(result.files[0]?.path).toBe('firstgraph.c');
  });

  test('simple example class_define maps to class line', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const main = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: main.nodes,
      edges: main.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });
    expect(result.files[0]!.content).toContain('class FirstGraph');
    expect(result.sourceMap['fg-class-define']?.length).toBeGreaterThan(0);
  });
});
