import { expect, test } from 'bun:test';
import { analyzeProject } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from './nativeScalarSourceGraphs';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeScalarSourceFixtures } from '../test/nativeScalarSourceFixtures';
configureNativeInventoryRuntime();
const extension = { cpp: 'cpp', rust: 'rs', gdscript: 'gd' };

for (const language of ['cpp', 'rust', 'gdscript'] as const) test(`source-owned scalar module ${language}`, async () => {
  const source = nativeScalarSourceFixtures[language];
  const report = await previewNativeScalarSourceGraphs(source, language, { fileName: `sample.${extension[language]}`, entryPolicy: 'library' });
  expect(report.diagnostics).toEqual([]);
  expect(report.status).toBe('mapped');
  expect(report.graphAdmission).toBe('blocked');
  expect(report.inventory.regions.map(item => item.text).join('')).toBe(source);
  const project = report.snapshot!;
  expect(project.functions).toHaveLength(4);
  expect(new Set(project.functions.map(fn => fn.id.toLowerCase())).size).toBe(4);
  expect(analyzeProject(JSON.parse(JSON.stringify(project))).diagnostics.filter(item => item.level === 'error')).toEqual([]);
  for (const node of Object.values(project.documents).flatMap(doc => doc.nodes)) {
    const origin = node.data.properties!.sourceOrigin as { start: number; end: number; sourceSha256: string };
    expect(origin.sourceSha256).toBe(report.sourceSha256);
    expect(source.slice(origin.start, origin.end).length).toBeGreaterThan(0);
  }
  const changed = await previewNativeScalarSourceGraphs(source.replace('-(-5)', '-(-6)'), language, { fileName: `sample.${extension[language]}`, entryPolicy: 'library' });
  expect(changed.snapshot!.functions.map(fn => fn.id)).toEqual(project.functions.map(fn => fn.id));
  if (language === 'rust') {
    const identityBody = project.documents[project.functions[0].id];
    expect(identityBody.nodes.find(node => node.data.kindId === 'flow_return')!.data.properties!.nativeReturnStyle).toBe('rust-tail');
  }
});

const unsupported = [
  ['cpp', 'int main() { return 0; }', 'FUNCTION_ROLE_CONTEXT'],
  ['gdscript', 'func _init() -> void:\n    pass\n', 'FUNCTION_ROLE_CONTEXT'],
  ['rust', 'fn sample(value: i32) -> i32 { value; }', 'DISCARDED_EXPRESSION'],
  ['rust', 'fn sample(value: i32) -> i32 { value + 1 }', 'CONSTANT_RETURN_CONTEXT'],
  ['cpp', 'int sample() { int value = 2; return value; }', 'BODY_CONSTRUCTS'],
  ['cpp', 'int global = 1; int sample() { return 1; }', 'TOP_LEVEL_CONTEXT'],
  ['rust', 'fn sample() -> i32 { 1 }\n// retained comment\n', 'COMMENT_MAPPING_REQUIRED'],
  ['cpp', 'long long sample() { return 1; }', 'CONSTANT_RETURN_CONTEXT'],
  ['cpp', '[[nodiscard]] int sample() { return 1; }', 'HEADER_CONSTRUCT'],
] as const;
for (const [language, source, code] of unsupported) test(`atomic source rejection ${language}/${code}`, async () => {
  const report = await previewNativeScalarSourceGraphs(source, language, { fileName: `sample.${extension[language]}`, entryPolicy: 'library' });
  expect(report.status).toBe('unsupported');
  expect(report.snapshot).toBeUndefined();
  expect(report.source).toBe(source);
  expect(report.diagnostics.some(item => item.code.includes(code))).toBe(true);
});
