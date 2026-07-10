import {
  VVS_DIR,
  VVS_PROJECT_FILE,
  VVS_INTEGRATION_FILE,
  VVS_GITIGNORE_LINES,
  createDefaultIntegration,
  normalizeIntegrationConfig,
  syncIntegrationEnvironment,
  buildFolderGraphManifest,
  classGraphRelativePath,
  classHomeGraphId,
  type VvsProjectManifest,
  type ProjectIntegrationConfig,
  type ProjectSnapshot,
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
const CONTAINERS_DIR = `${GRAPHS_DIR}/containers`;
const FUNCTIONS_DIR = `${GRAPHS_DIR}/functions`;

function buildManifest(snapshot: ProjectSnapshot): VvsProjectManifest {
  return {
    format: 'vvs.project',
    formatVersion: 2,
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
    graphContainers: snapshot.graphContainers,
    graphs: buildFolderGraphManifest(snapshot),
    ...(snapshot.syntaxPackLock ? { syntaxPackLock: snapshot.syntaxPackLock } : {}),
    ...(snapshot.codegenCapabilities ? { codegenCapabilities: snapshot.codegenCapabilities } : {}),
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
  const integration = integrationRaw
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

  for (const [containerId, relPath] of Object.entries(manifest.graphs.containers ?? {})) {
    const doc = await readJsonFile<ProjectSnapshot['documents'][string]>(
      root,
      `${VVS_DIR}/${relPath}`
    );
    if (doc) documents[containerId] = doc;
  }

  if (manifest.graphs.main) {
    const mainDoc = await readJsonFile<ProjectSnapshot['documents'][string]>(
      root,
      `${VVS_DIR}/${manifest.graphs.main}`
    );
    if (mainDoc) documents.main = mainDoc;
  }

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
      const homeId = classHomeGraphId(cls);
      if (tabId === 'main' || documents[tabId] || documents[homeId]) continue;
      if (manifest.graphs.containers?.[homeId]) continue;
      const rel = classGraphRelativePath(cls.name);
      const doc = await readJsonFile<ProjectSnapshot['documents'][string]>(root, `${VVS_DIR}/${rel}`);
      if (doc) documents[tabId] = doc;
    }
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
    graphContainers: manifest.graphContainers,
    activeClassId:
      typeof manifest.settings.activeClassId === 'string'
        ? manifest.settings.activeClassId
        : undefined,
    variables,
    events,
    functions,
    targetLanguage: manifest.defaultTarget,
    autoCompile: manifest.settings.autoCompile,
    autoSave: manifest.settings.autoSave,
    documents,
    installedLibrary: [],
    environmentId: envId,
    environmentVersion: envVersion,
    integration,
    syntaxPackLock: manifest.syntaxPackLock,
    codegenCapabilities: manifest.codegenCapabilities,
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
  const graphManifest = manifest.graphs;
  const savedContainerIds = new Set(Object.keys(graphManifest.containers ?? {}));

  await ensureDirPath(root, GRAPHS_DIR);
  await ensureDirPath(root, CONTAINERS_DIR);
  await ensureDirPath(root, FUNCTIONS_DIR);
  await ensureDirPath(root, SYMBOLS_DIR);

  await writeJsonFile(root, VVS_PROJECT_FILE, manifest);
  await writeJsonFile(root, VVS_INTEGRATION_FILE, integration);

  for (const [containerId, relPath] of Object.entries(graphManifest.containers ?? {})) {
    const doc = persisted.documents[containerId];
    if (!doc) continue;
    await writeJsonFile(root, `${VVS_DIR}/${relPath}`, doc);
  }

  for (const [tabId, relPath] of Object.entries(graphManifest.functions)) {
    const doc = persisted.documents[tabId];
    if (!doc) continue;
    await writeJsonFile(root, `${VVS_DIR}/${relPath}`, doc);
  }

  for (const tab of persisted.openTabs) {
    if (tab.type !== 'class') continue;
    if (savedContainerIds.has(tab.id)) continue;
    const doc = persisted.documents[tab.id];
    if (!doc) continue;
    const rel = classGraphRelativePath(tab.name);
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
