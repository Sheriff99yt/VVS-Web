/**
 * Dedicated Worker for project/graph codegen.
 *
 * Snapshot in / files out. No sibling imports — Pages `output: 'export'` copies
 * this file into `out/`; package imports are bundled by the Next worker entry
 * (`new URL('./transpileWorker.ts', import.meta.url)`).
 */
import { transpileGraph, transpileProject } from '@vvs/transpiler';
import type { CodegenContext, ProjectTranspileInput } from '@vvs/transpiler';
import type { TranspileResult } from '@vvs/graph-types';

type TranspileWorkerRequest =
  | { id: string; kind: 'project'; input: ProjectTranspileInput }
  | { id: string; kind: 'graph'; input: CodegenContext };

type TranspileWorkerResponse =
  | { id: string; ok: true; result: TranspileResult }
  | { id: string; ok: false; error: string };

const ctx = self as unknown as {
  postMessage(message: TranspileWorkerResponse): void;
  onmessage: ((event: MessageEvent<TranspileWorkerRequest>) => void) | null;
};

ctx.onmessage = (event: MessageEvent<TranspileWorkerRequest>) => {
  const message = event.data;
  if (!message || typeof message.id !== 'string') return;
  try {
    const result =
      message.kind === 'project' ? transpileProject(message.input) : transpileGraph(message.input);
    ctx.postMessage({ id: message.id, ok: true, result });
  } catch (err: unknown) {
    ctx.postMessage({
      id: message.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
