import { expect, test } from 'bun:test';
import { analyzeProject, type NativeConstantExpression } from '@vvs/graph-types';
import cases from '../../../../tools/native_constant_cases.json';
import { nativeScalarConstantProjectFixture } from '../../../../packages/transpiler/test/nativeScalarFixtures';
import { emitProjectLikeCodePanel } from './emitProjectCode';
import goldens from '../../../../packages/transpiler/test/nativeConstantModuleGoldens.json';

for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of cases[language]) {
  if (fixture.calibration || fixture.modelDiagnostic) continue;
  test(`native constant Code panel ${language}/${fixture.id}`, () => {
    const project = nativeScalarConstantProjectFixture(language, fixture.tree as NativeConstantExpression, fixture.nativeType);
    expect(analyzeProject(project).diagnostics.filter(item => item.level === 'error')).toEqual([]);
    const result = emitProjectLikeCodePanel(project);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].content).toBe((goldens as Record<string, string>)[`${language}/${fixture.id}`]);
    for (const node of project.documents['identity-0'].nodes) if (node.id.startsWith('native-constant-')) expect(result.sourceMap[node.id]?.length).toBeGreaterThan(0);
    expect(emitProjectLikeCodePanel(JSON.parse(JSON.stringify(project))).files).toEqual(result.files);
  });
}
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`${language} constant edits reconstruct native facts`, () => {
  const project = nativeScalarConstantProjectFixture(language, { kind: 'binary', operator: '/', left: { kind: 'literal', token: '12' }, right: { kind: 'literal', token: '3' } }, language === 'rust' ? 'i32' : 'int');
  const operand = project.documents['identity-0'].nodes.find(node => node.data.properties?.payload === '3')!;
  operand.data.properties!.payload = '2';
  expect(emitProjectLikeCodePanel(project).files[0].content).toContain('(12 / 2)');
  operand.data.properties!.payload = '0'; expect(() => emitProjectLikeCodePanel(project)).toThrow('DIVIDE_BY_ZERO');
  operand.data.properties!.payload = '2';
  operand.data.properties!.nativeDomain = 'native-bool'; operand.data.outputs[0].type = 'data_boolean';
  for (const edge of project.documents['identity-0'].edges) if (edge.source === operand.id) edge.data!.pinType = 'data_boolean';
  expect(() => emitProjectLikeCodePanel(project)).toThrow('DOMAIN');
});
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`${language} nested unary tokens retain two visible negations`, () => {
  const project = nativeScalarConstantProjectFixture(language, { kind: 'unary', operator: '-', operand: { kind: 'unary', operator: '-', directLiteral: true, operand: { kind: 'literal', token: '7' } } }, language === 'rust' ? 'i32' : 'int');
  expect(emitProjectLikeCodePanel(project).files[0].content).toContain('return - -7');
  expect(emitProjectLikeCodePanel(project).files[0].content).toBe((goldens as Record<string, string>)[`${language}/nested-unary-negative`]);
});
test('Rust saved literal hints cannot replace visible type inference in comparisons', () => {
  const tree: NativeConstantExpression = { kind: 'binary', operator: '<', left: { kind: 'unary', operator: '!', operand: { kind: 'literal', token: '7' } }, right: { kind: 'literal', token: '250' } };
  const project = nativeScalarConstantProjectFixture('rust', tree, 'bool');
  expect(emitProjectLikeCodePanel(project).files[0].content).toContain('(!7 < 250)');
  for (const node of project.documents['identity-0'].nodes) if (node.data.kindId === 'expr_native_literal') node.data.properties!.nativeLiteralType = 'u8';
  expect(() => emitProjectLikeCodePanel(project)).toThrow('RUST_LITERAL_CONTEXT_NOT_ON_GRAPH');
});
