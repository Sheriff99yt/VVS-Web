import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { lintFidelity } from '../src/fidelity';
import { resolvePack } from '../src/resolve';
import {
  ROSETTA_FAMILIES,
  extractGoldenBody,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from '../src/rosettaHarness';

const ROSETTA_DIR = rosettaDir();

const fixtures = readdirSync(ROSETTA_DIR)
  .filter((f) => f.endsWith('.fixture.json'))
  .map((f) => f.replace('.fixture.json', ''));

describe('Rosetta golden suite', () => {
  for (const fixtureName of fixtures) {
    for (const family of ROSETTA_FAMILIES) {
      test(`${fixtureName} × ${family} matches golden`, () => {
        const fixture = loadRosettaFixture(fixtureName);
        const golden = readFileSync(
          join(ROSETTA_DIR, `${fixtureName}.${family}.golden.txt`),
          'utf8'
        );
        const result = transpileRosettaFixture(fixture, family);
        const body = extractGoldenBody(
          result.files[0]!.content,
          family,
          fixture.goldenExtract ?? 'on_start'
        );
        expect(body).toBe(golden);
      });
    }
  }
});

const SPAN_EXPECTATIONS: Record<string, { sourceMapIds: string[]; contentAnchors: string[] }> = {
  print: { sourceMapIds: ['print-hello'], contentAnchors: ['Hello Rosetta'] },
  branch: { sourceMapIds: ['branch'], contentAnchors: ['yes', 'if '] },
  assign: { sourceMapIds: ['set-count'], contentAnchors: ['42'] },
  dispatch: { sourceMapIds: ['dispatch-go'], contentAnchors: ['on_go'] },
  wait: { sourceMapIds: ['wait-2s'], contentAnchors: ['sleep'] },
  convert: { sourceMapIds: ['to-string', 'print-score'], contentAnchors: ['str(', 'Score'] },
  call: { sourceMapIds: ['call-greet'], contentAnchors: ['Greet'] },
  for: { sourceMapIds: ['for-loop'], contentAnchors: ['for ', 'print('] },
  while: { sourceMapIds: ['while-loop'], contentAnchors: ['while ', 'loop'] },
  switch: { sourceMapIds: ['switch-node'], contentAnchors: ['_vvs_sel', 'one'] },
  sequence: { sourceMapIds: ['seq'], contentAnchors: ['sequence', 'first', 'second'] },
  subscribe: { sourceMapIds: ['sub-tick'], contentAnchors: ['_subscribe'] },
  emit: { sourceMapIds: ['emit-go'], contentAnchors: ['_emit'] },
  await_wait: { sourceMapIds: ['await-2s'], contentAnchors: ['await', 'sleep'] },
  import_module: { sourceMapIds: ['import-utils'], contentAnchors: ['utils'] },
  call_native: { sourceMapIds: ['native-print'], contentAnchors: ['print('] },
};

describe('Rosetta span invariants', () => {
  for (const fixtureName of fixtures) {
    test(`${fixtureName} behavioral nodes appear in sourceMap`, () => {
      const fixture = loadRosettaFixture(fixtureName);
      const expected = SPAN_EXPECTATIONS[fixtureName] ?? { sourceMapIds: [], contentAnchors: [] };
      const result = transpileRosettaFixture(fixture, 'python');
      const content = result.files[0]!.content;
      for (const nodeId of expected.sourceMapIds) {
        expect(result.sourceMap[nodeId]).toBeDefined();
      }
      for (const anchor of expected.contentAnchors) {
        expect(content).toContain(anchor);
      }
    });
  }
});

describe('pack resolver', () => {
  test('javascript es2022 overlay merges when capability present', () => {
    const profile = resolvePack('javascript', ['es2022']);
    expect(profile.sourcePackIds).toContain('javascript.base@1');
    expect(profile.sourcePackIds).toContain('javascript.es2022@1');
    expect(profile.templates.NullCoalesce?.quasi).toBe('{left} ?? {right}');
  });
});

describe('fidelity linter on Rosetta output', () => {
  for (const fixtureName of fixtures) {
    test(`${fixtureName} passes fidelity lint`, () => {
      const fixture = loadRosettaFixture(fixtureName);
      const result = transpileRosettaFixture(fixture, 'python');
      const violations = lintFidelity({
        statements: Object.keys(result.sourceMap).map((nodeId) => ({ sourceGraphNodeId: nodeId })),
        sourceMap: result.sourceMap,
      });
      expect(violations).toEqual([]);
    });
  }
});
