import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, transactNativeScalarLocal, transactNativeScalarDeclarationMode } from '@vvs/graph-types';
import { previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { configureNativeInventoryRuntime } from '../../../../packages/source-import/test/nativeInventoryRuntime';
import { nativeInferredGraphFixtures } from '../../../../packages/source-import/test/nativeInferredGraphFixtures';
import { normalizedNativeScalarSyntax } from '../../../../packages/source-import/src/nativeScalarSyntax';
import goldens from '../../../../packages/source-import/test/nativeInferredGraphGoldens.json';
import { emitProjectLikeCodePanel } from './emitProjectCode';
configureNativeInventoryRuntime();
for (const language of ['cpp', 'rust', 'gdscript'] as const) for (const fixture of nativeInferredGraphFixtures[language]) test(`saved inferred declaration Code-panel ${language}/${fixture.id}`, async () => {
  const preview = await previewNativeScalarSourceGraphs(fixture.source, language, { fileName: 'inferred.' + { cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[language], entryPolicy: 'library', runtimeExpressions: true, localStatements: true, groupedDeclarations: true, inferredLocals: true });
  expect(preview.diagnostics).toEqual([]);
  const project = normalizeProjectSnapshot(JSON.parse(JSON.stringify(preview.snapshot)))!;
  const fn = project.functions[0], body = project.documents[fn.id];
  const declarations = body.nodes.filter(node => node.data.kindId === 'var_define');
  expect(declarations.every(node => node.data.properties?.nativeInferenceMode === { cpp: 'cpp-auto', rust: 'rust-let', gdscript: 'gdscript-inferred' }[language])).toBe(true);
  const output = emitProjectLikeCodePanel(project);
  expect(output.files).toHaveLength(1);
  expect(output.files[0].content).toBe((goldens[language] as Record<string, string>)[fixture.id]);
  expect(normalizedNativeScalarSyntax(output.files[0].content, language)).toBe(normalizedNativeScalarSyntax(fixture.source, language));
  for (const node of body.nodes) if (node.data.kindId !== 'function_entry') expect(output.sourceMap[node.id]?.length).toBeGreaterThan(0);
  expect(emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(project)))!).files).toEqual(output.files);
  const before = JSON.stringify(project);
  const renamed = { ...project, ...transactNativeScalarLocal(project, declarations.at(-1)!.id, { name: 'editedLocal' }) };
  expect(emitProjectLikeCodePanel(normalizeProjectSnapshot(JSON.parse(JSON.stringify(renamed)))!).files[0].content).toContain('editedLocal');
  expect(JSON.stringify(project)).toBe(before);
  const typed = { ...project, ...transactNativeScalarDeclarationMode(project, declarations[0].id, { declarationMode: 'typed' }) };
  const typedLoaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(typed)))!;
  expect(emitProjectLikeCodePanel(typedLoaded).files[0].content).not.toBe(output.files[0].content);
  const inferredAgain = { ...typedLoaded, ...transactNativeScalarDeclarationMode(typedLoaded, declarations[0].id, { declarationMode: 'inferred' }) };
  expect(emitProjectLikeCodePanel(inferredAgain).files).toEqual(output.files);
  expect(inferredAgain.documents[fn.id].edges).toEqual(body.edges);
  expect(JSON.stringify(project)).toBe(before);
  const stale = structuredClone(project);
  const declaration = stale.documents[fn.id].nodes.find(node => node.id === declarations[0].id)!;
  // A same-domain width edit must not become inferred type authority.
  declaration.data.properties!.nativeType = language === 'rust' ? 'i64' : language === 'cpp' ? 'long long' : declaration.data.properties!.nativeType === 'bool' ? 'int' : 'bool';
  expect(() => emitProjectLikeCodePanel(stale)).toThrow();
  const foreignMode = structuredClone(project);
  foreignMode.documents[fn.id].nodes.find(node => node.id === declarations[0].id)!.data.properties!.nativeInferenceMode = language === 'rust' ? 'cpp-auto' : 'rust-let';
  expect(() => emitProjectLikeCodePanel(foreignMode)).toThrow();
  if (language === 'rust' && fixture.id === 'suffixed') {
    const unconstrained = structuredClone(project);
    unconstrained.documents[fn.id].nodes.find(node => node.data.properties?.payload === '4i32')!.data.properties!.payload = '4';
    expect(() => emitProjectLikeCodePanel(unconstrained)).toThrow();
  }
});
