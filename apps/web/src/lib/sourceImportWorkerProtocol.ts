import type { ProjectSnapshot } from '@vvs/graph-types';
import type { SourceImportPreview, CSharpSourceInventory, ImportRegion } from '@vvs/source-import';
import type { SourceImportGraphReview, SourceFileInput, SourceReimportReview } from '@vvs/source-import/validation';

export type SourceAnalysisLanguage = 'javascript' | 'python' | 'go' | 'csharp' | 'cpp' | 'rust' | 'gdscript';
export type WorkerNativeScalarPreview = Omit<SourceImportPreview, 'language'> & { language: 'cpp' | 'rust' | 'gdscript' };
/** Inventory remains analysis-only; eligibility never carries an acceptance receipt. */
export interface WorkerCSharpPreview extends CSharpSourceInventory {
  mappingRegion?: ImportRegion;
  mappingDiagnostics: string[];
}
type Config = { goWordBits?: import('@vvs/graph-types').GoWordBits; language?: SourceAnalysisLanguage; source: string; fileName: string; mapStart: boolean; entryPolicy: 'program' | 'library' };
export type ImportWorkerCommand =
  { kind: 'review_reimport'; snapshot: ProjectSnapshot; source: string; fileName: string } |
  { kind: 'accept_reimport'; snapshot: ProjectSnapshot; source: string; receipt: string; resolution?: 'keep-graph' | 'use-source' } |
  { kind: 'review_files'; files: SourceFileInput[] } |
  { kind: 'accept_files'; files: SourceFileInput[]; receipt: string; snapshotJson: string } |
  { kind: 'preview'; goWordBits?: import('@vvs/graph-types').GoWordBits; source: string; language?: SourceAnalysisLanguage } |
  (Config & { kind: 'review'; regionIndex: number }) |
  (Config & { kind: 'accept'; receipt: string; snapshotJson: string });
export type ImportWorkerRequest = ImportWorkerCommand & { id: number };
export type WorkerGraphReview = SourceImportGraphReview & { receipt: string; files?: { fileName: string; generated: string }[] };
export type WorkerReimportReview = SourceReimportReview & { receipt: string };
export type ImportWorkerResponse =
  { id: number; ok: true; result: SourceImportPreview | WorkerNativeScalarPreview | CSharpSourceInventory | WorkerGraphReview | WorkerReimportReview | ProjectSnapshot } |
  { id: number; ok: false; error: string };
