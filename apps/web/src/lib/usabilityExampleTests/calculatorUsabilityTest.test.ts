import { describe, expect, test } from 'bun:test';
import {
  analyzeProject,
  pinsAreCompatible,
  MAIN_CLASS_ID,
  classHomeGraphId,
  findDefineNodesForSymbol,
} from '@vvs/graph-types';
import { transpileGraphCode, graphToIr } from '@vvs/transpiler';
import { createCalculatorUsabilityTestSnapshot } from './calculatorUsabilityTest';
import { normalizeUsabilityTestNodes } from './usabilityTestGraphBuild';
import { evaluateWireConnection } from '@/lib/graphWiring';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

function analyzeCalculatorSnapshot(snapshot: ReturnType<typeof createCalculatorUsabilityTestSnapshot>) {
  return analyzeProject({
    documents: snapshot.documents!,
    variables: snapshot.variables,
    functions: snapshot.functions,
    events: snapshot.events,
    classes: snapshot.classes,
    openTabs: snapshot.openTabs,
    projectDetails: { extendsType: snapshot.projectDetails.extendsType },
    targetLanguage: 'python',
  });
}

function calculatorDoc(snapshot: ReturnType<typeof createCalculatorUsabilityTestSnapshot>) {
  const doc = snapshot.documents![CALCULATOR_GRAPH_ID];
  if (!doc) throw new Error(`missing ${CALCULATOR_GRAPH_ID} document`);
  return doc;
}

