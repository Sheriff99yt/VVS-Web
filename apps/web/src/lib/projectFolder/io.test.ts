import { describe, expect, test } from 'bun:test';
import {
  buildFolderGraphManifest,
  containerGraphRelativePath,
  functionGraphRelativePath,
  normalizeProjectSnapshot,
  sanitizeGraphFileStem,
  MAIN_GRAPH_CONTAINER_ID,
} from '@vvs/graph-types';
import { createComplexSnapshot } from '../usabilityExampleTests/complexUsabilityTest';
import { createAdvancedSnapshot } from '../usabilityExampleTests/advancedUsabilityTest';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadProjectSnapshotFromPath, saveProjectSnapshotToPath } from './nodeIo';

describe('projectFolder graph manifest helpers', () => {
  test('sanitizeGraphFileStem strips Function prefix and unsafe chars', () => {
    expect(sanitizeGraphFileStem('Function: Add')).toBe('Add');
    expect(sanitizeGraphFileStem('UI flow')).toBe('UI_flow');
    expect(sanitizeGraphFileStem('')).toBe('Graph');
  });

  test('containerGraphRelativePath uses containers subdirectory', () => {
    expect(containerGraphRelativePath('main-graph')).toBe(
      'graphs/containers/main-graph.graph.json'
    );
  });

  test('functionGraphRelativePath uses functions subdirectory and includes id', () => {
    expect(functionGraphRelativePath({ id: 'fn-boot', type: 'function', name: 'Function: Boot' })).toBe(
      'graphs/functions/Boot__fn-boot.graph.json'
    );
  });

  test('functionGraphRelativePath keeps same-named methods on distinct files', () => {
    const parent = functionGraphRelativePath({
      id: 'fn-parent-speak',
      type: 'function',
      name: 'Function: Speak',
    });
    const child = functionGraphRelativePath({
      id: 'fn-child-speak',
      type: 'function',
      name: 'Function: Speak',
    });
    expect(parent).toBe('graphs/functions/Speak__fn-parent-speak.graph.json');
    expect(child).toBe('graphs/functions/Speak__fn-child-speak.graph.json');
    expect(parent).not.toBe(child);
  });

  test('buildFolderGraphManifest maps every container id for v2 layout', () => {
    const snapshot = normalizeProjectSnapshot(createComplexSnapshot())!;
    const graphs = buildFolderGraphManifest(snapshot);

    expect(graphs.main).toBeUndefined();
    expect(graphs.containers).toBeDefined();

    for (const container of snapshot.graphContainers) {
      expect(graphs.containers![container.id]).toBe(containerGraphRelativePath(container.id));
      expect(snapshot.documents[container.id]).toBeDefined();
    }

    expect(Object.keys(graphs.functions)).toEqual(
      expect.arrayContaining(['fn-add'])
    );
    expect(graphs.functions['fn-add']).toBe('graphs/functions/Add__fn-add.graph.json');
  });

  test('Advanced same-named Diagnose bodies survive folder save/load', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vvs-speak-'));
    try {
      saveProjectSnapshotToPath(dir, createAdvancedSnapshot());
      const loaded = loadProjectSnapshotFromPath(dir);
      if (!loaded) throw new Error('failed to load Advanced');
      const parentPrint = loaded.documents['fn-machine-diagnose']?.nodes.find((n) => n.id === 'ad-print-label');
      const childPrint = loaded.documents['fn-sensor-diagnose']?.nodes.find((n) => n.id === 'ad-print-sensor');
      expect(parentPrint).toBeDefined();
      expect(childPrint?.data.inlineValues?.in_str).toBe('sensor');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('normalized Complex has no documents.main key', () => {
    const snapshot = normalizeProjectSnapshot(createComplexSnapshot())!;
    expect(snapshot.documents.main).toBeUndefined();
    expect(snapshot.documents[MAIN_GRAPH_CONTAINER_ID]).toBeDefined();
  });


  test('folder save writes one graph file per document, not a giant snapshot blob', () => {
    const snapshot = normalizeProjectSnapshot(createComplexSnapshot())!;
    const dir = mkdtempSync(join(tmpdir(), 'vvs-doc-split-'));
    try {
      saveProjectSnapshotToPath(dir, snapshot);
      const manifest = buildFolderGraphManifest(snapshot);

      expect(existsSync(join(dir, 'snapshot.json'))).toBe(false);
      expect(existsSync(join(dir, '.vvs', 'snapshot.json'))).toBe(false);
      expect(existsSync(join(dir, '.vvs', 'documents.json'))).toBe(false);

      const projectJson = JSON.parse(readFileSync(join(dir, '.vvs', 'project.json'), 'utf8')) as {
        documents?: unknown;
      };
      expect(projectJson.documents).toBeUndefined();

      const expectedRel = {
        ...(manifest.containers ?? {}),
        ...manifest.functions,
      };
      expect(Object.keys(expectedRel).length).toBeGreaterThan(1);

      for (const [docId, rel] of Object.entries(expectedRel)) {
        const path = join(dir, '.vvs', rel);
        expect(existsSync(path)).toBe(true);
        const doc = JSON.parse(readFileSync(path, 'utf8')) as {
          nodes?: unknown;
          edges?: unknown;
          documents?: unknown;
          version?: unknown;
        };
        expect(Array.isArray(doc.nodes)).toBe(true);
        expect(Array.isArray(doc.edges)).toBe(true);
        expect(doc.documents).toBeUndefined();
        expect(doc.version).toBeUndefined();
        expect(snapshot.documents[docId]).toBeDefined();
      }

      const graphJsonFiles: string[] = [];
      const walk = (folder: string) => {
        if (!existsSync(folder)) return;
        for (const name of readdirSync(folder)) {
          const next = join(folder, name);
          if (statSync(next).isDirectory()) walk(next);
          else if (name.endsWith('.graph.json')) graphJsonFiles.push(next);
        }
      };
      walk(join(dir, '.vvs', 'graphs'));
      expect(graphJsonFiles).toHaveLength(Object.keys(expectedRel).length);

      const loaded = loadProjectSnapshotFromPath(dir);
      if (!loaded) throw new Error('failed to reload split folder project');
      for (const docId of Object.keys(expectedRel)) {
        expect(loaded.documents[docId]).toBeDefined();
        expect(loaded.documents[docId]?.nodes.length).toBe(snapshot.documents[docId]?.nodes.length);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('loadProjectFromFolder registers custom packs from packs directory', async () => {
    const mockProjectJson = JSON.stringify({
      format: 'vvs.project',
      formatVersion: 2,
      name: 'Test',
      defaultTarget: 'python',
      module: { name: 'Test' },
      settings: { autoCompile: false, autoSave: false },
      graphs: { containers: {}, functions: {} }
    });

    const mockPackJson = JSON.stringify({
      id: 'mock.base',
      version: '1.5.0',
      family: 'python',
      templates: {},
      layout: {
        indentUnit: '  ',
        blockPlaceholder: 'TODO',
        commentPrefix: '#',
        instanceReceiver: 'self'
      }
    });

    // Mock Directory/File handles
    const projectFileHandle = {
      getFile: async () => ({ text: async () => mockProjectJson })
    };
    const packFileHandle = {
      kind: 'file',
      name: 'mock.base@1.5.0.json',
      getFile: async () => ({ text: async () => mockPackJson })
    };

    const packsDirHandle = {
      kind: 'directory',
      name: 'packs',
      values: async function* () {
        yield packFileHandle;
      }
    };

    const vvsDirHandle = {
      kind: 'directory',
      name: '.vvs',
      getDirectoryHandle: async (name: string) => {
        if (name === 'packs') return packsDirHandle;
        throw new Error('Not found');
      },
      getFileHandle: async (name: string) => {
        if (name === 'project.json') return projectFileHandle;
        throw new Error('Not found');
      }
    };

    const mockRoot = {
      kind: 'directory',
      getDirectoryHandle: async (name: string) => {
        if (name === '.vvs') return vvsDirHandle;
        throw new Error('Not found');
      },
      getFileHandle: async (name: string) => {
        throw new Error('Not found');
      }
    } as unknown as FileSystemDirectoryHandle;

    const { getSyntaxPack } = await import('@vvs/syntax-packs');
    const { loadProjectFromFolder } = await import('./io');

    expect(getSyntaxPack('mock.base@1.5.0')).toBeUndefined();

    const res = await loadProjectFromFolder(mockRoot);
    expect(res).toBeDefined();

    expect(getSyntaxPack('mock.base@1.5.0')).toBeDefined();
  });
});
