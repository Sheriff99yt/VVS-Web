import { describe, expect, test } from 'bun:test';
import { analyzeProject, normalizeProjectSnapshot } from '@vvs/graph-types';
import { previewJavaScriptImport } from './sourceImportPreview';
import { reviewSourceImportGraph, normalizedImportSyntax } from './sourceImportGraph';

async function review(source: string) {
  const preview = await previewJavaScriptImport(source);
  return reviewSourceImportGraph(preview, preview.regions.find(r => r.kind === 'candidate')!, 'example.js', true);
}

describe('source import graph', () => {
  test('creates editable class/method nodes and preserves expression grouping', async () => {
    const source = 'class Calculator { on_start() { return 0; } add(a, b) { return (3 + 4) * 2; } static text() { return "hello world"; } }';
    const result = await review(source);
    expect(result.diagnostics).toEqual([]);
    expect(result.snapshot).toBeDefined();
    expect(normalizedImportSyntax(result.generated)).toBe(normalizedImportSyntax(source));
    expect(analyzeProject(result.snapshot!).diagnostics.filter(d => d.level === 'error')).toEqual([]);
    expect(result.snapshot!.functions).toHaveLength(2);
    expect(Object.values(result.snapshot!.documents).flatMap(d => d.nodes).some(n => n.data.kindId === 'math_multiply')).toBe(true);
  });

  test('maps terminal if/else without changing control flow', async () => {
    const result = await review('class Choice { on_start() { return 0; } choose(flag, a, b) { if (true) { return a; } else { return b; } } }');
    expect(result.diagnostics).toEqual([]);
    expect(result.snapshot).toBeDefined();
  });

  test('blocks unsupported behavior in the entire class', async () => {
    for (const source of [
      'class Bad { on_start() { return 0; } f(a) { return external(a); } }',
      'class Bad { on_start() { return 0; } f() { return captured; } }',
      'class Bad { on_start() { return 0; } f(a) { let x = a; return x; } }',
      'class Bad { on_start() { return 0; } f(a) { return a; } f(b) { return b; } }',
      'function f(a) { return a; }',
    ]) {
      const result = await review(source);
      expect(result.snapshot).toBeUndefined();
      expect(result.diagnostics.length).toBeGreaterThan(0);
    }
  });

  test('retains full original file and source link through save/load normalization', async () => {
    const source = '// original header\nclass Saved { on_start() { return 0; } f() { return 42; } }\nconst untouched = 3;';
    const result = await review(source);
    expect(result.diagnostics).toEqual([]);
    const saved = normalizeProjectSnapshot(JSON.parse(JSON.stringify(result.snapshot)))!;
    expect(analyzeProject(saved).diagnostics.filter(d => d.level === 'error')).toEqual([]);
    const node = Object.values(saved.documents).flatMap(d => d.nodes).find(n => n.data.kindId === 'class_define' && n.data.properties?.sourceImport);
    const provenance = node!.data.properties!.sourceImport as { source: string; sourceSha256: string };
    expect(provenance.source).toBe(source);
    expect(provenance.sourceSha256).toHaveLength(64);
    expect(result.generated).not.toContain('untouched');
  });
  test('requires explicit entry mapping and never invents an entry method', async () => {
    const preview = await previewJavaScriptImport('class Confirm { on_start() { return 0; } }');
    expect(reviewSourceImportGraph(preview, preview.regions[0]!, 'x.js').snapshot).toBeUndefined();
    expect((await review('class NoEntry { f() { return 0; } }')).snapshot).toBeUndefined();
  });

  test('blocks emitter string escaping drift and retains source on rejection', async () => {
    const source = 'class Escaped { on_start() { return "line\\nnext"; } }';
    const preview = await previewJavaScriptImport(source);
    const result = reviewSourceImportGraph(preview, preview.regions[0]!, 'x.js', true);
    expect(result.snapshot).toBeUndefined();
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(preview.source).toBe(source);
  });

});
