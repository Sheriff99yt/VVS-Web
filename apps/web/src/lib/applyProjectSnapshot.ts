import { ProjectSnapshot } from '@/types/projectSnapshot';
import { GraphTab, TargetLanguage, ClassSymbol } from '@/contexts/ProjectContext';
import { GraphVariable, ProjectEventDefinition, FunctionSymbol } from '@/types/graph';
import { GraphDocument } from '@/lib/graphDefaults';
import { InstalledLibraryEntry } from '@/types/libraryAsset';
import type { Dispatch, SetStateAction } from 'react';
import { createDefaultIntegration, normalizeProjectSnapshot, type ProjectIntegrationConfig, type SyntaxPackLock } from '@vvs/graph-types';

export interface SnapshotApplyTarget {
  setVariables: Dispatch<SetStateAction<GraphVariable[]>>;
  setEvents: Dispatch<SetStateAction<ProjectEventDefinition[]>>;
  setFunctions: Dispatch<SetStateAction<FunctionSymbol[]>>;
  setClasses: Dispatch<SetStateAction<ClassSymbol[]>>;
  setActiveClassId: Dispatch<SetStateAction<string>>;
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>;
  setActiveGraphTab: (tabId: string) => void;
  setProjectDetails: (details: { moduleName: string; extendsType: string; description: string }) => void;
  setTargetLanguage: (lang: TargetLanguage) => void;
  setAutoCompile: (value: boolean) => void;
  setAutoSave: (value: boolean) => void;
  setSelection: (selection: {
    type: 'node' | 'variable' | 'event' | 'function' | 'graph' | 'class';
    id: string | null;
  }) => void;
  loadDocuments: (documents: Record<string, GraphDocument>, activeTab: string) => void;
  setInstalledLibrary: Dispatch<SetStateAction<InstalledLibraryEntry[]>>;
  setEnvironmentLink: (id: string | undefined, version?: string) => void;
  setIntegration: Dispatch<SetStateAction<ProjectIntegrationConfig>>;
  setSyntaxPackLock?: Dispatch<SetStateAction<SyntaxPackLock | undefined>>;
}

export function applyProjectSnapshot(snapshot: ProjectSnapshot, target: SnapshotApplyTarget): void {
  const normalized = normalizeProjectSnapshot(snapshot) ?? snapshot;
  target.setVariables(normalized.variables);
  target.setEvents(normalized.events ?? []);
  target.setFunctions(normalized.functions);
  target.setClasses(normalized.classes);
  target.setActiveClassId(normalized.activeClassId);
  target.setOpenTabs(
    normalized.openTabs.length > 0 ? normalized.openTabs : [{ id: 'main', type: 'main', name: 'Main graph' }]
  );
  const activeTab = normalized.activeGraphTab || 'main';
  target.setActiveGraphTab(activeTab);
  target.setProjectDetails(normalized.projectDetails);
  target.setTargetLanguage(normalized.targetLanguage);
  target.setAutoCompile(normalized.autoCompile);
  target.setAutoSave(normalized.autoSave ?? false);
  target.setSelection({ type: 'graph', id: null });
  target.loadDocuments(normalized.documents as Record<string, GraphDocument>, activeTab);
  target.setInstalledLibrary(normalized.installedLibrary ?? []);
  target.setEnvironmentLink(normalized.environmentId, normalized.environmentVersion);
  target.setIntegration(
    normalized.integration ??
      createDefaultIntegration({
        environmentId: normalized.environmentId,
        environmentVersion: normalized.environmentVersion,
        moduleName: normalized.projectDetails.moduleName,
        defaultTarget: normalized.targetLanguage,
        adoptExisting: true,
      })
  );
  target.setSyntaxPackLock?.(normalized.syntaxPackLock);
}
