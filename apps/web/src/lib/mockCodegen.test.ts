import { describe, expect, test } from 'bun:test';
import { generateMockCode, generateMockTranspileResult } from './mockCodegen';
import { createComplexExampleSnapshot } from './examples/complexExample';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

describe('generateMockCode', () => {
  test('complex example calculator graph emits call_function and branch', () => {
    const snapshot = createComplexExampleSnapshot();
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];

    const code = generateMockCode({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
    });

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
    });

    expect(code).toContain('def Add(self):');
    expect(code).toContain('self.Result =');
    expect(code).not.toContain('class Calculator');
  });

  test('transpile result includes sourceMap for statement nodes', () => {
    const snapshot = createComplexExampleSnapshot();
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
    });

    expect(result.files[0]?.content.length).toBeGreaterThan(0);
    expect(Object.keys(result.sourceMap).length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-set-a']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-set-a']).toContain('A');
  });

  test('event member define nodes map to full handler block in sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
    });

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
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
    });

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
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];
    const start = calcGraph.nodes.find((n) => n.id === 'calc-start-handler')!;
    const dispatchNode = calcGraph.nodes.find((n) => n.id === 'calc-dispatch')!;

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
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes,
      edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
    });

    const content = result.files[0]!.content;
    expect(content).toContain('self.on_calculate()');
    expect(result.sourceMap['calc-dispatch']?.length).toBeGreaterThan(0);
  });

  test('Calculator fidelity reference nodes have sourceMap coverage', () => {
    const snapshot = createComplexExampleSnapshot();
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });

    const expectations: [string, RegExp][] = [
      ['calc-var-a-define', /self\.A/],
      ['calc-fn-add-define', /Add/],
      ['calc-evt-calc-member', /on_calculate/],
      ['calc-dispatch', /on_calculate\(\)/],
      ['calc-call-add', /Add\(/],
      ['calc-set-a', /self\.A\s*=/],
    ];

    for (const [nodeId, pattern] of expectations) {
      expect(result.sourceMap[nodeId]?.length).toBeGreaterThan(0);
      expect(result.fragments?.[nodeId]).toMatch(pattern);
    }
  });

  test('event_member_define declaration and event_define handler body stay linked', () => {
    const snapshot = createComplexExampleSnapshot();
    const calcGraph = snapshot.documents![CALCULATOR_GRAPH_ID];
    const handlerEntry = calcGraph.nodes.find((n) => n.id === 'calc-define');
    expect(handlerEntry?.data.kindId).toBe('event_define');

    const result = generateMockTranspileResult({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: snapshot.projectDetails.extendsType,
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: calcGraph.nodes,
      edges: calcGraph.edges,
      tabId: CALCULATOR_GRAPH_ID,
      documents: snapshot.documents,
      classes: snapshot.classes,
      activeClassId: snapshot.activeClassId,
    });

    const memberRange = result.sourceMap['calc-evt-calc-member']![0]!;
    const callRange = result.sourceMap['calc-call-add']![0]!;

    expect(result.sourceMap['calc-evt-calc-member']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['calc-call-add']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['calc-evt-calc-member']).toContain('on_calculate');
    expect(result.fragments?.['calc-call-add']).toContain('Add');
    expect(callRange.startLine).toBeGreaterThanOrEqual(memberRange.startLine);
    expect(callRange.endLine).toBeLessThanOrEqual(memberRange.endLine);
  });
});
