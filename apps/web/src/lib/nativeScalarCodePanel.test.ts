import { expect, test } from 'bun:test';
import { nativeScalarProjectFixture } from '../../../../packages/transpiler/test/nativeScalarFixtures';
import { emitProjectLikeCodePanel } from './emitProjectCode';
import { analyzeProject } from '@vvs/graph-types';
import goldens from '../../../../packages/transpiler/test/nativeScalarModuleGoldens.json';

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`saved native scalar project Code panel ${language}`, () => {
  const project = nativeScalarProjectFixture(language);
  expect(analyzeProject(project).diagnostics.filter(item => item.level === 'error')).toEqual([]);
  const result = emitProjectLikeCodePanel(project);
  expect(result.files).toHaveLength(1);
  const code = result.files[0].content;
  expect(code).toBe(goldens[language]);
  expect(code).toContain('Identity_0');
  expect(code).toContain('return Value');
  expect(code).not.toContain('Global::');
  expect(code).not.toContain('&mut self');
  expect(code).not.toContain('(x)');
  for (const fn of project.functions) {
    expect(result.sourceMap[`${fn.id}-define`]?.length).toBeGreaterThan(0);
    if (fn.overloads[0].returnType !== 'void') expect(result.sourceMap[`${fn.id}-return`]?.length).toBeGreaterThan(0);
  }
  expect(emitProjectLikeCodePanel(JSON.parse(JSON.stringify(project))).files[0].content).toBe(code);
  project.documents['identity-0'].nodes[0].data.graphBinding!.symbolId = 'identity-1';
  expect(() => emitProjectLikeCodePanel(project)).toThrow('NATIVE_SCALAR_FUNCTION_BODY');
});
