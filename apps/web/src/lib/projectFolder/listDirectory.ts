export interface DirectoryEntry {
  name: string;
  kind: 'file' | 'directory';
  path: string;
  children?: DirectoryEntry[];
}

const SKIP_DEPTH_BELOW = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

export async function listDirectoryTree(
  root: FileSystemDirectoryHandle,
  options?: { maxDepth?: number; basePath?: string }
): Promise<DirectoryEntry[]> {
  const maxDepth = options?.maxDepth ?? 4;
  const basePath = options?.basePath ?? '';

  async function walk(
    dir: FileSystemDirectoryHandle,
    path: string,
    depth: number
  ): Promise<DirectoryEntry[]> {
    if (depth > maxDepth) return [];
    const entries: DirectoryEntry[] = [];

    for await (const [name, handle] of dir.entries()) {
      const entryPath = path ? `${path}/${name}` : name;
      if (handle.kind === 'directory') {
        const subDir = handle as FileSystemDirectoryHandle;
        if (depth < maxDepth && !SKIP_DEPTH_BELOW.has(name)) {
          const children = await walk(subDir, entryPath, depth + 1);
          entries.push({ name, kind: 'directory', path: entryPath, children });
        } else {
          entries.push({ name, kind: 'directory', path: entryPath, children: [] });
        }
      } else {
        entries.push({ name, kind: 'file', path: entryPath });
      }
    }

    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return entries;
  }

  return walk(root, basePath, 0);
}
