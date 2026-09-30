import { describe, expect, test, setSystemTime } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseAcorn } from 'acorn';
import { analyzeProject, normalizeProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { previewJavaScriptImport, planJavaScriptClass, materializeImportPlan, resolveReverseMapping, JAVASCRIPT_MAPPING_CONTRACTS, IMPORT_LIMITS } from './index';
import { reviewSourceImportGraph, normalizedImportSyntax, validateImportSnapshot, acceptSourceImportReview } from './validation';
import { fullFileSnapshot, type FullFileFixture } from '../test/fullFileFixture';
import { semanticProjection } from '../test/semanticProjection';

const fixtureDir = new URL('../../syntax-packs/rosetta/full-file/', import.meta.url).pathname;
const fixtures: FullFileFixture[] = readdirSync(fixtureDir).filter(name => name.endsWith('.fixture.json')).map(name => JSON.parse(readFileSync(join(fixtureDir, name), 'utf8')));
async function review(source: string) {
  const preview = await previewJavaScriptImport(source);
  const candidate = preview.regions.find(r => r.kind === 'candidate');
  return candidate ? reviewSourceImportGraph(preview, candidate, 'fixture.js', true) : { diagnostics: preview.regions.map(r => r.reason ?? ''), snapshot: undefined, generated: '', nodeCount: 0 };
}
function independentlyParsed(source: string) {
  return JSON.stringify(parseAcorn(source, { ecmaVersion: 2022, sourceType: 'script' }), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : Array.isArray(value) ? value.filter(item => item?.type !== 'EmptyStatement') : value);
}

for (const fixture of fixtures) describe(`full-file Rosetta ${fixture.name}`, () => {
  test('G→S→G preserves fixed semantic facts, options, bindings and flow', async () => {
    const original = normalizeProjectSnapshot(fullFileSnapshot(fixture))!;
    expect(analyzeProject(original).diagnostics.filter(d => d.level === 'error')).toEqual([]);
    expect(semanticProjection(original)).toEqual(fixture.expected);
    const generated = transpileProject({ ...original, projectEvents: original.events });
    expect(generated.files).toHaveLength(1);
    expect(normalizedImportSyntax(generated.files[0]!.content)).toBe(normalizedImportSyntax(fixture.source));
    expect(independentlyParsed(generated.files[0]!.content)).toBe(independentlyParsed(fixture.source));
    const imported = await review(generated.files[0]!.content);
    expect(imported.diagnostics).toEqual([]);
    expect(semanticProjection(imported.snapshot!)).toEqual(fixture.expected);
  });
  test('S→G→S and persistence preserve handwritten facts and immutable provenance', async () => {
    const imported = await review(fixture.source);
    expect(imported.diagnostics).toEqual([]);
    expect(semanticProjection(imported.snapshot!)).toEqual(fixture.expected);
    expect(normalizedImportSyntax(imported.generated)).toBe(normalizedImportSyntax(fixture.source));
    expect(independentlyParsed(imported.generated)).toBe(independentlyParsed(fixture.source));
    const accepted = await acceptSourceImportReview(imported, fixture.source, 'fixture.js', true);
    const saved = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
    expect(semanticProjection(saved)).toEqual(fixture.expected);
    const provenance = Object.values(saved.documents).flatMap(d => d.nodes).find(n => n.data.properties?.sourceImport)!.data.properties!.sourceImport as { source: string; sourceSha256: string };
    expect(provenance.source).toBe(fixture.source);
    expect(provenance.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('independent rejection gates', () => {
  test('materialization is identical across different wall-clock times', async () => {
    const preview = await previewJavaScriptImport(fixtures[0]!.source);
    const plan = planJavaScriptClass(preview, preview.regions[0]!, 'fixture.js', true);
    try {
      setSystemTime(new Date('2026-09-30T00:00:00Z'));
      const first = materializeImportPlan(plan);
      setSystemTime(new Date('2026-10-01T00:00:00Z'));
      const second = materializeImportPlan(plan);
      expect(first.savedAt).toBe('');
      expect(second).toEqual(first);
      expect(semanticProjection(second)).toEqual(fixtures[0]!.expected);
    } finally { setSystemTime(); }
  });
  test('mutated branch polarity, arithmetic operator and parameter binding fail structural gate', async () => {
    const branch = fixtures.find(f => f.name === 'terminal-branch')!;
    const arithmetic = fixtures.find(f => f.name === 'static-arithmetic')!;
    for (const [fixture, mutate] of [
      [branch, (s: NonNullable<Awaited<ReturnType<typeof review>>['snapshot']>) => {
        const doc = Object.values(s.documents).find(d => d.nodes.some(n => n.data.kindId === 'flow_branch'))!;
        for (const edge of doc.edges) if (edge.sourceHandle === 'true_exec') edge.sourceHandle = 'false_exec'; else if (edge.sourceHandle === 'false_exec') edge.sourceHandle = 'true_exec';
      }],
      [arithmetic, (s: NonNullable<Awaited<ReturnType<typeof review>>['snapshot']>) => {
        const node = Object.values(s.documents).flatMap(d => d.nodes).find(n => n.data.kindId === 'math_add')!; node.data.kindId = 'math_subtract';
      }],
      [branch, (s: NonNullable<Awaited<ReturnType<typeof review>>['snapshot']>) => {
        const edge = Object.values(s.documents).flatMap(d => d.edges).find(e => e.sourceHandle === 'param-0')!; edge.sourceHandle = 'param-1';
      }],
    ] as const) {
      const result = await review(fixture.source); const snapshot = structuredClone(result.snapshot!); mutate(snapshot);
      expect(() => validateImportSnapshot(snapshot, fixture.source)).toThrow('STRUCTURAL_DRIFT');
      expect(semanticProjection(snapshot)).not.toEqual(fixture.expected);
    }
  });
  test('omitted visible Declare is blocked by analyzer even if generation could appear correct', async () => {
    const result = await review(fixtures[0]!.source); const snapshot = structuredClone(result.snapshot!);
    for (const doc of Object.values(snapshot.documents)) {
      const declaration = doc.nodes.find(n => n.data.kindId === 'function_define'); if (!declaration) continue;
      doc.nodes = doc.nodes.filter(n => n.id !== declaration.id); doc.edges = doc.edges.filter(e => e.source !== declaration.id && e.target !== declaration.id);
    }
    expect(() => validateImportSnapshot(snapshot, fixtures[0]!.source)).toThrow('GRAPH_ANALYSIS');
  });
  test('ordered side effects cannot be accepted or silently converted to comments', async () => {
    for (const body of ['first(); second(); return 0;', 'second(); first(); return 0;']) {
      const result = await review(`class Effects { on_start() { ${body} } }`);
      expect(result.snapshot).toBeUndefined(); expect(result.diagnostics.join()).toContain('TERMINAL_BLOCK_REQUIRED');
    }
  });
  test('dynamic operators and truthiness are explicit capability gaps', async () => {
    for (const body of ['return a + b;', 'return a * b;', 'return "a" + "b";', 'if (a) { return a; } else { return b; }']) {
      const result = await review(`class Dynamic { on_start() { return 0; } f(a,b) { ${body} } }`);
      expect(result.snapshot).toBeUndefined(); expect(result.diagnostics.join()).toMatch(/JS_DYNAMIC_OPERATOR|JS_TRUTHINESS/);
    }
  });
  test('rejects captures, shadowing, receiver access, directives, module context, defaults, async and negative zero', async () => {
    for (const source of [
      'class C { on_start(){return 0;} f(a){return captured;} }',
      'class C { on_start(){return 0;} f(a){let a=1;return a;} }',
      'class C { on_start(){return this.a;} }',
      '"use strict"; class C { on_start(){return 0;} }',
      'class C { on_start(){"use strict";return 0;} }',
      'export class C { on_start(){return 0;} }',
      'class C { on_start(){return 0;} f(a=1){return a;} }',
      'class C { async on_start(){return 0;} }',
      'class C { on_start(){return -0;} }',
    ]) expect((await review(source)).snapshot).toBeUndefined();
  });
  test('UTF-16 ranges and scoped reads are exact, including astral text outside selected unit', async () => {
    const source = '// 🧭 retained\nclass Scope { on_start(){return 0;} one(x){return x;} two(x){return x;} }';
    const preview = await previewJavaScriptImport(source); const candidate = preview.regions.find(r => r.kind === 'candidate')!;
    expect(preview.regions.map(r => r.text).join('')).toBe(source);
    const plan = planJavaScriptClass(preview, candidate, 'unicode.js', true);
    expect(plan.dependencies).toHaveLength(2); expect(new Set(plan.dependencies.map(d => d.scopeId)).size).toBe(2);
    for (const dependency of plan.dependencies) expect(source.slice(dependency.start, dependency.end)).toBe('x');
    expect(materializeImportPlan(plan)).toEqual(materializeImportPlan(plan));
  });
  test('ambiguous registry selection is independent of insertion order', () => {
    const contract = JAVASCRIPT_MAPPING_CONTRACTS[0];
    const mappings = ['one','two'].map(id => ({ contract: { ...contract, id }, matches: () => true, map: () => id }));
    for (const order of [mappings, [...mappings].reverse()]) {
      const result = resolveReverseMapping(order, {}, {}, { start: 0, end: 1 });
      expect(result.status).toBe('ambiguous');
      if (result.status === 'ambiguous') expect(result.mappingIds).toEqual(['one','two']);
    }
  });
  test('stale source, role consent, filename and graph cannot be accepted', async () => {
    const source = fixtures[0]!.source;
    const result = await review(source); expect(result.snapshot).toBeDefined();
    await expect(acceptSourceImportReview(result, source + ' ', 'fixture.js', true)).rejects.toThrow('STALE_REVIEW');
    await expect(acceptSourceImportReview(result, source, 'other.js', true)).rejects.toThrow('STALE_REVIEW');
    await expect(acceptSourceImportReview(result, source, 'fixture.js', false)).rejects.toThrow('STALE_REVIEW');
    result.snapshot!.projectDetails.moduleName = 'changed';
    await expect(acceptSourceImportReview(result, source, 'fixture.js', true)).rejects.toThrow('STALE_REVIEW');
    const preview = await previewJavaScriptImport(source);
    expect(reviewSourceImportGraph({ ...preview, sourceSha256: '0'.repeat(64) }, preview.regions[0]!, 'x.js', true).diagnostics.join()).toContain('STALE_SOURCE');
  });
  test('parser recovery, byte, depth and method budgets never expose an acceptable graph', async () => {
    expect((await review('class C {on_start(){return ; broken }}')).snapshot).toBeUndefined();
    await expect(previewJavaScriptImport(' '.repeat(IMPORT_LIMITS.sourceBytes + 1))).rejects.toThrow('SOURCE_BUDGET');
    const nested = 'class C {on_start(){return ' + '('.repeat(200) + '1'.repeat(1) + ')'.repeat(200) + ';}}';
    // Parentheses are metadata; deep expression/branch trees are bounded separately.
    expect((await review(nested)).snapshot).toBeDefined();
    const deep = 'class C {on_start(){return ' + '1+'.repeat(100) + '1;}}';
    expect((await review(deep)).snapshot).toBeUndefined();
    const manyNodes = 'class C {on_start(){return 0;}' + Array.from({length:31},(_,i)=>`f${i}(){return ${'1+'.repeat(20)}1;}`).join('') + '}';
    expect((await review(manyNodes)).diagnostics.join()).toContain('NODE_BUDGET');
    expect((await review('class C {on_start(){return 0;}' + Array.from({length:32},(_,i)=>`f${i}(){return 0;}`).join('') + '}')).snapshot).toBeUndefined();
  });
});
