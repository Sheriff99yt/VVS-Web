import { describe, expect, test } from 'bun:test';
import { createDefaultIntegration } from './integration';
import {
  listVirtualProjectFolderPaths,
  VVS_PROJECT_FILE,
  VVS_INTEGRATION_FILE,
  VVS_SYMBOLS_DIR,
} from './projectFolder';

describe('listVirtualProjectFolderPaths', () => {
  test('includes vvs overlay, symbols, graphs, emit, host, and workspace paths', () => {
    const snapshot = {
      graphContainers: [
        { id: 'main-graph', name: 'Project map' },
        { id: 'calc-graph', name: 'Calculator' },
      ],
      openTabs: [
        { id: 'main-graph', type: 'container' as const, name: 'Project map' },
        { id: 'calc-graph', type: 'container' as const, name: 'Calculator' },
        { id: 'fn-add', type: 'function' as const, name: 'Function: Add' },
      ],
      documents: {
        'main-graph': { nodes: [], edges: [] },
        'calc-graph': { nodes: [], edges: [] },
        'fn-add': { nodes: [], edges: [] },
      },
      classes: [{ kind: 'class' as const, id: 'main-class', name: 'Calculator', containerId: 'calc-graph' }],
      workspaceFiles: ['src/ui/panel.css', 'tests/fixtures/empty.json'],
    };

    const integration = createDefaultIntegration({
      moduleName: 'Calculator',
      defaultTarget: 'python',
      adoptExisting: true,
      hostFilePaths: ['main.py'],
    });

    const paths = listVirtualProjectFolderPaths(snapshot, {
      emittedFilePaths: ['Calculator/Calculator.py', 'Calculator/Add.py'],
      integration,
    });

    const pathSet = new Set(paths.map((e) => e.path));
    expect(pathSet.has(VVS_PROJECT_FILE)).toBe(true);
    expect(pathSet.has(VVS_INTEGRATION_FILE)).toBe(true);
    expect(pathSet.has(`${VVS_SYMBOLS_DIR}/variables.json`)).toBe(true);
    expect(pathSet.has('.vvs/graphs/containers/main-graph.graph.json')).toBe(true);
    expect(pathSet.has('.vvs/graphs/functions/Add.graph.json')).toBe(true);
    expect(pathSet.has('Calculator/Calculator.py')).toBe(true);
    expect(pathSet.has('main.py')).toBe(true);
    expect(pathSet.has('src/ui/panel.css')).toBe(true);
    expect(pathSet.has('tests/fixtures/empty.json')).toBe(true);

    expect(paths.find((e) => e.path === 'Calculator/Calculator.py')?.kind).toBe('generated');
    expect(paths.find((e) => e.path === VVS_PROJECT_FILE)?.kind).toBe('vvs');
    expect(paths.find((e) => e.path === 'src/ui/panel.css')?.kind).toBe('workspace');
  });
});
