import { expect, test } from 'bun:test';
import type { ProjectSnapshot } from '@vvs/graph-types';
import { editNativeScalarReturnType } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import { nativeScalarSourceFixtures } from '../../../../packages/source-import/test/nativeScalarSourceFixtures';
import goldens from '../../../../packages/source-import/test/nativeScalarSourceGoldens.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();

test('imported Rust unsuffixed constants follow visible edited return types', async () => {
  const preview = await previewNativeScalarSourceGraphs(nativeScalarSourceFixtures.rust, 'rust', { fileName: 'sample.rs', entryPolicy: 'library' });
  const project = preview.snapshot!;
  const definition = project.documents['main-graph'].nodes.find(node => node.data.properties?.functionName === 'value')!;
  definition.data = editNativeScalarReturnType(definition.data, 'i8');
  expect(emitProjectLikeCodePanel(project).files[0].content).toContain('const fn value() -> i8');
  expect(Object.values(project.documents).flatMap(doc => doc.nodes).some(node => node.data.properties?.nativeLiteralType)).toBe(false);
  definition.data = editNativeScalarReturnType(definition.data, 'u8');
  expect(() => emitProjectLikeCodePanel(project)).toThrow('NATIVE_SCALAR_FUNCTION_BODY');
});

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`source scalar canonical Code panel ${language}`, async () => {
  const fileName = `sample.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`;
  const preview = await previewNativeScalarSourceGraphs(nativeScalarSourceFixtures[language], language, { fileName, entryPolicy: 'library' });
  expect(preview.diagnostics).toEqual([]);
  const project = JSON.parse(JSON.stringify(preview.snapshot!)) as ProjectSnapshot;
  const output = emitProjectLikeCodePanel(project);
  expect(output.files).toHaveLength(1);
  const source = output.files[0].content;
  expect(source).toBe(goldens[language]);
  expect(source).toContain(language === 'rust' ? '    value\n' : 'return value');
  expect(source).toContain(language === 'rust' ? '    -(-5)\n' : 'return -(-5)');
  if (language === 'rust') expect(source).toContain('return (2 < 3);');
  for (const fn of project.functions) {
    expect(output.sourceMap[`${fn.id}-define`]?.length).toBeGreaterThan(0);
    expect(output.sourceMap[`${fn.id}-return`]?.length).toBeGreaterThan(0);
  }
  expect(emitProjectLikeCodePanel(JSON.parse(JSON.stringify(project))).files).toEqual(output.files);
  const ret = project.documents[project.functions[0].id].nodes.find(node => node.data.kindId === 'flow_return')!;
  ret.data.properties!.nativeReturnStyle = language === 'rust' ? 'unknown' : 'rust-tail';
  expect(() => emitProjectLikeCodePanel(project)).toThrow('NATIVE_SCALAR_FUNCTION_BODY');
});
