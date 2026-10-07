import { expect, test } from 'bun:test';
import { SourceImportWorkerClient, type ImportWorkerPort } from './sourceImportWorkerClient';
import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { ImportWorkerRequest, ImportWorkerResponse, WorkerGraphReview, WorkerCSharpPreview } from './sourceImportWorkerProtocol';
import { configureCSharpTestRuntime } from '../../../../packages/source-import/test/csharpRuntime';
import csharpCorpus from '../../../../packages/source-import/test/native-csharp/cases.json';
import type { CSharpSourceInventory } from '@vvs/source-import';
configureCSharpTestRuntime();

class FakeWorker implements ImportWorkerPort {
  onmessage: ImportWorkerPort['onmessage'] = null;
  onerror: ImportWorkerPort['onerror'] = null;
  requests: ImportWorkerRequest[] = []; terminated = false;
  postMessage(message: ImportWorkerRequest) { this.requests.push(message); }
  terminate() { this.terminated = true; }
  respond(response: ImportWorkerResponse) { this.onmessage?.({ data: response }); }
}
test('cancel hard-terminates workers and late results cannot resolve a new request', async () => {
  const workers: FakeWorker[] = [];
  const client = new SourceImportWorkerClient(() => { const worker = new FakeWorker(); workers.push(worker); return worker; });
  const first = client.preview('old');
  const rejected = first.catch(error => error.message);
  client.cancel(); expect(await rejected).toBe('IMPORT_CANCELLED');
  expect(workers[0]!.terminated).toBe(true);
  const second = client.preview('new');
  const result = { language: 'javascript' as const, source: 'new', sourceSha256: 'hash', regions: [], diagnostics: [] };
  workers[0]!.respond({ id: workers[1]!.requests[0]!.id, ok: true, result: { ...result, source: 'old' } });
  workers[1]!.respond({ id: workers[1]!.requests[0]!.id, ok: true, result });
  expect((await second).source).toBe('new'); client.cancel();
});

for (const fixture of csharpCorpus.cases) test(`C# worker inventory retains native fixture: ${fixture.id}`, async () => {
  const service = createSourceImportWorkerService();
  for (const [index, file] of fixture.files.entries()) {
    const response = await service({ id: index + 1, kind: 'preview', language: 'csharp', source: file.source });
    expect(response.ok).toBe(true);
    const inventory = (response as { result: CSharpSourceInventory }).result;
    expect(inventory.source).toBe(file.source);
    expect(inventory.syntaxComplete).toBe(true);
    expect(inventory.analysisOnly).toBe(true);
    expect('snapshot' in inventory).toBe(false);
    expect('receipt' in inventory).toBe(false);
  }
});

test('C# worker analysis invalidates earlier graph receipts and unsupported review cannot accept', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'function value() { return 1; }', fileName: 'library.js', mapStart: false, entryPolicy: 'library' as const };
  const response = await service({ id: 1, kind: 'review', regionIndex: 0, ...config });
  const review = (response as { result: WorkerGraphReview }).result;
  expect(review.snapshot).toBeDefined();
  await service({ id: 2, kind: 'preview', source: 'class Example {}', language: 'csharp' });
  expect(await service({ id: 3, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config })).toMatchObject({ ok: false, error: 'STALE_REVIEW' });
  const unsupported = await service({ id: 4, kind: 'review', regionIndex: 0, ...config, language: 'csharp' });
  expect(unsupported.ok).toBe(true); expect((unsupported as { result: WorkerGraphReview }).result.snapshot).toBeUndefined();
  expect(await service({ id: 5, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config, language: 'csharp' })).toMatchObject({ ok: false, error: 'STALE_REVIEW' });
});

