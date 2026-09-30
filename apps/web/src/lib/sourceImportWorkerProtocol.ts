import type { ProjectSnapshot } from '@vvs/graph-types';
import type { SourceImportPreview } from '@vvs/source-import';
import type { SourceImportGraphReview } from '@vvs/source-import/validation';

type Config = { source: string; fileName: string; mapStart: boolean; entryPolicy: 'program' | 'library' };
export type ImportWorkerCommand =
  { kind: 'preview'; source: string } |
  (Config & { kind: 'review'; regionIndex: number }) |
  (Config & { kind: 'accept'; receipt: string; snapshotJson: string });
export type ImportWorkerRequest = ImportWorkerCommand & { id: number };
export type WorkerGraphReview = SourceImportGraphReview & { receipt: string };
export type ImportWorkerResponse =
  { id: number; ok: true; result: SourceImportPreview | WorkerGraphReview | ProjectSnapshot } |
  { id: number; ok: false; error: string };
