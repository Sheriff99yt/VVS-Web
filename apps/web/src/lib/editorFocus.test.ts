import { describe, expect, test } from 'bun:test';
import { canvasFocusFrame, resolveClassHomeGraphTarget, resolveVariableFocusFrame } from './editorFocus';
import { createComplexExampleSnapshot } from './examples/complexExample';

describe('editorFocus', () => {
  test('resolveClassHomeGraphTarget uses container tab for Calculator class', () => {
    const snapshot = createComplexExampleSnapshot();
    const cls = snapshot.classes!.find((c) => c.name === 'Calculator')!;
    const target = resolveClassHomeGraphTarget(cls, snapshot.graphContainers!);

    expect(target.graphTab).toBe('calc-calculator-graph');
    expect(target.referenceTabId).toBe('calc-calculator-graph');
    expect(target.container?.id).toBe('calc-calculator-graph');
  });

  test('canvasFocusFrame pins selection on navigate payload', () => {
    const frame = canvasFocusFrame('calc-calculator-graph', { type: 'event', id: 'evt-calc' });
    expect(frame.selection).toEqual({ type: 'event', id: 'evt-calc' });
    expect(frame.editorView).toBe('canvas');
  });

  test('resolveVariableFocusFrame targets class home graph for var-a', () => {
    const snapshot = createComplexExampleSnapshot();
    const frame = resolveVariableFocusFrame(
      'var-a',
      snapshot.variables,
      snapshot.classes!,
      snapshot.graphContainers!
    );

    expect(frame).not.toBeNull();
    expect(frame!.graphTab).toBe('calc-calculator-graph');
    expect(frame!.selection).toEqual({ type: 'variable', id: 'var-a' });
  });
});
