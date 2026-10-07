import { expect, test } from 'bun:test';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import { nativeRuntimeSourceFixtures } from '../../../../packages/source-import/test/nativeRuntimeSourceFixtures';
import goldens from '../../../../packages/source-import/test/nativeRuntimeSourceGoldens.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`runtime source module through canonical Code panel ${language}`, async () => {
  const source = nativeRuntimeSourceFixtures[language];
  const fileName = `runtime.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language]}`;
  const closed = await previewNativeScalarSourceGraphs(source, language, { fileName, entryPolicy: 'library' });
  expect(closed.snapshot).toBeUndefined();
  const preview = await previewNativeScalarSourceGraphs(source, language, { fileName, entryPolicy: 'library', runtimeExpressions: true });
  expect(preview.diagnostics).toEqual([]); expect(preview.graphAdmission).toBe('blocked');
  const project = JSON.parse(JSON.stringify(preview.snapshot!));
  const output = emitProjectLikeCodePanel(project);
  expect(output.files).toHaveLength(1);
  expect(output.files[0].content).toBe(goldens[language]);
  expect(output.files[0].content).toContain(language === 'gdscript' ? 'or' : '||');
  expect(output.files[0].content).toContain(language === 'rust' ? 'as i32' : language === 'cpp' ? 'static_cast<int>' : 'int(a)');
  for (const doc of Object.values(preview.snapshot!.documents)) for (const node of doc.nodes) {
    if (node.data.kindId === 'function_entry') continue;
    expect(output.sourceMap[node.id]?.length).toBeGreaterThan(0);
  }
  expect(emitProjectLikeCodePanel(JSON.parse(JSON.stringify(project))).files).toEqual(output.files);
  const arithmetic = preview.snapshot!.functions.find(fn => fn.name === 'arithmetic')!;
  const literal = project.documents[arithmetic.id].nodes.find((node: { data: { properties?: Record<string, unknown> } }) => node.data.properties?.payload === '2')!;
  literal.data.properties.payload = '3';
  expect(emitProjectLikeCodePanel(project).files[0].content).not.toBe(output.files[0].content);
  literal.data.properties.payload = 'invalid';
  expect(() => emitProjectLikeCodePanel(project)).toThrow();
});
