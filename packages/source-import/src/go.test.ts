import { expect, test } from 'bun:test';
import { previewGoImport, normalizedGoSyntax } from './go';
import { acceptSourceImportReview, reviewSourceImportGraph, validateImportSnapshot } from './validation';
import { analyzeProject, normalizeProjectSnapshot } from '@vvs/graph-types';

import { configureGoTestRuntime } from '../test/goRuntime';
import { GO_UNIT_FIXTURES, GO_UNIT_GAPS, GO_WORD_FIXTURES } from './goUnitCorpus';
configureGoTestRuntime();
test('Go constant initializers and updates reject dynamic facts, width errors and invalid bindings', async () => {
  for (const source of [
    'package sample\nfunc dynamic(value int) int { const copy = value; return copy }',
    'package sample\nfunc check() int { return 1 }\nfunc dynamic() int { const copy = check(); return copy }',
    'package sample\nfunc dynamic(value int) bool { const copy = value > 0; return copy }',
    'package sample\nfunc update() int { const copy = 1; copy = 2; return copy }',
    'package sample\nfunc update() int { const copy = 1; copy++; return copy }',
    'package sample\nfunc overflow() uint8 { const copy uint8 = 256; return copy }',
    'package sample\nfunc fractional() int { const copy int = 1.5; return copy }',
    'package sample\nfunc cycle() int { const copy = copy; return copy }',
    'package sample\nfunc forward() int { const copy = later; const later = 1; return copy }',
    'package sample\nfunc duplicate() int { const copy = 1; const copy = 2; return copy }',
    'package sample\nfunc mismatch() float64 { const copy int32 = 1; return copy }',
    'package sample\nfunc wrong() string { return "\\/" }',
    'package sample\nfunc wrong() string { return "\\uD83D\\uDE00" }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot, source).toBeUndefined();
    expect(review.diagnostics.length, source).toBeGreaterThan(0);
    expect(preview.source).toBe(source);
  }
});
for (const gap of GO_UNIT_GAPS) test(`Go roadmap feedback retains unresolved construct: ${gap.id}`, async () => {
  const preview = await previewGoImport(gap.source);
  expect(preview.source).toBe(gap.source);
  const review = preview.regions[0].kind === 'candidate' ? reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library') : undefined;
  expect(review?.snapshot).toBeUndefined();
  expect((review?.diagnostics ?? preview.diagnostics).length).toBeGreaterThan(0);
});
for (const source of GO_UNIT_FIXTURES) test(`Go file units round-trip with visible types and package: ${source}`, async () => {
  const preview = await previewGoImport(source);
  expect(preview.diagnostics).toEqual([]);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  expect(normalizedGoSyntax(review.generated)).toBe(normalizedGoSyntax(source));
  const snapshot = await acceptSourceImportReview(review, source, 'sample.go', false, 'library');
  expect(analyzeProject(snapshot).ok).toBe(true);
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(snapshot)))!;
  expect(validateImportSnapshot(loaded, source).generated).toBe(review.generated);
  expect(Object.values(loaded.documents).flatMap(doc => doc.nodes).filter(node => node.data.kindId === 'source_package')).toHaveLength(1);
});
test('Go unsupported or invalid native constructs retain original source and block acceptance', async () => {
  for (const source of [
    'package sample\nfunc wrong(value float64) bool { return value }',
    'package sample\nfunc identity(value bool) bool { return value }\nfunc wrong() bool { return identity(1) }',
    'package sample\nfunc count(value int64) uint64 { return value }',
    'package sample\nfunc mixed(left int8, right int64) int64 { return left + right }',
    'package sample\nfunc inferred(value int64) int64 { copy := 1; return copy }',
    'package sample\nfunc wrong(value uint8) uint8 { var copy int8 = value; return copy }',
    'package sample\nfunc grouped(first, second float64) float64 { return first }',
    'package sample\nfunc captured() float64 { return outside }',
    'package sample\nfunc compare(left bool, right bool) bool { return left < right }',
    'package sample\nfunc bool(value bool) bool { return value }',
    'package sample\nfunc blank(_ float64) float64 { return _ }',
    'package sample\nfunc wrong(value float64) float64 { copy := 1; return copy }',
    'package sample\nfunc unused(value float64) float64 { copy := value; return value }',
    'package sample\nfunc escaped(value float64) float64 { copy := value; for index := value; index < 5; index++ { copy += index }; return index }',
    'package sample\nfunc missing(flag bool, value float64) float64 { if flag { return value } }',
    'package sample\nfunc mismatched(value float64) float64 { copy := value; copy = true; return copy }',
    'package sample\nfunc main() { }',
    'package sample\n// retained comment\nfunc identity(value string) string { return value }',
    'package sample\nfunc identity(value string string { return value }',
  ]) {
    const preview = await previewGoImport(source);
    if (preview.regions[0]?.kind === 'candidate') expect(reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library').snapshot).toBeUndefined();
    else expect(preview.diagnostics.length).toBeGreaterThan(0);
    expect(preview.source).toBe(source);
  }
});

for (const { source, wordBits } of GO_WORD_FIXTURES) test(`Go explicit ${wordBits}-bit context preserves native word inference: ${source}`, async () => {
  const preview = await previewGoImport(source, wordBits);
  const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
  expect(review.diagnostics).toEqual([]);
  const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(review.snapshot)))!;
  expect(Object.values(loaded.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'source_package')!.data.properties!.goWordBits).toBe(String(wordBits));
  expect(validateImportSnapshot(loaded, source).generated).toBe(review.generated);
});
test('Go exact constant failures retain source and cannot produce accepted graphs', async () => {
  for (const source of [
    'package sample\nfunc overflow() uint64 { return 18446744073709551616 }',
    'package sample\nfunc negative() uint8 { return -1 }',
    'package sample\nfunc width(value uint8) uint8 { return value + 256 }',
    'package sample\nfunc divide(value int64) int64 { return value / 0 }',
    'package sample\nfunc shift(value int64) int64 { return value << -1 }',
    'package sample\nfunc compare(value uint8) bool { return value < 256 }',
    'package sample\nfunc changed() int { copy := 2147483648; return copy }',
  ]) {
    const preview = await previewGoImport(source, 32);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0); expect(preview.source).toBe(source);
  }
});

