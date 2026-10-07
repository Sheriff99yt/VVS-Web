import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_initialization_cases.json';
import { analyzeNativeInitialization } from '../src/nativeInitialization';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';

const root = join(import.meta.dir, '../../..');
{
  const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_initialization.py', ...(process.argv.includes('--reuse-native') ? ['--reuse-native'] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  if (await compiler.exited !== 0) throw new Error('Independent initialization compiler contrasts failed');
}
configureNativeInventoryRuntime();
type NativeCase = { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number };
const native: { cases: NativeCase[]; failures: string[] } = JSON.parse(readFileSync(join(root, 'scratch/native-initialization/results.json'), 'utf8'));
const expectedCount = Object.values(cases).reduce((count, fixtures) => count + fixtures.length, 0);
if (native.failures.length || native.cases.length !== expectedCount) throw new Error('Complete native initialization evidence is required');
let checked = 0;
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  const observed = native.cases.find(item => item.language === language && item.id === fixture.id);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fixture.source))), byte => byte.toString(16).padStart(2, '0')).join('');
  if (!observed || observed.sourceSha256 !== digest || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error(`Native input/acceptance drift: ${language}/${fixture.id}`);
  const report = await analyzeNativeInitialization(fixture.source, language);
  if (JSON.stringify(report.reads.map(item => item.initialized)) !== JSON.stringify(fixture.reads)) throw new Error(`Native initialization read drift: ${language}/${fixture.id}`);
  const expected = fixture.modelDiagnostic ? [{ code: `${language.toUpperCase()}_${fixture.modelDiagnostic}`, status: fixture.modelStatus }] : [];
  if (JSON.stringify(report.diagnostics.map(item => ({ code: item.code, status: item.status }))) !== JSON.stringify(expected)) throw new Error(`Native initialization diagnostic drift: ${language}/${fixture.id}`);
  checked++;
}
console.log(`Native initialization: ${checked} exact-input contrast cases agree. C++ warning policy is distinct from validity; Godot runtime default values, native types/effects and graph admission are not certified.`);
