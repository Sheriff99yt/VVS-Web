import { expect, test } from 'bun:test';
import { SourceImportWorkerClient, type ImportWorkerPort } from './sourceImportWorkerClient';
import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { ImportWorkerRequest, ImportWorkerResponse, WorkerGraphReview } from './sourceImportWorkerProtocol';

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
