export interface GeneratedFileTreeNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: GeneratedFileTreeNode[];
}

function sortTree(nodes: GeneratedFileTreeNode[]): GeneratedFileTreeNode[] {
  return nodes
    .map((node) =>
      node.kind === 'directory' && node.children
        ? { ...node, children: sortTree(node.children) }
        : node
    )
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/** Build a folder tree from flat generated file paths (POSIX-style `/` separators). */
export function buildGeneratedFileTree(paths: string[]): GeneratedFileTreeNode[] {
  const root: GeneratedFileTreeNode[] = [];

  for (const filePath of [...paths].sort((a, b) => a.localeCompare(b))) {
    const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized) continue;

    const parts = normalized.split('/').filter(Boolean);
    let level = root;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let node = level.find((entry) => entry.name === part);
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          kind: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
        };
        level.push(node);
      } else if (!isFile && node.kind === 'file') {
        node = {
          name: part,
          path: currentPath,
          kind: 'directory',
          children: [],
        };
        const index = level.indexOf(level.find((e) => e.name === part)!);
        level[index] = node;
      }

      if (!isFile) {
        node.children ??= [];
        level = node.children;
      }
    }
  }

  return sortTree(root);
}
