import type { GraphDocument, GraphTab, VariableSymbol, ProjectEventDefinition, FunctionSymbol, TargetLanguage, ClassSymbol } from './symbols';
import type { ProjectIntegrationConfig } from './integration';
import { normalizeIntegrationConfig } from './integration';
import type { SyntaxPackLock } from './codegenTarget';
import { normalizeFunctionSymbols, normalizeVariableSymbols, createClassSymbol, normalizeClassSymbols, MAIN_CLASS_ID, normalizeGraphContainers, MAIN_GRAPH_CONTAINER_ID, PROJECT_MAP_CONTAINER_NAME, containerTabFor, ensureContainerDocuments, classHomeGraphId, createProgramEntryEvent } from './symbols';
import type { GraphContainer } from './symbols';
import type { GraphNode } from './nodes';
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

export interface ProjectSnapshotV3 {
  version: 3;
  projectId?: string;
  savedAt: string;
  projectDetails: { moduleName: string; extendsType: string; description: string };
  classes: ClassSymbol[];
  activeClassId: string;
  /** Virtual folders grouping classes in the project tree — organizational only. */
  graphContainers: GraphContainer[];
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

export type ProjectSnapshot = ProjectSnapshotV3;

const TARGET_LANGUAGES: TargetLanguage[] = ['python', 'javascript', 'cpp', 'verse', 'json'];

export function defaultTabMetadata(
  tabType: 'main' | 'function' | 'macro' | 'class' | 'graph' | 'container',
  tabName: string
): import('./symbols').GraphTabMetadata {
  const cleanName = tabName.replace(/^Function:\s*/, '').replace(/^Macro:\s*/, '');
  return {
    moduleName:
      tabType === 'main' || tabType === 'class'
        ? 'PlayerController'
        : tabType === 'container'
          ? cleanName || PROJECT_MAP_CONTAINER_NAME
          : cleanName || 'Graph',
    extendsType: '',
    description: '',
  };
}

function stampSymbolsWithClassId<T extends { classId?: string }>(
  items: T[],
  classId: string
): T[] {
  return items.map((item) => ({ ...item, classId: item.classId ?? classId }));
}

function upgradeSnapshotToV3(
  base: Omit<ProjectSnapshotV3, 'version' | 'classes' | 'activeClassId' | 'graphContainers'>,
  raw: Record<string, unknown>
): ProjectSnapshotV3 {
  const moduleName = base.projectDetails.moduleName;
  const extendsType = base.projectDetails.extendsType;

  let classes: ClassSymbol[];
  let activeClassId: string;

  if (raw.version === 3 && Array.isArray(raw.classes)) {
    classes = normalizeClassSymbols(raw.classes);
    activeClassId =
      typeof raw.activeClassId === 'string' && raw.activeClassId.length > 0
        ? raw.activeClassId
        : classes[0]?.id ?? MAIN_CLASS_ID;
  } else {
    classes = [
      createClassSymbol(moduleName, {
        id: MAIN_CLASS_ID,
        extendsType: extendsType || undefined,
        graphTabId: 'main',
      }),
    ];
    activeClassId = MAIN_CLASS_ID;
  }

  if (classes.length === 0) {
    classes = [
      createClassSymbol(moduleName, {
        id: MAIN_CLASS_ID,
        extendsType: extendsType || undefined,
        graphTabId: 'main',
      }),
    ];
    activeClassId = MAIN_CLASS_ID;
  }

  if (!classes.some((c) => c.id === activeClassId)) {
    activeClassId = classes[0]!.id;
  }

  const graphContainers = normalizeGraphContainers(raw.graphContainers);
  const stampedClasses = classes.map((cls) => ({
    ...cls,
    containerId: cls.containerId ?? MAIN_GRAPH_CONTAINER_ID,
  }));

  const defaultClassId =
    stampedClasses.find((c) => c.id === MAIN_CLASS_ID)?.id ?? stampedClasses[0]!.id;

  return {
    ...base,
    version: 3,
    classes: stampedClasses,
    activeClassId,
    graphContainers,
    variables: stampSymbolsWithClassId(base.variables, defaultClassId),
    functions: stampSymbolsWithClassId(base.functions, defaultClassId),
    events: stampSymbolsWithClassId(base.events, defaultClassId),
  };
}

function createStarterClassDefineNode(cls: ClassSymbol): GraphNode {
  const execIn = { id: 'exec_in', label: '', type: 'execution' as const };
  const execOut = { id: 'exec_out', label: '', type: 'execution' as const };
  return {
    id: `class-define-${cls.id}`,
    type: 'vvs_standard_node',
    position: { x: 80, y: 40 },
    data: {
      label: `Class ${cls.name}`,
      category: 'Project',
      kindId: 'class_define',
      inputs: [execIn],
      outputs: [execOut],
      inlineValues: {},
      properties: {
        name: cls.name,
        extendsType: cls.extendsType ?? '',
        visibility: cls.visibility ?? 'public',
      },
    },
  };
}

function createEntryMemberDefineNode(entry: ProjectEventDefinition): GraphNode {
  const execIn = { id: 'exec_in', label: '', type: 'execution' as const };
  const execOut = { id: 'exec_out', label: '', type: 'execution' as const };
  return {
    id: `entry-member-${entry.id}`,
    type: 'vvs_standard_node',
    position: { x: 280, y: 40 },
    data: {
      label: 'Declare start',
      category: 'Events',
      kindId: 'event_member_define',
      inputs: [execIn],
      outputs: [execOut],
      inlineValues: {},
      properties: {
        symbolId: entry.id,
        name: entry.name,
        eventId: entry.id,
        eventName: 'On start',
      },
    },
  };
}

function createEntryHandlerDefineNode(entry: ProjectEventDefinition): GraphNode {
  const execOut = { id: 'exec_out', label: '', type: 'execution' as const };
  return {
    id: `entry-handler-${entry.id}`,
    type: 'vvs_standard_node',
    position: { x: 80, y: 160 },
    data: {
      label: 'On start',
      category: 'Events',
      kindId: 'event_define',
      inputs: [],
      outputs: [execOut],
      inlineValues: {},
      properties: {
        eventId: entry.id,
        eventName: 'start',
        symbolId: entry.id,
      },
    },
  };
}

/** Bootstrap class home graph with explicit program entry (no hidden on_start). */
export function createClassHomeBootstrap(
  cls: ClassSymbol,
  entry?: ProjectEventDefinition
): { entry: ProjectEventDefinition; document: GraphDocument } {
  const programEntry =
    entry ?? createProgramEntryEvent({ id: `evt-start-${cls.id}`, classId: cls.id });
  const classDefine = createStarterClassDefineNode(cls);
  const entryMember = createEntryMemberDefineNode(programEntry);
  const entryHandler = createEntryHandlerDefineNode(programEntry);
  return {
    entry: programEntry,
    document: {
      nodes: [classDefine, entryMember, entryHandler],
      edges: [
        {
          id: `edge-class-entry-member-${cls.id}`,
          source: classDefine.id,
          target: entryMember.id,
          sourceHandle: 'exec_out',
          targetHandle: 'exec_in',
          type: 'vvs_standard_edge',
          data: { pinType: 'execution' },
        },
      ],
    },
  };
}

export function createEmptyProjectSnapshot(): ProjectSnapshot {
  const moduleName = 'Untitled';
  const mainClass = createClassSymbol(moduleName, {
    id: MAIN_CLASS_ID,
    containerId: MAIN_GRAPH_CONTAINER_ID,
  });
  const { entry, document } = createClassHomeBootstrap(mainClass);
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    projectDetails: { moduleName, extendsType: '', description: '' },
    classes: [mainClass],
    activeClassId: MAIN_CLASS_ID,
    graphContainers: normalizeGraphContainers(undefined),
    variables: [],
    events: [entry],
    functions: [],
    openTabs: [
      { id: MAIN_GRAPH_CONTAINER_ID, type: 'container', name: PROJECT_MAP_CONTAINER_NAME },
    ],
    activeGraphTab: MAIN_GRAPH_CONTAINER_ID,
    targetLanguage: 'python',
    autoCompile: true,
    autoSave: false,
    documents: {
      [MAIN_GRAPH_CONTAINER_ID]: document,
    },
    installedLibrary: [],
  };
}

