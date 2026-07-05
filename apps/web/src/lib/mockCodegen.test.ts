import { describe, expect, test } from 'bun:test';
import { generateMockCode, generateMockTranspileResult } from './mockCodegen';
import { createComplexExampleSnapshot } from './examples/complexExample';

describe('generateMockCode', () => {
  test('complex example main graph emits call_function and branch', () => {
    const snapshot = createComplexExampleSnapshot();
    const main = snapshot.documents!.main;

    const code = generateMockCode({
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
    });

    expect(code).toContain('self.ApplyDamage()');
    expect(code).toContain('def ApplyDamage(self):');
    expect(code).toContain('self.PlayerHealth =');
    expect(code).toContain('if ');
    expect(code).toContain('self.ResetGame()');
    expect(code).toContain('def on_damage(self, damageamount):');
  });

  test('function tab emits standalone function body', () => {
    const snapshot = createComplexExampleSnapshot();
    const f1 = snapshot.documents!.f1;

    const code = generateMockCode({
      moduleName: 'ApplyDamage',
      extendsType: '',
      targetLanguage: 'python',
      variables: snapshot.variables,
      projectEvents: snapshot.events,
      functions: snapshot.functions,
      nodes: f1.nodes,
      edges: f1.edges,
      tabId: 'f1',
      documents: snapshot.documents,
    });

    expect(code).toContain('def ApplyDamage(self):');
    expect(code).toContain('print("Damage applied")');
    expect(code).not.toContain('class GameSession');
  });

  test('transpile result includes sourceMap for statement nodes', () => {
    const snapshot = createComplexExampleSnapshot();
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
    });

    expect(result.files[0]?.content.length).toBeGreaterThan(0);
    expect(Object.keys(result.sourceMap).length).toBeGreaterThan(0);
    expect(result.sourceMap['cx-print-welcome']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['cx-print-welcome']).toContain('print');
  });

  test('event nodes map to full handler block in sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
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
    });

    const damageRanges = result.sourceMap['cx-damage-event'];
    expect(damageRanges?.length).toBeGreaterThan(0);

    const content = result.files[0]!.content;
    const handlerLine = content.split('\n').findIndex((l) => l.includes('def on_damage(self')) + 1;
    expect(handlerLine).toBeGreaterThan(0);
    expect(damageRanges![0]!.startLine).toBeLessThanOrEqual(handlerLine);
    expect(damageRanges![0]!.endLine).toBeGreaterThanOrEqual(handlerLine);
    expect(result.fragments?.['cx-damage-event']).toContain('on_damage');
  });

  test('On Start maps to on_start handler not run', () => {
    const snapshot = createComplexExampleSnapshot();
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
    });

    const content = result.files[0]!.content;
    expect(content).toContain('def on_start(self):');
    expect(content).not.toContain('def run(self):');
    expect(result.sourceMap['cx-start']?.length).toBeGreaterThan(0);
    expect(result.fragments?.['cx-start']).toContain('on_start');
  });

  test('On Update chain emits on_update handler with mapped set node', () => {
    const snapshot = createComplexExampleSnapshot();
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
    });

    const content = result.files[0]!.content;
    expect(content).toContain('def on_update(self, delta_time):');
    expect(result.sourceMap['cx-set-score-tick']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['cx-update']?.length).toBeGreaterThan(0);
  });

  test('get and math nodes map to expression spans in on_update set line', () => {
    const snapshot = createComplexExampleSnapshot();
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
    });

    expect(result.sourceMap['cx-get-score']?.length).toBeGreaterThan(0);
    expect(result.sourceMap['cx-add-score']?.length).toBeGreaterThan(0);

    const getRange = result.sourceMap['cx-get-score']![0]!;
    const mathRange = result.sourceMap['cx-add-score']![0]!;
    expect(getRange.startLine).toBe(mathRange.startLine);
    expect(mathRange.startCol).toBeLessThan(getRange.startCol);
    expect(result.fragments?.['cx-get-score']).toContain('Score');
    expect(result.fragments?.['cx-add-score']).toContain('Score');
  });

  test('dispatch node emits parameterized call with sourceMap', () => {
    const snapshot = createComplexExampleSnapshot();
    const start = snapshot.documents!.main.nodes.find((n) => n.id === 'cx-start')!;
    const dispatchNode = {
      id: 'cx-dispatch-damage',
      type: 'vvs_standard_node' as const,
      position: { x: 320, y: 40 },
      data: {
        label: 'Dispatch damage',
        category: 'Events',
        kindId: 'event_dispatch',
        properties: { eventId: 'evt-damage', eventName: 'damage' },
        inputs: [
          { id: 'exec_in', label: '', type: 'execution' as const },
          { id: 'damage', label: 'DamageAmount', type: 'data_number' as const },
        ],
        outputs: [{ id: 'exec_out', label: '', type: 'execution' as const }],
        inlineValues: { damage: 25 },
      },
    };
    const nodes = [start, dispatchNode];
    const edges = [
      {
        id: 'cx-edge-dispatch',
        source: 'cx-start',
        target: 'cx-dispatch-damage',
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
      tabId: 'main',
      documents: snapshot.documents,
    });

    const content = result.files[0]!.content;
    expect(content).toContain('self.on_damage(25)');
    expect(result.sourceMap['cx-dispatch-damage']?.length).toBeGreaterThan(0);
  });
});
