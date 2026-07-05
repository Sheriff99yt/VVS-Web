import type { ProjectEnvironmentManifest } from './types';
import { renderHostFileTemplate } from './resolveApiSurface';

export interface EnvironmentManifestSummary {
  methodCount: number;
  eventCount: number;
  nativeCount: number;
  hostFilePaths: string[];
  entryPath?: string;
}

export function summarizeEnvironmentManifest(
  manifest: ProjectEnvironmentManifest
): EnvironmentManifestSummary {
  const natives = manifest.apiSurface.methods.filter((m) => m.role === 'native');
  const entry = manifest.hostFiles.find((f) => f.role === 'entry') ?? manifest.hostFiles[0];
  return {
    methodCount: manifest.apiSurface.methods.length,
    eventCount: manifest.apiSurface.events.length,
    nativeCount: natives.length,
    hostFilePaths: manifest.hostFiles.map((f) => f.path),
    entryPath: entry?.path,
  };
}

/** Render the entry host file template for library/start previews. */
export function previewHostEntry(manifest: ProjectEnvironmentManifest): string {
  const entry =
    manifest.hostFiles.find((f) => f.role === 'entry') ?? manifest.hostFiles[0];
  if (!entry) return '# No host files in manifest';
  return renderHostFileTemplate(entry.template, manifest.module.defaultName).trim();
}
