import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintFidelity } from './fidelity';
import { loadRosettaFixture, rosettaDir, transpileRosettaFixture } from './rosettaHarness';

for (const name of ['scalar-comparison', 'counted-for', 'native-range', 'native-values-javascript', 'native-values-python']) {
  const fixture = loadRosettaFixture(`target-scoped/${name}`);
  for (const family of fixture.families!) test(`target-scoped Rosetta ${name} × ${family}: golden, spans and fidelity`, () => {
    const output = transpileRosettaFixture(fixture, family);
    expect(output.files[0].content).toBe(readFileSync(join(rosettaDir(), `target-scoped/${name}.${family}.golden.txt`), 'utf8'));
    const expected = name.startsWith('native-values') ? ['exact', 'values', 'index', 'native-op', 'return'] : name === 'native-range' ? ['loop', 'initialize', 'body', 'after'] : name === 'counted-for' ? ['loop', 'initialize', 'get', 'compare', 'update', 'body', 'after'] : ['compare', 'branch', 'yes', 'after'];
    for (const id of expected) expect(output.sourceMap[id]?.length, id).toBeGreaterThan(0);
    expect(lintFidelity({ statements: expected.map(sourceGraphNodeId => ({ sourceGraphNodeId })), sourceMap: output.sourceMap })).toEqual([]);
  });
}
