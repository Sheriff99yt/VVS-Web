import type { CodegenContext, ProjectTranspileInput } from '@vvs/transpiler';
import { transpileGraph, transpileGraphCode, transpileProject } from '@vvs/transpiler';
import type {
  CodegenCapabilities,
  CodegenTarget,
  SyntaxPackLock,
  TargetLanguage,
  TranspileResult,
} from '@vvs/graph-types';
import { resolveCodegenTarget } from '@vvs/graph-types';

export type { CodegenContext } from '@vvs/transpiler';
export type { CodegenTarget } from '@vvs/graph-types';
export { transpileGraph, transpileGraphCode, transpileProject };

export interface ProjectCodegenOptions {
  targetLanguage: TargetLanguage;
  codegenCapabilities?: CodegenCapabilities;
  syntaxPackLock?: SyntaxPackLock;
}

export function resolveProjectCodegenTarget(options: ProjectCodegenOptions): CodegenTarget | null {
  return resolveCodegenTarget(options.targetLanguage, {
    capabilities: options.codegenCapabilities,
    syntaxPackLock: options.syntaxPackLock,
  });
}

export function withProjectCodegenTarget<T>(
  ctx: T,
  options: ProjectCodegenOptions
): T & { codegenTarget?: CodegenTarget } {
  const codegenTarget = resolveProjectCodegenTarget(options);
  return (codegenTarget ? { ...ctx, codegenTarget } : ctx) as T & { codegenTarget?: CodegenTarget };
}


export type TranspileOffThreadOptions = {
  /** Skip Worker construction — used by tests and as the documented fallback. */
  forceMainThread?: boolean;
};

type TranspileJob =
  | { kind: 'project'; input: ProjectTranspileInput }
  | { kind: 'graph'; input: CodegenContext };

type WorkerRequest = { id: string } & TranspileJob;
type WorkerResponse =
  | { id: string; ok: true; result: TranspileResult }
  | { id: string; ok: false; error: string };

/** Same pipeline the worker runs — snapshot in / files out. */
export function executeTranspileJob(job: TranspileJob): TranspileResult {
  return job.kind === 'project' ? transpileProject(job.input) : transpileGraph(job.input);
}

let transpileWorker: Worker | null = null;
let transpileWorkerFailed = false;

function getTranspileWorker(): Worker | null {
  if (transpileWorkerFailed) return null;
  if (typeof Worker === 'undefined') return null;
  if (transpileWorker) return transpileWorker;
  try {
    transpileWorker = new Worker(new URL('./transpileWorker.ts', import.meta.url), { type: 'module' });
    return transpileWorker;
  } catch {
    transpileWorkerFailed = true;
    transpileWorker = null;
    return null;
  }
}

function postTranspileJob(worker: Worker, job: TranspileJob): Promise<TranspileResult> {
  const id = `transpile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return new Promise<TranspileResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(new Error('transpile worker timed out'));
    }, 30000);

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      if (!event.data || event.data.id !== id) return;
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      if (event.data.ok) resolve(event.data.result);
      else reject(new Error(event.data.error));
    };
    const onError = (event: ErrorEvent) => {
      clearTimeout(timer);
      worker.removeEventListener('message', onMessage);
      worker.removeEventListener('error', onError);
      reject(event.error instanceof Error ? event.error : new Error(event.message));
    };

    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError);
    const request: WorkerRequest = { id, ...job };
    worker.postMessage(request);
  });
}

async function runTranspileOffThread(job: TranspileJob, options?: TranspileOffThreadOptions): Promise<TranspileResult> {
  if (options?.forceMainThread) return executeTranspileJob(job);
  const worker = getTranspileWorker();
  if (!worker) return executeTranspileJob(job);
  try {
    return await postTranspileJob(worker, job);
  } catch {
    return executeTranspileJob(job);
  }
}

/** Off-main-thread `transpileProject`. Falls back to the sync pipeline when Worker is unavailable. */
export function transpileProjectOffThread(
  input: ProjectTranspileInput,
  options?: TranspileOffThreadOptions
): Promise<TranspileResult> {
  return runTranspileOffThread({ kind: 'project', input }, options);
}

/** Off-main-thread `transpileGraph`. Falls back to the sync pipeline when Worker is unavailable. */
export function transpileGraphOffThread(
  input: CodegenContext,
  options?: TranspileOffThreadOptions
): Promise<TranspileResult> {
  return runTranspileOffThread({ kind: 'graph', input }, options);
}

export async function transpileGraphCodeOffThread(
  input: CodegenContext,
  options?: TranspileOffThreadOptions
): Promise<string> {
  const result = await transpileGraphOffThread(input, options);
  return result.files[0]?.content ?? '';
}