describe('calculator usability example test', () => {
  test('passes structural analysis with no errors', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const result = analyzeCalculatorSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(result.diagnostics.filter((d) => d.level === 'error')).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === 'PIN_TYPE_MISMATCH')).toBe(false);
  });

  test('strict fidelity: no missing defines or off-canvas declarations', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const result = analyzeCalculatorSnapshot(snapshot);
    const mainClass = snapshot.classes.find((c) => c.id === MAIN_CLASS_ID)!;
    const homeDoc = snapshot.documents![classHomeGraphId(mainClass)]!;

    expect(result.ok).toBe(true);
    expect(result.diagnostics.filter((d) => d.code === 'DEFINE_NODE_MISSING')).toHaveLength(0);
    expect(result.diagnostics.filter((d) => d.code === 'DECLARATION_NOT_ON_CANVAS')).toHaveLength(0);

    for (const variable of snapshot.variables.filter((v) => v.classId === MAIN_CLASS_ID)) {
      expect(findDefineNodesForSymbol(homeDoc, 'variable', variable.id).length).toBeGreaterThan(0);
    }
    for (const func of snapshot.functions.filter((f) => f.classId === MAIN_CLASS_ID)) {
      expect(findDefineNodesForSymbol(homeDoc, 'function', func.id).length).toBeGreaterThan(0);
    }
    for (const event of snapshot.events.filter((e) => e.classId === MAIN_CLASS_ID)) {
      expect(findDefineNodesForSymbol(homeDoc, 'event', event.id).length).toBeGreaterThan(0);
    }
  });

  test('canvas-only emit uses ir.members without legacy preamble flag', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);
    const ir = graphToIr(
      {
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
      },
      'Calculator.py'
    );

    expect('useLegacyPreamble' in ir).toBe(false);
    expect(ir.members.length).toBeGreaterThan(0);
  });

  test('every wire is compatible with editor wiring rules', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    for (const [tabId, doc] of Object.entries(snapshot.documents!)) {
      for (const edge of doc.edges) {
        const others = doc.edges.filter((e) => e.id !== edge.id);
        const evaluation = evaluateWireConnection(
          {
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          },
          doc.nodes,
          others
        );
        expect(evaluation.ok).toBe(true);
        if (!evaluation.ok) {
          throw new Error(`${tabId} edge ${edge.id}: ${evaluation.reason}`);
        }
      }
    }
  });

  test('transpiles for all supported target languages', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);

    for (const lang of ['python', 'javascript', 'cpp', 'verse', 'gdscript', 'rust', 'csharp'] as const) {
      const code = transpileGraphCode({
        moduleName: snapshot.projectDetails.moduleName,
        extendsType: snapshot.projectDetails.extendsType,
        targetLanguage: lang,
        variables: snapshot.variables,
        projectEvents: snapshot.events,
        functions: snapshot.functions,
        nodes: calc.nodes,
        edges: calc.edges,
        tabId: CALCULATOR_GRAPH_ID,
        documents: snapshot.documents,
        classes: snapshot.classes,
        activeClassId: snapshot.activeClassId,
      });
      expect(code.length).toBeGreaterThan(0);
      if (lang === 'gdscript') {
        expect(code).toMatch(/OS\.read_string_from_stdin\(\)/);
      } else if (lang === 'rust') {
        expect(code).toMatch(/std::io::stdin\(\)\.read_line/);
      } else if (lang === 'csharp') {
        expect(code).toMatch(/Console\.ReadLine/);
      } else {
        expect(code).toMatch(/Enter A:/);
      }
    }
  });

  test('user input value wires to typed set pins', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);
    const inputA = calc.nodes.find((n) => n.id === 'calc-input-a')!;
    const setA = calc.nodes.find((n) => n.id === 'calc-set-a')!;
    const valOut = inputA.data.outputs.find((p) => p.id === 'value')!;
    const valIn = setA.data.inputs.find((p) => p.id === 'val')!;
    expect(valOut.type).toBe('data_number');
    expect(valIn.type).toBe('data_number');
    expect(pinsAreCompatible(valOut.type, valIn.type)).toBe(true);
  });

  test('text-shaped fidelity: no macro semantics in export', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);

    expect(snapshot.openTabs.every((t) => t.type !== 'macro')).toBe(true);
    expect(snapshot.openTabs.every((t) => t.type !== 'class')).toBe(true);
    expect(calc.nodes.some((n) => n.data.kindId === 'vvs.project.use_macro')).toBe(false);

    const code = transpileGraphCode({
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
    });

    expect(code).not.toContain('# macro');
    expect(code).not.toMatch(/use_macro/);
    expect(code).toMatch(/def Add\(/);
    expect(code).toMatch(/self\.Add\(\)/);
  });

  test('normalized labels use Declare / On / Dispatch vocabulary', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);
    const nodes = normalizeUsabilityTestNodes(calc.nodes);

    const memberKindIds = new Set(['class_define', 'var_define', 'function_define', 'event_member_define']);
    for (const node of nodes.filter((n) => memberKindIds.has(n.data.kindId))) {
      expect(node.data.label).toMatch(/^Declare /);
      expect(node.data.label).not.toMatch(/^Define /);
    }

    for (const node of nodes.filter((n) => n.data.kindId === 'event_define')) {
      const eventName =
        typeof node.data.properties?.eventName === 'string'
          ? node.data.properties.eventName
          : node.data.label;
      expect(node.data.label).toBe(eventName);
    }

    for (const node of nodes.filter((n) => n.data.kindId === 'event_dispatch')) {
      expect(node.data.label).toMatch(/^Dispatch /);
    }
  });

  test('organizational graph folders and graph_ref nodes are present', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    expect(snapshot.graphContainers!.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.graphContainers!.some((c) => c.name === 'Calculator')).toBe(true);
    expect(snapshot.graphContainers!.some((c) => c.name === 'UI flow')).toBe(true);
    expect(snapshot.classes).toHaveLength(2);
    const mapDoc = snapshot.documents!['main-graph'];
    const calcDoc = snapshot.documents![CALCULATOR_GRAPH_ID];
    expect(mapDoc.nodes.some((n) => n.data.kindId === 'graph_ref')).toBe(true);
    expect(calcDoc.nodes.some((n) => n.data.kindId === 'class_define')).toBe(true);
    expect(snapshot.activeGraphTab).toBe('main-graph');
    expect(snapshot.classes.find((c) => c.id === MAIN_CLASS_ID)?.containerId).toBe(CALCULATOR_GRAPH_ID);
    expect(snapshot.documents!.main).toBeUndefined();
  });

  test('result prints through explicit To String node', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);
    expect(calc.nodes.some((n) => n.data.kindId === 'convert_to_string')).toBe(true);

    const code = transpileGraphCode({
      moduleName: snapshot.projectDetails.moduleName,
      extendsType: '',
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
    });
    expect(code).toContain('print(str(self.Result))');
    expect(code).not.toMatch(/print\(self\.Result\)/);
  });

  test('dispatch nodes use graphBinding for event symbols', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const calc = calculatorDoc(snapshot);
    const dispatchNodes = calc.nodes.filter((n) => n.data.kindId === 'event_dispatch');
    expect(dispatchNodes.length).toBeGreaterThanOrEqual(2);
    for (const node of dispatchNodes) {
      expect(node.data.graphBinding?.kind).toBe('dispatch_event');
      expect(typeof node.data.graphBinding?.symbolId).toBe('string');
    }
  });

  test('secondary class ResultPanel emits from UI flow container', () => {
    const snapshot = createCalculatorUsabilityTestSnapshot();
    const uiFlowId = 'calc-ui-flow-container';
    const uiDoc = snapshot.documents![uiFlowId];
    if (!uiDoc) throw new Error(`missing ${uiFlowId}`);

    const resultPanel = snapshot.classes.find((c) => c.name === 'ResultPanel')!;
    const code = transpileGraphCode({
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

    expect(code).toContain('class ResultPanel');
    expect(code).toContain('def on_start(self):');
    expect(code).toContain('Result panel ready');
  });
});
