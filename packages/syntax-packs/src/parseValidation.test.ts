import { describe, expect, test } from 'bun:test';
import {
  SUPPORTED_FAMILIES,
  isParseValidationRuntimeAvailable,
  validateGeneratedParse,
} from './parseValidation';

describe('Tree-sitter parse validation', () => {
  test('supported Rosetta outputs parse cleanly when parser runtime is available', () => {
    const result = validateGeneratedParse({ families: SUPPORTED_FAMILIES });
    if (isParseValidationRuntimeAvailable()) {
      expect(result.runtimeAvailable).toBe(true);
      expect(result.ok).toBe(true);
      expect(result.failed).toBe(0);
      expect(result.total).toBeGreaterThan(0);
    } else {
      expect(result.runtimeAvailable).toBe(false);
      expect(result.skipped).toBeGreaterThan(0);
      expect(result.total).toBe(0);
    }
  });
});
