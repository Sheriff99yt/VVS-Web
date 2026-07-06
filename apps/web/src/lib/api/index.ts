import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  mockCompileProject,
  mockGetHealth,
  mockLoadProject,
  mockProbeMcp,
  mockSaveProject,
  mockListEnvironments,
  mockListProjects,
  mockImportEnvironment,
  loadStoredImportedEnvironments,
  type HealthResponse,
  type McpProbeResult,
  type EnvironmentCatalogEntry,
  type ProjectListEntry,
  type ImportEnvironmentRequest,
} from './mock';
import { authHeaders } from '@/lib/auth/session';
import {
  httpGetHealth,
  httpLoadProject,
  httpProbeMcp,
  httpSaveProject,
  httpListEnvironments,
  httpListProjects,
  httpCompileProject,
  httpImportEnvironment,
} from './client';
import { registerEnvironmentManifest } from '@vvs/environment-templates';

export type ApiMode = 'mock' | 'http';

export function getApiMode(): ApiMode {
  return process.env.NEXT_PUBLIC_API_MODE === 'http' ? 'http' : 'mock';
}

const DEFAULT_PROJECT_ID = 'default';

/** Register user-imported environments from localStorage (mock/offline). */
export function bootstrapImportedEnvironments(): void {
  for (const manifest of loadStoredImportedEnvironments()) {
    registerEnvironmentManifest(manifest);
  }
}

export const VvsApi = {
  getHealth(): Promise<HealthResponse> {
    return getApiMode() === 'http' ? httpGetHealth() : mockGetHealth();
  },

  saveProject(snapshot: ProjectSnapshot, projectId = DEFAULT_PROJECT_ID): Promise<boolean> {
    return getApiMode() === 'http'
      ? httpSaveProject(projectId, snapshot)
      : mockSaveProject(snapshot, projectId);
  },

  loadProject(projectId = DEFAULT_PROJECT_ID): Promise<ProjectSnapshot | null> {
    return getApiMode() === 'http' ? httpLoadProject(projectId) : mockLoadProject(projectId);
  },

  listProjects(): Promise<ProjectListEntry[]> {
    return getApiMode() === 'http' ? httpListProjects() : mockListProjects();
  },

  compileProject(projectId = DEFAULT_PROJECT_ID): Promise<{ ok: true }> {
    return getApiMode() === 'http'
      ? httpCompileProject(projectId)
      : mockCompileProject(projectId);
  },

  probeMcp(url: string): Promise<McpProbeResult> {
    return getApiMode() === 'http'
      ? httpProbeMcp(url, authHeaders())
      : mockProbeMcp(url);
  },

  listEnvironments(): Promise<EnvironmentCatalogEntry[]> {
    return getApiMode() === 'http' ? httpListEnvironments() : mockListEnvironments();
  },

  importEnvironment(request: ImportEnvironmentRequest): Promise<EnvironmentCatalogEntry> {
    return getApiMode() === 'http' ? httpImportEnvironment(request) : mockImportEnvironment(request);
  },
};

export { ApiError } from './errors';
export type {
  HealthResponse,
  McpProbeResult,
  EnvironmentCatalogEntry,
  ProjectListEntry,
  ImportEnvironmentRequest,
};
