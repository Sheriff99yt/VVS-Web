import { describe, expect, test } from 'bun:test';
import {
  transpileGraphCode,
  transpileGraph,
  transpileProject,
  type CodegenContext,
} from './generate';
import {
  createAdvancedSnapshot,
  MACHINE_CLASS,
  SENSOR_CLASS,
} from '../../../apps/web/src/lib/usabilityExampleTests/advancedUsabilityTest';
import { createComplexSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/complexUsabilityTest';
import { createSimpleSnapshot } from '../../../apps/web/src/lib/usabilityExampleTests/simpleUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

function homeCtx(
  snapshot: ReturnType<typeof createSimpleSnapshot>,
  overrides: Partial<CodegenContext> = {}
): CodegenContext {
  const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
  return {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType ?? '',
    targetLanguage: 'python',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: home.nodes,
    edges: home.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
    ...overrides,
  };
}

describe('transpileGraphCode', () => {
  test('Complex emits Add, branch, and on_start', () => {
    const snapshot = createComplexSnapshot();
    const code = transpileGraphCode(homeCtx(snapshot));

    expect(code).toContain('def Add(self, n):');
    expect(code).toContain('self.Add(');
    expect(code).toContain('if ');
    expect(code).toContain('def on_start(self):');
    expect(code).not.toContain('# (x) Declare Add');
  });

  test('Python sourceMap: Define owns def line; Declare does not', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    const lines = result.files[0]!.content.split('\n');
    const defAdd = lines.findIndex((l) => l.includes('def Add(self, n):')) + 1;
    expect(defAdd).toBeGreaterThan(0);
    expect(result.files[0]!.content).not.toContain('(x) Declare Add');
    const declareAdd = (result.sourceMap['cx-fn-add'] ?? []).map((r) => r.startLine);
    const defineAdd = result.sourceMap['cx-fn-add-impl']!.map((r) => r.startLine);
    expect(declareAdd).not.toContain(defAdd);
    expect(defineAdd).toContain(defAdd);
  });

  test('emitUnsupportedComments false omits leftover comments', () => {
    const snapshot = createComplexSnapshot();
    const py = transpileGraphCode(homeCtx(snapshot, { emitUnsupportedComments: false }));
    expect(py).toContain('def Add(self, n):');
    expect(py).not.toContain('(x)');
  });

  test('canvas define chain emits members in graph order (1:1)', () => {
    const snapshot = createComplexSnapshot();
    const code = transpileGraphCode(homeCtx(snapshot));
    const lines = code.split('\n');
    const lineClass = lines.findIndex((l) => l.includes('class Counter'));
    const lineTotal = lines.findIndex((l) => /Total\s*=/.test(l));
    const lineAdd = lines.findIndex((l) => l.includes('def Add(self, n):'));
    const lineOnStart = lines.findIndex((l) => l.includes('def on_start(self):'));
    expect(lineClass).toBeGreaterThanOrEqual(0);
    expect(lineTotal).toBeGreaterThan(lineClass);
    expect(lineAdd).toBeGreaterThan(lineTotal);
    expect(lineOnStart).toBeGreaterThan(lineAdd);
  });

  test('var_define nodes map to declaration lines in sourceMap', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    expect(result.sourceMap['cx-var-total']?.length).toBeGreaterThan(0);
  });

  test('event member define maps to method signature', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    const lines = result.files[0]!.content.split('\n');
    const startLine = lines.findIndex((l) => l.includes('def on_start(self):')) + 1;
    expect(startLine).toBeGreaterThan(0);
    expect(result.sourceMap['cx-start-mem']?.some((r) => r.startLine === startLine)).toBe(true);
  });

  test('On Start maps to on_start handler not run', () => {
    const snapshot = createComplexSnapshot();
    const code = transpileGraphCode(homeCtx(snapshot));
    expect(code).toContain('def on_start(self):');
    expect(code).not.toContain('def run(');
  });

  test('U71 — Switch case-body nodes have their own sourceMap entries', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    expect(result.sourceMap['cx-print-idle']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['cx-print-run']?.length).toBeGreaterThan(0);
  });

  test('U71 — Complex home graph: every behavioral node has sourceMap', () => {
    const snapshot = createComplexSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    const home = snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!;
    const behavioral = home.nodes.filter((n) => {
      const kind = n.data.kindId ?? '';
      return (
        kind &&
        kind !== 'class_define' &&
        kind !== 'vvs.project.import_module' &&
        kind !== 'function_define' &&
        n.type !== 'vvs_comment_node'
      );
    });
    for (const node of behavioral) {
      expect(result.sourceMap[node.id], node.id).toBeDefined();
    }
  });

  test('transpileProject emits one Advanced module with Machine and Sensor', () => {
    const snapshot = createAdvancedSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
    });
    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.toLowerCase().includes('advanced'))).toBe(true);
    const home = result.files[0]!.content;
    expect(home).toContain('class Machine:');
    expect(home).toContain('class Sensor(Machine)');
    expect(home).toContain('def Diagnose(');
  });

  test('Advanced Sensor extends Machine', () => {
    const snapshot = createAdvancedSnapshot();
    expect(SENSOR_CLASS.extendsType).toBe('Machine');
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
    });
    expect(result.files.map((f) => f.content).join('\n')).toContain('class Sensor(Machine)');
  });

  test('async on_start flag emits async def in python (Advanced)', () => {
    const snapshot = createAdvancedSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
    });
    expect(result.files.map((f) => f.content).join('\n')).toMatch(/async def on_start/);
  });

  test('Advanced Machine C++ — Declare prototype + out-of-line Define (U82)', () => {
    const snapshot = createAdvancedSnapshot();
    const code = transpileGraphCode(homeCtx(snapshot, { targetLanguage: 'cpp', activeClassId: MACHINE_CLASS.id }));
    expect(code).toContain('class Machine {');
    expect(code).toContain('virtual void Diagnose();');
    expect(code).toContain('void Machine::Diagnose() {');
    expect(code).not.toContain('virtual void Diagnose() {');
  });

  test('class home graph uses per-graph extension in output path', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileGraph({
      ...homeCtx(snapshot),
      tabLabel: 'Hello',
    });
    expect(result.files[0]!.path.toLowerCase()).toMatch(/hello/);
  });

  test('simple example class_define maps to class line', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileGraph(homeCtx(snapshot));
    expect(result.files[0]!.content).toContain('class Hello');
    const lines = result.files[0]!.content.split('\n');
    const classLine = lines.findIndex((l) => l.includes('class Hello')) + 1;
    expect(result.sourceMap['sm-class-define']?.some((r) => r.startLine === classLine)).toBe(true);
  });

  test('json target dumps graph JSON (not Unsupported language)', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileGraph(homeCtx(snapshot, { targetLanguage: 'json' as never }));
    const content = result.files[0]!.content;
    expect(content).not.toContain('Unsupported language');
    expect(content).toContain('{');
  });

  test('transpileProject json metadata emits graph JSON for home graph', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileProject({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'json' as never,
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
    });
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.files[0]!.content).toContain('{');
  });

  test('U81 — Declare without Define emits no method (no stub magic)', () => {
    const snapshot = createSimpleSnapshot();
    const home = structuredClone(snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!);
    home.nodes = home.nodes.filter((n) => n.id !== 'sm-fn-greet-impl');
    home.edges = home.edges.filter((e) => e.source !== 'sm-fn-greet-impl' && e.target !== 'sm-fn-greet-impl');
    const implToStart = home.edges.find((e) => e.id === 'sm-impl-start-member');
    // Re-wire Declare Greet → start member after removing Define.
    home.edges.push({
      id: 'sm-fn-start-member',
      source: 'sm-fn-greet',
      target: 'sm-start-member',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    });
    void implToStart;
    const code = transpileGraphCode({
      ...homeCtx(snapshot),
      nodes: home.nodes,
      edges: home.edges,
      documents: { ...snapshot.documents, [MAIN_GRAPH_CONTAINER_ID]: home },
    });
    expect(code).not.toContain('def Greet(self):');
    expect(code).toContain('# (x) Declare Greet');
  });

  test('U82 — C++ Declare without Define emits prototype only', () => {
    const snapshot = createSimpleSnapshot();
    const home = structuredClone(snapshot.documents![MAIN_GRAPH_CONTAINER_ID]!);
    home.nodes = home.nodes.filter((n) => n.id !== 'sm-fn-greet-impl');
    home.edges = home.edges.filter((e) => e.source !== 'sm-fn-greet-impl' && e.target !== 'sm-fn-greet-impl');
    home.edges.push({
      id: 'sm-fn-start-member',
      source: 'sm-fn-greet',
      target: 'sm-start-member',
      sourceHandle: 'exec_out',
      targetHandle: 'exec_in',
      type: 'vvs_standard_edge',
      data: { pinType: 'execution' },
    });
    const code = transpileGraphCode({
      ...homeCtx(snapshot, { targetLanguage: 'cpp' }),
      nodes: home.nodes,
      edges: home.edges,
      documents: { ...snapshot.documents, [MAIN_GRAPH_CONTAINER_ID]: home },
    });
    expect(code).toContain('void Greet();');
    expect(code).not.toContain('void Hello::Greet()');
  });

  test('U81 — Define owns def line; Declare maps only to leftover on Python', () => {
    const snapshot = createSimpleSnapshot();
    const result = transpileGraph(homeCtx(snapshot, { moduleName: 'Hello' }));
    const code = result.files[0]!.content;
    const lines = code.split('\n');
    const defLine = lines.findIndex((l) => l.includes('def Greet(self):')) + 1;
    expect(code).toContain('Hello, ');
    expect(defLine).toBeGreaterThan(0);
    const declareLines = (result.sourceMap['sm-fn-greet'] ?? []).map((r) => r.startLine);
    const defineLines = result.sourceMap['sm-fn-greet-impl']!.map((r) => r.startLine);
    expect(code).not.toContain('(x) Declare Greet');
    expect(declareLines).not.toContain(defLine);
    expect(defineLines).toContain(defLine);
  });
});

