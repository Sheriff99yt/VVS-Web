import { describe, expect, test } from 'bun:test';
import { analyzeProject } from '@vvs/graph-types';
import { nodeEffectiveness } from '@vvs/language-profiles';
import { transpileGraph, transpileProject } from '@vvs/transpiler';
import { emitProjectLikeCodePanel } from '@/lib/emitProjectCode';
import {
  createCoverageLabUsabilityTestSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from './coverageLabUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('coverage lab usability example', () => {
  test('strict analysis passes', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const analysis = analyzeProject(snapshot);
    expect(analysis.ok).toBe(true);
  });

  test('both classes live on the same home graph', () => {
    expect(MACHINE_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(SENSOR_CLASS.containerId).toBe(MAIN_GRAPH_CONTAINER_ID);
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const classDefines = home.nodes.filter((n) => n.data.kindId === 'class_define');
    expect(classDefines).toHaveLength(2);
  });

  test('1:1 member order — fields before Boot; event Y order (pulse above start)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const code =
      transpileGraph({
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
      }).files[0]?.content ?? '';

    const power = code.indexOf('Power =');
    const boot = code.indexOf('def Boot(self):');
    const onPulse = code.indexOf('def on_pulse(self):');
    const onStart = code.indexOf('def on_start(self):');
    expect(power).toBeGreaterThan(-1);
    expect(boot).toBeGreaterThan(power);
    // pulse Declare is visually higher on canvas → emits before start
    expect(onPulse).toBeGreaterThan(boot);
    expect(onStart).toBeGreaterThan(onPulse);
    expect(code).toContain('# (x) Declare Boot');
    expect(code).toContain('# (x) Declare Diagnose');
    expect(code).not.toContain('# abstract Diagnose');
  });

  test('U79 Code panel path: two Event Declare Y orders flip on_pulse / on_start', () => {
    const base = createCoverageLabUsabilityTestSnapshot();
    const home = base.documents![MAIN_GRAPH_CONTAINER_ID]!;

    const homePreview = (snapshot: typeof base) => {
      const result = emitProjectLikeCodePanel(snapshot, { targetLanguage: 'python' });
      return result.files.find((f) => f.path === 'src/CoverageLab.py')?.content ?? '';
    };

    // Order A — fixture default: pulse higher (y:-280) than start (y:-120)
    const orderA = homePreview(base);
    const pulseA = orderA.indexOf('def on_pulse(self):');
    const startA = orderA.indexOf('def on_start(self):');
    expect(pulseA).toBeGreaterThan(-1);
    expect(startA).toBeGreaterThan(-1);
    expect(pulseA).toBeLessThan(startA);

    // Order B — same wires; start higher than pulse
    const flippedNodes = home.nodes.map((n) => {
      if (n.id === 'lab-evt-pulse-mem') return { ...n, position: { ...n.position, y: -120 } };
      if (n.id === 'lab-evt-start-mem') return { ...n, position: { ...n.position, y: -280 } };
      return n;
    });
    const orderB = homePreview({
      ...base,
      documents: {
        ...base.documents,
        [MAIN_GRAPH_CONTAINER_ID]: { ...home, nodes: flippedNodes },
      },
    });
    const pulseB = orderB.indexOf('def on_pulse(self):');
    const startB = orderB.indexOf('def on_start(self):');
    expect(startB).toBeGreaterThan(-1);
    expect(pulseB).toBeGreaterThan(-1);
    expect(startB).toBeLessThan(pulseB);

    // Def placement actually changed between the two Code-panel emits
    expect(pulseA < startA).toBe(true);
    expect(startB < pulseB).toBe(true);
    expect(orderA).not.toEqual(orderB);
  });

  test('lock: Coverage Lab Function Declares use U66 (x) on Python (no fake # abstract)', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const declares = home.nodes.filter((n) => n.data.kindId === 'function_define');
    expect(declares.length).toBeGreaterThanOrEqual(3);
    for (const node of declares) {
      expect(
        nodeEffectiveness('function_define', node.data.properties ?? {}, 'python')
      ).toBe('ineffective');
    }
    const code =
      transpileGraph({
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
      }).files[0]?.content ?? '';
    // Ban the old stub form that skipped dim/(x) for abstract Declare Diagnose.
    expect(code).not.toMatch(/^\s*# abstract /m);
    expect(code).not.toMatch(/^\s*\/\/ abstract /m);
    for (const name of ['Boot', 'Diagnose', 'Shutdown']) {
      expect(code).toContain(`# (x) Declare ${name}`);
    }
  });

  test('Python boolean literals use True/False', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const shutdown = snapshot.documents!['fn-shutdown']!;
    const code =
      transpileGraph({
        moduleName: 'Shutdown',
        extendsType: '',
        targetLanguage: 'python',
        variables: snapshot.variables,
        projectEvents: snapshot.events,
        functions: snapshot.functions,
        nodes: shutdown.nodes,
        edges: shutdown.edges,
        tabId: 'fn-shutdown',
        documents: snapshot.documents,
        classes: snapshot.classes,
        activeClassId: MACHINE_CLASS.id,
      }).files[0]?.content ?? '';
    expect(code).toContain('self.Ready = False');
    expect(code).not.toContain('self.Ready = false');
  });

  test('transpileProject emits one home module with Machine and Sensor', () => {
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
    expect(home).toContain('from enum import Enum');
    expect(home).toContain('class Machine:');
    expect(home).toContain('class SensorStatus(Enum):');
    expect(home).toContain('class Sensor(Machine)');
    expect(home.indexOf('class Machine:')).toBeLessThan(home.indexOf('class Sensor(Machine)'));
    // Shared imports once at file top — before both classes.
    expect(home.indexOf('from enum import Enum')).toBeLessThan(home.indexOf('class Machine:'));
    expect(home.indexOf('class Machine:')).toBeLessThan(home.indexOf('class SensorStatus'));
    // Conditional import inside Ready=false branch (Python-style).
    expect(home).toMatch(/else:\s*\n\s+import json\s*\n\s+print\("Not ready"\)/);
    expect(home).toContain('Operator name?');
    expect(home).toMatch(/input\(/);
    expect(home).toContain('Host = None');
    expect(home).toContain('Status = SensorStatus.OK');
  });

  test('TypeRef user types — enum / class / typed array in C++ home', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails!,
      targetLanguage: 'cpp',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const home = result.files.find((f) => f.path === 'src/CoverageLab.cpp')!.content;
    expect(home).toContain('SensorStatus Status = SensorStatus::OK');
    expect(home).toContain('Machine Host = {}');
    expect(home).toContain('std::vector<float> Readings');
    expect(home).toContain('std::unordered_map<std::string, std::string> Tags = {}');
    // Declare isOverride on Report → Define emits postfix override (skill AdvancedClass style).
    expect(home).toContain('void Report() override');
  });

  test('C++ Machine golden — modifiers and 1:1 order', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const code = transpileGraph({
      moduleName: 'Machine',
      extendsType: '',
      targetLanguage: 'cpp',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: home.nodes,
      edges: home.edges,
      tabId: MAIN_GRAPH_CONTAINER_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: MACHINE_CLASS.id,
    }).files[0]?.content ?? '';

    expect(code).toContain('class Machine {');
    expect(code).toContain('#include <iostream>');
    expect(code).toContain('protected:');
    expect(code).toContain('float Power');
    expect(code).toContain('inline static float Serial');
    expect(code).toContain('const float MaxPower');
    expect(code).toContain('virtual void Boot(');
    expect(code).toContain('virtual void Diagnose() = 0');
    expect(code).toContain('void Shutdown(');
    // Declare+Define: body starts with statements — no function_entry `// Boot` noise.
    expect(code).not.toContain('// Boot');
    expect(code).not.toContain('// Declare');
    expect(code.indexOf('Power')).toBeLessThan(code.indexOf('void Boot'));
    expect(code.indexOf('void Boot')).toBeLessThan(code.indexOf('void on_pulse'));
    expect(code.indexOf('void on_pulse')).toBeLessThan(code.indexOf('void on_start'));
    // Import node owns iostream — no invented Default / forced public on protected-first member
    expect(code).not.toContain('impl Default');
    expect(code.indexOf('protected:')).toBeLessThan(code.indexOf('public:'));
  });

  test('Sensor inherits Machine; Rust uses composition field', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const result = transpileProject({
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
    const home = result.files.find((f) => /CoverageLab/i.test(f.path))!.content;
    expect(home).toContain('base: Machine,');
    expect(home).toContain('struct Machine');
    expect(home).toContain('struct Sensor');
  });

  test('language-gated imports only emit for matching targets in the home file', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const py = transpileProject({
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
    const homePy = py.files.find((f) => /CoverageLab/i.test(f.path))!.content;
    expect(homePy).toContain('from enum import Enum');
    expect(homePy).not.toContain('#include');
    expect(homePy).not.toContain('using System');

    const cpp = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'cpp',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const homeCpp = cpp.files.find((f) => /CoverageLab/i.test(f.path))!.content;
    expect(homeCpp).toContain('#include <iostream>');
    expect(homeCpp).toContain('#include <string>');
    expect(homeCpp).toContain('#include <vector>');
    expect(homeCpp).toContain('#include <unordered_map>');
    expect(homeCpp).not.toContain('from enum import');
    // Shared Import iostream once at file top (no per-class duplicate).
    expect(homeCpp.split('#include <iostream>').length - 1).toBe(1);
    // Conditional Import json is Python-gated — inactive comment in C++ branch body.
    expect(homeCpp).toMatch(/else \{\s*\n\s*\/\/ \(x\) Import json/);

    const cs = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'csharp',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
      integration: snapshot.integration,
    });
    const homeCs = cs.files.find((f) => /CoverageLab/i.test(f.path))!.content;
    expect(homeCs).toContain('using System;');
    expect(homeCs).toContain('using System.Collections.Generic;');
    expect(homeCs).not.toContain('#include');
  });
});
