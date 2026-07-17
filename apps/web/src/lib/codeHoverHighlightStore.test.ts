import { describe, expect, test } from 'bun:test';
import {
  clearCodeHoverHighlight,
  getCodeHoverHighlightNodeId,
  getCodeHoverHighlightTabId,
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
});
