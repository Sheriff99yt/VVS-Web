import { ProjectSnapshot } from '@/types/projectSnapshot';
import { GraphTab, TargetLanguage } from '@/contexts/ProjectContext';
import { GraphVariable, ProjectEventDefinition, FunctionSymbol } from '@/types/graph';
import { GraphDocument } from '@/lib/graphDefaults';
import { InstalledLibraryEntry } from '@/types/libraryAsset';
import type { Dispatch, SetStateAction } from 'react';

export interface SnapshotApplyTarget {
  setVariables: Dispatch<SetStateAction<GraphVariable[]>>;
  setEvents: Dispatch<SetStateAction<ProjectEventDefinition[]>>;
  setFunctions: Dispatch<SetStateAction<FunctionSymbol[]>>;
  setOpenTabs: Dispatch<SetStateAction<GraphTab[]>>;
  setActiveGraphTab: (tabId: string) => void;
  setProjectDetails: (details: { moduleName: string; extendsType: string; description: string }) => void;
  setTargetLanguage: (lang: TargetLanguage) => void;
  setAutoCompile: (value: boolean) => void;
  setAutoSave: (value: boolean) => void;
  setSelection: (selection: {
    type: 'node' | 'variable' | 'event' | 'function' | 'graph';
    id: string | null;
  }) => void;
  loadDocuments: (documents: Record<string, GraphDocument>, activeTab: string) => void;
  setInstalledLibrary: Dispatch<SetStateAction<InstalledLibraryEntry[]>>;
}

export function applyProjectSnapshot(snapshot: ProjectSnapshot, target: SnapshotApplyTarget): void {
  target.setVariables(snapshot.variables);
  target.setEvents(snapshot.events ?? []);
  target.setFunctions(snapshot.functions);
  target.setOpenTabs(
    snapshot.openTabs.length > 0 ? snapshot.openTabs : [{ id: 'main', type: 'main', name: 'Main graph' }]
  );
  const activeTab = snapshot.activeGraphTab || 'main';
  target.setActiveGraphTab(activeTab);
  target.setProjectDetails(snapshot.projectDetails);
  target.setTargetLanguage(snapshot.targetLanguage);
  target.setAutoCompile(snapshot.autoCompile);
  target.setAutoSave(snapshot.autoSave ?? false);
  target.setSelection({ type: 'graph', id: null });
  target.loadDocuments(snapshot.documents as Record<string, GraphDocument>, activeTab);
  target.setInstalledLibrary(snapshot.installedLibrary ?? []);
}
