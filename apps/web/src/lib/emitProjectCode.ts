import type { ProjectSnapshot, TranspileResult } from '@vvs/graph-types';
import { classHomeGraphId, MAIN_GRAPH_CONTAINER_ID } from '@vvs/graph-types';
import { transpileProject, withProjectCodegenTarget } from '@/lib/codegen';

/**
 * Same emit path as Code | Files / useProjectTranspileResult.
 * One container graph → one module file (all classes); function tabs separate.
 */
export function emitProjectLikeCodePanel(
  snapshot: ProjectSnapshot,
  options?: {
    targetLanguage?: ProjectSnapshot['targetLanguage'];
    /** When true (default), emit `(x)` comments for language-gated ineffective imports. */
    emitUnsupportedComments?: boolean;
  }
): TranspileResult {
  const targetLanguage = options?.targetLanguage ?? snapshot.targetLanguage;
  return transpileProject(
    withProjectCodegenTarget(
      {
        projectDetails: snapshot.projectDetails,
        variables: snapshot.variables,
        projectEvents: snapshot.events,
        functions: snapshot.functions ?? [],
        documents: snapshot.documents ?? {},
        classes: snapshot.classes,
        activeClassId: snapshot.activeClassId,
        openTabs: snapshot.openTabs,
        targetLanguage,
        targetFileExtensions: snapshot.targetFileExtensions,
        environmentId: snapshot.environmentId,
        integration: snapshot.integration,
        emitUnsupportedComments: options?.emitUnsupportedComments !== false,
      },
      {
        targetLanguage,
        codegenCapabilities: snapshot.codegenCapabilities,
        syntaxPackLock: snapshot.syntaxPackLock,
      }
    )
  );
}

/** Map emitted paths → owning graph tab id (mirrors Code panel Files ownership). */
export function fileOwnersForEmitResult(
  snapshot: ProjectSnapshot,
  result: TranspileResult
): Record<string, string> {
  const classes = snapshot.classes ?? [];
  const functions = snapshot.functions ?? [];
  const moduleBase = (snapshot.projectDetails.moduleName || 'module').toLowerCase();
  const defaultHome =
    classes.map((c) => classHomeGraphId(c))[0] ?? MAIN_GRAPH_CONTAINER_ID;
  const owners: Record<string, string> = {};

  for (const file of result.files) {
    const base = file.path.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
    const lower = base.toLowerCase();
    const fn = functions.find((f) => f.name.toLowerCase() === lower);
    if (fn) {
      owners[file.path] = fn.id;
      continue;
    }
    if (lower === moduleBase) {
      owners[file.path] = defaultHome;
      continue;
    }
    owners[file.path] = defaultHome;
  }
  return owners;
}
