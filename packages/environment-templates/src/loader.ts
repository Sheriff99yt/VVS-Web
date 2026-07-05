import type { ProjectEnvironmentManifest } from './types';
import { validateEnvironmentManifest } from './validate';
import { BUILTIN_MANIFEST_SOURCES } from './manifests/builtins';

type GlobLoader = (
  pattern: string,
  options: { eager: true }
) => Record<string, ProjectEnvironmentManifest | { default: ProjectEnvironmentManifest }>;

function manifestFromModule(
  mod: ProjectEnvironmentManifest | { default: ProjectEnvironmentManifest }
): ProjectEnvironmentManifest | undefined {
  const raw = 'default' in mod && mod.default ? mod.default : (mod as ProjectEnvironmentManifest);
  const validated = validateEnvironmentManifest(raw);
  return validated.ok ? validated.manifest : undefined;
}

function loadBuiltinManifestsFromGlob(): Record<string, ProjectEnvironmentManifest> | null {
  const glob = (import.meta as ImportMeta & { glob?: GlobLoader }).glob;
  if (typeof glob !== 'function') return null;

  const modules = glob('./manifests/*.json', { eager: true });
  const out: Record<string, ProjectEnvironmentManifest> = {};
  for (const [path, mod] of Object.entries(modules)) {
    if (path.endsWith('/builtins.ts')) continue;
    const manifest = manifestFromModule(mod);
    if (manifest) out[manifest.id] = manifest;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function loadBuiltinManifestsFromSources(): Record<string, ProjectEnvironmentManifest> {
  const out: Record<string, ProjectEnvironmentManifest> = {};
  for (const raw of BUILTIN_MANIFEST_SOURCES) {
    const validated = validateEnvironmentManifest(raw);
    if (validated.ok) out[validated.manifest.id] = validated.manifest;
  }
  return out;
}

const BUILTIN_MANIFESTS: Record<string, ProjectEnvironmentManifest> =
  loadBuiltinManifestsFromGlob() ?? loadBuiltinManifestsFromSources();

const REGISTERED_MANIFESTS: Record<string, ProjectEnvironmentManifest> = {};

export function listBuiltinEnvironments(): ProjectEnvironmentManifest[] {
  return Object.values(BUILTIN_MANIFESTS);
}

export function listAllEnvironments(): ProjectEnvironmentManifest[] {
  const byId = new Map<string, ProjectEnvironmentManifest>();
  for (const m of Object.values(BUILTIN_MANIFESTS)) byId.set(m.id, m);
  for (const m of Object.values(REGISTERED_MANIFESTS)) byId.set(m.id, m);
  return [...byId.values()];
}

export function registerEnvironmentManifest(manifest: ProjectEnvironmentManifest): void {
  const validated = validateEnvironmentManifest(manifest);
  if (!validated.ok) {
    const msg = validated.issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Cannot register invalid manifest: ${msg}`);
  }
  REGISTERED_MANIFESTS[validated.manifest.id] = validated.manifest;
}

export function loadEnvironmentManifest(id: string): ProjectEnvironmentManifest | undefined {
  return REGISTERED_MANIFESTS[id] ?? BUILTIN_MANIFESTS[id];
}

export function isEnvironmentManifest(value: unknown): value is ProjectEnvironmentManifest {
  return validateEnvironmentManifest(value).ok;
}

export function mergeEnvironmentManifest(
  raw: unknown
): ProjectEnvironmentManifest | undefined {
  if (!isEnvironmentManifest(raw)) return undefined;
  const builtin = BUILTIN_MANIFESTS[raw.id];
  if (!builtin) return raw;
  return { ...builtin, ...raw, apiSurface: { ...builtin.apiSurface, ...raw.apiSurface } };
}