test('C# worker candidate does not own a receipt; whole-class review and exact acceptance do', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'class Sample { public static int Sum(byte First, byte Second) => checked(First + Second); public static byte Narrow(long Value) => unchecked((byte)Value); }', language: 'csharp' as const, fileName: 'Sample.cs', mapStart: false, entryPolicy: 'library' as const };
  const preview = (await service({ id: 1, kind: 'preview', ...config }) as { result: WorkerCSharpPreview }).result;
  expect(preview.mappingRegion?.text).toBe(config.source); expect(preview.mappingDiagnostics).toEqual([]);
  expect('receipt' in preview).toBe(false); expect('snapshot' in preview).toBe(false);
  expect(await service({ id: 2, kind: 'review', regionIndex: 1, ...config })).toMatchObject({ ok: false, error: 'IMPORT_REGION_INVALID' });
  const review = (await service({ id: 3, kind: 'review', regionIndex: 0, ...config }) as { result: WorkerGraphReview }).result;
  expect(review.diagnostics).toEqual([]); expect(review.snapshot).toBeDefined();
  expect(await service({ id: 4, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config, language: 'go' })).toMatchObject({ ok: false, error: 'STALE_LANGUAGE' });
  expect(await service({ id: 5, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config, fileName: 'Other.cs' })).toMatchObject({ ok: false });
  const accepted = await service({ id: 6, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config });
  expect(accepted).toMatchObject({ ok: true, result: { targetLanguage: 'csharp' } });
  expect(await service({ id: 7, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config })).toMatchObject({ ok: false, error: 'STALE_REVIEW' });
});

test('late C# review and acceptance cannot replace a newer transaction', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'class Sample { public static int Value() => 1; }', language: 'csharp' as const, fileName: 'Sample.cs', mapStart: false, entryPolicy: 'library' as const };
  const old = service({ id: 1, kind: 'review', regionIndex: 0, ...config });
  const recent = service({ id: 2, kind: 'preview', language: 'javascript', source: 'function Value() { return 1; }' });
  expect(await old).toMatchObject({ ok: false, error: 'IMPORT_SUPERSEDED' }); expect((await recent).ok).toBe(true);
  const review = (await service({ id: 3, kind: 'review', regionIndex: 0, ...config }) as { result: WorkerGraphReview }).result;
  const acceptance = service({ id: 4, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config });
  const newer = service({ id: 5, kind: 'preview', ...config });
  expect(await acceptance).toMatchObject({ ok: false, error: 'IMPORT_SUPERSEDED' }); expect((await newer).ok).toBe(true);
});

test('C# worker reimport keeps graph-only edits and seals conflict choices against settings changes', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'class Sample { public static int Value() => 1; }', language: 'csharp' as const, fileName: 'Sample.cs', mapStart: false, entryPolicy: 'library' as const };
  const original = (await service({ id: 1, kind: 'review', regionIndex: 0, ...config }) as { result: WorkerGraphReview }).result;
  const snapshot = original.snapshot!;
  Object.values(snapshot.documents).flatMap(doc => doc.nodes).find(node => node.data.properties?.payload === '1')!.data.properties!.payload = '2';
  const source = config.source.replace('=> 1', '=> 3');
  const review = (await service({ id: 2, kind: 'review_reimport', snapshot, source, fileName: config.fileName }) as { result: import('./sourceImportWorkerProtocol').WorkerReimportReview }).result;
  expect(review.diagnostics).toEqual([]); expect(review.conflicts).toHaveLength(1);
  expect(await service({ id: 3, kind: 'accept_reimport', snapshot, source, receipt: review.receipt })).toMatchObject({ ok: false });
  const changed = structuredClone(snapshot); changed.autoCompile = !changed.autoCompile;
  expect(await service({ id: 4, kind: 'accept_reimport', snapshot: changed, source, receipt: review.receipt, resolution: 'use-source' })).toMatchObject({ ok: false });
  expect(await service({ id: 5, kind: 'accept_reimport', snapshot, source, receipt: review.receipt, resolution: 'keep-graph' })).toMatchObject({ ok: true, result: JSON.parse(JSON.stringify(snapshot)) });
});

test('C# worker rejects stale analysis after another language supersedes it', async () => {
  const service = createSourceImportWorkerService();
  const first = service({ id: 1, kind: 'preview', language: 'csharp', source: 'class Example {}' });
  const second = service({ id: 2, kind: 'preview', language: 'javascript', source: 'function value() { return 1; }' });
  expect(await first).toMatchObject({ ok: false, error: 'IMPORT_SUPERSEDED' });
  expect(await second).toMatchObject({ ok: true, result: { language: 'javascript' } });
});

test('C# malformed source remains retained and oversized input is rejected', async () => {
  const service = createSourceImportWorkerService();
  const source = 'class Broken { void Test( {';
  expect(await service({ id: 1, kind: 'preview', language: 'csharp', source })).toMatchObject({ ok: true, result: { source, syntaxComplete: false, analysisOnly: true } });
  expect(await service({ id: 2, kind: 'preview', language: 'csharp', source: ' '.repeat(128 * 1024 + 1) })).toMatchObject({ ok: false });
});

