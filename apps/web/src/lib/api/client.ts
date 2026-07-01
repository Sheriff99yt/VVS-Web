import { ProjectSnapshot } from '@/types/projectSnapshot';
import { ApiError } from './errors';
import type { HealthResponse } from './mock';

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status);
  }
  return res.json() as Promise<T>;
}

export async function httpGetHealth(): Promise<HealthResponse> {
  const res = await fetch(`${getBaseUrl()}/health`);
  return parseJson<HealthResponse>(res);
}

export async function httpSaveProject(projectId: string, snapshot: ProjectSnapshot): Promise<boolean> {
  const res = await fetch(`${getBaseUrl()}/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  });
  await parseJson(res);
  return true;
}

export async function httpLoadProject(projectId: string): Promise<ProjectSnapshot | null> {
  const res = await fetch(`${getBaseUrl()}/api/projects/${encodeURIComponent(projectId)}`);
  if (res.status === 404) return null;
  return parseJson<ProjectSnapshot>(res);
}
