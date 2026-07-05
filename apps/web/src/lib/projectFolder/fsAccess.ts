/** Browser File System Access helpers for the `.vvs/` overlay layout. */

export function isFolderPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickProjectFolder(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFolderPickerSupported()) {
    window.alert('Your browser does not support opening project folders. Use Chrome or Edge.');
    return null;
  }
  try {
    const picker = window.showDirectoryPicker;
    if (!picker) return null;
    return await picker({ mode: 'readwrite' });
  } catch {
    return null;
  }
}

export async function verifyHandlePermission(
  handle: FileSystemDirectoryHandle,
  mode: FileSystemPermissionMode = 'readwrite'
): Promise<boolean> {
  if ((await handle.queryPermission({ mode })) === 'granted') return true;
  return (await handle.requestPermission({ mode })) === 'granted';
}

export async function getOrCreateDir(
  parent: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return parent.getDirectoryHandle(name, { create: true });
}

/** Create each path segment under root (e.g. `.vvs/graphs/functions`). */
export async function ensureDirPath(
  root: FileSystemDirectoryHandle,
  relativePath: string
): Promise<FileSystemDirectoryHandle> {
  const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  let current = root;
  for (const segment of segments) {
    current = await getOrCreateDir(current, segment);
  }
  return current;
}

async function getDirAtPath(
  root: FileSystemDirectoryHandle,
  segments: string[]
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment);
  }
  return current;
}

export async function readTextFile(
  root: FileSystemDirectoryHandle,
  relativePath: string
): Promise<string | null> {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return null;
  try {
    const dir = parts.length ? await getDirAtPath(root, parts) : root;
    const fileHandle = await dir.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

export async function readJsonFile<T>(
  root: FileSystemDirectoryHandle,
  relativePath: string
): Promise<T | null> {
  const text = await readTextFile(root, relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function writeTextFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  content: string
): Promise<void> {
  const parts = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) throw new Error('Invalid file path');
  let dir = root;
  for (const segment of parts) {
    dir = await getOrCreateDir(dir, segment);
  }
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function writeJsonFile(
  root: FileSystemDirectoryHandle,
  relativePath: string,
  data: unknown
): Promise<void> {
  await writeTextFile(root, relativePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function appendGitignoreLines(
  root: FileSystemDirectoryHandle,
  lines: string[]
): Promise<void> {
  const existing = (await readTextFile(root, '.gitignore')) ?? '';
  const missing = lines.filter((line) => !existing.includes(line));
  if (missing.length === 0) return;
  const prefix = existing.length > 0 && !existing.endsWith('\n') ? '\n' : '';
  await writeTextFile(root, '.gitignore', `${existing}${prefix}${missing.join('\n')}\n`);
}
