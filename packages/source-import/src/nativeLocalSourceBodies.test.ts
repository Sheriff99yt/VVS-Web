import { expect, test } from 'bun:test';
import { analyzeNativeLocalSourceBodies } from './nativeLocalSourceBodies';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import cases from '../test/native-local-source-cases.json';
import type { NativeScalarSourceExpression } from './nativeScalarSourceExpression';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) test(`source-owned typed local body ${language}/${fixture.id}`, async () => {
  const report = await analyzeNativeLocalSourceBodies(fixture.source, language);
  expect(report.source).toBe(fixture.source); expect(report.sourceSha256).toHaveLength(64);
  expect(report.graphAdmission).toBe('blocked'); expect(report.headerDiagnostics).toEqual([]);
  const diagnostics = report.records.flatMap(record => record.diagnostic ? [record.diagnostic] : []);
  if (!fixture.mapped) {
    expect(diagnostics).not.toHaveLength(0);
    expect(diagnostics[0].code).toContain((fixture as { diagnostic: string }).diagnostic);
    expect(report.records[0].statements).toBeUndefined(); return;
  }
  expect(diagnostics).toEqual([]);
  const walk = (value: NativeScalarSourceExpression) => {
    expect(Object.isFrozen(value)).toBe(true);
    expect(fixture.source.slice(value.start, value.end)).not.toBe('');
    if (value.kind === 'local' || value.kind === 'parameter') {
      expect(Object.isFrozen(value.declaration)).toBe(true);
      expect(fixture.source.slice(value.declaration.start, value.declaration.end)).toContain(fixture.source.slice(value.start, value.end));
    } else if (value.kind === 'binary') { walk(value.left); walk(value.right); }
    else if (value.kind !== 'literal') walk(value.operand);
  };
  for (const record of report.records) {
    expect(Object.isFrozen(record.statements)).toBe(true);
    expect(record.statements!.at(-1)!.kind).toBe('return');
    for (const statement of record.statements!) {
      expect(Object.isFrozen(statement)).toBe(true); expect(statement.fact.values).toBe('unknown');
      walk(statement.kind === 'declaration' ? statement.initializer : statement.value);
    }
  }
  expect(JSON.parse(JSON.stringify(report)).records).toEqual(report.records);
});
test('Rust local shadowing preserves each initializer and declaration identity', async () => {
  const report = await analyzeNativeLocalSourceBodies(cases.rust[1].source, 'rust');
  const statements = report.records[0].statements!;
  const first = statements[0], second = statements[1], returned = statements[2];
  expect(first.kind).toBe('declaration'); expect(second.kind).toBe('declaration');
  if (first.kind !== 'declaration' || second.kind !== 'declaration' || returned.kind !== 'return') throw new Error('Expected owned declarations');
  expect(first.binding.id).not.toBe(second.binding.id);
  expect(first.initializer.kind).toBe('binary'); expect(second.initializer.kind).toBe('binary');
  if (first.initializer.kind !== 'binary' || second.initializer.kind !== 'binary') throw new Error('Expected initializer operators');
  expect(first.initializer.left.kind).toBe('parameter');
  expect(second.initializer.left).toMatchObject({ kind: 'local', bindingId: first.binding.id });
  expect(returned.value).toMatchObject({ kind: 'local', bindingId: second.binding.id });
});
test('C++ grouped declarations retain one authored group and ordered initializer reads', async () => {
  const report = await analyzeNativeLocalSourceBodies(cases.cpp[1].source, 'cpp');
  const [first, second] = report.records[0].statements!;
  if (first.kind !== 'declaration' || second.kind !== 'declaration') throw new Error('Expected declarations');
  expect(second.declarationGroup).toEqual(first.declarationGroup);
  expect(second.initializer).toMatchObject({ kind: 'binary', left: { kind: 'local', bindingId: first.binding.id } });
});
