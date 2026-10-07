import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeProject, type NativeConstantExpression } from '@vvs/graph-types';
import cases from '../../../tools/native_constant_cases.json';
import { nativeScalarConstantProjectFixture } from '../../../packages/transpiler/test/nativeScalarFixtures';
import { emitProjectLikeCodePanel } from '../src/lib/emitProjectCode';

const root = join(import.meta.dir, '../../..'), directory = join(root, 'scratch/native-constant-graphs');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = { cpp: [], rust: [], gdscript: [] };
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const corpus = [...cases[language], { id: 'nested-unary-negative', tree: { kind: 'unary', operator: '-', operand: { kind: 'unary', operator: '-', directLiteral: true, operand: { kind: 'literal', token: '7' } } }, nativeType: language === 'rust' ? 'i32' : 'int', payload: '7', calibration: false, modelDiagnostic: null }];
  for (const fixture of corpus) {
    if (fixture.calibration || fixture.modelDiagnostic) continue;
    const path = join(directory, `${language}-${fixture.id}.vvs.json`);
    writeFileSync(path, JSON.stringify(nativeScalarConstantProjectFixture(language, fixture.tree as NativeConstantExpression, fixture.nativeType), null, 2) + '\n');
    const project = JSON.parse(readFileSync(path, 'utf8'));
    const errors = analyzeProject(project).diagnostics.filter(item => item.level === 'error');
    if (errors.length) throw new Error(JSON.stringify(errors));
    const result = emitProjectLikeCodePanel(project);
    if (result.files.length !== 1) throw new Error('One graph must produce one file');
    const body = project.documents['identity-0'], valueEdge = body.edges.find((edge: { id: string }) => edge.id === 'constant-return');
    const expression = result.fragments?.[valueEdge.source];
    if (!expression || !result.sourceMap[valueEdge.source]?.length) throw new Error('Actual mapped expression fragment required');
    let assertion: string;
    const payload = String(fixture.payload);
    if (language === 'cpp') {
      const expected = fixture.nativeType === 'bool' ? payload : payload + (fixture.nativeType.startsWith('unsigned') ? 'ULL' : 'LL');
      assertion = `\ntemplate<class A,class B> constexpr bool SAME=false;\ntemplate<class A> constexpr bool SAME<A,A> = true;\nstatic_assert(SAME<decltype(${expression}),${fixture.nativeType}>);\nstatic_assert(Identity_0()==${expected});\n`;
    } else if (language === 'rust') {
      const expected = fixture.nativeType === 'bool' ? payload : payload + fixture.nativeType;
      assertion = `\nconst VALUE:${fixture.nativeType}=Identity_0();\nconst _:()=assert!(VALUE==${expected});\n`;
    } else {
      const expected = payload === '-9223372036854775808' ? '(-9223372036854775807 - 1)' : payload;
      assertion = `\nconst VALUE=${expression}\nconst CHECK=1 / int(VALUE==${expected})\nconst TYPE_CHECK=1 / int(VALUE is ${fixture.nativeType})\n`;
    }
    const source = result.files[0].content + '\n' + assertion;
    fixtures[language].push({ id: fixture.id, source, valid: true });
    writeFileSync(join(directory, `${language}-${fixture.id}.code-panel.json`), JSON.stringify(result, null, 2) + '\n');
  }
  const first = fixtures[language][0];
  fixtures[language].push({ id: 'false-assertion-calibration', source: first.source + (language === 'cpp' ? '\nstatic_assert(false);\n' : language === 'rust' ? '\nconst _:()=assert!(false);\n' : '\nconst WRONG=1 / 0\n'), valid: false });
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const retry = process.argv.find(arg => arg.startsWith('--retry-native='));
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_constant_graphs.py', ...(retry ? [retry] : [])], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Generated constant graph native assertions failed');
const native = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
const count = Object.values(fixtures).reduce((sum, rows) => sum + rows.length, 0);
if (native.failures.length || native.cases.length !== count) throw new Error('Complete generated graph evidence required');
for (const [language, rows] of Object.entries(fixtures)) for (const fixture of rows) {
  const observed = native.cases.find((item: { language: string; id: string }) => item.language === language && item.id === fixture.id);
  if (!observed || observed.sourceSha256 !== new Bun.CryptoHasher('sha256').update(fixture.source).digest('hex') || observed.expectedValid !== fixture.valid || (observed.exitCode === 0) !== fixture.valid) throw new Error('Generated graph/native source acceptance differs');
}
console.log(`Native constant Code-panel graphs:${count - 3} exact saved function modules/type-value assertions +3 false assertion calibrations; no programs execute. Godot body execution and reverse-import lifecycle are not certified.`);
