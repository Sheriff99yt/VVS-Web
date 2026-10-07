import { expect, test } from 'bun:test';
import { normalizeProjectSnapshot, resolveCodegenTarget, type ProjectSnapshot } from '@vvs/graph-types';
import { transpileProject } from '@vvs/transpiler';
import { previewJavaScriptImport } from './parser';
import { previewPythonImport } from './python';
import { previewGoImport } from './go';
import { configureGoTestRuntime } from '../test/goRuntime';
import { configureCSharpTestRuntime } from '../test/csharpRuntime';
configureGoTestRuntime();
configureCSharpTestRuntime();
import { reviewSourceImportGraph, reviewCSharpImportGraph, reviewSourceFileSet, reviewSourceReimport, acceptSourceReimport } from './validation';

async function fixture(mode: 'javascript' | 'python' | 'go' | 'csharp' | 'modules') {
  const fileName = mode === 'csharp' ? 'Value.cs' : mode === 'go' ? 'value.go' : mode === 'python' ? 'value.py' : 'value.js';
  const source = mode === 'csharp' ? 'class Sample { public static int Value() { return 1; } }' : mode === 'go' ? 'package sample\nfunc value() float64 { return 1 }' : mode === 'python' ? 'def value():\n    return 1\n' : `${mode === 'modules' ? 'export ' : ''}function value() { return 1; }`;
  let current: ProjectSnapshot;
  if (mode === 'modules') {
    const review = await reviewSourceFileSet([{ fileName: 'main.js', source: 'import { value } from "./value.js"; export function main() { return value(); }' }, { fileName, source }]);
    expect(review.diagnostics).toEqual([]); current = review.snapshot!;
  } else if (mode === 'csharp') {
    const review = await reviewCSharpImportGraph(source, fileName);
    expect(review.diagnostics).toEqual([]); current = review.snapshot!;
  } else {
    const preview = await (mode === 'go' ? previewGoImport : mode === 'python' ? previewPythonImport : previewJavaScriptImport)(source);
    const review = reviewSourceImportGraph(preview, preview.regions[0], fileName, false, 'library');
    expect(review.diagnostics).toEqual([]); current = review.snapshot!;
  }
  current.projectId = 'retained-project'; current.savedAt = '2026-10-04T00:00:00Z';
  current.autoCompile = false; current.autoSave = true;
  current.workspaceFiles = ['docs/README.md', 'assets/icon.svg'];
  current.projectDetails.description = 'Keep this project description';
  current.installedLibrary = [{ assetId: 'retained-asset', installedAt: current.savedAt, environmentVersion: '1' }];
  current.environmentId = 'unlinked-fixture'; current.environmentVersion = '1';
  const language = mode === 'csharp' ? 'csharp' : mode === 'go' ? 'go' : mode === 'python' ? 'python' : 'javascript';
  current.integration = { environmentId: current.environmentId, environmentVersion: '1', emit: { [language]: { moduleDir: 'src', moduleFile: `retained.${mode === 'csharp' ? 'cs' : mode === 'go' ? 'go' : mode === 'python' ? 'py' : 'mjs'}` } }, hostFiles: {} };
  current.syntaxPackLock = { [language]: { base: `${language}.base@1`, overlays: language === 'javascript' ? ['javascript.es2022@1'] : [] } };
  current.codegenCapabilities = { [language]: language === 'javascript' ? ['es2022'] : language === 'csharp' ? [] : ['type_hints'] };
  current.targetFileExtensions = { [language]: mode === 'csharp' ? 'cs' : mode === 'go' ? 'go' : mode === 'python' ? 'py' : 'mjs' };
  current.graphContainers[0].name = 'Retained file folder';
  for (const doc of Object.values(current.documents)) doc.metadata = { ...doc.metadata!, description: 'Retained graph description' };
  return { current, fileName, source, replacement: source.replace('return 1', 'return 3') };
}

const contextKeys = ['projectId', 'savedAt', 'projectDetails', 'targetLanguage', 'autoCompile', 'autoSave', 'workspaceFiles', 'installedLibrary', 'environmentId', 'environmentVersion', 'integration', 'syntaxPackLock', 'codegenCapabilities', 'targetFileExtensions', 'graphContainers'] as const;
function emit(project: ProjectSnapshot) {
  return transpileProject({ ...project, projectEvents: project.events, codegenTarget: resolveCodegenTarget(project.targetLanguage, { capabilities: project.codegenCapabilities, syntaxPackLock: project.syntaxPackLock })! });
}