test('Go contextual shifts reject initial representability failures and noninteger contexts', async () => {
  for (const source of [
    'package sample\nfunc overflow(count uint8) int8 { return 128 >> count }',
    'package sample\nfunc negative(count uint8) uint8 { return -1 << count }',
    'package sample\nfunc floating(count uint8) float64 { return 1 << count }',
    'package sample\nfunc constant() int { return 0 >> 1075 }',
    'package sample\nfunc compound(value int8) int8 { copy := value; copy %= 0; return copy }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
  }
});

test('Go unresolved shift counts reject literals beyond the pinned compiler storage domain', async () => {
  for (const token of ['18446744073709551616', '-9223372036854775809']) {
    const source = `package sample\nfunc count(left uint64, count uint8) uint64 { return left << (${token} << count) }`;
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.join(' ')).toContain('NATIVE_GO_INTEGER_OVERFLOW');
  }
});

test('Go floating constants reject native overflow, fractional integer conversion and invalid shift inference', async () => {
  for (const source of [
    'package sample\nfunc overflow() float64 { return 0x1.fffffffffffff8p1023 }',
    'package sample\nfunc fractional() int { return 1.5 }',
    'package sample\nfunc divide(value float64) float64 { return value / 1e-1200 }',
    'package sample\nfunc inferred(count uint8) float64 { value := 1.0 << count; return value }',
    'package sample\nfunc typed(value float64, count uint8) float64 { return value << count }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
  }
});

test('Go native conversions reject invalid constants, implicit width changes and shadowed type calls', async () => {
  for (const source of [
    'package sample\nfunc wrong() uint8 { return uint8(256) }',
    'package sample\nfunc wrong() int32 { return int32(1.5) }',
    'package sample\nfunc wrong() float32 { return float32(1e40) }',
    'package sample\nfunc wrong(value float32) float64 { return value }',
    'package sample\nfunc wrong(value float64) float32 { return value }',
    'package sample\nfunc wrong(count uint8) float64 { return float64(1 << count) }',
    'package sample\nfunc wrong(float32 int) float32 { return float32(1) }',
    'package sample\nfunc wrong() int { return int() }',
    'package sample\nfunc wrong() int { return int(1, 2) }',
  ]) {
    const preview = await previewGoImport(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], 'sample.go', false, 'library');
    expect(review.snapshot).toBeUndefined(); expect(review.diagnostics.length).toBeGreaterThan(0);
  }
});
