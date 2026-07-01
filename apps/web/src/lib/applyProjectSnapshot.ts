import { ProjectSnapshot } from '@/types/projectSnapshot';
import { GraphTab, TargetLanguage } from '@/contexts/ProjectContext';
import { GraphVariable } from '@/types/graph';
import { GraphDocument } from '@/lib/graphDefaults';
import { InstalledLibraryEntry } from '@/types/libraryAsset';

export interface SnapshotApplyTarget {
  setVariables: (variables: GraphVariable[]) => void;
  setFunctions: (functions: { id: string; name: string }[]) => void;
  setOpenTabs: (tabs: GraphTab[]) => void;
  setActiveGraphTab: (tabId: string) => void;
  setProjectDetails: (details: { moduleName: string; extendsType: string; description: string }) => void;
  setTargetLanguage: (lang: TargetLanguage) => void;
  setAutoCompile: (value: boolean) => void;
  setSelection: (selection: { type: 'node' | 'variable' | 'graph'; id: string | null }) => void;
  loadDocuments: (documents: Record<string, GraphDocument>, activeTab: string) => void;
  setInstalledLibrary: (entries: InstalledLibraryEntry[]) => void;
}

export function applyProjectSnapshot(snapshot: ProjectSnapshot, target: SnapshotApplyTarget): void {
  target.setVariables(snapshot.variables);
  target.setFunctions(snapshot.functions);
  target.setOpenTabs(
    snapshot.openTabs.length > 0 ? snapshot.openTabs : [{ id: 'main', type: 'main', name: 'Main graph' }]
  );
  const activeTab = snapshot.activeGraphTab || 'main';
  target.setActiveGraphTab(activeTab);
  target.setProjectDetails(snapshot.projectDetails);
  target.setTargetLanguage(snapshot.targetLanguage);
  target.setAutoCompile(snapshot.autoCompile);
  target.setSelection({ type: 'graph', id: null });
  target.loadDocuments(snapshot.documents, activeTab);
  target.setInstalledLibrary(snapshot.installedLibrary ?? []);
}
