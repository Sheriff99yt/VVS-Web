import type { GraphDocument, GraphTab, VariableSymbol, ProjectEventDefinition, FunctionSymbol, TargetLanguage } from './symbols';
import type { ProjectIntegrationConfig } from './integration';
import { normalizeIntegrationConfig } from './integration';
import type { SyntaxPackLock } from './codegenTarget';
import { normalizeFunctionSymbols, normalizeVariableSymbols } from './symbols';
import { migrateTextShapedAlignment } from './fidelityMigration';

export interface InstalledLibraryEntry {
  assetId: string;
  installedAt: string;
  linkedGraphId?: string;
  /** Installed environment template version for drift detection */
  environmentVersion?: string;
}

export interface ProjectSnapshotV1 {
  version: 1;
  projectId?: string;
  savedAt: string;
  projectDetails: { moduleName: string; extendsType: string; description: string };
  variables: VariableSymbol[];
  events: ProjectEventDefinition[];
  functions: { id: string; name: string }[];
  openTabs: GraphTab[];
  activeGraphTab: string;
  targetLanguage: TargetLanguage;
  autoCompile: boolean;
  autoSave: boolean;
  documents: Record<string, GraphDocument>;
  installedLibrary: InstalledLibraryEntry[];
}

export interface ProjectSnapshotV2 {
  version: 2;
  projectId?: string;
  savedAt: string;
  projectDetails: { moduleName: string; extendsType: string; description: string };
  variables: VariableSymbol[];
  events: ProjectEventDefinition[];
  functions: FunctionSymbol[];
  openTabs: GraphTab[];
  activeGraphTab: string;
  targetLanguage: TargetLanguage;
  autoCompile: boolean;
  autoSave: boolean;
  documents: Record<string, GraphDocument>;
  installedLibrary: InstalledLibraryEntry[];
  /** Linked project environment template pack id */
  environmentId?: string;
  /** Template version at link time — for upgrade/drift detection */
  environmentVersion?: string;
  /** Codegen output paths and host file policies — persisted in .vvs/integration.json */
  integration?: ProjectIntegrationConfig;
  /** Pinned syntax pack versions per language family — persisted in .vvs/project.json */
  syntaxPackLock?: SyntaxPackLock;
}

export type ProjectSnapshot = ProjectSnapshotV2;

const TARGET_LANGUAGES: TargetLanguage[] = ['python', 'javascript', 'cpp', 'verse', 'json'];

export function defaultTabMetadata(
  tabType: 'main' | 'function' | 'macro',
  tabName: string
): import('./symbols').GraphTabMetadata {
  const cleanName = tabName.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '');
  return {
    moduleName: tabType === 'main' ? 'PlayerController' : cleanName || 'Graph',
    extendsType: '',
    description: '',
  };
}

export function createEmptyProjectSnapshot(): ProjectSnapshot {
  const moduleName = 'Untitled';
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    projectDetails: { moduleName, extendsType: '', description: '' },
    variables: [],
    events: [],
    functions: [],
    openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
    activeGraphTab: 'main',
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      main: {
        nodes: [
          {
            id: 'node-on-start',
            type: 'vvs_standard_node',
            position: { x: 80, y: 80 },
            data: {
              label: 'On Start',
              category: 'Events',
              kindId: 'event_on_start',
              inputs: [],
              outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
              inlineValues: {},
            },
          },
        ],
        edges: [],
        metadata: defaultTabMetadata('main', 'Main graph'),
      },
    },
    installedLibrary: [],
  };
}

function asGraphDocument(value: unknown, tabId: string, tabName: string): GraphDocument | null {
  if (!value || typeof value !== 'object') return null;
  const doc = value as Record<string, unknown>;
  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) return null;
  const tabType = tabId === 'main' ? 'main' : 'function';
  return {
    nodes: doc.nodes as GraphDocument['nodes'],
    edges: doc.edges as GraphDocument['edges'],
    metadata:
      (doc.metadata as GraphDocument['metadata']) ??
      defaultTabMetadata(tabType, tabName),
  };
}

export function normalizeProjectSnapshot(raw: unknown): ProjectSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const version = value.version;
  if (version !== 1 && version !== 2) return null;

  const defaults = createEmptyProjectSnapshot();
  const documents: Record<string, GraphDocument> = { ...defaults.documents };

  if (value.documents && typeof value.documents === 'object' && value.documents !== null) {
    for (const [id, doc] of Object.entries(value.documents as Record<string, unknown>)) {
      const normalized = asGraphDocument(doc, id, id);
      if (normalized) documents[id] = normalized;
    }
  } else if (Array.isArray(value.nodes) || Array.isArray(value.edges)) {
    documents.main = {
      nodes: Array.isArray(value.nodes) ? (value.nodes as GraphDocument['nodes']) : [],
      edges: Array.isArray(value.edges) ? (value.edges as GraphDocument['edges']) : [],
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

  const functions = normalizeFunctionSymbols(value.functions);

  return migrateTextShapedAlignment({
    version: 2,
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
    variables: normalizeVariableSymbols(value.variables),
    events: Array.isArray(value.events) ? (value.events as ProjectEventDefinition[]) : [],
    functions,
    openTabs,
    activeGraphTab,
    targetLanguage,
    autoCompile: typeof value.autoCompile === 'boolean' ? value.autoCompile : defaults.autoCompile,
    autoSave: typeof value.autoSave === 'boolean' ? value.autoSave : defaults.autoSave,
    documents,
    installedLibrary: Array.isArray(value.installedLibrary)
      ? (value.installedLibrary as InstalledLibraryEntry[])
      : [],
    environmentId: typeof value.environmentId === 'string' ? value.environmentId : undefined,
    environmentVersion:
      typeof value.environmentVersion === 'string' ? value.environmentVersion : undefined,
    integration: value.integration
      ? normalizeIntegrationConfig(value.integration)
      : undefined,
    syntaxPackLock:
      value.syntaxPackLock && typeof value.syntaxPackLock === 'object'
        ? (value.syntaxPackLock as SyntaxPackLock)
        : undefined,
  });
}

export function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  return normalizeProjectSnapshot(value) !== null;
}

export function toPersistedSnapshot(snapshot: ProjectSnapshot): ProjectSnapshotV2 {
  return { ...snapshot, version: 2 };
}
