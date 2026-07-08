import { describe, expect, test } from 'bun:test';
import { SUPPORTED_FAMILIES, validateGeneratedParse } from './parseValidation';

describe('Tree-sitter parse validation', () => {
  test('supported Rosetta outputs parse cleanly when parser runtime is available', () => {
    const result = validateGeneratedParse({ families: SUPPORTED_FAMILIES });
    expect(result.ok).toBe(true);
    expect(result.failed).toBe(0);
    expect(result.total + result.skipped).toBeGreaterThan(0);
  });
});
