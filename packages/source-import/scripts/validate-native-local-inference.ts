import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../test/native-inferred-local-cases.json';
import { analyzeNativeLocalSourceBodies } from '../src/nativeLocalSourceBodies';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';

const root = join(import.meta.dir, '../../..');
const directory = join(root, 'scratch/native-local-inference');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = { cpp: [], rust: [], gdscript: [] };
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  fixtures[language].push({ id: fixture.id, source: fixture.source, valid: 'valid' in fixture ? fixture.valid : true });
  if ('assertions' in fixture) {
    const assertions = fixture.assertions;
    const anchor = language === 'cpp' ? 'return ' : /([A-Za-z_][A-Za-z0-9_]*)\s*}\s*$/.exec(fixture.source)?.[0];
    if (!anchor) throw new Error('Missing native type-proof anchor');
    const proof = fixture.source.replace(anchor, `${assertions} ${anchor}`);
    const wrong = assertions.replace(/__is_same\(decltype\((first|second)\), (?:const )?(?:bool|int|unsigned int)\)/g, '__is_same(decltype($1), void)').replace(/let _: (?:bool|i8|i32)/g, 'let _: ()');
    if (wrong === assertions || proof === fixture.source) throw new Error('Missing native false-type calibration');
    fixtures[language].push({ id: fixture.id + '-type-proof', source: proof, valid: true }, { id: fixture.id + '-wrong-type', source: fixture.source.replace(anchor, `${wrong} ${anchor}`), valid: false });
  }
  const analysis = await analyzeNativeLocalSourceBodies(fixture.source, language, { inferredLocals: true });
  writeFileSync(join(directory, `${language}-${fixture.id}.analysis.json`), JSON.stringify(analysis, null, 2) + '\n');
  if (analysis.headerDiagnostics.length || analysis.records.length !== 1) throw new Error('Incomplete source inference inventory');
  const record = analysis.records[0];
  if ('types' in fixture) {
    if (record.diagnostic || JSON.stringify(record.statements?.filter(statement => statement.kind === 'declaration').map(statement => statement.nativeType)) !== JSON.stringify(fixture.types)) throw new Error(`Source inference differs: ${language}/${fixture.id}: ${JSON.stringify(record)}`);
  } else if (record.statements || !record.diagnostic?.code.includes(fixture.diagnostic)) throw new Error(`Missing source inference boundary: ${language}/${fixture.id}`);
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const retry = process.argv.find(argument => argument.startsWith('--retry-native='));
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_local_inference.py', ...(retry ? [retry] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Independent inferred-local compiler contrasts failed');
const native = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== Object.values(fixtures).flat().length) throw new Error('Complete native inferred-local evidence required');
for (const [language, inputs] of Object.entries(fixtures)) for (const fixture of inputs) {
  const result = native.cases.find((row: { language: string; id: string }) => row.language === language && row.id === fixture.id);
  if (!result || result.sourceSha256 !== new Bun.CryptoHasher('sha256').update(fixture.source).digest('hex') || result.expectedValid !== fixture.valid || (result.exitCode === 0) !== fixture.valid) throw new Error('Native inferred-local source/expectation mismatch');
}
console.log(`${native.cases.length} pinned inferred-local checks agree with source boundaries; Godot applicability only, no graph/worker admission.`);