describe('host file skip vs emit', () => {
  test('skips host entry files when integration strategy is skip', async () => {
    const { loadEnvironmentManifest } = await import('@vvs/environment-templates');
    const manifest = loadEnvironmentManifest('env.python.console-app');
    expect(manifest).toBeDefined();
    const result = transpileGraph({
      moduleName: 'App',
      extendsType: 'object',
      targetLanguage: 'python',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes: [],
      edges: [],
      tabId: 'main',
      environmentManifest: manifest,
      integration: {
        emit: {},
        hostFiles: { 'main.py': { strategy: 'skip' } },
      },
    });
    expect(result.files.some((f) => f.path === 'main.py' || f.path.endsWith('/main.py'))).toBe(false);
  });

  test('emits host entry files when integration strategy is emit', async () => {
    const { loadEnvironmentManifest } = await import('@vvs/environment-templates');
    const manifest = loadEnvironmentManifest('env.python.console-app');
    expect(manifest).toBeDefined();
    const result = transpileGraph({
      moduleName: 'App',
      extendsType: 'object',
      targetLanguage: 'python',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes: [],
      edges: [],
      tabId: 'main',
      environmentManifest: manifest,
      integration: {
        emit: {},
        hostFiles: { 'main.py': { strategy: 'emit' } },
      },
    });
    const host = result.files.find((f) => f.path === 'main.py');
    expect(host).toBeDefined();
    expect(host!.content).toContain('from App import App');
  });

  test('emit uses persisted in-editor host contents', async () => {
    const { loadEnvironmentManifest } = await import('@vvs/environment-templates');
    const manifest = loadEnvironmentManifest('env.python.console-app');
    expect(manifest).toBeDefined();
    const result = transpileGraph({
      moduleName: 'App',
      extendsType: 'object',
      targetLanguage: 'python',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes: [],
      edges: [],
      tabId: 'main',
      environmentManifest: manifest,
      integration: {
        emit: {},
        hostFiles: { 'main.py': { strategy: 'emit', contents: 'print("edited host")\n' } },
      },
    });
    const host = result.files.find((f) => f.path === 'main.py');
    expect(host).toBeDefined();
    expect(host!.content).toBe('print("edited host")\n');
  });
});