test('C# cancellation and timeout terminate the worker; late results cannot replace Go analysis', async () => {
  const workers: FakeWorker[] = [];
  const client = new SourceImportWorkerClient(() => { const worker = new FakeWorker(); workers.push(worker); return worker; }, 10);
  const timeout = client.preview('class Old {}', 'csharp');
  await expect(timeout).rejects.toThrow('IMPORT_TIME_BUDGET');
  expect(workers[0].terminated).toBe(true);
  const first = client.preview('class Cancelled {}', 'csharp');
  const rejected = first.catch(error => error.message);
  client.cancel();
  expect(await rejected).toBe('IMPORT_CANCELLED');
  const latest = client.preview('package sample', 'go');
  const result = { language: 'go' as const, source: 'package sample', sourceSha256: 'hash', regions: [], diagnostics: [] };
  workers[1].respond({ id: workers[2].requests[0].id, ok: true, result: { ...result, source: 'stale C#' } });
  workers[2].respond({ id: workers[2].requests[0].id, ok: true, result });
  expect((await latest).source).toBe('package sample');
  client.cancel();
});
test('superseded requests and hard deadline never retain a partial candidate', async () => {
  const worker = new FakeWorker();
  const client = new SourceImportWorkerClient(() => worker, 5);
  await expect(client.preview('large')).rejects.toThrow('IMPORT_TIME_BUDGET');
  expect(worker.terminated).toBe(true);
  const workers: FakeWorker[] = [];
  const next = new SourceImportWorkerClient(() => { const current = new FakeWorker(); workers.push(current); return current; });
  const first = next.preview('old'); const rejected = first.catch(error => error.message);
  const second = next.preview('new'); expect(await rejected).toBe('IMPORT_SUPERSEDED');
  expect(workers[0]!.terminated).toBe(true);
  const cancelled = second.catch(error => error.message); next.cancel(); expect(await cancelled).toBe('IMPORT_CANCELLED');
});
test('worker-owned receipts seal source, configuration and graph and are consumed atomically', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'class Library { value() { return true; } }', fileName: 'library.js', mapStart: false, entryPolicy: 'library' as const };
  const response = await service({ id: 1, kind: 'review', regionIndex: 0, ...config });
  expect(response.ok).toBe(true);
  const review = structuredClone((response as { result: WorkerGraphReview }).result);
  expect(review.snapshot).toBeDefined();
  const accept = { id: 2, kind: 'accept' as const, receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config };
  const wrongPolicy = await service({ ...accept, entryPolicy: 'program' });
  expect(wrongPolicy.ok).toBe(false);
  const mutated = structuredClone(review.snapshot)!;
  mutated.documents[mutated.activeGraphTab]!.metadata!.compilationUnit!.entryPolicy = 'program';
  const wrongGraph = await service({ ...accept, snapshotJson: JSON.stringify(mutated) });
  expect(wrongGraph.ok).toBe(false);
  const accepted = await service(accept);
  expect(accepted.ok).toBe(true);
  expect((await service(accept)).ok).toBe(false);
});
test('another preview invalidates an earlier acceptance receipt', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'class Library { value() { return 1; } }', fileName: 'library.js', mapStart: false, entryPolicy: 'library' as const };
  const response = await service({ id: 1, kind: 'review', regionIndex: 0, ...config });
  const review = (response as { result: WorkerGraphReview }).result;
  await service({ id: 2, kind: 'preview', source: config.source });
  expect((await service({ id: 3, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config })).ok).toBe(false);
});

test('worker reviews and accepts standalone Library functions with file-owned provenance', async () => {
  const service = createSourceImportWorkerService();
  const config = { source: 'function identity(value) { return value; }', fileName: 'library.js', mapStart: false, entryPolicy: 'library' as const };
  const response = await service({ id: 1, kind: 'review', regionIndex: 0, ...config });
  expect(response.ok).toBe(true);
  const review = structuredClone((response as { result: WorkerGraphReview }).result);
  expect(review.snapshot).toBeDefined();
  expect(review.generated).toContain('function identity(value)');
  expect(review.snapshot!.events).toEqual([]);
  const nodes = Object.values(review.snapshot!.documents).flatMap(doc => doc.nodes);
  expect(nodes.some(node => node.data.kindId === 'class_define')).toBe(false);
  expect(nodes.find(node => node.data.kindId === 'function_define')!.data.properties!.sourceImport).toBeDefined();
  const accepted = await service({ id: 2, kind: 'accept', receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot), ...config });
  expect(accepted.ok).toBe(true);
});
