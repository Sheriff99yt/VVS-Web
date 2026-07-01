import { ProjectSnapshot } from '@/types/projectSnapshot';
import { saveProjectToStore, loadProjectFromStore } from '@/lib/projectStore';

export interface HealthResponse {
  status: string;
  service: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGetHealth(): Promise<HealthResponse> {
  await delay(50);
  return { status: 'ok', service: 'vvs-mock' };
}

export async function mockSaveProject(
  snapshot: ProjectSnapshot,
  projectId = 'default'
): Promise<boolean> {
  await delay(400);
  saveProjectToStore(projectId, snapshot);
  return true;
}

export async function mockLoadProject(projectId = 'default'): Promise<ProjectSnapshot | null> {
  await delay(300);
  return loadProjectFromStore(projectId);
}

export async function mockCompileProject(): Promise<{ ok: true }> {
  await delay(800);
  return { ok: true };
}
