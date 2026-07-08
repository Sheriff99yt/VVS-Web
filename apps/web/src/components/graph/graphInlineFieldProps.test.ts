import { describe, expect, test } from 'bun:test';
import { stepNumberInlineValue } from '@/components/graph/useNumberInputWheel';

describe('stepNumberInlineValue', () => {
  test('scroll up increases by 1', () => {
    expect(stepNumberInlineValue(5, -100)).toBe(6);
  });

  test('scroll down decreases by 1', () => {
    expect(stepNumberInlineValue(5, 100)).toBe(4);
  });

  test('shift uses step 10', () => {
    expect(stepNumberInlineValue(0, -1, { shiftKey: true })).toBe(10);
  });

  test('ctrl uses step 0.1', () => {
    expect(stepNumberInlineValue(1, -1, { ctrlKey: true })).toBe(1.1);
  });

  test('non-finite current treats as zero', () => {
    expect(stepNumberInlineValue(Number.NaN, -1)).toBe(1);
  });
});
