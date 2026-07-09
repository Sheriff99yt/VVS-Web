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
  const result = transpileRosettaFixture(fixture, 'csharp');
  const body = extractGoldenBody(
    result.files[0]!.content,
    'csharp',
    fixture.goldenExtract ?? 'on_start'
  );
  const outPath = join(rosettaDir(), `${name}.csharp.golden.txt`);
  writeFileSync(outPath, body, 'utf8');
  console.log(`wrote ${outPath}`);
}
