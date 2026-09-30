import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { IMPORT_CAPABILITY_GAPS, JAVASCRIPT_MAPPING_CONTRACTS } from './index';

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sources(join(dir, entry.name)) : entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [join(dir, entry.name)] : []);
}
test('import core and generator have independent dependency boundaries', () => {
  const dir = new URL('.', import.meta.url).pathname;
  for (const file of sources(dir)) {
    const code = readFileSync(file, 'utf8');
    expect(code).not.toMatch(/(?:from\s*|import\s*)['"](?:react|next|@xyflow|@\/|.*rosetta|.*apps\/web)/);
    if (!file.endsWith('validation.ts')) expect(code).not.toContain("from '@vvs/transpiler'");
  }
  const transpiler = new URL('../../transpiler/src/', import.meta.url).pathname;
  for (const file of sources(transpiler)) expect(readFileSync(file, 'utf8')).not.toMatch(/(?:from\s*|import\s*)['"].*source-import/);
});
test('mapping contracts are versioned and every Rosetta seed has a concrete classified gap', () => {
  for (const contract of JAVASCRIPT_MAPPING_CONTRACTS) {
    expect(contract.version).toBe(1); expect(contract.context.sourceMode).toBe('script');
    expect(contract.preconditions.length).toBeGreaterThan(0); expect(contract.failures.length).toBeGreaterThan(0); expect(contract.evidence.length).toBeGreaterThan(0);
  }
  const rosetta = new URL('../../syntax-packs/rosetta/', import.meta.url).pathname;
  const names = readdirSync(rosetta).filter(n => n.endsWith('.fixture.json')).map(n => n.replace('.fixture.json',''));
  expect(IMPORT_CAPABILITY_GAPS.filter(g => g.rosettaSeed).map(g => g.rosettaSeed).sort()).toEqual(names.sort());
  for (const gap of IMPORT_CAPABILITY_GAPS) {
    for (const key of ['example','meaning','graphEvidence','category','blocker','roadmapTrack'] as const) expect(gap[key].length).toBeGreaterThan(0);
    expect(gap.context).toEqual({ language: 'javascript', version: 'es2022', sourceMode: 'script', environment: 'none' });
  }
});
