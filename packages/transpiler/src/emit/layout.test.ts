import { describe, expect, test } from 'bun:test';
import { emptyFunctionBodyLine, emptyHandlerBodyLine } from './layout';

describe('emit layout empty body lines', () => {
  test('python uses pack emptyHandlerBody / emptyFunctionBody', () => {
    expect(emptyHandlerBodyLine('python')).toBe('        pass');
    expect(emptyFunctionBodyLine('python')).toBe('        pass');
  });

  test('javascript uses pack empty lines', () => {
    expect(emptyHandlerBodyLine('javascript')).toBe('        // empty');
    expect(emptyFunctionBodyLine('javascript')).toBe('        // empty');
  });

  test('cpp and verse use pack empty lines', () => {
    expect(emptyHandlerBodyLine('cpp')).toBe('        // empty');
    expect(emptyFunctionBodyLine('cpp')).toBe('        // empty');
    expect(emptyHandlerBodyLine('verse')).toBe('        # empty');
    expect(emptyFunctionBodyLine('verse')).toBe('        # empty');
  });
});
