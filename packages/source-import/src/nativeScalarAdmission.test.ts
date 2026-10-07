import { expect, test } from 'bun:test';
import { analyzeProject } from '@vvs/graph-types';
import { reviewNativeScalarImportGraph, acceptSourceImportReview, reviewSourceReimport, acceptSourceReimport } from './validation';
import { normalizedNativeScalarSyntax } from './nativeScalarSyntax';
import { configureNativeInventoryRuntime } from '../test/nativeInventoryRuntime';
import { nativeScalarSourceFixtures } from '../test/nativeScalarSourceFixtures';
configureNativeInventoryRuntime();
const extension = { cpp: 'cpp', rust: 'rs', gdscript: 'gd' };
for (const language of ['cpp', 'rust', 'gdscript'] as const) {
  const source = nativeScalarSourceFixtures[language], fileName = `sample.${extension[language]}`;
  test(`sealed native acceptance and structural fidelity ${language}`, async () => {
    const review = await reviewNativeScalarImportGraph(source, language, fileName);
    expect(review.diagnostics).toEqual([]);
    expect(normalizedNativeScalarSyntax(review.generated, language)).toBe(normalizedNativeScalarSyntax(source, language));
    expect(normalizedNativeScalarSyntax(review.generated.replace('-(-5)', '-(-6)'), language)).not.toBe(normalizedNativeScalarSyntax(source, language));
    const accepted = await acceptSourceImportReview(review, source, fileName, false, 'library');
    expect(analyzeProject(accepted).ok).toBe(true);
    expect(accepted.autoCompile).toBe(true);
    expect(accepted.documents['main-graph'].metadata!.sourceFileName).toBe(fileName);
    await expect(acceptSourceImportReview(review, source + ' ', fileName, false, 'library')).rejects.toThrow('STALE_REVIEW');
    await expect(acceptSourceImportReview({ ...review }, source, fileName, false, 'library')).rejects.toThrow('STALE_REVIEW');
    review.snapshot!.autoSave = true;
    await expect(acceptSourceImportReview(review, source, fileName, false, 'library')).rejects.toThrow('STALE_REVIEW');
  });
  test(`native persisted graph/source conflict choices ${language}`, async () => {
    const imported = await reviewNativeScalarImportGraph(source, language, fileName);
    expect(imported.diagnostics).toEqual([]);
    const current = imported.snapshot!;
    current.autoSave = true; current.workspaceFiles = ['docs/README.md'];
    const literal = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '5')!;
    literal.data.properties!.payload = '6';
    const unchanged = await reviewSourceReimport(current, source, fileName);
    expect(unchanged.diagnostics).toEqual([]); expect(unchanged.conflicts).toEqual([]);
    expect(acceptSourceReimport(unchanged, current, source).documents).toEqual(current.documents);
    const changed = source.replace('-(-5)', '-(-7)');
    const conflict = await reviewSourceReimport(current, changed, fileName);
    expect(conflict.diagnostics).toEqual([]); expect(conflict.conflicts).toHaveLength(1);
    expect(() => acceptSourceReimport(conflict, current, changed)).toThrow('REIMPORT_CONFLICT');
    expect(acceptSourceReimport(conflict, current, changed, 'keep-graph').documents).toEqual(current.documents);
    const incoming = acceptSourceReimport(conflict, current, changed, 'use-source');
    expect(incoming.autoSave).toBe(true); expect(incoming.workspaceFiles).toEqual(current.workspaceFiles);
    expect(Object.values(incoming.documents).flatMap(doc => doc.nodes).some(node => node.data.properties?.payload === '7')).toBe(true);
    current.autoCompile = !current.autoCompile;
    expect(() => acceptSourceReimport(conflict, current, changed, 'use-source')).toThrow('STALE_REIMPORT');
  });
}

test('Rust authored tail versus return and discarded values remain structurally distinct', async () => {
  await reviewNativeScalarImportGraph('fn sample()->i32{1}', 'rust', 'sample.rs');
  expect(normalizedNativeScalarSyntax('fn sample()->i32{1}', 'rust')).not.toBe(normalizedNativeScalarSyntax('fn sample()->i32{return 1;}', 'rust'));
  expect(normalizedNativeScalarSyntax('fn sample()->i32{1}', 'rust')).not.toBe(normalizedNativeScalarSyntax('fn sample()->i32{1;}', 'rust'));
});

test('Godot direct negative literal and grouped negation preserve native context', async () => {
  await reviewNativeScalarImportGraph(nativeScalarSourceFixtures.gdscript, 'gdscript', 'sample.gd');
  expect(normalizedNativeScalarSyntax('func sample()->int:\n    return -9223372036854775808\n', 'gdscript')).not.toBe(normalizedNativeScalarSyntax('func sample()->int:\n    return -(9223372036854775808)\n', 'gdscript'));
});
