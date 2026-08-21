import { describe, expect, test } from 'bun:test';
import { canvasFocusFrame, resolveClassHomeGraphTarget, resolveVariableFocusFrame } from './editorFocus';
import { createAdvancedSnapshot } from './usabilityExampleTests/advancedUsabilityTest';
import { createComplexSnapshot } from './usabilityExampleTests/complexUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('editorFocus', () => {
  test('resolveClassHomeGraphTarget uses container tab for Machine class', () => {
    const snapshot = createAdvancedSnapshot();
    const cls = snapshot.classes!.find((c) => c.name === 'Machine')!;
    const target = resolveClassHomeGraphTarget(
      cls,
      snapshot.graphContainers!,
      snapshot.documents!,
      MAIN_GRAPH_CONTAINER_ID
    );

    expect(target.graphTab).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(target.referenceTabId).toBe(MAIN_GRAPH_CONTAINER_ID);
  });

  test('canvasFocusFrame pins selection on navigate payload', () => {
    const frame = canvasFocusFrame(MAIN_GRAPH_CONTAINER_ID, { type: 'event', id: 'evt-sensor-start' });
    expect(frame.selection).toEqual({ type: 'event', id: 'evt-sensor-start' });
    expect(frame.editorView).toBe('canvas');
  });

  test('resolveVariableFocusFrame targets class home graph for var-total', () => {
    const snapshot = createComplexSnapshot();
    const frame = resolveVariableFocusFrame(
      'var-total',
      snapshot.variables,
      snapshot.classes!,
      snapshot.graphContainers!,
      snapshot.documents!,
      MAIN_GRAPH_CONTAINER_ID
    );

    expect(frame).not.toBeNull();
    expect(frame!.graphTab).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(frame!.selection).toEqual({ type: 'variable', id: 'var-total' });
  });
});
