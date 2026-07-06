import {
  VVS_DIR,
  VVS_PROJECT_FILE,
  VVS_INTEGRATION_FILE,
  VVS_GITIGNORE_LINES,
  createDefaultIntegration,
  normalizeIntegrationConfig,
  syncIntegrationEnvironment,
  type VvsProjectManifest,
  type ProjectIntegrationConfig,
  type ProjectSnapshot,
  type GraphTab,
  normalizeProjectSnapshot,
  toPersistedSnapshot,
} from '@vvs/graph-types';
import { loadEnvironmentManifest } from '@vvs/environment-templates';
import {
  appendGitignoreLines,
  ensureDirPath,
  readJsonFile,
  writeJsonFile,
} from './fsAccess';

const SYMBOLS_DIR = `${VVS_DIR}/symbols`;
const GRAPHS_DIR = `${VVS_DIR}/graphs`;
const FUNCTIONS_DIR = `${VVS_DIR}/graphs/functions`;

function sanitizeFileStem(name: string): string {
  return name.replace(/^Function:\s*/i, '').replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Graph';
}

function functionGraphRelativePath(tab: GraphTab): string {
  const stem = sanitizeFileStem(tab.name);
  return `graphs/functions/${stem}.graph.json`;
}

function buildManifest(snapshot: ProjectSnapshot): VvsProjectManifest {
  const functionPaths: Record<string, string> = {};
  for (const tab of snapshot.openTabs) {
    if (tab.type === 'function') {
      functionPaths[tab.id] = functionGraphRelativePath(tab);
    }
  }
  return {
    format: 'vvs.project',
    formatVersion: 1,
    name: snapshot.projectDetails.moduleName || 'Untitled',
    description: snapshot.projectDetails.description,
    defaultTarget: snapshot.targetLanguage,
    module: {
      name: snapshot.projectDetails.moduleName,
      extends: snapshot.projectDetails.extendsType,
    },
    settings: {
      autoCompile: snapshot.autoCompile,
      autoSave: snapshot.autoSave ?? false,
      activeClassId: snapshot.activeClassId,
    },
    graphs: {
      main: 'graphs/main.graph.json',
      functions: functionPaths,
    },
    ...(snapshot.syntaxPackLock ? { syntaxPackLock: snapshot.syntaxPackLock } : {}),
  };
}

function integrationFromSnapshot(snapshot: ProjectSnapshot): ProjectIntegrationConfig {
  if (snapshot.integration) {
    const manifest = snapshot.environmentId
      ? loadEnvironmentManifest(snapshot.environmentId)
      : null;
    const hostPaths = manifest?.hostFiles?.map((h) => h.path) ?? [];
    return syncIntegrationEnvironment(
      snapshot.integration,
      snapshot.environmentId,
      snapshot.environmentVersion,
      hostPaths
    );
  }
  const manifest = snapshot.environmentId
    ? loadEnvironmentManifest(snapshot.environmentId)
    : null;
  return createDefaultIntegration({
    environmentId: snapshot.environmentId,
    environmentVersion: snapshot.environmentVersion,
    moduleName: snapshot.projectDetails.moduleName,
    defaultTarget: snapshot.targetLanguage,
    adoptExisting: true,
    hostFilePaths: manifest?.hostFiles?.map((h) => h.path) ?? [],
  });
}

export interface LoadedFolderProject {
  snapshot: ProjectSnapshot;
  manifest: VvsProjectManifest;
  integration: ProjectIntegrationConfig;
}

