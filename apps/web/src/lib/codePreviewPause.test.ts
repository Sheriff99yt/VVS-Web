import { describe, expect, test } from 'bun:test';
import { isCodePreviewPaused } from './codePreviewPause';

describe('isCodePreviewPaused', () => {
  test('pauses when auto generate is off and graph is dirty', () => {
    expect(isCodePreviewPaused(false, 'dirty')).toBe(true);
    expect(isCodePreviewPaused(false, 'compiling')).toBe(true);
    expect(isCodePreviewPaused(false, 'success', true)).toBe(true);
    expect(isCodePreviewPaused(true, 'dirty')).toBe(false);
    expect(isCodePreviewPaused(false, 'success')).toBe(false);
    expect(isCodePreviewPaused(false, 'clean')).toBe(false);
    expect(isCodePreviewPaused(true, 'success')).toBe(false);
  });
});
