import { IMPORT_LIMITS, type SourceImportPreview } from '@vvs/source-import';
import type { ProjectSnapshot } from '@vvs/graph-types';
import type { SourceFileInput } from '@vvs/source-import/validation';
import type { ImportWorkerCommand, ImportWorkerResponse, WorkerGraphReview, WorkerReimportReview, WorkerCSharpPreview, WorkerNativeScalarPreview, SourceAnalysisLanguage } from './sourceImportWorkerProtocol';

export interface ImportWorkerPort {
  postMessage(message: ImportWorkerCommand & { id: number }): void;
  terminate(): void;
  onmessage: ((event: { data: ImportWorkerResponse }) => void) | null;
  onerror: ((event: { message: string }) => void) | null;
}
/** One active transaction. Cancellation/timeout destroys the worker and every receipt it owns. */
export class SourceImportWorkerClient {
  private worker: ImportWorkerPort | null = null;
  private serial = 0;
  private pending: { id: number; resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  constructor(private readonly createWorker: () => ImportWorkerPort, private readonly budgetMs: number = IMPORT_LIMITS.elapsedMs) {}
  cancel(reason = 'IMPORT_CANCELLED'): void {
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(new Error(reason)); this.pending = null; }
    this.worker?.terminate(); this.worker = null;
  }
  private request<T>(command: ImportWorkerCommand): Promise<T> {
    if (this.pending) this.cancel('IMPORT_SUPERSEDED');
    if (!this.worker) {
      const worker = this.createWorker(); this.worker = worker;
      worker.onmessage = ({ data }) => {
        if (this.worker !== worker || !this.pending || this.pending.id !== data.id) return;
        const pending = this.pending; this.pending = null; clearTimeout(pending.timer);
        if (data.ok) pending.resolve(data.result); else pending.reject(new Error(data.error));
      };
      worker.onerror = ({ message }) => { if (this.worker === worker) this.cancel(`IMPORT_WORKER_FAILED: ${message}`); };
    }
    const id = ++this.serial;
    return new Promise<T>((resolve, reject) => {
      this.pending = { id, resolve: value => resolve(value as T), reject, timer: setTimeout(() => this.cancel('IMPORT_TIME_BUDGET'), this.budgetMs) };
      try { this.worker!.postMessage({ ...command, id }); } catch (error) { this.cancel(error instanceof Error ? error.message : 'IMPORT_WORKER_FAILED'); }
    });
  }
  preview(source: string, language: 'csharp', goWordBits?: import('@vvs/graph-types').GoWordBits): Promise<WorkerCSharpPreview>;
  preview(source: string, language?: 'javascript' | 'python' | 'go', goWordBits?: import('@vvs/graph-types').GoWordBits): Promise<SourceImportPreview>;
  preview(source: string, language: 'cpp' | 'rust' | 'gdscript', goWordBits?: import('@vvs/graph-types').GoWordBits): Promise<WorkerNativeScalarPreview>;
  preview(source: string, language: SourceAnalysisLanguage, goWordBits?: import('@vvs/graph-types').GoWordBits): Promise<SourceImportPreview | WorkerCSharpPreview | WorkerNativeScalarPreview>;
  preview(source: string, language: SourceAnalysisLanguage = 'javascript', goWordBits: import('@vvs/graph-types').GoWordBits = 64): Promise<SourceImportPreview | WorkerCSharpPreview | WorkerNativeScalarPreview> { return this.request({ kind: 'preview', source, language, goWordBits }); }
  reviewReimport(snapshot: ProjectSnapshot, source: string, fileName: string): Promise<WorkerReimportReview> { return this.request({ kind: 'review_reimport', snapshot: { ...snapshot, savedAt: '' }, source, fileName }); }
  acceptReimport(review: WorkerReimportReview, snapshot: ProjectSnapshot, source: string, resolution?: 'keep-graph' | 'use-source'): Promise<ProjectSnapshot> { return this.request({ kind: 'accept_reimport', receipt: review.receipt, snapshot: { ...snapshot, savedAt: '' }, source, resolution }); }
  reviewFiles(files: SourceFileInput[]): Promise<WorkerGraphReview> { return this.request({ kind: 'review_files', files }); }
  acceptFiles(review: WorkerGraphReview, files: SourceFileInput[]): Promise<ProjectSnapshot> { return this.request({ kind: 'accept_files', files, receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot) }); }
  review(source: string, regionIndex: number, fileName: string, mapStart: boolean, entryPolicy: 'program' | 'library', language: SourceAnalysisLanguage = 'javascript', goWordBits: import('@vvs/graph-types').GoWordBits = 64): Promise<WorkerGraphReview> {
    return this.request({ kind: 'review', source, regionIndex, fileName, mapStart, entryPolicy, language, goWordBits });
  }
  accept(review: WorkerGraphReview, source: string, fileName: string, mapStart: boolean, entryPolicy: 'program' | 'library', language: SourceAnalysisLanguage = 'javascript', goWordBits: import('@vvs/graph-types').GoWordBits = 64): Promise<ProjectSnapshot> {
    return this.request({ kind: 'accept', source, fileName, mapStart, entryPolicy, language, goWordBits, receipt: review.receipt, snapshotJson: JSON.stringify(review.snapshot) });
  }
}
