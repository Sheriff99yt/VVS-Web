import { describe, expect, test } from 'bun:test';
import {
  shouldCaptureProjectOnJump,
  shouldCaptureProjectOnOpposite,
} from './graphHistoryPolicy';

describe('graphHistoryPolicy', () => {
  test('fat entry always captures project on opposite stack', () => {
    expect(shouldCaptureProjectOnOpposite(true, 'main', 'main')).toBe(true);
    expect(shouldCaptureProjectOnOpposite(true, 'main', 'fn-1')).toBe(true);
  });

  test('lean same-tab undo stays lean', () => {
    expect(shouldCaptureProjectOnOpposite(false, 'main', 'main')).toBe(false);
  });

  test('lean cross-tab undo fat-captures Current', () => {
    expect(shouldCaptureProjectOnOpposite(false, 'main', 'fn-1')).toBe(true);
  });

  test('jump captures project when target or discarded entries are fat', () => {
    expect(shouldCaptureProjectOnJump(false, false)).toBe(false);
    expect(shouldCaptureProjectOnJump(true, false)).toBe(true);
    expect(shouldCaptureProjectOnJump(false, true)).toBe(true);
  });
});
