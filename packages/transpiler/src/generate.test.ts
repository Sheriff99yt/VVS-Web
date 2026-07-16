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
    expect(code).toContain('# (x) Declare Boot');
    expect(code).toContain('# (x) Declare Shutdown');
    expect(code).toContain('# abstract Diagnose');
  });

  test('Python sourceMap: Declare→(x) only; Define→def; abstract→comment', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot));
    const lines = result.files[0]!.content.split('\n');
    const xBoot = lines.findIndex((l) => l.includes('(x) Declare Boot')) + 1;
    const defBoot = lines.findIndex((l) => l.includes('def Boot(self):')) + 1;
    const absLine = lines.findIndex((l) => l.includes('abstract Diagnose')) + 1;
    expect(xBoot).toBeGreaterThan(0);
    expect(defBoot).toBeGreaterThan(0);
    expect(absLine).toBeGreaterThan(0);
    const declareBoot = result.sourceMap['lab-fn-boot']!.map((r) => r.startLine);
    const defineBoot = result.sourceMap['lab-fn-boot-impl']!.map((r) => r.startLine);
    expect(declareBoot).toContain(xBoot);
    expect(declareBoot).not.toContain(defBoot);
    expect(defineBoot).toContain(defBoot);
    expect(result.sourceMap['lab-fn-diagnose']!.map((r) => r.startLine)).toContain(absLine);
  });

  test('non-C++ Coverage Lab langs: (x) Declare, abstract, sourceMap split', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const cases: Array<{
      lang: 'javascript' | 'csharp' | 'rust' | 'gdscript' | 'verse';
      bootHeader: RegExp;
      abstractNeedle: string | RegExp;
    }> = [
      { lang: 'javascript', bootHeader: /^\s*Boot\(\)\s*\{/, abstractNeedle: 'abstract Diagnose' },
      { lang: 'csharp', bootHeader: /void Boot\(\)\s*\{/, abstractNeedle: /abstract\s+void\s+Diagnose/ },
      { lang: 'rust', bootHeader: /fn Boot\(/, abstractNeedle: 'abstract Diagnose' },
      { lang: 'gdscript', bootHeader: /func Boot\(/, abstractNeedle: 'abstract Diagnose' },
      { lang: 'verse', bootHeader: /^\s*Boot.*: void/, abstractNeedle: 'abstract Diagnose' },
    ];
    for (const { lang, bootHeader, abstractNeedle } of cases) {
      const result = transpileGraph(machineCtx(snapshot, { targetLanguage: lang }));
      const content = result.files[0]!.content;
      const lines = content.split('\n');
      expect(content).toContain('(x) Declare Boot');
      const xBoot = lines.findIndex((l) => l.includes('(x) Declare Boot')) + 1;
      const defBoot = lines.findIndex((l) => bootHeader.test(l)) + 1;
      const absLine =
        typeof abstractNeedle === 'string'
          ? lines.findIndex((l) => l.includes(abstractNeedle)) + 1
          : lines.findIndex((l) => abstractNeedle.test(l)) + 1;
      expect(xBoot).toBeGreaterThan(0);
      expect(defBoot).toBeGreaterThan(0);
      expect(absLine).toBeGreaterThan(0);
      const declareBoot = result.sourceMap['lab-fn-boot']!.map((r) => r.startLine);
      expect(declareBoot).toContain(xBoot);
      expect(declareBoot).not.toContain(defBoot);
      expect(result.sourceMap['lab-fn-boot-impl']!.map((r) => r.startLine)).toContain(defBoot);
      expect(result.sourceMap['lab-fn-diagnose']!.map((r) => r.startLine)).toContain(absLine);
    }
  });

  test('emitUnsupportedComments false omits (x) Declare; abstract still emits', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const py = transpileGraphCode(
      machineCtx(snapshot, { emitUnsupportedComments: false })
    );
    expect(py).toContain('def Boot(self):');
    expect(py).not.toContain('(x) Declare');
    expect(py).toContain('# abstract Diagnose');

    const cs = transpileGraphCode(
      machineCtx(snapshot, {
        targetLanguage: 'csharp',
        emitUnsupportedComments: false,
      })
    );
    expect(cs).toContain('void Boot()');
    expect(cs).not.toContain('(x) Declare');
    expect(cs).toMatch(/abstract\s+void\s+Diagnose/);
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
    expect(paths).not.toContain('src/Boot.py');
    expect(paths).toEqual(['src/CoverageLab.py']);
    const home = result.files.find((f) => f.path === 'src/CoverageLab.py')!.content;
    expect(home).toContain('def Boot(');
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

  test('Advanced Machine C++ golden — Declare prototype + out-of-line Define (U82)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot, { targetLanguage: 'cpp' }));
    const code = result.files[0]!.content;

    expect(code).toContain('class Machine {');
    expect(code).toContain('protected:');
    expect(code).toContain('inline static float Serial');
    expect(code).toContain('const float MaxPower');
    expect(code).toContain('virtual void Boot();');
    expect(code).toContain('virtual void Diagnose() = 0');
    expect(code).toContain('void Machine::Boot() {');
    expect(code).toContain('void Machine::Shutdown() {');
    expect(code).not.toContain('virtual void Boot() {');
    expect(code).not.toContain('// Declare');
    expect(code.indexOf('Power')).toBeLessThan(code.indexOf('virtual void Boot();'));
    expect(code.indexOf('virtual void Boot();')).toBeLessThan(code.indexOf('void on_start'));
    expect(code.indexOf('};')).toBeLessThan(code.indexOf('void Machine::Boot()'));
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

  test('json target dumps graph JSON (not Unsupported language)', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const main = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const result = transpileGraph({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: 'json',
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
    expect(result.language).toBe('json');
    expect(result.files[0]?.path).toMatch(/\.json$/);
    const parsed = JSON.parse(result.files[0]!.content);
    expect(parsed.graph.nodes.length).toBeGreaterThan(0);
    expect(parsed.metadata.moduleName).toBeTruthy();
    expect(result.files[0]!.content).not.toContain('Unsupported language');
  });

  test('transpileProject json metadata emits graph JSON for home graph', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const homeId = MAIN_GRAPH_CONTAINER_ID;
    const documents = structuredClone(snapshot.documents!);
    documents[homeId] = {
      ...documents[homeId]!,
      metadata: {
        ...documents[homeId]!.metadata!,
        targetLanguage: 'json',
        targetFileExtension: 'json',
      },
    };

    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
    });

    const jsonFile = result.files.find((f) => f.path.endsWith('.json'));
    expect(jsonFile).toBeTruthy();
    const parsed = JSON.parse(jsonFile!.content);
    expect(parsed.graph.nodes.length).toBeGreaterThan(0);
    expect(jsonFile!.content).not.toContain('Unsupported language');
  });

  test('U81 — Declare without Define emits no method (no stub magic)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = structuredClone(snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!);
    home.nodes = home.nodes.filter((n) => n.id !== 'lab-fn-boot-impl');
    home.edges = home.edges.filter(
      (e) => e.source !== 'lab-fn-boot-impl' && e.target !== 'lab-fn-boot-impl'
    );
    // Re-wire Declare Boot → Diagnose after removing Define.
    home.edges = home.edges.filter((e) => e.id !== 'lab-mm-4b' && e.id !== 'lab-mm-5');
    home.edges.push({
      id: 'lab-mm-boot-diagnose',
      source: 'lab-fn-boot',
      target: 'lab-fn-diagnose',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_wire_edge',
      data: { pinType: 'execution' },
    });
    const code = transpileGraphCode(
      machineCtx({
        ...snapshot,
        documents: { ...snapshot.documents!, [MAIN_GRAPH_CONTAINER_ID]: home },
      })
    );
    expect(code).not.toContain('def Boot(self):');
    expect(code).not.toContain('Booted');
    expect(code).toContain('# (x) Declare Boot');
    expect(code).toContain('async def Shutdown(self):');
  });

  test('U82 — C++ Declare without Define emits prototype only', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = structuredClone(snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!);
    home.nodes = home.nodes.filter((n) => n.id !== 'lab-fn-boot-impl');
    home.edges = home.edges.filter(
      (e) => e.source !== 'lab-fn-boot-impl' && e.target !== 'lab-fn-boot-impl'
    );
    home.edges = home.edges.filter((e) => e.id !== 'lab-mm-4b' && e.id !== 'lab-mm-5');
    home.edges.push({
      id: 'lab-mm-boot-diagnose',
      source: 'lab-fn-boot',
      target: 'lab-fn-diagnose',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_wire_edge',
      data: { pinType: 'execution' },
    });
    const code = transpileGraph(
      machineCtx(
        {
          ...snapshot,
          documents: { ...snapshot.documents!, [MAIN_GRAPH_CONTAINER_ID]: home },
        },
        { targetLanguage: 'cpp' }
      )
    ).files[0]!.content;
    expect(code).toContain('virtual void Boot();');
    expect(code).not.toContain('void Machine::Boot()');
    expect(code).not.toContain('Booted');
    expect(code).toContain('void Machine::Shutdown()');
  });

  test('U82 — C++ sourceMap: prototype→Declare, out-of-line→Define', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileGraph(machineCtx(snapshot, { targetLanguage: 'cpp' }));
    expect(result.sourceMap['lab-fn-boot']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['lab-fn-boot-impl']?.length).toBeGreaterThan(0);
    const code = result.files[0]!.content;
    const protoLine = code.split('\n').findIndex((l) => l.includes('virtual void Boot();')) + 1;
    const outLine = code.split('\n').findIndex((l) => l.includes('void Machine::Boot()')) + 1;
    expect(protoLine).toBeGreaterThan(0);
    expect(outLine).toBeGreaterThan(0);
    const declareLines = result.sourceMap['lab-fn-boot']!.map((r) => r.startLine);
    const defineLines = result.sourceMap['lab-fn-boot-impl']!.map((r) => r.startLine);
    expect(declareLines).toContain(protoLine);
    expect(declareLines).not.toContain(outLine);
    expect(defineLines).toContain(outLine);
    expect(defineLines).not.toContain(protoLine);
  });

  test('U82 — two graphs .h Declares + .cpp Defines (no invented include)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const homeId = MAIN_GRAPH_CONTAINER_ID;
    const implId = 'machine-impl-cpp';
    const home = structuredClone(snapshot.documents![homeId]!);
    // Strip Defines from home — header-style Declares only for Boot/Shutdown.
    const implNodeIds = new Set(['lab-fn-boot-impl', 'lab-fn-shutdown-impl']);
    home.nodes = home.nodes.filter((n) => !implNodeIds.has(n.id));
    home.edges = home.edges.filter(
      (e) => !implNodeIds.has(e.source) && !implNodeIds.has(e.target)
    );
    home.edges = home.edges.filter((e) => e.id !== 'lab-mm-4b' && e.id !== 'lab-mm-6b');
    home.edges.push({
      id: 'lab-mm-boot-diagnose',
      source: 'lab-fn-boot',
      target: 'lab-fn-diagnose',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_wire_edge',
      data: { pinType: 'execution' },
    });
    home.edges.push({
      id: 'lab-mm-diagnose-shutdown',
      source: 'lab-fn-diagnose',
      target: 'lab-fn-shutdown',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_wire_edge',
      data: { pinType: 'execution' },
    });
    home.edges.push({
      id: 'lab-mm-shutdown-start',
      source: 'lab-fn-shutdown',
      target: 'lab-evt-start-mem',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_wire_edge',
      data: { pinType: 'execution' },
    });
    home.metadata = {
      ...home.metadata!,
      targetLanguage: 'cpp',
      targetFileExtension: 'h',
    };

    const original = snapshot.documents![homeId]!;
    const bootImpl = original.nodes.find((n) => n.id === 'lab-fn-boot-impl')!;
    const shutdownImpl = original.nodes.find((n) => n.id === 'lab-fn-shutdown-impl')!;
    const implDoc = {
      nodes: [
        {
          id: 'impl-import-machine',
          type: 'vvs_standard_node' as const,
          position: { x: 0, y: 0 },
          data: {
            label: 'Import Machine',
            category: 'Imports',
            kindId: 'vvs.project.import_module',
            inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
            outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
            inlineValues: {},
            properties: {
              modulePath: 'Machine',
              importStyle: 'from',
              targetLanguages: 'cpp',
            },
          },
        },
        bootImpl,
        shutdownImpl,
      ],
      edges: [
        {
          id: 'impl-e0',
          source: 'impl-import-machine',
          target: 'lab-fn-boot-impl',
          sourceHandle: 'exec_out',
          targetHandle: 'exec_in',
          type: 'vvs_wire_edge',
          data: { pinType: 'execution' as const },
        },
        {
          id: 'impl-e1',
          source: 'lab-fn-boot-impl',
          target: 'lab-fn-shutdown-impl',
          sourceHandle: 'exec_out',
          targetHandle: 'exec_in',
          type: 'vvs_wire_edge',
          data: { pinType: 'execution' as const },
        },
      ],
      metadata: {
        targetLanguage: 'cpp' as const,
        targetFileExtension: 'cpp',
      },
    };

    // Keep Sensor defines on home so Sensor still emits; only Machine Boot/Shutdown moved.
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'cpp',
      targetFileExtensions: { cpp: 'cpp' },
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: {
        ...snapshot.documents!,
        [homeId]: home,
        [implId]: implDoc,
      },
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: [
        ...(snapshot.openTabs ?? []),
        { id: implId, type: 'container', name: 'Machine' },
      ],
    });

    const header = result.files.find((f) => f.path.endsWith('.h'));
    const impl = result.files.find(
      (f) => f.path.endsWith('.cpp') && f.content.includes('void Machine::Boot()')
    );
    expect(header).toBeTruthy();
    expect(impl).toBeTruthy();
    expect(header!.content).toContain('virtual void Boot();');
    expect(header!.content).not.toContain('void Machine::Boot()');
    expect(header!.content).not.toContain('Booted');
    expect(impl!.content).toContain('#include "Machine.h"');
    expect(impl!.content).toContain('void Machine::Boot() {');
    expect(impl!.content).toContain('Booted');
    expect(impl!.content).not.toContain('class Machine {');
  });

  test('U81 — Define owns def line; Declare maps only to (x) comment on Python', () => {
    const snapshot = createFirstGraphUsabilityTestSnapshot();
    const result = transpileGraph({
      moduleName: 'FirstGraph',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!.nodes,
      edges: snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });
    const code = result.files[0]!.content;
    const lines = code.split('\n');
    const defLine = lines.findIndex((l) => l.includes('def SayHello(self):')) + 1;
    const xLine = lines.findIndex((l) => l.includes('(x) Declare SayHello')) + 1;
    expect(code).toContain('Hello from SayHello!');
    expect(defLine).toBeGreaterThan(0);
    expect(xLine).toBeGreaterThan(0);
    const declareLines = result.sourceMap['fg-fn-hello']!.map((r) => r.startLine);
    const defineLines = result.sourceMap['fg-fn-hello-impl']!.map((r) => r.startLine);
    expect(declareLines).toContain(xLine);
    expect(declareLines).not.toContain(defLine);
    expect(defineLines).toContain(defLine);
  });
});
