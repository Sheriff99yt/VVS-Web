'use client';

import { useMemo, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useUiPreference } from '@/hooks/useUiPreference';
import { isCodePreviewPaused } from '@/lib/codePreviewPause';
import {
  emitProjectLikeCodePanel,
  fileOwnersForEmitResult,
} from '@/lib/emitProjectCode';
import type { TranspileResult } from '@/types/transpile';
import type { ProjectSnapshot } from '@/types/projectSnapshot';

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

/** Project-wide codegen — same path as Generate / extract script (U56). */
export function useProjectTranspileResult(): ProjectTranspileBundle {
  const {
    variables,
    events,
    functions,
    classes,
    activeClassId,
    openTabs,
    activeGraphTab,
    projectDetails,
    environmentId,
    environmentVersion,
    integration,
    syntaxPackLock,
    codegenCapabilities,
    targetLanguage,
    targetFileExtensions,
    autoCompile,
    autoSave,
    compileState,
    dirtyTabIds,
    workspaceFiles,
    graphContainers,
    installedLibrary,
  } = useProject();
  const documents = useGraphDocuments();
  const [showUnsupportedComments] = useUiPreference('showUnsupportedComments');
  const [showUserComments] = useUiPreference('showUserComments');
  /** Last live emit — returned while Auto generate is off and the graph is dirty. */
  const liveBundleRef = useRef<ProjectTranspileBundle | null>(null);

  const hasDirtyTabs = Object.keys(dirtyTabIds).length > 0;
  const paused = isCodePreviewPaused(autoCompile, compileState, hasDirtyTabs);

  return useMemo(() => {
    if (paused) {
      return (
        // eslint-disable-next-line react-hooks/refs
        liveBundleRef.current ?? {
          result: { ...EMPTY_RESULT, language: targetLanguage },
          fileOwners: {},
        }
      );
    }

    if (!documents) {
      const empty = { result: { ...EMPTY_RESULT, language: targetLanguage }, fileOwners: {} };
      // eslint-disable-next-line react-hooks/refs
      liveBundleRef.current = empty;
      return empty;
    }

    const snapshot: ProjectSnapshot = {
      version: 3,
      savedAt: new Date().toISOString(),
      projectDetails,
      classes,
      activeClassId,
      variables,
      events,
      functions,
      openTabs,
      activeGraphTab,
      targetLanguage,
      targetFileExtensions,
      autoCompile,
      autoSave,
      documents,
      environmentId,
      environmentVersion,
      integration,
      syntaxPackLock,
      codegenCapabilities,
      workspaceFiles,
      graphContainers,
      installedLibrary,
    };

    const result = emitProjectLikeCodePanel(snapshot, {
      emitUnsupportedComments: showUnsupportedComments,
      emitUserComments: showUserComments,
    });
    const bundle = { result, fileOwners: fileOwnersForEmitResult(snapshot, result) };
    // eslint-disable-next-line react-hooks/refs
    liveBundleRef.current = bundle;
    return bundle;
  }, [
    paused,
    documents,
    projectDetails,
    variables,
    events,
    functions,
    classes,
    activeClassId,
    openTabs,
    activeGraphTab,
    targetLanguage,
    targetFileExtensions,
    autoCompile,
    autoSave,
    environmentId,
    environmentVersion,
    integration,
    syntaxPackLock,
    codegenCapabilities,
    workspaceFiles,
    graphContainers,
    installedLibrary,
    showUnsupportedComments,
    showUserComments,
  ]);
}
