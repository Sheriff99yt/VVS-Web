import { useCallback, useEffect, useReducer, useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { useGraphWorkspace } from '@/contexts/GraphWorkspaceContext';
import { useGraphDocuments } from '@/hooks/useGraphDocuments';
import { isOrgOnlyGraphTab } from '@/lib/graphTabs';
import { defaultTabMetadata } from '@/lib/graphDefaults';
import {
  resolveGraphCodegenSettings,
  type ProjectCodegenDefaults,
  type TargetLanguage,
} from '@vvs/graph-types';
import type { GraphTab } from '@/contexts/ProjectContext';

export function useProjectCodegenDefaults(): ProjectCodegenDefaults {
  const { targetLanguage, targetFileExtensions } = useProject();
  return useMemo(
    () => ({ targetLanguage, targetFileExtensions }),
    [targetLanguage, targetFileExtensions]
  );
}

export function resolveTabCodegenSettings(
  tabId: string,
  documents: Record<string, import('@/lib/graphDefaults').GraphDocument> | null,
  defaults: ProjectCodegenDefaults
) {
  const metadata = documents?.[tabId]?.metadata;
  return resolveGraphCodegenSettings(metadata, defaults);
}

function documentTabType(tabType: GraphTab['type'] | undefined): 'main' | 'function' | 'container' {
  if (tabType === 'main' || tabType === 'class') return 'main';
  if (tabType === 'container') return 'container';
  return 'function';
}

/** Resolved codegen target for the active graph tab (or an explicit tab id). */
export function useActiveGraphCodegenSettings(tabId?: string | null) {
  const projectDefaults = useProjectCodegenDefaults();
  const { activeGraphTab, openTabs, markTabDirty, setCompileState, classes } = useProject();
  const documents = useGraphDocuments();
  const {
    getActiveTabMetadata,
    updateActiveTabMetadata,
    patchAllDocuments,
    subscribeMetadata,
  } = useGraphWorkspace();
  const resolvedTabId = tabId ?? activeGraphTab;
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const isOrgGraph = isOrgOnlyGraphTab(resolvedTabId, classes);

  useEffect(() => subscribeMetadata(() => bump()), [subscribeMetadata]);

  const settings = useMemo(() => {
    if (isOrgGraph) {
      return resolveGraphCodegenSettings(undefined, projectDefaults);
    }
    const metadata =
      documents?.[resolvedTabId]?.metadata ??
      (resolvedTabId === activeGraphTab ? getActiveTabMetadata() ?? undefined : undefined);
    return resolveGraphCodegenSettings(metadata, projectDefaults);
  }, [
    isOrgGraph,
    documents,
    resolvedTabId,
    activeGraphTab,
    getActiveTabMetadata,
    projectDefaults,
    bump,
  ]);

  const markCodegenDirty = useCallback(() => {
    if (!isOrgGraph) {
      markTabDirty(resolvedTabId);
      setCompileState('dirty');
    }
  }, [isOrgGraph, markTabDirty, resolvedTabId, setCompileState]);

  const applyMetadataPatch = useCallback(
    (patch: Partial<import('@/lib/graphDefaults').GraphTabMetadata>) => {
      if (isOrgGraph) return;
      if (resolvedTabId === activeGraphTab) {
        updateActiveTabMetadata(patch);
        return;
      }
      const tabMeta = openTabs.find((tab) => tab.id === resolvedTabId);
      patchAllDocuments?.(
        (docs) => {
          const doc = docs[resolvedTabId];
          if (!doc) return docs;
          const base =
            doc.metadata ??
            defaultTabMetadata(
              documentTabType(tabMeta?.type),
              tabMeta?.name ?? 'Graph',
              projectDefaults
            );
          return {
            ...docs,
            [resolvedTabId]: {
              ...doc,
              metadata: { ...base, ...patch },
            },
          };
        },
        { affectedTabIds: [resolvedTabId] }
      );
    },
    [
      isOrgGraph,
      resolvedTabId,
      activeGraphTab,
      updateActiveTabMetadata,
      patchAllDocuments,
      openTabs,
      projectDefaults,
    ]
  );

  const setGraphTargetLanguage = useCallback(
    (language: TargetLanguage) => {
      if (isOrgGraph) return;
      const nextExtension = resolveGraphCodegenSettings(
        { moduleName: '', extendsType: '', description: '', targetLanguage: language },
        projectDefaults
      ).targetFileExtension;
      applyMetadataPatch({
        targetLanguage: language,
        targetFileExtension: nextExtension,
      });
      markCodegenDirty();
      bump();
    },
    [isOrgGraph, projectDefaults, applyMetadataPatch, markCodegenDirty]
  );

  const setGraphLanguageWithExtension = useCallback(
    (language: TargetLanguage, extension: string) => {
      if (isOrgGraph) return;
      applyMetadataPatch({
        targetLanguage: language,
        targetFileExtension: extension,
      });
      markCodegenDirty();
      bump();
    },
    [isOrgGraph, applyMetadataPatch, markCodegenDirty]
  );

  const setGraphTargetFileExtension = useCallback(
    (extension: string) => {
      if (isOrgGraph) return;
      applyMetadataPatch({
        targetLanguage: settings.targetLanguage,
        targetFileExtension: extension,
      });
      markCodegenDirty();
      bump();
    },
    [isOrgGraph, settings.targetLanguage, applyMetadataPatch, markCodegenDirty]
  );

  const resetGraphCodegenToProjectDefaults = useCallback(() => {
    if (isOrgGraph) return;
    applyMetadataPatch({
      targetLanguage: undefined,
      targetFileExtension: undefined,
    });
    markCodegenDirty();
    bump();
  }, [isOrgGraph, applyMetadataPatch, markCodegenDirty]);

  const usesProjectDefaults = useMemo(() => {
    if (isOrgGraph) return true;
    const metadata =
      documents?.[resolvedTabId]?.metadata ??
      (resolvedTabId === activeGraphTab ? getActiveTabMetadata() ?? undefined : undefined);
    return !metadata?.targetLanguage && !metadata?.targetFileExtension;
  }, [isOrgGraph, documents, resolvedTabId, activeGraphTab, getActiveTabMetadata, bump]);

  return {
    ...settings,
    isOrgGraph,
    usesProjectDefaults,
    setGraphTargetLanguage,
    setGraphTargetFileExtension,
    setGraphLanguageWithExtension,
    resetGraphCodegenToProjectDefaults,
    projectDefaults,
  };
}
