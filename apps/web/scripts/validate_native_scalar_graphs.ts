import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeProject } from '@vvs/graph-types';
import { nativeScalarProjectFixture } from '../../../packages/transpiler/test/nativeScalarFixtures';
import { emitProjectLikeCodePanel } from '../src/lib/emitProjectCode';

const root = join(import.meta.dir, '../../..'), directory = join(root, 'scratch/native-scalar-graphs');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = { cpp: [], rust: [], gdscript: [] };
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const path = join(directory, `${language}.vvs.json`);
  writeFileSync(path, JSON.stringify(nativeScalarProjectFixture(language), null, 2) + '\n');
  const project = JSON.parse(readFileSync(path, 'utf8'));
  const errors = analyzeProject(project).diagnostics.filter(item => item.level === 'error');
  if (errors.length) throw new Error(JSON.stringify(errors));
  const result = emitProjectLikeCodePanel(project);
  if (result.files.length !== 1) throw new Error('One global graph must produce one file');
  const source = result.files[0].content;
  for (const fn of project.functions) {
    if (!result.sourceMap[`${fn.id}-define`]?.length) throw new Error('Missing visible definition mapping');
    if (fn.overloads[0].returnType !== 'void' && !result.sourceMap[`${fn.id}-return`]?.length) throw new Error('Missing visible return mapping');
  }
  writeFileSync(join(directory, `${language}.code-panel.json`), JSON.stringify(result, null, 2) + '\n');
  fixtures[language].push({ id: 'saved-identity-unit', source, valid: true });
  // Compiler calibration: an undeclared reference in the exact emitted body must fail.
  fixtures[language].push({ id: 'invalid-reference-calibration', source: source.replace('return Value', 'return MissingNativeValue'), valid: false });
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_scalar_graphs.py'], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Saved graph native compilation failed');
const native = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
if (native.failures.length || native.cases.length !== 6) throw new Error('Complete compiler evidence required');
for (const [language, cases] of Object.entries(fixtures)) for (const fixture of cases) {
  const observed = native.cases.find((item: { language: string; id: string }) => item.language === language && item.id === fixture.id);
  const hash = new Bun.CryptoHasher('sha256').update(fixture.source).digest('hex');
  if (!observed || observed.sourceSha256 !== hash || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error('Actual Code-panel bytes/native acceptance mismatch');
}
console.log('Native scalar saved graphs: 3 complete emitted modules / 29 identity-unit functions and 3 rejection calibrations; no source-body substitution or fixture execution. Reverse-import admission remains separate.');
