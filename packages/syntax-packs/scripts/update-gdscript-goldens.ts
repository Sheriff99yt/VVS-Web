import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  extractGoldenBody,
  loadRosettaFixture,
  rosettaDir,
  transpileRosettaFixture,
} from '../src/rosettaHarness';

const fixtures = readdirSync(rosettaDir())
  .filter((f) => f.endsWith('.fixture.json'))
  .map((f) => f.replace('.fixture.json', ''));

for (const name of fixtures) {
  const fixture = loadRosettaFixture(name);
  const result = transpileRosettaFixture(fixture, 'gdscript');
  const body = extractGoldenBody(
    result.files[0]!.content,
    'gdscript',
    fixture.goldenExtract ?? 'on_start'
  );
  const outPath = join(rosettaDir(), `${name}.gdscript.golden.txt`);
  writeFileSync(outPath, body, 'utf8');
  console.log(`wrote ${outPath}`);
}