function asGraphDocument(value: unknown, tabId: string, tabName: string): GraphDocument | null {
  if (!value || typeof value !== 'object') return null;
  const doc = value as Record<string, unknown>;
  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.edges)) return null;
  const tabType =
    tabId === 'main'
      ? 'main'
      : tabId === MAIN_GRAPH_CONTAINER_ID
        ? 'container'
        : 'function';
  return {
    nodes: doc.nodes as GraphDocument['nodes'],
    edges: doc.edges as GraphDocument['edges'],
    metadata:
      (doc.metadata as GraphDocument['metadata']) ??
      defaultTabMetadata(tabType, tabName),
  };
}

function ensureContainerOpenTabs(containers: GraphContainer[], openTabs: GraphTab[]): GraphTab[] {
  const tabs = [...openTabs];
  for (const container of containers) {
    if (!tabs.some((tab) => tab.id === container.id)) {
      tabs.push(containerTabFor(container));
    } else {
      const idx = tabs.findIndex((tab) => tab.id === container.id);
      if (idx >= 0 && tabs[idx]!.type !== 'container') {
        tabs[idx] = containerTabFor(container);
      }
    }
  }
  const mainGraphIdx = tabs.findIndex((tab) => tab.id === MAIN_GRAPH_CONTAINER_ID);
  if (mainGraphIdx > 0) {
    const [mainGraphTab] = tabs.splice(mainGraphIdx, 1);
    tabs.unshift(mainGraphTab);
  }
  return tabs;
}

