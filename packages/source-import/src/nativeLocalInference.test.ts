import { expect, test } from 'bun:test';
import cases from '../test/native-inferred-local-cases.json';
import { analyzeNativeLocalSourceBodies } from './nativeLocalSourceBodies';
import { previewNativeScalarSourceGraphs } from './nativeScalarSourceGraphs';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) test(`native inferred local analysis ${language}/${fixture.id}`, async () => {
  const report = await analyzeNativeLocalSourceBodies(fixture.source, language, { inferredLocals: true });
  expect(report.headerDiagnostics).toEqual([]);
  expect(report.graphAdmission).toBe('blocked');
  expect(report.records).toHaveLength(1);
  if ('types' in fixture) {
    expect(report.records[0].diagnostic).toBeUndefined();
    const declarations = report.records[0].statements!.filter(statement => statement.kind === 'declaration');
    expect(declarations.map(statement => statement.nativeType)).toEqual(fixture.types);
    expect(declarations.map(statement => statement.inferenceMode)).toEqual(fixture.modes);
    for (const statement of declarations) {
      expect(Object.isFrozen(statement)).toBe(true);
      expect(Object.isFrozen(statement.initializer)).toBe(true);
      expect(statement.fact.values).toBe('unknown');
      expect(fixture.source.slice(statement.binding.start, statement.binding.end)).toBe(statement.binding.name);
    }
    expect(JSON.parse(JSON.stringify(report)).records).toEqual(report.records);
  } else {
    expect(report.records[0].statements).toBeUndefined();
    expect(report.records[0].diagnostic!.code).toContain(fixture.diagnostic);
  }
  const preview = await previewNativeScalarSourceGraphs(fixture.source, language, { fileName: `probe.${language === 'rust' ? 'rs' : language === 'cpp' ? 'cpp' : 'gd'}`, entryPolicy: 'library', runtimeExpressions: true, localStatements: true, groupedDeclarations: true });
  expect(preview.snapshot).toBeUndefined();
  expect(preview.diagnostics.length).toBeGreaterThan(0);
});
