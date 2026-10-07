import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import cases from '../../../tools/native_signature_cases.json';
import { analyzeNativeSourceSignatures } from '../src/nativeSourceSignatures';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
configureNativeInventoryRuntime();
const root = join(import.meta.dir, '../../..');
if (!process.argv.includes('--reuse-native')) {
  const retry = process.argv.find(arg => arg.startsWith('--retry-native='))?.slice('--retry-native='.length);
  const compiler = Bun.spawn(['python', 'tools/validate_native_signatures.py', ...(retry ? [`--only=${retry}`] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  if (await compiler.exited !== 0) throw new Error('Independent native header assertions failed');
}
type Case = { language: string; id: string; sourceSha256: string; expectedValid: boolean; exitCode: number };
const native: { cases: Case[]; failures: string[] } = JSON.parse(readFileSync(join(root, 'scratch/native-signatures/results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== Object.values(cases).reduce((total, items) => total + items.length, 0)) throw new Error('Complete native signature evidence required');
let checked = 0, unsupported = 0;
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  const report = await analyzeNativeSourceSignatures(fixture.source, language);
  const observed = native.cases.find(item => item.language === language && item.id === fixture.id);
  if (!observed || observed.sourceSha256 !== report.sourceSha256 || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error(`Native signature identity/acceptance differs:${language}/${fixture.id}`);
  if ('unsupported' in fixture && fixture.unsupported) {
    if (report.signatures.length || !report.diagnostics.length) throw new Error('Unsupported signature acquired scalar facts');
    unsupported++;
  } else {
    const signature = report.signatures[0];
    if (report.signatures.length !== 1 || report.diagnostics.length || signature.name !== 'sample' || signature.nativeReturnType !== fixture.returnType || JSON.stringify(signature.parameters.map(item => ({ name: item.name, type: item.nativeType, mutable: item.mutable }))) !== JSON.stringify(fixture.parameters)) throw new Error(`Native signature differs:${language}/${fixture.id}`);
    for (const parameter of signature.parameters) if (fixture.source.slice(parameter.start, parameter.end) !== parameter.name || fixture.source.slice(parameter.typeSpan.start, parameter.typeSpan.end) !== parameter.authoredType) throw new Error('Native header span differs');
  }
  if (report.graphAdmission !== 'blocked') throw new Error('Header facts cannot admit a graph');
  checked++;
}
console.log(`Native signatures:${checked} exact compiler input/header comparisons;${unsupported} native-valid unsupported headers retained. C++/Rust typed function-pointer assignments; Godot isolated header check-only. Body/graph admission remains required.`);
