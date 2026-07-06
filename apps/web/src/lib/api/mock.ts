import { ProjectSnapshot } from '@/types/projectSnapshot';
import { loadProjectFromStore } from '@/lib/projectStore';
import {
  listAllEnvironments,
  type ProjectEnvironmentManifest,
} from '@vvs/environment-templates';

export interface HealthResponse {
  status: string;
  service: string;
  store?: 'memory' | 'postgres';
  auth?: 'dev' | 'required';
  userId?: string;
}

export interface EnvironmentCatalogEntry {
  id: string;
  version: string;
  displayName: string;
  description: string;
  defaultTarget: string;
  supportedTargets: string[];
  manifest: ProjectEnvironmentManifest;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGetHealth(): Promise<HealthResponse> {
  await delay(50);
  return { status: 'ok', service: 'vvs-mock', store: 'memory', auth: 'dev' };
}

export async function mockSaveProject(
  _snapshot: ProjectSnapshot,
  _projectId: string
): Promise<boolean> {
  await delay(400);
  // Local persistence is handled by saveProjectToStore in the UI — mock API is a no-op here
  // to avoid duplicate recent entries (especially the legacy "default" id).
  return true;
}

export async function mockLoadProject(projectId = 'default'): Promise<ProjectSnapshot | null> {
  await delay(300);
  return loadProjectFromStore(projectId);
}

export async function mockCompileProject(_projectId = 'default'): Promise<{ ok: true }> {
  await delay(800);
  return { ok: true };
}

export interface McpProbeResult {
  ok: boolean;
  message: string;
  toolCount?: number;
}

export interface ProjectListEntry {
  id: string;
  name: string;
  savedAt?: string;
}

export interface ImportEnvironmentRequest {
  format: 'openapi' | 'asyncapi';
  raw: unknown;
  id?: string;
  displayName?: string;
  defaultTarget?: string;
}

const IMPORTED_ENVS_KEY = 'vvs-imported-environments';

function readImportedEnvironments(): ProjectEnvironmentManifest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(IMPORTED_ENVS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ProjectEnvironmentManifest =>
        Boolean(item && typeof item === 'object' && typeof (item as ProjectEnvironmentManifest).id === 'string')
    );
  } catch {
    return [];
  }
}

function writeImportedEnvironments(manifests: ProjectEnvironmentManifest[]): void {
  localStorage.setItem(IMPORTED_ENVS_KEY, JSON.stringify(manifests));
}

export function loadStoredImportedEnvironments(): ProjectEnvironmentManifest[] {
  return readImportedEnvironments();
}

export async function mockProbeMcp(_url: string): Promise<McpProbeResult> {
  await delay(500);
  return {
    ok: false,
    message:
      'MCP is unavailable in offline mode. Set NEXT_PUBLIC_API_MODE=http and run the Go server for local MCP.',
  };
}

export async function mockListProjects(): Promise<ProjectListEntry[]> {
  await delay(80);
  return [];
}

export async function mockImportEnvironment(
  request: ImportEnvironmentRequest
): Promise<EnvironmentCatalogEntry> {
  await delay(200);
  const { buildEnvironmentManifest, validateEnvironmentManifest } = await import(
    '@vvs/environment-templates'
  );

  const manifest = buildEnvironmentManifest({
    id: request.id ?? 'env.imported.api',
    version: '1.0.0',
    displayName: request.displayName ?? 'Imported API',
    description: `Imported from ${request.format.toUpperCase()}`,
    defaultTarget: (request.defaultTarget as 'python') ?? 'python',
    supportedTargets: ['python', 'javascript'],
    openapi:
      request.format === 'openapi'
        ? (request.raw as import('@vvs/environment-templates').OpenApiDocument)
        : undefined,
    asyncapi:
      request.format === 'asyncapi'
        ? (request.raw as import('@vvs/environment-templates').AsyncApiDocument)
        : undefined,
  });
  const validated = validateEnvironmentManifest(manifest);
  if (!validated.ok) {
    throw new Error(validated.issues.map((i) => i.message).join('; '));
  }

  const stored = readImportedEnvironments().filter((m) => m.id !== validated.manifest.id);
  stored.push(validated.manifest);
  writeImportedEnvironments(stored);

  const m = validated.manifest;
  return {
    id: m.id,
    version: m.version,
    displayName: m.displayName,
    description: m.description,
    defaultTarget: m.defaultTarget,
    supportedTargets: m.supportedTargets,
    manifest: m,
  };
}

export async function mockListEnvironments(): Promise<EnvironmentCatalogEntry[]> {
  await delay(30);
  const byId = new Map<string, ProjectEnvironmentManifest>();
  for (const manifest of listAllEnvironments()) {
    byId.set(manifest.id, manifest);
  }
  for (const manifest of readImportedEnvironments()) {
    byId.set(manifest.id, manifest);
  }
  return [...byId.values()].map((manifest) => ({
    id: manifest.id,
    version: manifest.version,
    displayName: manifest.displayName,
    description: manifest.description,
    defaultTarget: manifest.defaultTarget,
    supportedTargets: manifest.supportedTargets,
    manifest,
  }));
}
