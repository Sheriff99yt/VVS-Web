'use client';

import { useEffect, useRef, useState } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { useUiPreference } from '@/hooks/useUiPreference';
import { isCodePreviewPaused } from '@/lib/codePreviewPause';
import {
  emitProjectLikeCodePanelOffThread,
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
  const [bundle, setBundle] = useState<ProjectTranspileBundle>(() => ({
    result: { ...EMPTY_RESULT, language: targetLanguage },
    fileOwners: {},
  }));

  const hasDirtyTabs = Object.keys(dirtyTabIds).length > 0;
  const paused = isCodePreviewPaused(autoCompile, compileState, hasDirtyTabs);

  useEffect(() => {
    if (paused) {
      setBundle(
        liveBundleRef.current ?? {
          result: { ...EMPTY_RESULT, language: targetLanguage },
          fileOwners: {},
        }
      );
      return;
    }

    if (!documents) {
      const empty = { result: { ...EMPTY_RESULT, language: targetLanguage }, fileOwners: {} };
      liveBundleRef.current = empty;
      setBundle(empty);
      return;
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

    let cancelled = false;
    void emitProjectLikeCodePanelOffThread(snapshot, {
      emitUnsupportedComments: showUnsupportedComments,
      emitUserComments: showUserComments,
    }).then((result) => {
      if (cancelled) return;
      const next = { result, fileOwners: fileOwnersForEmitResult(snapshot, result) };
      liveBundleRef.current = next;
      setBundle(next);
    });
    return () => {
      cancelled = true;
    };
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

  return bundle;
}
