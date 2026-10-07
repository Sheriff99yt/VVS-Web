import { expect, test } from 'bun:test';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { normalizeProjectSnapshot } from '@vvs/graph-types';
import { normalizedNativeScalarSyntax } from '../../../../packages/source-import/src/nativeScalarSyntax';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import cases from '../../../../packages/source-import/test/native-local-source-cases.json';
import goldens from '../../../../packages/source-import/test/nativeLocalSourceGoldens.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`local module canonical Code-panel output ${language}`, async () => {
  const source = cases[language][0].source;
  const preview = await previewNativeScalarSourceGraphs(source, language, { fileName: `locals.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`, entryPolicy: 'library', localStatements: true });
  expect(preview.diagnostics).toEqual([]);
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot!)))!;
  const output = emitProjectLikeCodePanel(project);
  expect(output.files).toHaveLength(1); expect(output.files[0].content).toBe(goldens[language]);
  expect(normalizedNativeScalarSyntax(output.files[0].content, language)).toBe(normalizedNativeScalarSyntax(source, language));
  for (const doc of Object.values(preview.snapshot!.documents)) for (const node of doc.nodes) {
    if (node.data.kindId !== 'function_entry') expect(output.sourceMap[node.id]?.length).toBeGreaterThan(0);
  }
  const reloaded = emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(project)))!);
  expect(reloaded.files).toEqual(output.files);
  expect(reloaded.sourceMap).toEqual(output.sourceMap);
  const fn = preview.snapshot!.functions.find(fn => fn.name === 'accumulate')!;
  const literal = project.documents[fn.id].nodes.find((node: { data: { properties?: Record<string, unknown> } }) => node.data.properties?.payload === '2')!;
  literal.data.properties.payload = '3';
  expect(emitProjectLikeCodePanel(project).files[0].content).toContain('first * 3');
  literal.data.properties.payload = 'invalid';
  expect(() => emitProjectLikeCodePanel(project)).toThrow();
});
test('Rust same-block shadowing retains native visible declaration identities', async () => {
  const source = cases.rust[1].source;
  const preview = await previewNativeScalarSourceGraphs(source, 'rust', { fileName: 'shadow.rs', entryPolicy: 'library', localStatements: true });
  expect(preview.diagnostics).toEqual([]);
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot!)))!;
  expect(project.variables).toHaveLength(2); expect(project.variables[0].id).not.toBe(project.variables[1].id);
  expect(emitProjectLikeCodePanel(project).files[0].content).toBe('fn shadow(value: i32) -> i32 {\n        let value: i32 = (value + 1);\n        let value: i32 = (value + 2);\n        value\n    }');
  expect(normalizedNativeScalarSyntax(emitProjectLikeCodePanel(project).files[0].content, 'rust')).toBe(normalizedNativeScalarSyntax(source, 'rust'));
  const doc = project.documents[project.functions[0].id], ret = doc.nodes.find((node: { data: { kindId?: string } }) => node.data.kindId === 'flow_return');
  const value = doc.edges.find((edge: { target: string; targetHandle?: string }) => edge.target === ret.id && edge.targetHandle === 'val');
  value.source = doc.nodes.find((node: { data: { kindId?: string } }) => node.data.kindId === 'function_entry').id;
  value.sourceHandle = 'parameter-0';
  expect(() => emitProjectLikeCodePanel(project)).toThrow();
});
test('Godot typed constant and subsequent local reads stay visible', async () => {
  const source = cases.gdscript[1].source;
  const preview = await previewNativeScalarSourceGraphs(source, 'gdscript', { fileName: 'constants.gd', entryPolicy: 'library', localStatements: true });
  expect(preview.diagnostics).toEqual([]);
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot!)))!;
  const output = emitProjectLikeCodePanel(project);
  expect(output.files[0].content).toBe('func constant(a: int) -> int:\n        const value: int = 2\n        var result: int = (value + a)\n        return result');
  expect(normalizedNativeScalarSyntax(output.files[0].content, 'gdscript')).toBe(normalizedNativeScalarSyntax(source, 'gdscript'));
  for (const doc of Object.values(preview.snapshot!.documents)) for (const node of doc.nodes) {
    if (node.data.kindId !== 'function_entry') expect(output.sourceMap[node.id]?.length).toBeGreaterThan(0);
  }
});
