import { describe, expect, test } from 'bun:test';
import { analyzeProject, pinsAreCompatible, MAIN_CLASS_ID } from '@vvs/graph-types';
import { generateMockCode } from '@vvs/transpiler';
import { createComplexExampleSnapshot } from './complexExample';
import { evaluateWireConnection } from '@/lib/graphWiring';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

function calculatorDoc(snapshot: ReturnType<typeof createComplexExampleSnapshot>) {
  const doc = snapshot.documents![CALCULATOR_GRAPH_ID];
  if (!doc) throw new Error(`missing ${CALCULATOR_GRAPH_ID} document`);
  return doc;
}

describe('createComplexExampleSnapshot', () => {
  test('passes structural analysis with no errors', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = analyzeProject({
      documents: snapshot.documents!,
      variables: snapshot.variables,
      functions: snapshot.functions,
      events: snapshot.events,
      classes: snapshot.classes,
      openTabs: snapshot.openTabs,
      projectDetails: { extendsType: snapshot.projectDetails.extendsType },
      targetLanguage: 'python',
    });

    expect(result.ok).toBe(true);
    expect(result.diagnostics.filter((d) => d.level === 'error')).toEqual([]);
    expect(result.diagnostics.some((d) => d.code === 'PIN_TYPE_MISMATCH')).toBe(false);
  });

  test('every wire is compatible with editor wiring rules', () => {
    const snapshot = createComplexExampleSnapshot();
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
    const snapshot = createComplexExampleSnapshot();
    const calc = calculatorDoc(snapshot);

    for (const lang of ['python', 'javascript', 'cpp', 'verse'] as const) {
      const code = generateMockCode({
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
      expect(code).toMatch(/Enter A:/);
    }
  });

  test('user input value wires to typed set pins', () => {
    const snapshot = createComplexExampleSnapshot();
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
    const snapshot = createComplexExampleSnapshot();
    const calc = calculatorDoc(snapshot);

    expect(snapshot.openTabs.every((t) => t.type !== 'macro')).toBe(true);
    expect(snapshot.openTabs.every((t) => t.type !== 'class')).toBe(true);
    expect(calc.nodes.some((n) => n.data.kindId === 'vvs.project.use_macro')).toBe(false);

    const code = generateMockCode({
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

  test('organizational graph folders and graph_ref nodes are present', () => {
    const snapshot = createComplexExampleSnapshot();
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
    const snapshot = createComplexExampleSnapshot();
    const calc = calculatorDoc(snapshot);
    expect(calc.nodes.some((n) => n.data.kindId === 'convert_to_string')).toBe(true);

    const code = generateMockCode({
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
});
