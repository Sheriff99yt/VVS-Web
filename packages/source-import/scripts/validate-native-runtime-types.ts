import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NATIVE_RUNTIME_TYPE_CASES } from '../../graph-types/src/nativeRuntimeTypeCases';
import { nativeRuntimeOperatorType } from '../../graph-types/src/nativeRuntimeTypes';
import { analyzeNativeRuntimeSource } from '../src/nativeRuntimeSource';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeRuntimeSourceFixtures } from '../test/nativeRuntimeSourceFixtures';
const directory = join(import.meta.dir, '../../../scratch/native-runtime-types');
mkdirSync(directory, { recursive: true });
const fixtures: Record<string, { id: string; source: string; valid: boolean }[]> = { cpp: [], rust: [], gdscript: [] };
for (const item of NATIVE_RUNTIME_TYPE_CASES) {
  let observed: string | undefined;
  try { observed = nativeRuntimeOperatorType(item.language, item.form, item.operator, item.operands).nativeType; }
  catch (error) { if (!(error instanceof Error) || !error.message.startsWith('NATIVE_RUNTIME_TYPE_')) throw error; }
  if (observed !== item.result) throw new Error(`Runtime type policy mismatch: ${item.language}/${item.id}`);
  const expression = item.form === 'binary' ? `a ${item.operator} b` : item.form === 'unary' ? `${item.language === 'gdscript' && item.operator === '!' ? 'not ' : item.operator}a` : item.language === 'cpp' ? `static_cast<${item.operator}>(a)` : item.language === 'rust' ? `a as ${item.operator}` : `${item.operator}(a)`;
  const result = item.result ?? (item.language === 'rust' ? 'i32' : 'int');
  const parameters = item.operands.map((type, i) => item.language === 'cpp' ? `${type} ${i ? 'b' : 'a'}` : `${i ? 'b' : 'a'}: ${type}`).join(', ');
  let source = item.language === 'cpp'
    ? `void probe(${parameters}) { using Actual = decltype(${expression}); static_assert(__is_same(Actual, ${result})); }\n`
    : item.language === 'rust' ? `fn probe(${parameters}) -> ${result} { ${expression} }\n`
    : `func probe(${parameters}) -> ${result}:\n    return ${expression}\n`;
  // A rejected operator must fail without a destination type masking applicability.
  if (!item.result && item.language === 'rust') source = `fn probe(${parameters}) { let _ = ${expression}; }\n`;
  if (!item.result && item.language === 'gdscript') source = `func probe(${parameters}) -> void:\n    var observed = ${expression}\n`;
  fixtures[item.language].push({ id: item.id, source, valid: !!item.result });
  // Independently calibrate valid result assertions for exact C++/Rust types.
  if (item.result && item.language !== 'gdscript') {
    const wrong = item.result === 'bool' ? (item.language === 'rust' ? 'i32' : 'int') : 'bool';
    fixtures[item.language].push({ id: `${item.id}-wrong-result`, source: item.language === 'cpp' ? source.replace(`__is_same(Actual, ${result})`, `__is_same(Actual, ${wrong})`) : source.replace(`-> ${result}`, `-> ${wrong}`), valid: false });
  }
}
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const source = nativeRuntimeSourceFixtures[language];
  const report = await analyzeNativeRuntimeSource(source, language);
  const expected = [language === 'rust' ? 'i8' : 'int', 'bool', language === 'rust' ? 'i32' : 'int'];
  if (report.headerDiagnostics.length || report.records.length !== 3 || report.records.some((record, index) => record.diagnostic || record.fact?.nativeType !== expected[index])) throw new Error(`Source-owned runtime facts differ: ${language}/${JSON.stringify(report.records)}`);
  writeFileSync(join(directory, `${language}.source-inventory.json`), JSON.stringify(report, null, 2) + '\n');
  fixtures[language].push({ id: 'composed-source-module', source, valid: true });
  fixtures[language].push({ id: 'composed-source-unbound', source: source.replace('a + b', 'a + MissingValue'), valid: false });
}
writeFileSync(join(directory, 'fixtures.json'), JSON.stringify(fixtures, null, 2) + '\n');
const retry = process.argv.find(arg => arg.startsWith('--retry-native='));
const compiler = Bun.spawn(['python', '-X', 'utf8', 'tools/validate_native_runtime_types.py', ...(retry ? [retry] : [])], { stdout: 'inherit', stderr: 'inherit' });
if (await compiler.exited !== 0) throw new Error('Native runtime type checks failed');
const report = JSON.parse(readFileSync(join(directory, 'results.json'), 'utf8'));
for (const [language, cases] of Object.entries(fixtures)) for (const item of cases) {
  const result = report.cases.find((row: { language: string; id: string }) => row.language === language && row.id === item.id);
  if (!result || result.sourceSha256 !== new Bun.CryptoHasher('sha256').update(item.source).digest('hex') || result.expectedValid !== item.valid || (result.exitCode === 0) !== item.valid) throw new Error('Native runtime type evidence differs');
}
console.log(`${report.cases.length} native parameter/operator type checks; no values evaluated, no graph/runtime admission claim.`);
