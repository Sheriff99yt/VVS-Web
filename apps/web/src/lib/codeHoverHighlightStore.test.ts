import { describe, expect, test } from 'bun:test';
import {
  clearCodeHoverHighlight,
  flashPlacementHighlight,
  getCodeHoverHighlightNodeId,
  getCodeHoverHighlightNodeIds,
  getCodeHoverHighlightTabId,
  isCodeHoverNode,
  setCodeHoverHighlight,
  subscribeCodeHoverHighlight,
} from './codeHoverHighlightStore';

describe('codeHoverHighlightStore', () => {
  test('set and clear notify subscribers', () => {
    clearCodeHoverHighlight();
    let ticks = 0;
    const unsub = subscribeCodeHoverHighlight(() => {
      ticks += 1;
    });
    setCodeHoverHighlight({ nodeId: 'n1', tabId: 'main' });
    expect(getCodeHoverHighlightNodeId()).toBe('n1');
    expect(getCodeHoverHighlightNodeIds()).toEqual(['n1']);
    expect(getCodeHoverHighlightTabId()).toBe('main');
    expect(ticks).toBe(1);
    setCodeHoverHighlight({ nodeId: 'n1', tabId: 'main' });
    expect(ticks).toBe(1);
    clearCodeHoverHighlight();
    expect(getCodeHoverHighlightNodeId()).toBeNull();
    expect(getCodeHoverHighlightTabId()).toBeNull();
    expect(ticks).toBe(2);
    unsub();
  });

  test('tab outline without canvas ring (other-tab hover)', () => {
    clearCodeHoverHighlight();
    setCodeHoverHighlight({ nodeId: null, tabId: 'fn-1' });
    expect(getCodeHoverHighlightNodeId()).toBeNull();
    expect(getCodeHoverHighlightTabId()).toBe('fn-1');
    clearCodeHoverHighlight();
  });

  test('multi-node flash for placement', () => {
    clearCodeHoverHighlight();
    flashPlacementHighlight(['a', 'b'], 'main', 50);
    expect(isCodeHoverNode('a')).toBe(true);
    expect(isCodeHoverNode('b')).toBe(true);
    expect(getCodeHoverHighlightNodeIds()).toEqual(['a', 'b']);
    clearCodeHoverHighlight();
  });
});
