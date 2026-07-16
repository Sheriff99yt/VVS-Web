'use client';

import { useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useUiPreference } from '@/hooks/useUiPreference';
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
    workspaceFiles,
    graphContainers,
    installedLibrary,
  } = useProject();
  const documents = useGraphDocuments();
  const [showUnsupportedComments] = useUiPreference('showUnsupportedComments');

  return useMemo(() => {
    if (!documents) {
      return { result: { ...EMPTY_RESULT, language: targetLanguage }, fileOwners: {} };
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
    });
    return { result, fileOwners: fileOwnersForEmitResult(snapshot, result) };
  }, [
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
  ]);
}
