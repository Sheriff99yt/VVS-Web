import type { ProjectIntegrationConfig } from './integration';
import type { SyntaxPackLock } from './codegenTarget';
import type { GraphContainer, GraphTab } from './symbols';
import { classHomeGraphId } from './symbols';
import type { ProjectSnapshot } from './snapshot';

/** VVS overlay directory name inside an existing repo */
export const VVS_DIR = '.vvs';

export const VVS_PROJECT_FILE = `${VVS_DIR}/project.json`;
export const VVS_INTEGRATION_FILE = `${VVS_DIR}/integration.json`;
export const VVS_GRAPHS_DIR = `${VVS_DIR}/graphs`;
export const VVS_SYMBOLS_DIR = `${VVS_DIR}/symbols`;
export const VVS_SESSION_FILE = `${VVS_DIR}/session.json`;

export const VVS_GITIGNORE_LINES = [
  '.vvs/session.json',
  '.vvs/cache/',
];

export interface VvsProjectGraphManifest {
  /** Legacy v1 main graph path — read-only on load; not written for formatVersion 2. */
  main?: string;
  /** Container id → relative graph path under `.vvs/`. */
  containers?: Record<string, string>;
  functions: Record<string, string>;
}

export interface VvsProjectManifest {
  format: 'vvs.project';
  formatVersion: 1 | 2;
  name: string;
  description: string;
  defaultTarget: string;
  module: { name: string; extends: string };
  settings: { autoCompile: boolean; autoSave: boolean; activeClassId?: string };
  /** Virtual folders grouping classes — persisted for multi-container projects. */
  graphContainers?: GraphContainer[];
  graphs: VvsProjectGraphManifest;
  /** Pinned syntax pack versions per language family. */
  syntaxPackLock?: SyntaxPackLock;
  /** Per-family capability overrides for syntax pack resolution. */
  codegenCapabilities?: import('./codegenTarget').CodegenCapabilities;
}

export interface LoadedFolderProject {
  folderName: string;
  manifest: VvsProjectManifest;
  integration: ProjectIntegrationConfig;
}

/** Safe file stem for graph JSON files under `.vvs/graphs/`. */
export function sanitizeGraphFileStem(name: string): string {
  return name.replace(/^Function:\s*/i, '').replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Graph';
}

export function containerGraphRelativePath(containerId: string): string {
  return `graphs/containers/${sanitizeGraphFileStem(containerId)}.graph.json`;
}

export function functionGraphRelativePath(tab: GraphTab): string {
  const stem = sanitizeGraphFileStem(tab.name);
  return `graphs/functions/${stem}.graph.json`;
}

export function classGraphRelativePath(className: string): string {
  return `graphs/${sanitizeGraphFileStem(className)}.class.graph.json`;
}

/** Build the `graphs` section of `.vvs/project.json` from a persisted snapshot. */
export function buildFolderGraphManifest(snapshot: ProjectSnapshot): VvsProjectGraphManifest {
  const containers: Record<string, string> = {};
  const containerIds = new Set(snapshot.graphContainers.map((c) => c.id));

  for (const container of snapshot.graphContainers) {
    if (snapshot.documents[container.id]) {
      containers[container.id] = containerGraphRelativePath(container.id);
    }
  }

  const functions: Record<string, string> = {};
  for (const tab of snapshot.openTabs) {
    if (tab.type === 'function' && snapshot.documents[tab.id]) {
      functions[tab.id] = functionGraphRelativePath(tab);
    }
  }

  // Legacy class home graphs not represented as graphContainers entries.
  for (const cls of snapshot.classes) {
    const homeId = classHomeGraphId(cls);
    if (containerIds.has(homeId) || !snapshot.documents[homeId]) continue;
    containers[homeId] = classGraphRelativePath(cls.name);
  }

  return { containers, functions };
}