export async function loadProjectFromFolder(
  root: FileSystemDirectoryHandle
): Promise<LoadedFolderProject | null> {
  const manifest = await readJsonFile<VvsProjectManifest>(root, VVS_PROJECT_FILE);
  if (!manifest || manifest.format !== 'vvs.project') return null;

  const integrationRaw = await readJsonFile<unknown>(root, VVS_INTEGRATION_FILE);
  let integration = integrationRaw
    ? normalizeIntegrationConfig(integrationRaw)
    : createDefaultIntegration({
        moduleName: manifest.module.name,
        defaultTarget: manifest.defaultTarget as ProjectSnapshot['targetLanguage'],
        adoptExisting: true,
      });

  const variables =
    (await readJsonFile<ProjectSnapshot['variables']>(root, `${SYMBOLS_DIR}/variables.json`)) ?? [];
  const events =
    (await readJsonFile<ProjectSnapshot['events']>(root, `${SYMBOLS_DIR}/events.json`)) ?? [];
  const functions =
    (await readJsonFile<ProjectSnapshot['functions']>(root, `${SYMBOLS_DIR}/functions.json`)) ??
    [];
  const classes =
    (await readJsonFile<ProjectSnapshot['classes']>(root, `${SYMBOLS_DIR}/classes.json`)) ??
    undefined;

  const documents: ProjectSnapshot['documents'] = {};
  const mainDoc = await readJsonFile<ProjectSnapshot['documents'][string]>(
    root,
    `${VVS_DIR}/${manifest.graphs.main}`
  );
  if (mainDoc) documents.main = mainDoc;

  for (const [fnId, relPath] of Object.entries(manifest.graphs.functions ?? {})) {
    const doc = await readJsonFile<ProjectSnapshot['documents'][string]>(
      root,
      `${VVS_DIR}/${relPath}`
    );
    if (doc) documents[fnId] = doc;
  }

  if (classes) {
    for (const cls of classes) {
      const tabId = cls.graphTabId ?? cls.id;
      if (tabId === 'main' || documents[tabId]) continue;
      const rel = `graphs/${sanitizeFileStem(cls.name)}.class.graph.json`;
      const doc = await readJsonFile<ProjectSnapshot['documents'][string]>(root, `${VVS_DIR}/${rel}`);
      if (doc) documents[tabId] = doc;
    }
  }

  const openTabs: GraphTab[] = [{ id: 'main', type: 'main', name: 'Main graph' }];
  if (classes) {
    for (const cls of classes) {
      const tabId = cls.graphTabId ?? cls.id;
      if (tabId === 'main') continue;
      if (documents[tabId]) {
        openTabs.push({ id: tabId, type: 'class', name: cls.name });
      }
    }
  }
  for (const tab of Object.keys(documents)) {
    if (tab === 'main') continue;
    const fn = functions.find((f) => f.id === tab);
    openTabs.push({
      id: tab,
      type: 'function',
      name: fn ? `Function: ${fn.name}` : `Function: ${tab}`,
    });
  }

  const envId = integration.environmentId;
  const envVersion = integration.environmentVersion;

  const snapshot = normalizeProjectSnapshot({
    version: classes ? 3 : 2,
    savedAt: new Date().toISOString(),
    projectDetails: {
      moduleName: manifest.module.name,
      extendsType: manifest.module.extends,
      description: manifest.description,
    },
    classes,
    activeClassId:
      typeof manifest.settings.activeClassId === 'string'
        ? manifest.settings.activeClassId
        : undefined,
    variables,
    events,
    functions,
    openTabs,
    activeGraphTab: 'main',
    targetLanguage: manifest.defaultTarget,
    autoCompile: manifest.settings.autoCompile,
    autoSave: manifest.settings.autoSave,
    documents,
    installedLibrary: [],
    environmentId: envId,
    environmentVersion: envVersion,
    integration,
    syntaxPackLock: manifest.syntaxPackLock,
  });

  if (!snapshot) return null;
  return { snapshot, manifest, integration };
}

export async function saveProjectToFolder(
  root: FileSystemDirectoryHandle,
  snapshot: ProjectSnapshot
): Promise<void> {
  const persisted = toPersistedSnapshot(snapshot);
  const integration = integrationFromSnapshot(persisted);
  const manifest = buildManifest(persisted);

  await ensureDirPath(root, GRAPHS_DIR);
  await ensureDirPath(root, FUNCTIONS_DIR);
  await ensureDirPath(root, SYMBOLS_DIR);

  await writeJsonFile(root, VVS_PROJECT_FILE, manifest);
  await writeJsonFile(root, VVS_INTEGRATION_FILE, integration);

  if (persisted.documents.main) {
    await writeJsonFile(root, `${GRAPHS_DIR}/main.graph.json`, persisted.documents.main);
  }

  for (const tab of persisted.openTabs) {
    if (tab.type !== 'function' && tab.type !== 'class') continue;
    if (tab.id === 'main') continue;
    const doc = persisted.documents[tab.id];
    if (!doc) continue;
    const rel =
      tab.type === 'class'
        ? `graphs/${sanitizeFileStem(tab.name)}.class.graph.json`
        : functionGraphRelativePath(tab);
    await writeJsonFile(root, `${VVS_DIR}/${rel}`, doc);
  }

  await writeJsonFile(root, `${SYMBOLS_DIR}/variables.json`, persisted.variables);
  await writeJsonFile(root, `${SYMBOLS_DIR}/events.json`, persisted.events ?? []);
  await writeJsonFile(root, `${SYMBOLS_DIR}/functions.json`, persisted.functions);
  await writeJsonFile(root, `${SYMBOLS_DIR}/classes.json`, persisted.classes);
}

export async function createProjectInFolder(
  root: FileSystemDirectoryHandle,
  snapshot: ProjectSnapshot,
  options?: { adoptExisting?: boolean }
): Promise<void> {
  const manifest = snapshot.environmentId
    ? loadEnvironmentManifest(snapshot.environmentId)
    : null;
  const integration = createDefaultIntegration({
    environmentId: snapshot.environmentId,
    environmentVersion: snapshot.environmentVersion,
    moduleName: snapshot.projectDetails.moduleName,
    defaultTarget: snapshot.targetLanguage,
    adoptExisting: options?.adoptExisting ?? true,
    hostFilePaths: manifest?.hostFiles?.map((h) => h.path) ?? [],
  });
  const enriched: ProjectSnapshot = { ...snapshot, integration };
  await saveProjectToFolder(root, enriched);
  await appendGitignoreLines(root, VVS_GITIGNORE_LINES);
}
