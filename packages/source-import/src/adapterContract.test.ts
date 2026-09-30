import { expect, test } from 'bun:test';
import { SourceAdapterRegistry, type SourceAdapter } from './adapterContract';
import { toReviewSpan } from './sourceOffsets';

test('Unicode, CRLF and multibyte offsets convert to exact review boundaries', () => {
  const source = 'é\r\n😀x';
  expect(toReviewSpan(source, { start: 4, end: 8 }, 'utf8')).toEqual({ start: 3, end: 5 });
  expect(toReviewSpan(source, { start: 3, end: 4 }, 'codepoint')).toEqual({ start: 3, end: 5 });
  expect(toReviewSpan(source, { start: 3, end: 5 }, 'utf16')).toEqual({ start: 3, end: 5 });
  for (const span of [{ start: 1, end: 2 }, { start: 5, end: 8 }, { start: 0, end: 10 }]) expect(() => toReviewSpan(source, span, 'utf8')).toThrow('SOURCE_SPAN_BOUNDARY_INVALID');
  expect(() => toReviewSpan(source, { start: 3, end: 4 }, 'utf16')).toThrow('SOURCE_SPAN_BOUNDARY_INVALID');
  expect(() => toReviewSpan(source, { start: 2, end: 1 }, 'codepoint')).toThrow('SOURCE_SPAN_INVALID');
});
test('adapter loading is lazy, versioned and checks returned identity', async () => {
  const registry = new SourceAdapterRegistry(); let loads = 0;
  const adapter: SourceAdapter = { id: 'future-parser', version: '1.0', profileId: 'future.v1', profileVersion: 1,
    async parse() { return { status: 'unvalidated', diagnostics: [] }; } };
  registry.register('future.v1', 1, async () => { loads++; return adapter; });
  expect(loads).toBe(0);
  expect(await registry.load('missing', 1)).toBeUndefined();
  expect(await registry.load('future.v1', 1)).toBe(adapter);
  expect(loads).toBe(1);
  await expect(registry.load('future.v1', 2)).rejects.toThrow('ADAPTER_PROFILE_STALE');
  expect(() => registry.register('future.v1', 1, async () => adapter)).toThrow('ADAPTER_PROFILE_DUPLICATE');
  registry.register('wrong', 1, async () => adapter);
  await expect(registry.load('wrong', 1)).rejects.toThrow('ADAPTER_IDENTITY_MISMATCH');
});
