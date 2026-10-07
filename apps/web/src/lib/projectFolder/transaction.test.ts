import { expect, test } from 'bun:test';
import { commitFolderFiles, recoverFolderSave } from './transaction';

function filesystem() {
  const files = new Map<string, string>();
  let count = 0, failAt = Infinity;
  const missing = () => new DOMException('missing', 'NotFoundError');
  const directory = (prefix: string): unknown => ({
    getDirectoryHandle: async (name: string) => directory(prefix + name + '/'),
    getFileHandle: async (name: string, options?: { create?: boolean }) => {
      const path = prefix + name;
      if (!files.has(path) && !options?.create) throw missing();
      return {
        getFile: async () => ({ text: async () => files.get(path)! }),
        createWritable: async () => {
          let pending = '';
          return { write: async (text: string) => { pending = text; }, close: async () => {
            if (++count === failAt) throw new Error('injected write failure');
            files.set(path, pending);
          } };
        },
      };
    },
    removeEntry: async (name: string) => { if (!files.delete(prefix + name)) throw missing(); },
  });
  return { root: directory('') as FileSystemDirectoryHandle, files, fail: (at: number) => { count = 0; failAt = at; } };
}

test('failure at every file boundary recovers the complete previous generation', async () => {
  for (const boundary of [1, 2, 3, 4]) {
    const fs = filesystem();
    const old = new Map<string, unknown>([['.vvs/graph.json', { n: 1 }], ['.vvs/symbols.json', { n: 1 }], ['.vvs/project.json', { n: 1 }]]);
    await commitFolderFiles(fs.root, old);
    fs.fail(boundary);
    await expect(commitFolderFiles(fs.root, new Map([...old].map(([path]) => [path, { n: 2 }])))).rejects.toThrow();
    fs.fail(Infinity);
    await recoverFolderSave(fs.root);
    for (const path of old.keys()) expect(JSON.parse(fs.files.get(path)!)).toEqual({ n: 1 });
    expect(fs.files.has('.vvs/save-journal.json')).toBe(false);
  }
});

test('first-save failure recovers an absent project and successful commit stays complete', async () => {
  const fs = filesystem(); fs.fail(3);
  const files = new Map<string, unknown>([['.vvs/graph.json', { n: 1 }], ['.vvs/project.json', { n: 1 }]]);
  await expect(commitFolderFiles(fs.root, files)).rejects.toThrow();
  fs.fail(Infinity); await recoverFolderSave(fs.root);
  expect(fs.files.size).toBe(0);
  await commitFolderFiles(fs.root, files);
  expect(JSON.parse(fs.files.get('.vvs/project.json')!)).toEqual({ n: 1 });
});
