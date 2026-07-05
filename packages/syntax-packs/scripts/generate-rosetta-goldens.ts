/**
 * Regenerate Rosetta `.golden.txt` files from `.fixture.json` inputs.
 * Usage: bun run scripts/generate-rosetta-goldens.ts [fixture-name ...]
 */
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  ROSETTA_FAMILIES,
  extractGoldenBody,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from '../src/rosettaHarness';

const args = process.argv.slice(2);
const dir = rosettaDir();
const fixtureNames =
  args.length > 0
    ? args
    : readdirSync(dir)
        .filter((f) => f.endsWith('.fixture.json'))
        .map((f) => f.replace('.fixture.json', ''));

for (const name of fixtureNames) {
  const fixture = loadRosettaFixture(name);
  for (const family of ROSETTA_FAMILIES) {
    const result = transpileRosettaFixture(fixture, family);
    const body = extractGoldenBody(
      result.files[0]!.content,
      family,
      fixture.goldenExtract ?? 'on_start'
    );
    const path = join(dir, `${name}.${family}.golden.txt`);
    writeFileSync(path, body);
    console.log(`wrote ${path}`);
  }
}

console.log(`Updated ${fixtureNames.length} fixture(s) × ${ROSETTA_FAMILIES.length} families.`);
