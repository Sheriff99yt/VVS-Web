import { describe, expect, test } from 'bun:test';
import { canvasFocusFrame, resolveClassHomeGraphTarget, resolveVariableFocusFrame } from './editorFocus';
import { createCoverageLabUsabilityTestSnapshot } from './usabilityExampleTests/coverageLabUsabilityTest';
import { MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';

describe('editorFocus', () => {
  test('resolveClassHomeGraphTarget uses container tab for Machine class', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
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
    const frame = canvasFocusFrame(MAIN_GRAPH_CONTAINER_ID, { type: 'event', id: 'evt-pulse' });
    expect(frame.selection).toEqual({ type: 'event', id: 'evt-pulse' });
    expect(frame.editorView).toBe('canvas');
  });

  test('resolveVariableFocusFrame targets class home graph for var-power', () => {
    const snapshot = createCoverageLabUsabilityTestSnapshot();
    const frame = resolveVariableFocusFrame(
      'var-power',
      snapshot.variables,
      snapshot.classes!,
      snapshot.graphContainers!,
      snapshot.documents!,
      MAIN_GRAPH_CONTAINER_ID
    );

    expect(frame).not.toBeNull();
    expect(frame!.graphTab).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(frame!.selection).toEqual({ type: 'variable', id: 'var-power' });
  });
});
