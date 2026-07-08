import { describe, expect, test } from 'bun:test';
import { graphToIr } from './lower/graphToIr';
import {
  generateMockCode,
  generateMockTranspileResult,
  generateProjectTranspileResult,
  type CodegenContext,
} from './generate';
import { withTestEntryGraph } from './testEntryGraph';
import { createComplexExampleSnapshot } from '../../../apps/web/src/lib/examples/complexExample';
import { createSimpleExampleSnapshot } from '../../../apps/web/src/lib/examples/simpleExample';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

function mainCtx(
  snapshot: ReturnType<typeof createComplexExampleSnapshot>,
  overrides: Partial<CodegenContext> = {}
): CodegenContext {
  const calc = snapshot.documents![CALCULATOR_GRAPH_ID];
  if (!calc) throw new Error(`missing ${CALCULATOR_GRAPH_ID}`);
  return {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage: 'python',
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: calc.nodes,
    edges: calc.edges,
    tabId: CALCULATOR_GRAPH_ID,
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
    expect(code).not.toContain('_emit');
    expect(code).not.toContain('_subscribe');
    expect(code).not.toContain('import ');
    expect(code).not.toContain('# Variables');
  });

  test('canvas define chain emits members in graph order', () => {
    const snapshot = createComplexExampleSnapshot();
    const code = generateMockCode(mainCtx(snapshot));
    const lines = code.split('\n');

    const memberLine = (pattern: RegExp) =>
      lines.findIndex((l) => pattern.test(l) && /^        self\./.test(l));

    const lineA = memberLine(/self\.A = 0/);
    const lineB = memberLine(/self\.B = 0/);
    const lineResult = memberLine(/self\.Result = 0/);
    const lineShow = memberLine(/self\.ShowResult = True/);
    const lineAdd = lines.findIndex((l) => l.includes('def Add(self):'));
    const lineClear = lines.findIndex((l) => l.includes('def Clear(self):'));
    const lineOnStart = lines.findIndex((l) => l.includes('def on_start(self):'));

    expect(lineOnStart).toBeGreaterThan(-1);
    expect(lineOnStart).toBeLessThan(lineA);
    expect(lineA).toBeGreaterThan(-1);
    expect(lineB).toBeGreaterThan(lineA);
    expect(lineResult).toBeGreaterThan(lineB);
    expect(lineShow).toBeGreaterThan(lineResult);
    expect(lineAdd).toBeGreaterThan(lineShow);
    expect(lineClear).toBeGreaterThan(lineAdd);
  });

  test('var_define nodes map to declaration lines in sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot));

    expect(result.sourceMap['calc-var-a-define']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-var-a-define']).toContain('self.A');
    expect(result.sourceMap['calc-class-define']?.length).toBeGreaterThan(0);
  });

  test('no define nodes emits no preamble declarations', () => {
    const snapshot = createComplexExampleSnapshot();
    const calc = snapshot.documents![CALCULATOR_GRAPH_ID]!;
    const nodesWithoutDefines = calc.nodes.filter(
      (n) =>
        n.data.kindId !== 'class_define' &&
        n.data.kindId !== 'var_define' &&
        n.data.kindId !== 'function_define' &&
        n.data.kindId !== 'event_member_define'
    );
    const edgesWithoutDefines = calc.edges.filter((e) => !e.id.startsWith('calc-def-e-'));
    const ctx = {
      ...mainCtx(snapshot),
      nodes: nodesWithoutDefines,
      edges: edgesWithoutDefines,
    };

    const ir = graphToIr(ctx, 'Calculator.py');
    expect(ir.members).toEqual([]);

    const code = generateMockCode(ctx);
    const classMemberSection = code.split('def on_start(self):')[0]!;
    expect(classMemberSection).not.toContain('# Variables');
    expect(classMemberSection).not.toMatch(/self\.A\s*=\s*0/);
    expect(classMemberSection).not.toMatch(/self\.B\s*=\s*0/);
    expect(classMemberSection).not.toMatch(/self\.Result\s*=\s*0/);
    expect(classMemberSection).not.toContain('def Add(self):');
    expect(classMemberSection).not.toContain('def Clear(self):');
    expect(classMemberSection).not.toContain('def on_calculate(self):');
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
    expect(result.sourceMap['calc-evt-start-member']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-evt-start-member']).toContain('on_start');
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
    const calc = snapshot.documents![CALCULATOR_GRAPH_ID]!;
    const start = calc.nodes.find((n) => n.id === 'calc-start-handler')!;
    const dispatchNode = calc.nodes.find((n) => n.id === 'calc-dispatch')!;

    const nodes = [start, dispatchNode];
    const edges = [
      {
        id: 'calc-edge-dispatch-test',
        source: 'calc-start-handler',
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
    const main = snapshot.documents![MAIN_GRAPH_CONTAINER_ID];
    if (!main) throw new Error(`missing ${MAIN_GRAPH_CONTAINER_ID}`);
    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
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

    expect(result.sourceMap['ex-class-define']?.length).toBeGreaterThan(0);
    expect(result.files[0]!.content).toContain('class HelloWorld');
  });

  test('import nodes hoist to line 1 with sourceMap and skip body', () => {
    const importNode = {
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
    };
    const printNode = {
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
    };
    const flowEdges = [
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

    const result = generateMockTranspileResult(
      withTestEntryGraph(
        {
          moduleName: 'TestMod',
          extendsType: '',
          targetLanguage: 'python',
          variables: [],
          functions: [],
          nodes: [importNode, printNode],
          edges: flowEdges,
        },
        'import-utils'
      )
    );

    const content = result.files[0]!.content;
    const lines = content.split('\n');
    expect(lines[0]).toBe('from utils import *');
    expect(content).not.toContain('import at exec position');
    expect(content).not.toMatch(/^\s+from utils import/m);
    expect(result.sourceMap['import-utils']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['import-utils']![0]!.startLine).toBe(1);
  });

  test('secondary class home graph emits class module file', () => {
    const snapshot = createComplexExampleSnapshot();
    const uiFlowId = 'calc-ui-flow-container';
    const uiDoc = snapshot.documents![uiFlowId];
    if (!uiDoc) throw new Error(`missing ${uiFlowId}`);
    const resultPanel = snapshot.classes.find((c) => c.name === 'ResultPanel')!;

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: uiDoc.nodes,
      edges: uiDoc.edges,
      tabId: uiFlowId,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: resultPanel.id,
    });

    const content = result.files[0]!.content;
    expect(result.files[0]?.path).toBe('ResultPanel.py');
    expect(content).toContain('class ResultPanel');
    expect(content).toContain('print("Result panel ready")');
  });

  test('generateProjectTranspileResult emits all class modules and function tabs', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateProjectTranspileResult({
      projectDetails: snapshot.projectDetails,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      documents: snapshot.documents!,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
      openTabs: snapshot.openTabs,
    });

    const paths = result.files.map((f) => f.path).sort();
    expect(paths).toContain('Calculator.py');
    expect(paths).toContain('ResultPanel.py');
    expect(paths).toContain('Add.py');
    expect(paths).toContain('Clear.py');
    expect(Object.keys(result.sourceMap).length).toBeGreaterThan(0);
  });

  test('cross-class import and call emit explicit class reference', () => {
    const snapshot = createComplexExampleSnapshot();
    const uiFlowId = 'calc-ui-flow-container';
    const resultPanel = snapshot.classes.find((c) => c.name === 'ResultPanel')!;
    const calculatorClass = snapshot.classes.find((c) => c.name === 'Calculator')!;
    const addFn = snapshot.functions.find((f) => f.name === 'Add')!;

    const importNode = {
      id: 'cross-import-calc',
      type: 'vvs_standard_node' as const,
      position: { x: 40, y: 200 },
      data: {
        label: 'Import Class Calculator',
        category: 'Imports',
        kindId: 'import_class',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: {},
        graphBinding: {
          kind: 'import_class' as const,
          symbolId: calculatorClass.id,
          targetClassId: calculatorClass.id,
        },
        properties: { targetClassId: calculatorClass.id },
      },
    };
    const callNode = {
      id: 'cross-call-add',
      type: 'vvs_standard_node' as const,
      position: { x: 280, y: 200 },
      data: {
        label: 'Call Add',
        category: 'Project',
        kindId: 'vvs.project.call_function',
        inputs: [{ id: 'exec_in', label: '', type: 'execution' as const }],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: {},
        graphBinding: { kind: 'call_function' as const, symbolId: addFn.id },
        linkedGraphId: addFn.id,
      },
    };

    const uiDoc = snapshot.documents![uiFlowId]!;
    const nodes = [...uiDoc.nodes, importNode, callNode];
    const edges = [
      ...uiDoc.edges,
      {
        id: 'cross-e-start-import',
        source: 'calc-panel-start-handler',
        target: 'cross-import-calc',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
      {
        id: 'cross-e-import-call',
        source: 'cross-import-calc',
        target: 'cross-call-add',
        sourceHandle: 'exec_out',
        targetHandle: 'exec_in',
        type: 'vvs_standard_edge' as const,
        data: { pinType: 'execution' as const },
      },
    ];

    const code = generateMockCode({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes,
      edges,
      tabId: uiFlowId,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: resultPanel.id,
    });

    expect(code).toContain('from Calculator import Calculator');
    expect(code).toContain('Calculator().Add()');
  });

  test('async function flag emits async def in python', () => {
    const snapshot = createComplexExampleSnapshot();
    const asyncFn = {
      ...snapshot.functions.find((f) => f.name === 'Add')!,
      flags: { async: true },
    };
    const functions = snapshot.functions.map((f) => (f.id === asyncFn.id ? asyncFn : f));
    const calc = snapshot.documents![CALCULATOR_GRAPH_ID]!;

    const code = generateMockCode({
      ...mainCtx(snapshot, { functions }),
      targetLanguage: 'python',
    });

    expect(code).toContain('async def Add(self):');
  });

  test('virtual function flag emits virtual keyword in cpp', () => {
    const snapshot = createComplexExampleSnapshot();
    const virtualFn = {
      ...snapshot.functions.find((f) => f.name === 'Add')!,
      flags: { virtual: true },
    };
    const functions = snapshot.functions.map((f) => (f.id === virtualFn.id ? virtualFn : f));

    const code = generateMockCode({
      ...mainCtx(snapshot, { functions }),
      targetLanguage: 'cpp',
    });

    expect(code).toContain('virtual void Add(');
  });

  test('cpp sourceMap endCol includes trailing punctuation on declaration lines', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = generateMockTranspileResult(mainCtx(snapshot, { targetLanguage: 'cpp' }));
    const content = result.files[0]!.content;
    const lines = content.split('\n');

    const varRange = result.sourceMap['calc-var-a-define']?.[0];
    expect(varRange).toBeDefined();
    const varLine = lines[varRange!.startLine - 1] ?? '';
    expect(varLine.trimEnd()).toMatch(/;$/);
    expect(varRange!.endCol).toBe(varLine.length + 1);

    const classRanges = result.sourceMap['calc-class-define'] ?? [];
    expect(classRanges.length).toBeGreaterThanOrEqual(2);
    const publicRange = classRanges.find((r) => lines[r.startLine - 1]?.trim() === 'public:');
    expect(publicRange).toBeDefined();
    expect(publicRange!.endCol).toBe('public:'.length + 1);

    const handlerRange = result.sourceMap['calc-evt-calc-member']?.[0];
    expect(handlerRange).toBeDefined();
    const handlerCloseLine = lines[handlerRange!.endLine - 1] ?? '';
    expect(handlerCloseLine.trimEnd()).toMatch(/}$/);
    expect(handlerRange!.endCol).toBe(handlerCloseLine.length + 1);
  });
});
