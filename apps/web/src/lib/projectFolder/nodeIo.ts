/**
 * Node/bun path I/O for `.vvs/` folder projects — used by the Test Projects
 * validation cycle (clear → seed → load-from-disk → emit). Mirrors
 * `loadProjectFromFolder` / `saveProjectToFolder` but with sync fs instead of
 * File System Access handles.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import {
  VVS_DIR,
  VVS_PROJECT_FILE,
  VVS_INTEGRATION_FILE,
  VVS_GITIGNORE_LINES,
  buildFolderGraphManifest,
  classGraphRelativePath,
  classHomeGraphId,
  createDefaultIntegration,
  functionGraphRelativePath,
  normalizeIntegrationConfig,
  normalizeProjectSnapshot,
  toPersistedSnapshot,
  type ProjectSnapshot,
  type VvsProjectManifest,
} from '@vvs/graph-types';

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function writeText(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

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
    ...(snapshot.codegenCapabilities
      ? { codegenCapabilities: snapshot.codegenCapabilities }
      : {}),
  };
}

/** Persist snapshot as a Node `.vvs/` folder project (mirrors saveProjectToFolder). */
export function saveProjectSnapshotToPath(projectDir: string, snapshot: ProjectSnapshot): void {
  const persisted = toPersistedSnapshot(snapshot);
  const integration =
    persisted.integration ??
    createDefaultIntegration({
      moduleName: persisted.projectDetails.moduleName,
      defaultTarget: persisted.targetLanguage,
      adoptExisting: true,
    });
  const enriched = { ...persisted, integration };
  const manifest = buildManifest(enriched);
  const graphs = manifest.graphs;
  const savedContainers = new Set(Object.keys(graphs.containers ?? {}));

  writeJson(join(projectDir, VVS_PROJECT_FILE), manifest);
  writeJson(join(projectDir, VVS_INTEGRATION_FILE), integration);
  writeText(join(projectDir, '.gitignore'), VVS_GITIGNORE_LINES.join('\n') + '\n');

  for (const [containerId, relPath] of Object.entries(graphs.containers ?? {})) {
    const doc = enriched.documents[containerId];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, relPath), doc);
  }

  const writtenFn = new Set<string>();
  for (const [tabId, relPath] of Object.entries(graphs.functions)) {
    const doc = enriched.documents[tabId];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, relPath), doc);
    writtenFn.add(tabId);
  }
  for (const func of enriched.functions) {
    const tabId = func.overloads[0]?.graphTabId ?? func.id;
    if (writtenFn.has(tabId)) continue;
    const doc = enriched.documents[tabId];
    if (!doc) continue;
    const rel = functionGraphRelativePath({
      id: tabId,
      type: 'function',
      name: func.name,
    });
    writeJson(join(projectDir, VVS_DIR, rel), doc);
    writtenFn.add(tabId);
  }

  for (const tab of enriched.openTabs) {
    if (tab.type !== 'class') continue;
    if (savedContainers.has(tab.id)) continue;
    const doc = enriched.documents[tab.id];
    if (!doc) continue;
    writeJson(join(projectDir, VVS_DIR, classGraphRelativePath(tab.name)), doc);
  }

  writeJson(join(projectDir, VVS_DIR, 'symbols', 'variables.json'), enriched.variables);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'events.json'), enriched.events ?? []);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'functions.json'), enriched.functions);
  writeJson(join(projectDir, VVS_DIR, 'symbols', 'classes.json'), enriched.classes);
}

/** Load snapshot from an on-disk `.vvs/` folder (mirrors loadProjectFromFolder). */
export function loadProjectSnapshotFromPath(projectDir: string): ProjectSnapshot | null {
  const manifest = readJson<VvsProjectManifest>(join(projectDir, VVS_PROJECT_FILE));
  if (!manifest || manifest.format !== 'vvs.project') return null;

  const integrationRaw = readJson<unknown>(join(projectDir, VVS_INTEGRATION_FILE));
  const integration = integrationRaw
    ? normalizeIntegrationConfig(integrationRaw)
    : createDefaultIntegration({
        moduleName: manifest.module.name,
        defaultTarget: manifest.defaultTarget as ProjectSnapshot['targetLanguage'],
        adoptExisting: true,
      });

  const variables =
    readJson<ProjectSnapshot['variables']>(join(projectDir, VVS_DIR, 'symbols', 'variables.json')) ??
    [];
  const events =
    readJson<ProjectSnapshot['events']>(join(projectDir, VVS_DIR, 'symbols', 'events.json')) ?? [];
  const functions =
    readJson<ProjectSnapshot['functions']>(join(projectDir, VVS_DIR, 'symbols', 'functions.json')) ??
    [];
  const classes =
    readJson<ProjectSnapshot['classes']>(join(projectDir, VVS_DIR, 'symbols', 'classes.json')) ??
    undefined;

  const documents: ProjectSnapshot['documents'] = {};

  for (const [containerId, relPath] of Object.entries(manifest.graphs.containers ?? {})) {
    const doc = readJson<ProjectSnapshot['documents'][string]>(join(projectDir, VVS_DIR, relPath));
    if (doc) documents[containerId] = doc;
  }

  if (manifest.graphs.main) {
    const mainDoc = readJson<ProjectSnapshot['documents'][string]>(
      join(projectDir, VVS_DIR, manifest.graphs.main)
    );
    if (mainDoc) documents.main = mainDoc;
  }

  for (const [fnId, relPath] of Object.entries(manifest.graphs.functions ?? {})) {
    const doc = readJson<ProjectSnapshot['documents'][string]>(join(projectDir, VVS_DIR, relPath));
    if (doc) documents[fnId] = doc;
  }

  if (classes) {
    for (const cls of classes) {
      const tabId = cls.graphTabId ?? cls.id;
      const homeId = classHomeGraphId(cls);
      if (tabId === 'main' || documents[tabId] || documents[homeId]) continue;
      if (manifest.graphs.containers?.[homeId]) continue;
      const rel = classGraphRelativePath(cls.name);
      const doc = readJson<ProjectSnapshot['documents'][string]>(join(projectDir, VVS_DIR, rel));
      if (doc) documents[tabId] = doc;
    }
  }

  return normalizeProjectSnapshot({
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
    environmentId: integration.environmentId,
    environmentVersion: integration.environmentVersion,
    integration,
    syntaxPackLock: manifest.syntaxPackLock,
    codegenCapabilities: manifest.codegenCapabilities,
  });
}
