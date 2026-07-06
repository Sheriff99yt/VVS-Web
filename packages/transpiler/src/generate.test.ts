import { describe, expect, test } from 'bun:test';
import { graphToIr } from './lower/graphToIr';
import { generateMockCode, generateMockTranspileResult, type CodegenContext } from './generate';
import { createComplexExampleSnapshot } from '../../../apps/web/src/lib/examples/complexExample';
import { createSimpleExampleSnapshot } from '../../../apps/web/src/lib/examples/simpleExample';

function mainCtx(
  snapshot: ReturnType<typeof createComplexExampleSnapshot>,
  overrides: Partial<CodegenContext> = {}
): CodegenContext {
  const main = snapshot.documents!.main;
  return {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage: 'python',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: main.nodes,
    edges: main.edges,
    tabId: 'main',
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
    ...overrides,
  };
}

describe('generateMockCode', () => {
  test('complex example main graph emits call_function and branch', () => {
    const snapshot = createComplexExampleSnapshot();
    const code = generateMockCode(mainCtx(snapshot));

    expect(code).toContain('self.Add()');
    expect(code).toContain('def Add(self):');
    expect(code).toContain('self.A =');
    expect(code).toContain('float(input("Enter A:"))');
    expect(code).toContain('float(input("Enter B:"))');
    expect(code).toContain('if ');
    expect(code).toContain('def Clear(self):');
    expect(code).toContain('def on_calculate(self):');
    expect(code).toContain('def on_clear(self):');
    expect(code).toContain('print(str(self.Result))');
    expect(code).toContain('self.Clear()');
    expect(code).not.toContain('import ');
    expect(code).not.toContain('# Variables');
  });

  test('canvas define chain emits members in graph order', () => {
    const snapshot = createComplexExampleSnapshot();
    const code = generateMockCode(mainCtx(snapshot));
    const lines = code.split('\n');

    const lineA = lines.findIndex((l) => l.includes('self.A ='));
    const lineB = lines.findIndex((l) => l.includes('self.B ='));
    const lineResult = lines.findIndex((l) => l.includes('self.Result ='));
    const lineShow = lines.findIndex((l) => l.includes('self.ShowResult ='));
    const lineAdd = lines.findIndex((l) => l.includes('def Add(self):'));
    const lineClear = lines.findIndex((l) => l.includes('def Clear(self):'));
    const lineOnStart = lines.findIndex((l) => l.includes('def on_start(self):'));

    expect(lineA).toBeGreaterThan(-1);
    expect(lineB).toBeGreaterThan(lineA);
    expect(lineResult).toBeGreaterThan(lineB);
    expect(lineShow).toBeGreaterThan(lineResult);
    expect(lineAdd).toBeGreaterThan(lineShow);
    expect(lineClear).toBeGreaterThan(lineAdd);
    expect(lineOnStart).toBeGreaterThan(lineClear);
  });

  test('var_define nodes map to declaration lines in sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    expect(result.sourceMap['calc-var-a-define']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-var-a-define']).toContain('self.A');
    expect(result.sourceMap['calc-class-define']?.length).toBeGreaterThan(0);
  });

  test('legacy fallback uses sidebar preamble when no define nodes', () => {
    const snapshot = createComplexExampleSnapshot();
    const main = snapshot.documents!.main;
    const legacyNodes = main.nodes.filter(
      (n) =>
        n.data.kindId !== 'class_define' &&
        n.data.kindId !== 'var_define' &&
        n.data.kindId !== 'function_define' &&
        n.data.kindId !== 'event_member_define'
    );

    const ir = graphToIr(
      {
        ...mainCtx(snapshot),
        nodes: legacyNodes,
        edges: main.edges.filter(
          (e) =>
            !e.id.startsWith('calc-def-e-')
        ),
      },
      'Calculator.py'
    );

    expect(ir.useLegacyPreamble).toBe(true);
    expect(ir.members).toEqual([]);
    expect(ir.compileWarnings).toContain('DECLARATION_NOT_ON_CANVAS');

    const code = generateMockCode({
      ...mainCtx(snapshot),
      nodes: legacyNodes,
      edges: main.edges.filter((e) => !e.id.startsWith('calc-def-e-')),
    });
    expect(code).toContain('# Variables');
  });

  test('function tab emits standalone function body', () => {
    const snapshot = createComplexExampleSnapshot();
    const addTab = snapshot.documents!['fn-add'];

    const code = generateMockCode({
      moduleName: 'Add',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: addTab.nodes,
      edges: addTab.edges,
      tabId: 'fn-add',
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });

    expect(code).toContain('def Add(self):');
    expect(code).toContain('self.Result =');
    expect(code).not.toContain('class Calculator');
  });

  test('transpile result includes sourceMap for statement nodes', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    expect(result.files[0]?.content.length).toBeGreaterThan(0);
    expect(Object.keys(result.sourceMap).length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-set-a']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-set-a']).toContain('A');
  });

  test('event member define nodes map to full handler block in sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    const handlerRanges = result.sourceMap['calc-evt-calc-member'];
    expect(handlerRanges?.length).toBeGreaterThan(0);

    const content = result.files[0]!.content;
    const handlerLine =
      content.split('\n').findIndex((l) => l.includes('def on_calculate(self')) + 1;
    expect(handlerLine).toBeGreaterThan(0);
    expect(handlerRanges![0]!.startLine).toBeLessThanOrEqual(handlerLine);
    expect(handlerRanges![0]!.endLine).toBeGreaterThanOrEqual(handlerLine);
    expect(result.fragments?.['calc-evt-calc-member']).toContain('on_calculate');
  });

  test('On Start maps to on_start handler not run', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    const content = result.files[0]!.content;
    expect(content).toContain('def on_start(self):');
    expect(content).not.toContain('def run(self):');
    expect(result.sourceMap['calc-start']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-start']).toContain('on_start');
  });

  test('Add function graph maps get and math nodes to expression spans', () => {
    const snapshot = createComplexExampleSnapshot();
    const addTab = snapshot.documents!['fn-add'];

    const result = generateMockTranspileResult({
      moduleName: 'Add',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: addTab.nodes,
      edges: addTab.edges,
      tabId: 'fn-add',
      documents: snapshot.documents,
    });

    expect(result.sourceMap['calc-add-get-a']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-add-math']?.length).toBeGreaterThan(0);

    const getRange = result.sourceMap['calc-add-get-a']![0]!;
    const mathRange = result.sourceMap['calc-add-math']![0]!;
    expect(getRange.startLine).toBe(mathRange.startLine);
    expect(mathRange.startCol).toBeLessThan(getRange.startCol);
    expect(result.fragments?.['calc-add-get-a']).toContain('A');
    expect(result.fragments?.['calc-add-math']).toContain('A');
  });

  test('dispatch node emits parameterless call with sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const start = snapshot.documents!.main.nodes.find((n) => n.id === 'calc-start')!;
    const dispatchNode = snapshot.documents!.main.nodes.find((n) => n.id === 'calc-dispatch')!;

    const nodes = [start, dispatchNode];
    const edges = [
      {
        id: 'calc-edge-dispatch-test',
        source: 'calc-start',
        target: 'calc-dispatch',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
    ];

    const result = generateMockTranspileResult({
      ...mainCtx(snapshot),
      nodes,
      edges,
    });

    const content = result.files[0]!.content;
    expect(content).toContain('self.on_calculate()');
    expect(result.sourceMap['calc-dispatch']?.length).toBeGreaterThan(0);
  });

  test('nested branch body nodes map to sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    expect(result.sourceMap['calc-print-done']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-print-result']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-to-string']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-get-result']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-print-skip']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-dispatch-clear']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-get-show']?.length).toBeGreaterThan(0);
  });

  test('simple example class_define maps to class line', () => {
    const snapshot = createSimpleExampleSnapshot();
    const main = snapshot.documents!.main;
    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: main.nodes,
      edges: main.edges,
      tabId: 'main',
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });

    expect(result.sourceMap['ex-class-define']?.length).toBeGreaterThan(0);
    expect(result.files[0]!.content).toContain('class HelloWorld');
  });

  test('import nodes hoist to line 1 with sourceMap and skip body', () => {
    const nodes = [
      {
        id: 'start-1',
        type: 'vvs_standard_node' as const,
        position: { x: 0, y: 0 },
        data: {
          label: 'On Start',
          category: 'Events',
          kindId: 'event_on_start',
          inputs: [],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
          inlineValues: {},
        },
      },
      {
        id: 'import-utils',
        type: 'vvs_standard_node' as const,
        position: { x: 200, y: 0 },
        data: {
          label: 'Import utils',
          category: 'Imports',
          kindId: 'import_module_utils',
          linkKind: 'import_module' as const,
          linkedGraphId: 'utils',
          inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
          inlineValues: {},
        },
      },
      {
        id: 'print-1',
        type: 'vvs_standard_node' as const,
        position: { x: 400, y: 0 },
        data: {
          label: 'Print String',
          category: 'Action',
          kindId: 'action_print',
          inputs: [
            { id: 'exec_in', label: '', type: 'execution' as const },
            { id: 'in_str', label: 'String', type: 'data_string' as const },
          ],
          outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
          inlineValues: { in_str: 'hi' },
        },
      },
    ];
    const edges = [
      {
        id: 'e1',
        source: 'start-1',
        target: 'import-utils',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
      {
        id: 'e2',
        source: 'import-utils',
        target: 'print-1',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
    ];

    const result = generateMockTranspileResult({
      moduleName: 'TestMod',
      extendsType: '',
      targetLanguage: 'python',
      variables: [],
      projectEvents: [],
      functions: [],
      nodes,
      edges,
      tabId: 'main',
    });

    const content = result.files[0]!.content;
    const lines = content.split('\n');
    expect(lines[0]).toBe('from utils import *');
    expect(content).not.toContain('import at exec position');
    expect(content).not.toMatch(/^\s+from utils import/m);
    expect(result.sourceMap['import-utils']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['import-utils']![0]!.startLine).toBe(1);
  });
});
