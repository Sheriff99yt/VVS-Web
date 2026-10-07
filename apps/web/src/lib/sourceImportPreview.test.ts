import { describe, expect, test } from 'bun:test';
import { previewJavaScriptImport } from './sourceImportPreview';

describe('source import preview', () => {
  test('classifies every byte and keeps unsupported source unchanged', async () => {
    const source = 'function add(a, b) {\n  return a + b;\n}\n\nexport const secret = await fetch(url);\n';
    const preview = await previewJavaScriptImport(source);
    expect(preview.regions.map(region => region.text).join('')).toBe(source);
    expect(preview.regions[0]?.kind).toBe('unresolved'); // Module context cannot be accepted as a script unit.
    expect(preview.regions.find(region => region.text.includes('await fetch'))?.kind).toBe('unresolved');
    expect(preview.sourceSha256).toHaveLength(64);
  });

  test('refuses a whole function when a nested construct is unsupported', async () => {
    const source = 'function update(x) { if (x) { return x; } return obj?.run(); }';
    const preview = await previewJavaScriptImport(source);
    expect(preview.regions).toHaveLength(1);
    expect(preview.regions[0]?.kind).toBe('unresolved');
    expect(preview.regions[0]?.text).toBe(source);
  });

  test('does not treat parser recovery or comments as safe conversion', async () => {
    const broken = await previewJavaScriptImport('function ok() { return 1; }\nfunction bad( {');
    expect(broken.regions.every(region => region.kind !== 'candidate')).toBe(true);
    const commented = await previewJavaScriptImport('function f() { /* keep me */ return 1; }');
    expect(commented.regions[0]?.kind).toBe('candidate'); // Eligibility still requires a fidelity review before acceptance.
  });
});
