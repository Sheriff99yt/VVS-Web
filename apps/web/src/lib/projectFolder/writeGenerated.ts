import type { TranspileResult } from '@vvs/graph-types';
import { writeTextFile } from './fsAccess';

/** Write transpile output files into a project folder (Generate / export honesty). */
export async function writeGeneratedFilesToFolder(
  root: FileSystemDirectoryHandle,
  result: TranspileResult
): Promise<void> {
  for (const file of result.files) {
    const path = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!path || path.includes('..')) continue;
    const content = file.content.endsWith('\n') ? file.content : `${file.content}\n`;
    await writeTextFile(root, path, content);
  }
}
