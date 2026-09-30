import { previewJavaScriptImport } from '@vvs/source-import';
import { acceptSourceImportReview, reviewSourceImportGraph } from '@vvs/source-import/validation';
import type { ImportWorkerRequest, ImportWorkerResponse, WorkerGraphReview } from './sourceImportWorkerProtocol';

/** Trusted previews and acceptance receipts stay in this worker, never reconstructed from UI JSON. */
export function createSourceImportWorkerService() {
  let current: WorkerGraphReview | null = null;
  let generation = 0;
  return async (message: ImportWorkerRequest): Promise<ImportWorkerResponse> => {
    const requestGeneration = ++generation;
    try {
      if (message.kind === 'preview') {
        current = null;
        const result = await previewJavaScriptImport(message.source);
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        return { id: message.id, ok: true, result };
      }
      if (message.kind === 'review') {
        current = null;
        const preview = await previewJavaScriptImport(message.source);
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        const region = preview.regions[message.regionIndex];
        if (!region) throw new Error('IMPORT_REGION_INVALID');
        // Preserve the original object identity: validation seals it in a WeakMap.
        const result = reviewSourceImportGraph(preview, region, message.fileName, message.mapStart, message.entryPolicy) as WorkerGraphReview;
        result.receipt = `${message.id}:${requestGeneration}`;
        if (result.snapshot) current = result;
        return { id: message.id, ok: true, result };
      }
      if (!current || current.receipt !== message.receipt || JSON.stringify(current.snapshot) !== message.snapshotJson) throw new Error('STALE_REVIEW');
      const review = current;
      const result = await acceptSourceImportReview(review, message.source, message.fileName, message.mapStart, message.entryPolicy);
      if (requestGeneration !== generation || current !== review) throw new Error('IMPORT_SUPERSEDED');
      current = null;
      return { id: message.id, ok: true, result };
    } catch (error) {
      return { id: message.id, ok: false, error: error instanceof Error ? error.message : 'IMPORT_WORKER_FAILED' };
    }
  };
}
