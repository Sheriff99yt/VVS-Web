import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { HostFileTemplate } from '../types';
import { inferHostFileRole, normalizeBackstageTemplate } from './fromBackstageSkeleton';

export interface ImportSkeletonOptions {
  skeletonDir: string;
  /** Replace ${{ values.name }} and {{ parameters.name }} with {moduleName} */
  normalizeBackstagePlaceholders?: boolean;
}

/** Load Backstage skeleton directory → hostFiles (Node/Bun only — not for browser bundles). */
export async function importHostFilesFromSkeleton(
  options: ImportSkeletonOptions
): Promise<HostFileTemplate[]> {
  const files: HostFileTemplate[] = [];
  await walkSkeleton(options.skeletonDir, options.skeletonDir, files, options);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function walkSkeleton(
  root: string,
  dir: string,
  out: HostFileTemplate[],
  options: ImportSkeletonOptions
): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkSkeleton(root, full, out, options);
      continue;
    }
    if (!entry.isFile()) continue;

    const rel = relative(root, full).split('\\').join('/');
    const content = await readFile(full, 'utf8');
    const template =
      options.normalizeBackstagePlaceholders !== false
        ? normalizeBackstageTemplate(content)
        : content;

    out.push({
      path: rel,
      role: inferHostFileRole(rel),
      template,
    });
  }
}
