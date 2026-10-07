import { expect, test } from 'bun:test';
import { analyzeNativeRuntimeSource, type NativeRuntimeSourceTree } from './nativeRuntimeSource';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeRuntimeSourceFixtures } from '../test/nativeRuntimeSourceFixtures';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`source-owned runtime expressions ${language}`, async () => {
  const source = nativeRuntimeSourceFixtures[language], report = await analyzeNativeRuntimeSource(source, language);
  expect(report.source).toBe(source); expect(report.sourceSha256).toHaveLength(64);
  expect(report.graphAdmission).toBe('blocked'); expect(report.headerDiagnostics).toEqual([]);
  expect(report.records).toHaveLength(3);
  expect(report.records.map(record => record.diagnostic)).toEqual([undefined, undefined, undefined]);
  expect(report.records.map(record => record.fact!.nativeType)).toEqual([language === 'rust' ? 'i8' : 'int', 'bool', language === 'rust' ? 'i32' : 'int']);
  expect(report.records[1].fact!.evaluation).toBe('short-circuit');
  const parameters: NativeRuntimeSourceTree[] = [];
  const walk = (tree: NativeRuntimeSourceTree) => {
    expect(Object.isFrozen(tree)).toBe(true);
    expect(source.slice(tree.start, tree.end).length).toBeGreaterThan(0);
    if (tree.kind === 'parameter') {
      parameters.push(tree);
      expect(source.slice(tree.start, tree.end)).toBe(tree.slot ? 'b' : 'a');
      expect(source.slice(tree.declaration.start, tree.declaration.end)).toContain(tree.slot ? 'b' : 'a');
    } else if (tree.kind === 'binary') { walk(tree.left); walk(tree.right); }
    else if (tree.kind !== 'literal') walk(tree.operand);
  };
  for (const record of report.records) { walk(record.expression!); expect(record.fact!.values).toBe('unknown'); }
  expect(parameters).toHaveLength(7);
  const changed = source.replace('a + b', 'a + MissingValue');
  const rejected = await analyzeNativeRuntimeSource(changed, language);
  expect(rejected.source).toBe(changed); expect(rejected.sourceSha256).not.toBe(report.sourceSha256);
  expect(rejected.records[0].fact).toBeUndefined(); expect(rejected.records[0].diagnostic!.code).toContain('PARAMETER_BINDING');
});
test('Rust runtime peer context, out-of-range literals and discarded expressions', async () => {
  const valid = await analyzeNativeRuntimeSource('fn compare(a: i8) -> bool { a < 127 }', 'rust');
  expect(valid.records[0].fact!.nativeType).toBe('bool');
  const invalid = await analyzeNativeRuntimeSource('fn compare(a: i8) -> bool { a < 128 }', 'rust');
  expect(invalid.records[0].fact).toBeUndefined(); expect(invalid.records[0].diagnostic).toBeDefined();
  const discarded = await analyzeNativeRuntimeSource('fn compare(a: i8) -> () { a + 1; }', 'rust');
  expect(discarded.records[0].diagnostic!.code).toContain('DISCARDED_EXPRESSION');
});
