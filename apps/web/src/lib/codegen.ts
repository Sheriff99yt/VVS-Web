import type { CodegenContext } from '@vvs/transpiler';
import { transpileGraph, transpileGraphCode, transpileProject } from '@vvs/transpiler';
import type {
  CodegenCapabilities,
  CodegenTarget,
  SyntaxPackLock,
  TargetLanguage,
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

export function withProjectCodegenTarget(
  ctx: CodegenContext,
  options: ProjectCodegenOptions
): CodegenContext {
  const codegenTarget = resolveProjectCodegenTarget(options);
  return codegenTarget ? { ...ctx, codegenTarget } : ctx;
}
