import * as vscode from 'vscode';
import {
  VVS_DIR, VVS_PROJECT_FILE, VVS_INTEGRATION_FILE,
  normalizeProjectSnapshot, normalizeIntegrationConfig, createDefaultIntegration,
  type ProjectSnapshot, type VvsProjectManifest,
} from '@vvs/graph-types';
import { registerPack, type SyntaxPackManifest } from '@vvs/syntax-packs';

function safeRelative(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/');
  if (parts.some((part) => !part || part === '.' || part === '..') || path.startsWith('/')) {
    throw new Error(`Unsafe project path: ${path}`);
  }
  return parts.join('/');
}

export function projectUri(root: vscode.Uri, relative: string): vscode.Uri {
  return vscode.Uri.joinPath(root, ...safeRelative(relative).split('/'));
}

async function readJson<T>(root: vscode.Uri, path: string): Promise<T | undefined> {
  try {
    const bytes = await vscode.workspace.fs.readFile(projectUri(root, path));
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') return undefined;
    throw error;
  }
}

/** Mirrors the web folder loader using VS Code workspace.fs, including remote workspaces. */
export async function loadWorkspaceProject(root: vscode.Uri): Promise<ProjectSnapshot> {
  const manifest = await readJson<VvsProjectManifest>(root, VVS_PROJECT_FILE);
  if (!manifest || manifest.format !== 'vvs.project' || ![1, 2].includes(manifest.formatVersion)) {
    throw new Error('Open a folder containing a supported .vvs/project.json.');
  }
  const rawIntegration = await readJson<unknown>(root, VVS_INTEGRATION_FILE);
  const integration = rawIntegration ? normalizeIntegrationConfig(rawIntegration) :
    createDefaultIntegration({ moduleName: manifest.module.name, defaultTarget: manifest.defaultTarget as ProjectSnapshot['targetLanguage'], adoptExisting: true });
  const symbols = async <T>(name: string, fallback: T): Promise<T> =>
    (await readJson<T>(root, `${VVS_DIR}/symbols/${name}.json`)) ?? fallback;
  const [variables, events, functions, classes] = await Promise.all([
    symbols('variables', [] as ProjectSnapshot['variables']),
    symbols('events', [] as ProjectSnapshot['events']),
    symbols('functions', [] as ProjectSnapshot['functions']),
    symbols('classes', undefined as ProjectSnapshot['classes'] | undefined),
  ]);
  const documents: ProjectSnapshot['documents'] = {};
  const paths = {
    ...(manifest.graphs.containers ?? {}),
    ...manifest.graphs.functions,
    ...(manifest.graphs.main ? { main: manifest.graphs.main } : {}),
  };
  for (const [id, relative] of Object.entries(paths)) {
    const graph = await readJson<ProjectSnapshot['documents'][string]>(root, `${VVS_DIR}/${relative}`);
    if (!graph) throw new Error(`Missing graph document: ${relative}`);
    documents[id] = graph;
  }
  const snapshot = normalizeProjectSnapshot({
    version: classes ? 3 : 2,
    savedAt: new Date().toISOString(),
    projectDetails: { moduleName: manifest.module.name, extendsType: manifest.module.extends, description: manifest.description },
    classes, graphContainers: manifest.graphContainers, activeClassId: manifest.settings.activeClassId,
    variables, events, functions, targetLanguage: manifest.defaultTarget,
    autoCompile: manifest.settings.autoCompile, autoSave: manifest.settings.autoSave,
    documents, installedLibrary: [], integration,
    environmentId: integration.environmentId, environmentVersion: integration.environmentVersion,
    syntaxPackLock: manifest.syntaxPackLock, codegenCapabilities: manifest.codegenCapabilities,
  });
  if (!snapshot) throw new Error('The VVS project format could not be loaded.');
  try {
    const entries = await vscode.workspace.fs.readDirectory(projectUri(root, `${VVS_DIR}/packs`));
    for (const [name, kind] of entries) {
      if (kind !== vscode.FileType.File || !name.endsWith('.json')) continue;
      const pack = await readJson<SyntaxPackManifest>(root, `${VVS_DIR}/packs/${name}`);
      if (pack) registerPack(pack);
    }
  } catch (error) {
    if (!(error instanceof vscode.FileSystemError && error.code === 'FileNotFound')) throw error;
  }
  return snapshot;
}