function migratePhantomProjectMapClass(snapshot: ProjectSnapshot): ProjectSnapshot {
  const phantom = snapshot.classes.find(
    (cls) =>
      cls.graphTabId === 'project-map' ||
      (cls.name === PROJECT_MAP_CONTAINER_NAME &&
        cls.id !== MAIN_CLASS_ID &&
        cls.graphTabId !== 'main')
  );
  if (!phantom) return snapshot;

  const phantomTabId = phantom.graphTabId ?? 'project-map';
  const phantomDoc = snapshot.documents[phantomTabId];
  const mainGraphDoc = snapshot.documents[MAIN_GRAPH_CONTAINER_ID];
  const mainGraphEmpty =
    !mainGraphDoc || (mainGraphDoc.nodes.length === 0 && mainGraphDoc.edges.length === 0);

  const documents = { ...snapshot.documents };
  if (phantomDoc && mainGraphEmpty) {
    documents[MAIN_GRAPH_CONTAINER_ID] = {
      nodes: [...phantomDoc.nodes],
      edges: [...phantomDoc.edges],
      metadata: phantomDoc.metadata,
    };
  }
  delete documents[phantomTabId];

  const classes = snapshot.classes.filter((cls) => cls.id !== phantom.id);
  const openTabs = snapshot.openTabs.filter(
    (tab) => tab.id !== phantomTabId && tab.classId !== phantom.id
  );

  let activeGraphTab = snapshot.activeGraphTab;
  if (activeGraphTab === phantomTabId) {
    activeGraphTab = MAIN_GRAPH_CONTAINER_ID;
  }

  return { ...snapshot, classes, openTabs, documents, activeGraphTab };
}

