import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../test/native-local-source-cases.json';
import { analyzeNativeLocalSourceBodies } from '../src/nativeLocalSourceBodies';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';

const root = join(import.meta.dir, '../../..');
const retry = process.argv.find(argument => argument.startsWith('--retry-native='));
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_local_source.py', ...(retry ? [retry] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Independent local/body compiler contrasts failed');
configureNativeInventoryRuntime();
const native: { cases: { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number }[]; failures: string[] } = JSON.parse(readFileSync(join(root, 'scratch/native-local-source/results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== 18) throw new Error('Complete native local/body evidence required');
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  const observed = native.cases.find(item => item.language === language && item.id === fixture.id);
  if (!observed || observed.sourceSha256 !== new Bun.CryptoHasher('sha256').update(fixture.source).digest('hex') || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error(`Native input/acceptance drift: ${language}/${fixture.id}`);
  const report = await analyzeNativeLocalSourceBodies(fixture.source, language);
  const mapped = report.headerDiagnostics.length === 0 && report.records.length > 0 && report.records.every(record => record.statements && !record.diagnostic);
  if (mapped !== fixture.mapped || !fixture.mapped && !report.records.some(record => record.diagnostic?.code.includes((fixture as { diagnostic: string }).diagnostic))) throw new Error(`Source local/body policy drift: ${language}/${fixture.id}`);
}
// Traversal repairs reuse the unchanged independent initialization fixtures.
const initialization = Bun.spawn(['bun', 'packages/source-import/scripts/validate-native-initialization.ts', '--reuse-native'], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await initialization.exited !== 0) throw new Error('Established initialization evidence consumer failed');
console.log('18 pinned native local/body contrasts and retained 45 initialization observations agree; source sequences are not visible graph/worker admission.');
