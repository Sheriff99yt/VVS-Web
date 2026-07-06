import { ProjectSnapshot } from '@/types/projectSnapshot';
import { authHeaders } from '@/lib/auth/session';
import { ApiError } from './errors';
import type {
  HealthResponse,
  McpProbeResult,
  EnvironmentCatalogEntry,
  ProjectListEntry,
  ImportEnvironmentRequest,
} from './mock';

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
  const res = await fetch(`${getBaseUrl()}/health`, {
    headers: apiHeaders(),
  });
  return parseJson<HealthResponse>(res);
}

function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...authHeaders(), ...extra };
}

export async function httpSaveProject(projectId: string, snapshot: ProjectSnapshot): Promise<boolean> {
  const res = await fetch(`${getBaseUrl()}/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    headers: apiHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(snapshot),
  });
  await parseJson(res);
  return true;
}

export async function httpLoadProject(projectId: string): Promise<ProjectSnapshot | null> {
  const res = await fetch(`${getBaseUrl()}/api/projects/${encodeURIComponent(projectId)}`, {
    headers: apiHeaders(),
  });
  if (res.status === 404) return null;
  return parseJson<ProjectSnapshot>(res);
}

export async function httpListProjects(): Promise<ProjectListEntry[]> {
  const res = await fetch(`${getBaseUrl()}/api/projects`, {
    headers: apiHeaders(),
  });
  const data = await parseJson<{ projects: ProjectListEntry[] }>(res);
  return data.projects ?? [];
}

export async function httpCompileProject(projectId: string): Promise<{ ok: true }> {
  const res = await fetch(
    `${getBaseUrl()}/api/projects/${encodeURIComponent(projectId)}/compile`,
    { method: 'POST', headers: apiHeaders() }
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new ApiError(
        'Project not found on server — save the project first (Ctrl+S), then generate again.',
        404
      );
    }
    const detail = (await res.text()).trim();
    throw new ApiError(
      detail ? `Compile failed: ${detail}` : `Compile failed: ${res.status} ${res.statusText}`,
      res.status
    );
  }
  return res.json() as Promise<{ ok: true }>;
}

export async function httpImportEnvironment(
  request: ImportEnvironmentRequest
): Promise<EnvironmentCatalogEntry> {
  const res = await fetch(`${getBaseUrl()}/api/environments/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return parseJson<EnvironmentCatalogEntry>(res);
}

export async function httpProbeMcp(
  url: string,
  extraHeaders?: Record<string, string>
): Promise<McpProbeResult> {
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: extraHeaders,
    });
    window.clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const body = (await res.json()) as { tools?: unknown[]; status?: string };
        const toolCount = Array.isArray(body.tools) ? body.tools.length : undefined;
        return {
          ok: true,
          message: toolCount
            ? `MCP endpoint reachable — ${toolCount} tools reported.`
            : 'MCP endpoint responded successfully.',
          toolCount,
        };
      }
      return { ok: true, message: 'MCP endpoint responded successfully.' };
    }

    const base = getBaseUrl();
    const healthRes = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) });
    if (healthRes.ok) {
      return {
        ok: false,
        message: `Server is up but MCP returned ${res.status}. Confirm ${url} is the MCP SSE route.`,
      };
    }
    return { ok: false, message: `Server returned ${res.status} ${res.statusText}.` };
  } catch {
    return { ok: false, message: 'Could not reach MCP server at that URL.' };
  }
}

export async function httpListEnvironments(): Promise<EnvironmentCatalogEntry[]> {
  const res = await fetch(`${getBaseUrl()}/registry/environments`);
  return parseJson<EnvironmentCatalogEntry[]>(res);
}
