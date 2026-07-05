import type { ProjectIntegrationConfig } from './integration';
import type { SyntaxPackLock } from './codegenTarget';

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

export interface VvsProjectManifest {
  format: 'vvs.project';
  formatVersion: 1;
  name: string;
  description: string;
  defaultTarget: string;
  module: { name: string; extends: string };
  settings: { autoCompile: boolean; autoSave: boolean };
  graphs: {
    main: string;
    functions: Record<string, string>;
  };
  /** Pinned syntax pack versions per language family. */
  syntaxPackLock?: SyntaxPackLock;
}

export interface LoadedFolderProject {
  folderName: string;
  manifest: VvsProjectManifest;
  integration: ProjectIntegrationConfig;
}