function migrateClassDocumentsToHomeGraph(snapshot: ProjectSnapshot): ProjectSnapshot {
  const documents = { ...snapshot.documents };
  const classes = snapshot.classes.map((cls) => {
    const home = classHomeGraphId(cls);
    const legacy = cls.graphTabId;
    if (legacy && documents[legacy]) {
      const homeDoc = documents[home];
      const legacyDoc = documents[legacy];
      const homeEmpty = !homeDoc || (homeDoc.nodes.length === 0 && homeDoc.edges.length === 0);
      if (legacy !== home && (homeEmpty || legacy === 'main')) {
        documents[home] = legacyDoc;
      }
      if (legacy !== home) {
        delete documents[legacy];
      }
    }
    return { ...cls, graphTabId: undefined };
  });

  if (documents.main) {
    const mainCls = classes.find((c) => c.id === MAIN_CLASS_ID) ?? classes[0];
    if (mainCls) {
      const home = classHomeGraphId(mainCls);
      const homeDoc = documents[home];
      const homeEmpty = !homeDoc || (homeDoc.nodes.length === 0 && homeDoc.edges.length === 0);
      if (homeEmpty) {
        documents[home] = documents.main;
      }
    }
    delete documents.main;
  }

  const openTabs = snapshot.openTabs.filter(
    (tab) => tab.type !== 'class' && !(tab.type === 'main' && tab.id === 'main')
  );

  let activeGraphTab = snapshot.activeGraphTab;
  if (activeGraphTab === 'main' || snapshot.openTabs.some((t) => t.id === activeGraphTab && t.type === 'class')) {
    const activeClass =
      snapshot.classes.find((c) => c.id === snapshot.activeClassId) ?? snapshot.classes[0];
    activeGraphTab = activeClass ? classHomeGraphId(activeClass) : MAIN_GRAPH_CONTAINER_ID;
  }

  return { ...snapshot, classes, documents, openTabs, activeGraphTab };
}

function finalizeGraphContainerSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  let next = migratePhantomProjectMapClass(snapshot);
  next = migrateClassDocumentsToHomeGraph(next);
  const graphContainers = normalizeGraphContainers(next.graphContainers);
  const documents = ensureContainerDocuments(graphContainers, next.documents);
  let openTabs = ensureContainerOpenTabs(graphContainers, next.openTabs);

  let activeGraphTab = next.activeGraphTab;
  if (!documents[activeGraphTab]) {
    activeGraphTab = documents[MAIN_GRAPH_CONTAINER_ID]
      ? MAIN_GRAPH_CONTAINER_ID
      : Object.keys(documents)[0] ?? MAIN_GRAPH_CONTAINER_ID;
  }

  return {
    ...next,
    graphContainers,
    documents,
    openTabs,
    activeGraphTab,
  };
}

export function normalizeProjectSnapshot(raw: unknown): ProjectSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const version = value.version;
  if (version !== 1 && version !== 2 && version !== 3) return null;

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

  const rawDetails =
    value.projectDetails && typeof value.projectDetails === 'object'
      ? (value.projectDetails as Record<string, unknown>)
      : null;

  let openTabs = Array.isArray(value.openTabs) ? (value.openTabs as GraphTab[]) : defaults.openTabs;
  let activeGraphTab =
    typeof value.activeGraphTab === 'string' ? value.activeGraphTab : defaults.activeGraphTab;

  // Drop legacy auxiliary canvas tabs (type: 'graph') — replaced by organizational containers.
  const auxiliaryTabIds = new Set(
    openTabs.filter((tab) => tab.type === 'graph').map((tab) => tab.id)
  );
  if (auxiliaryTabIds.size > 0) {
    openTabs = openTabs.filter((tab) => tab.type !== 'graph');
    for (const tabId of auxiliaryTabIds) {
      delete documents[tabId];
    }
    if (auxiliaryTabIds.has(activeGraphTab)) {
      activeGraphTab = MAIN_GRAPH_CONTAINER_ID;
    }
  }

  const targetLanguage = TARGET_LANGUAGES.includes(value.targetLanguage as TargetLanguage)
    ? (value.targetLanguage as TargetLanguage)
    : defaults.targetLanguage;

  const functions = normalizeFunctionSymbols(value.functions);

  const v2Base = {
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
  };

  const migrated = finalizeGraphContainerSnapshot(
    migrateTextShapedAlignment(upgradeSnapshotToV3(v2Base, value))
  );
  return migrated;
}

export function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  return normalizeProjectSnapshot(value) !== null;
}

export function toPersistedSnapshot(snapshot: ProjectSnapshot): ProjectSnapshotV3 {
  return { ...snapshot, version: 3 };
}