for (const mode of ['javascript', 'python', 'go', 'csharp', 'modules'] as const) {
  test(`${mode} source replacement retains context and exact preview through persistence`, async () => {
    const { current, fileName, replacement } = await fixture(mode);
    const before = JSON.stringify(current);
    const review = await reviewSourceReimport(current, replacement, fileName);
    expect(review.diagnostics).toEqual([]); expect(review.conflicts).toEqual([]);
    const accepted = acceptSourceReimport(review, current, replacement);
    for (const key of contextKeys) expect(accepted[key]).toEqual(current[key]);
    for (const [id, doc] of Object.entries(accepted.documents)) expect(doc.metadata).toEqual(current.documents[id].metadata);
    expect(emit(accepted).files.map(file => file.content).join('\n')).toBe(review.incoming);
    expect(emit(normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!).files).toEqual(emit(accepted).files);
    const loaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(accepted)))!;
    const originalLoaded = normalizeProjectSnapshot(JSON.parse(JSON.stringify(current)))!;
    for (const key of contextKeys) expect(loaded[key]).toEqual(originalLoaded[key]);
    expect(emit(accepted).files.map(file => file.path)).toEqual(emit(current).files.map(file => file.path));
    expect(review.incoming).toContain('return 3');
    expect(JSON.stringify(current)).toBe(before);
  });

  test(`${mode} conflict choices retain context and a settings change invalidates acceptance`, async () => {
    const { current, fileName, replacement } = await fixture(mode);
    if (mode === 'go' || mode === 'csharp') Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'expr_native_literal' && node.data.properties?.payload === '1')!.data.properties!.payload = '2';
    else {
      const ret = Object.values(current.documents).flatMap(doc => doc.nodes).find(node => node.data.kindId === 'flow_return' && Object.values(node.data.inlineValues).includes(1))!;
      ret.data.inlineValues[ret.data.inputs.find(pin => pin.type !== 'execution')!.id] = 2;
    }
    const review = await reviewSourceReimport(current, replacement, fileName);
    expect(review.diagnostics).toEqual([]); expect(review.conflicts).toHaveLength(1);
    expect(() => acceptSourceReimport(review, current, replacement)).toThrow('REIMPORT_CONFLICT');
    expect(acceptSourceReimport(review, current, replacement, 'keep-graph')).toEqual(current);
    const accepted = acceptSourceReimport(review, current, replacement, 'use-source');
    for (const key of contextKeys) expect(accepted[key]).toEqual(current[key]);
    for (const change of [
      (project: ProjectSnapshot) => { project.autoCompile = true; },
      (project: ProjectSnapshot) => { project.workspaceFiles!.push('new.txt'); },
      (project: ProjectSnapshot) => { project.syntaxPackLock!.javascript = { base: 'javascript.base@1', overlays: [] }; project.syntaxPackLock!.python = { base: 'python.base@1', overlays: ['missing@1'] }; },
      (project: ProjectSnapshot) => { project.integration!.emit = {}; },
    ]) {
      const changed = structuredClone(current); change(changed);
      expect(() => acceptSourceReimport(review, changed, replacement, 'use-source')).toThrow('STALE_REIMPORT');
    }
  });

  test(`${mode} incompatible retained targets and unavailable packs block atomically`, async () => {
    const { current, fileName, replacement } = await fixture(mode);
    for (const change of [
      (project: ProjectSnapshot) => { project.targetLanguage = 'rust'; },
      (project: ProjectSnapshot) => { Object.values(project.documents)[0].metadata!.targetLanguage = 'cpp'; },
      (project: ProjectSnapshot) => { project.syntaxPackLock![project.targetLanguage as 'javascript' | 'python']!.overlays.push('missing@1'); },
    ]) {
      const changed = structuredClone(current); change(changed); const before = JSON.stringify(changed);
      const review = await reviewSourceReimport(changed, replacement, fileName);
      expect(review.diagnostics.length).toBeGreaterThan(0);
      expect(() => acceptSourceReimport(review, changed, replacement, 'use-source')).toThrow('STALE_REIMPORT');
      expect(JSON.stringify(changed)).toBe(before);
    }
  });
}

test('module replacement retains another file’s graph edits with project settings', async () => {
  const { current, fileName, replacement } = await fixture('modules');
  const body = current.documents['file-0-import-function-0'];
  const ret = body.nodes.find(node => node.data.kindId === 'flow_return')!;
  ret.data.label = 'Preserve authored return label';
  const comment = current.documents['main-graph'].metadata!; comment.description = 'Keep main context';
  const review = await reviewSourceReimport(current, replacement, fileName);
  expect(review.diagnostics).toEqual([]);
  const accepted = acceptSourceReimport(review, current, replacement);
  expect(accepted.documents['file-0-import-function-0'].metadata).toEqual(body.metadata);
  expect(accepted.documents['file-0-import-function-0'].nodes.find(node => node.id === ret.id)?.data.label).toBe('Preserve authored return label');
  expect(accepted.autoCompile).toBe(false); expect(accepted.workspaceFiles).toEqual(current.workspaceFiles);
});

test('retained environment host-file policy is honored and extra outputs block source replacement', async () => {
  const { current, fileName, replacement } = await fixture('javascript');
  current.environmentId = 'env.javascript.node-script'; current.environmentVersion = '1.0.0';
  current.integration!.environmentId = current.environmentId; current.integration!.environmentVersion = current.environmentVersion;
  current.integration!.hostFiles = { 'main.js': { strategy: 'skip' }, 'package.json': { strategy: 'skip' } };
  const supported = await reviewSourceReimport(current, replacement, fileName);
  expect(supported.diagnostics).toEqual([]);
  expect(acceptSourceReimport(supported, current, replacement).integration).toEqual(current.integration);
  current.integration!.hostFiles['package.json'].strategy = 'emit';
  const before = JSON.stringify(current);
  const blocked = await reviewSourceReimport(current, replacement, fileName);
  expect(blocked.diagnostics.length).toBeGreaterThan(0);
  expect(() => acceptSourceReimport(blocked, current, replacement)).toThrow('STALE_REIMPORT');
  expect(JSON.stringify(current)).toBe(before);
});
