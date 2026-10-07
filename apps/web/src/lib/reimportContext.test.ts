import { expect, test } from 'bun:test';
import type { ProjectSnapshot } from '@vvs/graph-types';
import { previewJavaScriptImport } from '@vvs/source-import';
import { reviewSourceImportGraph } from '@vvs/source-import/validation';
import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { WorkerReimportReview } from './sourceImportWorkerProtocol';
import { emitProjectLikeCodePanel } from './emitProjectCode';
import { applyProjectSnapshot } from './applyProjectSnapshot';

test('worker re-import receipts retain context and reproduce the Code-panel preview', async () => {
  const source = 'function value() { return 1; }';
  const preview = await previewJavaScriptImport(source);
  const current = reviewSourceImportGraph(preview, preview.regions[0], 'value.js', false, 'library').snapshot!;
  current.autoCompile = false; current.workspaceFiles = ['docs/README.md'];
  current.syntaxPackLock = { javascript: { base: 'javascript.base@1', overlays: ['javascript.es2022@1'] } };
  current.codegenCapabilities = { javascript: ['es2022'] };
  current.integration = { emit: { javascript: { moduleDir: 'src', moduleFile: 'kept.mjs' } }, hostFiles: {} };
  current.graphContainers[0].name = 'Kept folder';
  const replacement = 'function value() { return 3; }';
  const service = createSourceImportWorkerService();
  const response = await service({ id: 1, kind: 'review_reimport', snapshot: structuredClone(current), source: replacement, fileName: 'value.js' });
  expect(response.ok).toBe(true);
  const review = (response as { result: WorkerReimportReview }).result;
  expect(review.diagnostics).toEqual([]);
  const stale = structuredClone(current); stale.autoCompile = true;
  const rejected = await service({ id: 2, kind: 'accept_reimport', snapshot: stale, source: replacement, receipt: review.receipt });
  expect(rejected.ok).toBe(false);
  const accepted = await service({ id: 3, kind: 'accept_reimport', snapshot: current, source: replacement, receipt: review.receipt });
  expect(accepted.ok).toBe(true);
  const snapshot = (accepted as { result: ProjectSnapshot }).result;
  expect(snapshot.autoCompile).toBe(false); expect(snapshot.workspaceFiles).toEqual(current.workspaceFiles);
  expect(snapshot.graphContainers).toEqual(current.graphContainers);
  const output = emitProjectLikeCodePanel(snapshot);
  expect(output.files.map(file => file.content).join('\n')).toBe(review.incoming);
  expect(output.files.map(file => file.path)).toEqual(emitProjectLikeCodePanel(current).files.map(file => file.path));
  const applied: Record<string, unknown> = {};
  const setter = (name: string) => (value: unknown) => { applied[name] = value; };
  applyProjectSnapshot(snapshot, {
    setVariables: setter('variables'), setEvents: setter('events'), setFunctions: setter('functions'), setClasses: setter('classes'), setGraphContainers: setter('containers'),
    setActiveClassId: setter('class'), setOpenTabs: setter('tabs'), setActiveGraphTab: setter('tab'), setProjectDetails: setter('details'), setTargetLanguage: setter('language'),
    setAutoCompile: setter('autoCompile'), setAutoSave: setter('autoSave'), setSelection: setter('selection'), loadDocuments: setter('documents'), setInstalledLibrary: setter('library'),
    setEnvironmentLink: setter('environment'), setIntegration: setter('integration'), setWorkspaceFiles: setter('workspaceFiles'), setSyntaxPackLock: setter('packs'), setCodegenCapabilities: setter('capabilities'),
  });
  expect(applied.containers).toEqual(snapshot.graphContainers);
  expect(applied.autoCompile).toBe(false); expect(applied.workspaceFiles).toEqual(snapshot.workspaceFiles);
  expect(applied.integration).toEqual(snapshot.integration); expect(applied.packs).toEqual(snapshot.syntaxPackLock);
  expect((await service({ id: 4, kind: 'accept_reimport', snapshot: current, source: replacement, receipt: review.receipt })).ok).toBe(false);
});
