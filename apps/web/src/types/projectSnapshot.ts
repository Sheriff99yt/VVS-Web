import { GraphVariable, VVSNode, VVSEdge } from '@/types/graph';
import { GraphTab, TargetLanguage } from '@/contexts/ProjectContext';
import { GraphDocument, defaultTabMetadata } from '@/lib/graphDefaults';
import { InstalledLibraryEntry } from '@/types/libraryAsset';
import { createEmptyProjectSnapshot } from '@/lib/emptyProject';

const TARGET_LANGUAGES: TargetLanguage[] = ['python', 'javascript', 'cpp', 'verse', 'json'];

function asGraphDocument(value: unknown, tabId: string, tabName: string): GraphDocument | null {
  if (!value || typeof value !== 'object') return null;
  const doc = value as Record<string, unknown>;
  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) return null;
  const tabType = tabId === 'main' ? 'main' : 'function';
  return {
    nodes: doc.nodes as VVSNode[],
    edges: doc.edges as VVSEdge[],
    metadata:
      (doc.metadata as GraphDocument['metadata']) ??
      defaultTabMetadata(tabType, tabName),
  };
}

export interface ProjectSnapshot {
  version: 1;
  projectId?: string;
  savedAt: string;
  projectDetails: { moduleName: string; extendsType: string; description: string };
  variables: GraphVariable[];
  functions: { id: string; name: string }[];
  openTabs: GraphTab[];
  activeGraphTab: string;
  targetLanguage: TargetLanguage;
  autoCompile: boolean;
  documents: Record<string, GraphDocument>;
  installedLibrary: InstalledLibraryEntry[];
}

export function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  return normalizeProjectSnapshot(value) !== null;
}

/** Repair legacy or partial saves so the editor always receives a valid snapshot. */
export function normalizeProjectSnapshot(raw: unknown): ProjectSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) return null;

  const defaults = createEmptyProjectSnapshot();
  const documents: Record<string, GraphDocument> = { ...defaults.documents };

  if (value.documents && typeof value.documents === 'object' && value.documents !== null) {
    for (const [id, doc] of Object.entries(value.documents as Record<string, unknown>)) {
      const normalized = asGraphDocument(doc, id, id);
      if (normalized) documents[id] = normalized;
    }
  } else if (Array.isArray(value.nodes) || Array.isArray(value.edges)) {
    documents.main = {
      nodes: Array.isArray(value.nodes) ? (value.nodes as VVSNode[]) : [],
      edges: Array.isArray(value.edges) ? (value.edges as VVSEdge[]) : [],
      metadata: defaultTabMetadata('main', 'Main graph'),
    };
  }

  if (!documents.main) {
    documents.main = defaults.documents.main;
  }

  const rawDetails =
    value.projectDetails && typeof value.projectDetails === 'object'
      ? (value.projectDetails as Record<string, unknown>)
      : null;

  let openTabs = Array.isArray(value.openTabs) ? (value.openTabs as GraphTab[]) : defaults.openTabs;
  let activeGraphTab =
    typeof value.activeGraphTab === 'string' ? value.activeGraphTab : defaults.activeGraphTab;

  if (!openTabs.some((tab) => tab.id === 'main')) {
    openTabs = [{ id: 'main', type: 'main', name: 'Main graph' }, ...openTabs];
  }
  if (!documents[activeGraphTab]) {
    activeGraphTab = 'main';
  }

  const targetLanguage = TARGET_LANGUAGES.includes(value.targetLanguage as TargetLanguage)
    ? (value.targetLanguage as TargetLanguage)
    : defaults.targetLanguage;

  return {
    version: 1,
    projectId: typeof value.projectId === 'string' ? value.projectId : undefined,
    savedAt: typeof value.savedAt === 'string' ? value.savedAt : new Date().toISOString(),
    projectDetails: {
      moduleName:
        typeof rawDetails?.moduleName === 'string'
          ? rawDetails.moduleName
          : defaults.projectDetails.moduleName,
      extendsType:
        typeof rawDetails?.extendsType === 'string' ? rawDetails.extendsType : '',
      description:
        typeof rawDetails?.description === 'string' ? rawDetails.description : '',
    },
    variables: Array.isArray(value.variables) ? (value.variables as GraphVariable[]) : [],
    functions: Array.isArray(value.functions)
      ? (value.functions as { id: string; name: string }[])
      : [],
    openTabs,
    activeGraphTab,
    targetLanguage,
    autoCompile: typeof value.autoCompile === 'boolean' ? value.autoCompile : defaults.autoCompile,
    documents,
    installedLibrary: Array.isArray(value.installedLibrary)
      ? (value.installedLibrary as InstalledLibraryEntry[])
      : [],
  };
}
