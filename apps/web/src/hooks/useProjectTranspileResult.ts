'use client';

import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { transpileProject, withProjectCodegenTarget } from '@/lib/codegen';
import { getLinkedEnvironmentManifest } from '@/lib/environmentContext';
import { resolveTabCodegenSettings } from '@/hooks/useGraphCodegenSettings';
import type { TranspileResult } from '@/types/transpile';
import {
  classGraphHasDefineNodes,
  classHomeGraphId,
  containerEmitSubdir,
} from '@vvs/graph-types';
import { classContainerId } from '@/lib/classScope';
import { transpileGraph } from '@vvs/transpiler';
import type { CodegenContext } from '@vvs/transpiler';

const EMPTY_RESULT: TranspileResult = {
  language: 'python',
  files: [],
  sourceMap: {},
};

export interface ProjectTranspileBundle {
  result: TranspileResult;
  /** Maps emitted file path → graph tab id that produced it. */
  fileOwners: Record<string, string>;
}

function mergeProjectFiles(results: TranspileResult[]): TranspileResult {
  if (results.length === 0) return EMPTY_RESULT;
  const files = results.flatMap((r) => r.files);
  const sourceMap: TranspileResult['sourceMap'] = {};
  for (const result of results) {
    Object.assign(sourceMap, result.sourceMap);
  }
  return {
    language: results[0]!.language,
    files,
    sourceMap,
  };
}

/** Project-wide codegen output — each graph uses its own language and extension. */
export function useProjectTranspileResult(): ProjectTranspileBundle {
  const {
    variables,
    events,
    functions,
    classes,
    graphContainers,
    activeClassId,
    openTabs,
    projectDetails,
    environmentId,
    integration,
    syntaxPackLock,
    codegenCapabilities,
    targetLanguage,
    targetFileExtensions,
  } = useProject();
  const documents = useGraphDocuments();

  const projectDefaults = useMemo(
    () => ({ targetLanguage, targetFileExtensions }),
    [targetLanguage, targetFileExtensions]
  );

  const environmentManifest = useMemo(
    () => getLinkedEnvironmentManifest(environmentId),
    [environmentId]
  );

  return useMemo(() => {
    if (!documents) {
      return { result: { ...EMPTY_RESULT, language: targetLanguage }, fileOwners: {} };
    }

    const emittedTabIds = new Set<string>();
    const results: TranspileResult[] = [];
    const fileOwners: Record<string, string> = {};

    const emitSubdirForTab = (tabId: string, classId?: string) => {
      const cls =
        classId != null
          ? classes.find((c) => c.id === classId)
          : classes.find((c) => classHomeGraphId(c) === tabId);
      if (!cls) {
        const fn = functions.find((f) => f.id === tabId);
        const fnClass = fn ? classes.find((c) => c.id === (fn.classId ?? '')) : undefined;
        if (!fnClass) return '';
        const container = graphContainers.find((c) => c.id === classContainerId(fnClass));
        return container ? containerEmitSubdir(container) : '';
      }
      const container = graphContainers.find((c) => c.id === classContainerId(cls));
      return container ? containerEmitSubdir(container) : '';
    };

    const emitTab = (tabId: string, tabLabel: string, nodes: CodegenContext['nodes'], edges: CodegenContext['edges'], activeClass?: string) => {
      if (emittedTabIds.has(tabId)) return;
      emittedTabIds.add(tabId);
      const codegen = resolveTabCodegenSettings(tabId, documents, projectDefaults);
      const homeClass = classes.find((cls) => classHomeGraphId(cls) === tabId);
      const ctx: CodegenContext = {
        moduleName: homeClass?.name ?? projectDetails.moduleName,
        projectModuleName: projectDetails.moduleName,
        extendsType: homeClass?.extendsType ?? projectDetails.extendsType,
        targetLanguage: codegen.targetLanguage,
        targetFileExtensions: codegen.targetFileExtensions,
        variables,
        projectEvents: events,
        functions,
        nodes,
        edges,
        tabLabel,
        tabId,
        documents,
        classes,
        activeClassId: activeClass ?? activeClassId,
        environmentId,
        environmentManifest,
        integration,
        emitSubdir: emitSubdirForTab(tabId, activeClass ?? homeClass?.id),
      };
      const tabResult = transpileGraph(
        withProjectCodegenTarget(ctx, {
          targetLanguage: codegen.targetLanguage,
          codegenCapabilities,
          syntaxPackLock,
        })
      );
      for (const file of tabResult.files) {
        fileOwners[file.path] = tabId;
      }
      results.push(tabResult);
    };

    for (const cls of classes) {
      const homeId = classHomeGraphId(cls);
      const doc = documents[homeId];
      if (!doc || !classGraphHasDefineNodes(doc)) continue;
      const tab = openTabs.find((t) => t.id === homeId);
      emitTab(homeId, tab?.name ?? cls.name, doc.nodes, doc.edges, cls.id);
    }

    for (const func of functions) {
      const doc = documents[func.id];
      if (!doc) continue;
      const tab = openTabs.find((t) => t.id === func.id);
      emitTab(func.id, tab?.name ?? `Function: ${func.name}`, doc.nodes, doc.edges);
    }

    if (results.length === 0) {
      const fallback = transpileProject(
        withProjectCodegenTarget(
          {
            projectDetails,
            variables,
            projectEvents: events,
            functions,
            documents,
            classes,
            activeClassId,
            openTabs,
            targetLanguage,
            targetFileExtensions,
            environmentId,
            environmentManifest,
            integration,
          },
          { targetLanguage, codegenCapabilities, syntaxPackLock }
        )
      );
      for (const file of fallback.files) {
        fileOwners[file.path] = 'main';
      }
      return { result: fallback, fileOwners };
    }

    return { result: mergeProjectFiles(results), fileOwners };
  }, [
    documents,
    projectDetails,
    variables,
    events,
    functions,
    classes,
    graphContainers,
    activeClassId,
    openTabs,
    targetLanguage,
    targetFileExtensions,
    projectDefaults,
    environmentId,
    environmentManifest,
    integration,
    syntaxPackLock,
    codegenCapabilities,
  ]);
}
