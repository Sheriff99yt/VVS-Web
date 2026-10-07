import { siteBasePath } from './siteOrigin';
import { previewJavaScriptImport, previewPythonImport, previewGoImport, inventoryCSharpSource, planCSharpIntegralClass, configureNativeParserAssets, previewNativeScalarSourceGraphs } from '@vvs/source-import';
import { acceptSourceImportReview, reviewSourceImportGraph, reviewCSharpImportGraph, reviewNativeScalarImportGraph, reviewSourceFileSet, acceptSourceFileSetReview, reviewSourceReimport, acceptSourceReimport, type SourceFileSetReview, type SourceReimportReview } from '@vvs/source-import/validation';
import type { ImportWorkerRequest, ImportWorkerResponse, WorkerGraphReview, WorkerCSharpPreview, WorkerNativeScalarPreview } from './sourceImportWorkerProtocol';

/** Trusted previews and acceptance receipts stay in this worker, never reconstructed from UI JSON. */
export function createSourceImportWorkerService() {
  configureNativeParserAssets({ baseUrl: `${siteBasePath()}/source-parsers` });
  let current: WorkerGraphReview | null = null;
  let reimport: { review: SourceReimportReview; receipt: string } | null = null;
  let generation = 0;
  return async (message: ImportWorkerRequest): Promise<ImportWorkerResponse> => {
    const requestGeneration = ++generation;
    try {
      if (message.kind === 'review_reimport') {
        current = null; reimport = null;
        const review = await reviewSourceReimport(message.snapshot, message.source, message.fileName);
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        const receipt = `${message.id}:${requestGeneration}`;
        reimport = { review, receipt };
        return { id: message.id, ok: true, result: { ...review, receipt } };
      }
      if (message.kind === 'accept_reimport') {
        if (!reimport || reimport.receipt !== message.receipt) throw new Error('STALE_REIMPORT');
        const result = acceptSourceReimport(reimport.review, message.snapshot, message.source, message.resolution);
        reimport = null; return { id: message.id, ok: true, result };
      }
      reimport = null;
      if (message.kind === 'review_files') {
        current = null;
        const result = await reviewSourceFileSet(message.files) as WorkerGraphReview;
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        result.receipt = `${message.id}:${requestGeneration}`;
        if (result.snapshot) current = result;
        return { id: message.id, ok: true, result };
      }
      if (message.kind === 'accept_files') {
        if (!current || current.receipt !== message.receipt || JSON.stringify(current.snapshot) !== message.snapshotJson) throw new Error('STALE_REVIEW');
        const result = acceptSourceFileSetReview(current as SourceFileSetReview, message.files);
        current = null; return { id: message.id, ok: true, result };
      }
      if (message.language && !['javascript', 'python', 'go', 'csharp', 'cpp', 'rust', 'gdscript'].includes(message.language)) throw new Error('IMPORT_LANGUAGE_UNSUPPORTED');
      if (message.language === 'cpp' || message.language === 'rust' || message.language === 'gdscript') {
        if (message.kind === 'preview') {
          current = null;
          const fileName = `pasted.${{ cpp: 'cpp', rust: 'rs', gdscript: 'gd' }[message.language]}`;
          const preview = await previewNativeScalarSourceGraphs(message.source, message.language, { fileName, entryPolicy: 'library', runtimeExpressions: true, localStatements: true, groupedDeclarations: true });
          if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
          const result: WorkerNativeScalarPreview = { language: message.language, source: message.source, sourceSha256: preview.sourceSha256, diagnostics: preview.diagnostics.map(item => `${item.code}: ${item.message}`), regions: [{ kind: preview.snapshot ? 'candidate' : 'unresolved', proposedKind: 'function-file', start: 0, end: message.source.length, text: message.source, reason: preview.snapshot ? 'Ordinary typed scalar functions — Library mode' : 'This source needs further native mappings.' }] };
          return { id: message.id, ok: true, result };
        }
        if (message.kind === 'review') {
          current = null;
          if (message.regionIndex !== 0) throw new Error('IMPORT_REGION_INVALID');
          const result = await reviewNativeScalarImportGraph(message.source, message.language, message.fileName, message.mapStart, message.entryPolicy) as WorkerGraphReview;
          if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
          result.receipt = `${message.id}:${requestGeneration}`;
          if (result.snapshot) current = result;
          return { id: message.id, ok: true, result };
        }
      }
      if (message.language === 'csharp' && message.kind === 'preview') {
        current = null;
        const inventory = await inventoryCSharpSource(message.source);
        const result: WorkerCSharpPreview = { ...inventory, mappingDiagnostics: [] };
        if (inventory.syntaxComplete) {
          try {
            const plan = await planCSharpIntegralClass(message.source, 'pasted.cs');
            result.mappingRegion = { kind: 'candidate', proposedKind: 'class', start: plan.start, end: plan.end, text: plan.selectedSource, reason: 'C# static integral/void class — Library mode' };
          } catch (error) { result.mappingDiagnostics.push(error instanceof Error ? error.message : 'C# source needs additional mappings.'); }
        }
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        return { id: message.id, ok: true, result };
      }
      const previewSource = (source: string) => message.language === 'go' ? previewGoImport(source, message.goWordBits ?? 64) : message.language === 'python' ? previewPythonImport(source) : previewJavaScriptImport(source);
      if (message.kind === 'preview') {
        current = null;
        const result = await previewSource(message.source);
        if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
        return { id: message.id, ok: true, result };
      }
      if (message.kind === 'review') {
        current = null;
        if (message.language === 'csharp') {
          if (message.regionIndex !== 0) throw new Error('IMPORT_REGION_INVALID');
          const result = await reviewCSharpImportGraph(message.source, message.fileName, message.mapStart, message.entryPolicy) as WorkerGraphReview;
          if (requestGeneration !== generation) throw new Error('IMPORT_SUPERSEDED');
          result.receipt = `${message.id}:${requestGeneration}`;
          if (result.snapshot) current = result;
          return { id: message.id, ok: true, result };
        }
        const preview = await previewSource(message.source);
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
      if (current.snapshot?.targetLanguage !== (message.language ?? 'javascript')) throw new Error('STALE_LANGUAGE');
      if (message.language === 'go' && Object.values(current.snapshot!.documents).flatMap(document => document.nodes).find(node => node.data.kindId === 'source_package')?.data.properties?.goWordBits !== String(message.goWordBits ?? 64)) throw new Error('STALE_GO_WORD_SIZE');
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
