import { ProjectSnapshot } from '@/types/projectSnapshot';
import {
  mockCompileProject,
  mockGetHealth,
  mockLoadProject,
  mockSaveProject,
  type HealthResponse,
} from './mock';
import { httpGetHealth, httpLoadProject, httpSaveProject } from './client';

export type ApiMode = 'mock' | 'http';

export function getApiMode(): ApiMode {
  return process.env.NEXT_PUBLIC_API_MODE === 'http' ? 'http' : 'mock';
}

const DEFAULT_PROJECT_ID = 'default';

export const VvsApi = {
  getHealth(): Promise<HealthResponse> {
    return getApiMode() === 'http' ? httpGetHealth() : mockGetHealth();
  },

  saveProject(snapshot: ProjectSnapshot, projectId = DEFAULT_PROJECT_ID): Promise<boolean> {
    return getApiMode() === 'http'
      ? httpSaveProject(projectId, snapshot)
      : mockSaveProject(snapshot);
  },

  loadProject(projectId = DEFAULT_PROJECT_ID): Promise<ProjectSnapshot | null> {
    return getApiMode() === 'http' ? httpLoadProject(projectId) : mockLoadProject();
  },

  compileProject(): Promise<{ ok: true }> {
    return mockCompileProject();
  },
};

export { ApiError } from './errors';
export type { HealthResponse };
