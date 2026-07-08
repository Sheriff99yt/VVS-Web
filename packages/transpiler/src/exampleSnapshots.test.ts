import { describe, expect, test } from 'bun:test';
import { analyzeProject, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { generateMockTranspileResult } from './generate';
import { createSimpleExampleSnapshot } from '../../../apps/web/src/lib/examples/simpleExample';
import { createComplexExampleSnapshot } from '../../../apps/web/src/lib/examples/complexExample';
import type { CodegenContext } from './generate';

type TargetLanguage = 'python' | 'javascript' | 'cpp' | 'verse';

const CALCULATOR_GRAPH_ID = 'calc-calculator-graph';

function transpileMain(
  snapshot: ReturnType<typeof createSimpleExampleSnapshot>,
  targetLanguage: TargetLanguage
) {
  const main = snapshot.documents![MAIN_GRAPH_CONTAINER_ID];
  if (!main) throw new Error(`missing ${MAIN_GRAPH_CONTAINER_ID}`);
  const ctx: CodegenContext = {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: main.nodes,
    edges: main.edges,
    tabId: MAIN_GRAPH_CONTAINER_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
  };
  return generateMockTranspileResult(ctx);
}

function transpileComplexCalculator(
  snapshot: ReturnType<typeof createComplexExampleSnapshot>,
  targetLanguage: TargetLanguage
) {
  const calc = snapshot.documents![CALCULATOR_GRAPH_ID];
  if (!calc) throw new Error(`missing ${CALCULATOR_GRAPH_ID}`);
  const ctx: CodegenContext = {
    moduleName: snapshot.projectDetails.moduleName,
    extendsType: snapshot.projectDetails.extendsType,
    targetLanguage,
    variables: snapshot.variables,
    projectEvents: snapshot.events,
    functions: snapshot.functions,
    nodes: calc.nodes,
    edges: calc.edges,
    tabId: CALCULATOR_GRAPH_ID,
    documents: snapshot.documents,
    classes: snapshot.classes,
    activeClassId: snapshot.activeClassId,
  };
  return generateMockTranspileResult(ctx);
}

const SIMPLE_EXPECTS: Record<TargetLanguage, string[]> = {
  python: ['def on_start', 'print('],
  javascript: ['on_start()', 'console.log'],
  cpp: ['void on_start', 'std::cout'],
  verse: ['on_start', 'Print'],
};

const COMPLEX_EXPECTS: Record<TargetLanguage, string[]> = {
  python: [
    'def on_calculate',
    'self.Add()',
    'if ',
    'def Add(',
    'def on_clear',
    'self.Clear()',
    'print(str(self.Result))',
    'float(input("Enter A:"))',
  ],
  javascript: [
    'on_calculate',
    'this.Add()',
    'if ',
    'on_clear',
    'this.Clear()',
    'this.Result',
    'parseFloat(prompt("Enter A:")',
  ],
  cpp: ['void on_calculate', 'Add()', 'if ', 'void on_clear', 'Clear()', 'Result', 'Enter A:'],
  verse: ['on_calculate', 'Add', 'if ', 'on_clear', 'Clear', 'Result', 'Enter A:'],
};

describe('example template snapshots', () => {
  for (const lang of ['python', 'javascript', 'cpp', 'verse'] as const) {
    test(`simple example transpiles for ${lang}`, () => {
      const snapshot = createSimpleExampleSnapshot();
      const result = transpileMain(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of SIMPLE_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).toContain('Hello from VVS!');
    });

    test(`complex example transpiles for ${lang}`, () => {
      const snapshot = createComplexExampleSnapshot();
      const result = transpileComplexCalculator(snapshot, lang);
      const content = result.files[0]!.content;

      expect(content.length).toBeGreaterThan(0);
      for (const anchor of COMPLEX_EXPECTS[lang]) {
        expect(content).toContain(anchor);
      }
      expect(content).not.toContain('import_module');
      expect(content).not.toMatch(/^import /m);
    });
  }

  test('complex example has no error-level analysis diagnostics', () => {
    const snapshot = createComplexExampleSnapshot();
    const result = analyzeProject({
      documents: snapshot.documents!,
      variables: snapshot.variables,
      functions: snapshot.functions,
      events: snapshot.events,
      openTabs: snapshot.openTabs,
      projectDetails: { extendsType: snapshot.projectDetails.extendsType },
      targetLanguage: 'python',
    });

    const errors = result.diagnostics.filter((d) => d.level === 'error');
    expect(errors).toEqual([]);
  });
});
