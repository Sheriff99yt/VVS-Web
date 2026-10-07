import { describe, expect, test } from 'bun:test';
import { inventoryCSharpSource } from './csharp';
import { previewGoImport } from './go';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
import { configureGoTestRuntime } from '../test/goRuntime';
import corpus from '../test/native-csharp/cases.json';
import nativeEvidence from '../../../docs/design/code_visual_csharp_native_evidence.json';
import { previewJavaScriptImport, type SourceImportPreview } from './parser';
import { reviewSourceImportGraph } from './validation';

configureCSharpTestRuntime();
configureGoTestRuntime();

describe('C# grammar inventory before visual acceptance', () => {
  test('forged C# candidates cannot fall through the JavaScript graph mapper', async () => {
    const preview = await previewJavaScriptImport('function value() { return 1; }');
    const forged = { ...preview, language: 'csharp' } as unknown as SourceImportPreview;
    const review = reviewSourceImportGraph(forged, preview.regions[0], 'value.cs', false, 'library');
    expect(review.snapshot).toBeUndefined();
    expect(review.issues?.[0].code).toBe('IMPORT_LANGUAGE_UNSUPPORTED');
  });
  for (const fixture of corpus.cases) test(`native fixture syntax: ${fixture.id}`, async () => {
    for (const file of fixture.files) {
      const inventory = await inventoryCSharpSource(file.source);
      expect(inventory.source).toBe(file.source);
      expect(inventory.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
      const native = nativeEvidence.observations.find(item => item.id === fixture.id);
      expect(native).toBeDefined();
      const grammarExpectation = (fixture as unknown as { grammarSyntaxComplete?: boolean }).grammarSyntaxComplete;
      expect(inventory.syntaxComplete).toBe(grammarExpectation ?? (native!.syntaxErrors.length === 0));
      expect(inventory.analysisOnly).toBe(true);
      expect('regions' in inventory).toBe(false);
      for (const declaration of inventory.declarations) {
        expect(file.source.slice(declaration.start, declaration.end).length).toBeGreaterThan(0);
        if (declaration.ownerStart !== undefined) expect(declaration.ownerStart).toBeLessThan(declaration.start);
      }
    }
  });

  test('Unicode spans and declaration owners retain directives and comments', async () => {
    const source = '#nullable enable\n// 🧭 retained\nnamespace Tools { public class Café { public string Read() => "λ"; } }\n';
    const inventory = await inventoryCSharpSource(source);
    expect(inventory.syntaxComplete).toBe(true);
    expect(inventory.source).toBe(source);
    expect(inventory.declarations.map(item => item.name)).toEqual(['Tools', 'Café', 'Read']);
    const method = inventory.declarations.at(-1)!;
    expect(source.slice(method.start, method.end)).toBe('public string Read() => "λ";');
    expect(Object.isFrozen(inventory)).toBe(true);
    expect(Object.isFrozen(inventory.declarations)).toBe(true);
  });

  test('invalid and over-depth source remains unresolved with exact original text', async () => {
    for (const source of ['class Broken { void Test( {', `class Deep { int Test() => ${'('.repeat(80)}1${')'.repeat(80)}; }`]) {
      const inventory = await inventoryCSharpSource(source);
      expect(inventory.source).toBe(source);
      expect(inventory.syntaxComplete).toBe(false);
      expect(inventory.declarations).toHaveLength(0);
      expect(inventory.diagnostics.length).toBeGreaterThan(0);
    }
  });

  test('source budget is enforced before loading or traversing syntax', async () => {
    await expect(inventoryCSharpSource(' '.repeat(128 * 1024 + 1))).rejects.toThrow('128 KiB');
  });

  test('Go and C# grammars remain independent across concurrent and repeated loads', async () => {
    const go = 'package sample\nfunc Test() bool { return true }';
    const csharp = 'public static class Sample { public static bool Test() => true; }';
    for (let repeat = 0; repeat < 3; repeat++) {
      const [g, c] = await Promise.all([previewGoImport(go), inventoryCSharpSource(csharp)]);
      expect(g.regions[0].kind).toBe('candidate');
      expect(c.syntaxComplete).toBe(true);
      expect(c.declarations.map(item => item.kind)).toEqual(['class_declaration', 'method_declaration']);
    }
  });
});
