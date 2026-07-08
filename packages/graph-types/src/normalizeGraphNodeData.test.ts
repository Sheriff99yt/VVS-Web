import { describe, expect, test } from 'bun:test';
import { normalizeGraphNodeData } from './normalizeGraphNodeData';
import { migrateTextShapedAlignment } from './fidelityMigration';
import type { ProjectSnapshot } from './snapshot';
import { createClassSymbol, MAIN_CLASS_ID } from './symbols';

describe('normalizeGraphNodeData', () => {
  test('legacy label-only Get node receives kindId', () => {
    const data = normalizeGraphNodeData({
      label: 'Get Score',
      category: 'Variables',
      inputs: [],
      outputs: [],
      inlineValues: {},
    });
    expect(data.kindId).toBe('variable_get');
    expect(data.properties?.variableName).toBe('Score');
  });

  test('graphBinding call_function seeds kindId without label', () => {
    const data = normalizeGraphNodeData({
      label: 'Call Add',
      category: 'Project',
      inputs: [],
      outputs: [],
      inlineValues: {},
      graphBinding: { kind: 'call_function', symbolId: 'fn-add' },
    });
    expect(data.kindId).toBe('vvs.project.call_function');
  });

  test('migrateTextShapedAlignment normalizes all document nodes on load', () => {
    const snapshot: ProjectSnapshot = {
      version: 3,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      classes: [createClassSymbol('Test', { id: MAIN_CLASS_ID, graphTabId: 'main' })],
      activeClassId: MAIN_CLASS_ID,
      graphContainers: [],
      variables: [],
      events: [],
      functions: [],
      openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
      activeGraphTab: 'main',
      targetLanguage: 'python',
      autoCompile: true,
      autoSave: false,
      documents: {
        main: {
          nodes: [
            {
              id: 'legacy-get',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Get Foo',
                category: 'Variables',
                inputs: [],
                outputs: [{ id: 'val', label: 'Value', type: 'data_number' }],
                inlineValues: {},
              },
            },
          ],
          edges: [],
        },
      },
      installedLibrary: [],
    };

    const migrated = migrateTextShapedAlignment(snapshot);
    const node = migrated.documents.main!.nodes[0]!;
    expect(node.data.kindId).toBe('variable_get');
    expect(node.data.properties?.variableName).toBe('Foo');
  });
});
