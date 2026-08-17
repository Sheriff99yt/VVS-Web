import type { ProjectIntegrationConfig, TranspileResult } from '@vvs/graph-types';
import { filterGeneratedFilesForHostPolicy } from '@vvs/environment-templates';
import { writeTextFile } from './fsAccess';

/** Write transpile output files into a project folder (Generate / export honesty). */
export async function writeGeneratedFilesToFolder(
  root: FileSystemDirectoryHandle,
  result: TranspileResult,
  integration?: ProjectIntegrationConfig
): Promise<{ written: string[]; skipped: string[] }> {
  const written: string[] = [];
  const skipped: string[] = [];
  const files = filterGeneratedFilesForHostPolicy(result.files, integration);
  const kept = new Set(files.map((file) => file.path.replace(/\\/g, '/')));
  for (const file of result.files) {
    const path = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!path || path.includes('..')) continue;
    if (!kept.has(path)) {
      skipped.push(path);
      continue;
    }
    const content = file.content.endsWith('\n') ? file.content : `${file.content}\n`;
    await writeTextFile(root, path, content);
    written.push(path);
  }
  return { written, skipped };
}
