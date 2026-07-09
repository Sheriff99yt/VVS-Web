import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_TARGET_FILE_EXTENSION,
  normalizeTargetFileExtensions,
  resolveTargetFileExtension,
  TARGET_FILE_EXTENSIONS,
} from './targetFileExtensions';

describe('targetFileExtensions', () => {
  test('cpp supports header and source extensions', () => {
    expect(TARGET_FILE_EXTENSIONS.cpp).toContain('h');
    expect(TARGET_FILE_EXTENSIONS.cpp).toContain('hpp');
    expect(TARGET_FILE_EXTENSIONS.cpp).toContain('cpp');
  });

  test('resolveTargetFileExtension uses override when valid', () => {
    expect(resolveTargetFileExtension('cpp', { cpp: 'hpp' })).toBe('hpp');
  });

  test('resolveTargetFileExtension falls back for invalid override', () => {
    expect(resolveTargetFileExtension('cpp', { cpp: 'xyz' })).toBe(
      DEFAULT_TARGET_FILE_EXTENSION.cpp
    );
  });

  test('normalizeTargetFileExtensions strips dot and ignores unknown langs', () => {
    expect(
      normalizeTargetFileExtensions({ cpp: '.h', python: 'py', verse: 'bad', foo: 'bar' })
    ).toEqual({ cpp: 'h', python: 'py' });
  });
});
