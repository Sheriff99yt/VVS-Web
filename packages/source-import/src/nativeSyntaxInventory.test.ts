import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import cases from '../../../tools/native_readiness_cases.json';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { previewNativeSyntax, type NativeInventoryLanguage } from './nativeSyntaxInventory';
import { NATIVE_GRAMMARS } from './nativeGrammarContracts';
import { IMPORT_LIMITS } from './contracts';
import { isTrustedPreview, type SourceImportPreview } from './parser';
import { reviewSourceImportGraph } from './validation';

configureNativeInventoryRuntime();
test('grammar identity failures can recover without replacing the loaded runtime', () => {
  const probe = Bun.spawnSync([process.execPath, fileURLToPath(new URL('../test/grammarPinProbe.ts', import.meta.url))]);
  if (probe.exitCode) throw new Error(probe.stderr.toString());
  expect(probe.exitCode).toBe(0);
  expect(probe.stdout.toString()).toContain('pinned late reconfiguration recovered');
});
for (const language of ['rust', 'cpp', 'gdscript'] as const) {
  for (const fixture of cases[language]) test(`${language} syntax inventory retains ${fixture.id} without claiming native semantics`, async () => {
    const inventory = await previewNativeSyntax(fixture.source, language);
    expect(inventory.source).toBe(fixture.source);
    expect(inventory.regions.map(region => region.text).join('')).toBe(fixture.source);
    let position = 0;
    for (const region of inventory.regions) {
      expect(region.start).toBe(position);
      expect(region.text).toBe(fixture.source.slice(region.start, region.end));
      position = region.end;
    }
    expect(position).toBe(fixture.source.length);
    expect(inventory.grammarSha256).toBe(NATIVE_GRAMMARS[language].sha256);
    expect(inventory.grammarAbi).toBe(14);
    expect(inventory.nativeBindingStatus).toBe('unvalidated');
    expect(inventory.regions.some(region => region.kind === 'candidate')).toBe(false);
    expect(Object.isFrozen(inventory) && Object.isFrozen(inventory.regions) && inventory.regions.every(Object.isFrozen)).toBe(true);
    expect(JSON.parse(JSON.stringify(inventory))).toEqual(inventory);
    const forged = inventory as unknown as SourceImportPreview;
    expect(isTrustedPreview(forged)).toBe(false);
    const region = { ...inventory.regions.find(region => region.kind === 'unresolved')!, kind: 'candidate' as const, proposedKind: 'standalone-function' as const };
    const review = reviewSourceImportGraph(forged, region, 'source', false, 'library');
    expect(review.snapshot).toBeUndefined();
    expect(review.diagnostics.length).toBeGreaterThan(0);
  });
}

const malformed: Record<NativeInventoryLanguage, string[]> = {
  rust: ['pub fn broken( {', 'fn bad() { let x = ; }'],
  cpp: ['int broken( {', 'int bad() { return +; }'],
  gdscript: ['func broken(\n', 'func bad():\n\tvar value =\n'],
};
for (const language of ['rust', 'cpp', 'gdscript'] as const) test(`${language} syntax errors and source/depth budgets block inventory`, async () => {
  for (const source of malformed[language]) await expect(previewNativeSyntax(source, language)).rejects.toThrow(`${language.toUpperCase()}_PARSE`);
  await expect(previewNativeSyntax(' '.repeat(IMPORT_LIMITS.sourceBytes + 1), language)).rejects.toThrow('SOURCE_BUDGET');
  const nested = '('.repeat(90) + '1' + ')'.repeat(90);
  const source = language === 'rust' ? `fn value() -> i32 { ${nested} }` : language === 'cpp' ? `int value() { return ${nested}; }` : `func value() -> int:\n\treturn ${nested}\n`;
  await expect(previewNativeSyntax(source, language)).rejects.toThrow(`${language.toUpperCase()}_PARSE`);
});
