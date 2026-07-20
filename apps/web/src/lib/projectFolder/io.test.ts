import { describe, expect, test } from 'bun:test';
import {
  buildFolderGraphManifest,
  containerGraphRelativePath,
  functionGraphRelativePath,
  normalizeProjectSnapshot,
  sanitizeGraphFileStem,
  MAIN_GRAPH_CONTAINER_ID,
} from '@vvs/graph-types';
import { createCoverageLabUsabilityTestSnapshot } from '../usabilityExampleTests/coverageLabUsabilityTest';

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

  test('functionGraphRelativePath uses functions subdirectory', () => {
    expect(functionGraphRelativePath({ id: 'fn-boot', type: 'function', name: 'Function: Boot' })).toBe(
      'graphs/functions/Boot.graph.json'
    );
  });

  test('buildFolderGraphManifest maps every container id for v2 layout', () => {
    const snapshot = normalizeProjectSnapshot(createCoverageLabUsabilityTestSnapshot())!;
    const graphs = buildFolderGraphManifest(snapshot);

    expect(graphs.main).toBeUndefined();
    expect(graphs.containers).toBeDefined();

    for (const container of snapshot.graphContainers) {
      expect(graphs.containers![container.id]).toBe(containerGraphRelativePath(container.id));
      expect(snapshot.documents[container.id]).toBeDefined();
    }

    expect(Object.keys(graphs.functions)).toEqual(
      expect.arrayContaining(['fn-boot', 'fn-shutdown', 'fn-sample', 'fn-report'])
    );
    expect(graphs.functions['fn-boot']).toBe('graphs/functions/Boot.graph.json');
  });

  test('normalized coverage lab has no documents.main key', () => {
    const snapshot = normalizeProjectSnapshot(createCoverageLabUsabilityTestSnapshot())!;
    expect(snapshot.documents.main).toBeUndefined();
    expect(snapshot.documents[MAIN_GRAPH_CONTAINER_ID]).toBeDefined();
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
