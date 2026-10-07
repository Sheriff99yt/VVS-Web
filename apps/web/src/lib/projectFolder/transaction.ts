import { readTextFile, writeTextFile } from './fsAccess';
import { SaveCoordinator } from '../saveCoordinator';

const JOURNAL = '.vvs/save-journal.json';
const queues = new WeakMap<FileSystemDirectoryHandle, SaveCoordinator>();

/** Recover the previous complete generation before reading any project file. */
export async function recoverFolderSave(root: FileSystemDirectoryHandle): Promise<void> {
  const text = await readTextFile(root, JOURNAL);
  if (text === null) return;
  const journal = JSON.parse(text) as { version: number; previous: Record<string, string | null> };
  if (journal.version !== 1 || !journal.previous || typeof journal.previous !== 'object') throw new Error('Invalid save recovery journal.');
  for (const [path, value] of Object.entries(journal.previous)) {
    if (path.startsWith('/') || path.includes(':') || path.includes('\\') || path.split('/').some(part => part === '..' || part === '.' || part === '.git' || !part) || path === JOURNAL) throw new Error('Invalid recovery path.');
    if (value !== null && typeof value !== 'string') throw new Error('Invalid recovery content.');
  }
  // Validate the complete journal before restoring any file.
  for (const [path, value] of Object.entries(journal.previous)) {
    if (value !== null) await writeTextFile(root, path, value);
    else {
      const parts = path.split('/');
      const name = parts.pop()!;
      let directory = root;
      try {
        for (const part of parts) directory = await directory.getDirectoryHandle(part);
        await directory.removeEntry(name);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'NotFoundError')) throw error;
      }
    }
  }
  await (await root.getDirectoryHandle('.vvs')).removeEntry('save-journal.json');
}

/** A durable undo journal protects the canonical split-file layout. Manifest goes last. */
export function commitFolderFiles(root: FileSystemDirectoryHandle, files: Map<string, unknown>, generated = new Map<string, string>()): Promise<void> {
  let queue = queues.get(root);
  if (!queue) { queue = new SaveCoordinator(); queues.set(root, queue); }
  return queue.run(async () => {
    await recoverFolderSave(root);
    const writes = new Map([...generated, ...[...files].map(([path, value]) => [path, JSON.stringify(value, null, 2) + '\n'] as const)]);
    const previous: Record<string, string | null> = {};
    for (const path of writes.keys()) {
      if (path.startsWith('/') || path.includes(':') || path.includes('\\') || path.split('/').some(part => part === '..' || part === '.' || part === '.git' || !part) || path === JOURNAL) throw new Error('Invalid save path.');
      previous[path] = await readTextFile(root, path);
    }
    await writeTextFile(root, JOURNAL, JSON.stringify({ version: 1, previous }));
    for (const [path, value] of writes) await writeTextFile(root, path, value);
    await (await root.getDirectoryHandle('.vvs')).removeEntry('save-journal.json');
  });
}
