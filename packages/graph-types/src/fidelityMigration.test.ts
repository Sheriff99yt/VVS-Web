import { describe, expect, test } from 'bun:test';
import { migrateTextShapedAlignment } from './fidelityMigration';
import type { ProjectSnapshot } from './snapshot';

describe('migrateTextShapedAlignment', () => {
  test('macro tab becomes function tab with symbol', () => {
    const snapshot: ProjectSnapshot = {
      version: 2,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      variables: [],
      events: [],
      functions: [],
      openTabs: [
        { id: 'main', type: 'main', name: 'Main graph' },
        { id: 'macro-1', type: 'macro', name: 'Macro: Reset' },
      ],
      activeGraphTab: 'main',
      targetLanguage: 'python',
      autoCompile: true,
      autoSave: false,
      documents: {
        main: { nodes: [], edges: [] },
        'macro-1': {
          nodes: [
            {
              id: 'in',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Reset Input',
                category: 'Flow Control',
                inputs: [],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
                inlineValues: {},
              },
            },
            {
              id: 'work',
              type: 'vvs_standard_node',
              position: { x: 200, y: 0 },
              data: {
                label: 'Print String',
                category: 'Action',
                kindId: 'action_print',
                inputs: [{ id: 'msg', label: 'Message', type: 'data_string' }],
                outputs: [],
                inlineValues: { msg: 'hi' },
              },
            },
            {
              id: 'out',
              type: 'vvs_standard_node',
              position: { x: 400, y: 0 },
              data: {
                label: 'Reset Output',
                category: 'Flow Control',
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [],
                inlineValues: {},
              },
            },
          ],
          edges: [
            { id: 'e1', source: 'in', target: 'work', sourceHandle: 'exec_out', targetHandle: 'exec_in' },
            { id: 'e2', source: 'work', target: 'out', sourceHandle: 'exec_out', targetHandle: 'exec_in' },
          ],
        },
      },
      installedLibrary: [],
    };

    const migrated = migrateTextShapedAlignment(snapshot);
    expect(migrated.openTabs.find((t) => t.id === 'macro-1')?.type).toBe('function');
    expect(migrated.functions.some((f) => f.id === 'macro-1' && f.name === 'Reset')).toBe(true);
    const doc = migrated.documents['macro-1']!;
    expect(doc.nodes.some((n) => n.data.label === 'Reset Input')).toBe(false);
    expect(doc.nodes.some((n) => n.data.label === 'Reset Output')).toBe(false);
    expect(doc.nodes.some((n) => n.data.category === 'Events')).toBe(true);
    expect(doc.nodes.some((n) => n.id === 'work')).toBe(true);
  });

  test('use_macro node becomes call_function', () => {
    const snapshot: ProjectSnapshot = {
      version: 2,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      variables: [],
      events: [],
      functions: [{ kind: 'function', id: 'fn-1', name: 'Add', binding: 'instance', visibility: 'public', overloads: [{ id: 'o1', parameters: [], returnType: 'void' }] }],
      openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
      activeGraphTab: 'main',
      targetLanguage: 'python',
      autoCompile: true,
      autoSave: false,
      documents: {
        main: {
          nodes: [
            {
              id: 'use-m',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Use Add',
                category: 'Project',
                kindId: 'vvs.project.use_macro',
                linkKind: 'use_macro',
                linkedGraphId: 'fn-1',
                graphBinding: { kind: 'use_macro', symbolId: 'fn-1' },
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
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
    expect(node.data.kindId).toBe('vvs.project.call_function');
    expect(node.data.linkKind).toBe('call_function');
    expect(node.data.label).toBe('Call Add');
    expect(node.data.graphBinding?.kind).toBe('call_function');
  });

  test('event_dispatch node becomes event_emit', () => {
    const snapshot: ProjectSnapshot = {
      version: 2,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      variables: [],
      events: [{ id: 'evt-1', name: 'Calculate', parameters: [] }],
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
              id: 'dispatch-1',
              type: 'vvs_standard_node',
              position: { x: 0, y: 0 },
              data: {
                label: 'Dispatch Calculate',
                category: 'Events',
                kindId: 'event_dispatch',
                properties: { eventId: 'evt-1', eventName: 'Calculate' },
                inputs: [{ id: 'exec_in', label: '', type: 'execution' }],
                outputs: [{ id: 'exec_out', label: '', type: 'execution' }],
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
    expect(node.data.kindId).toBe('event_emit');
    expect(node.data.label).toBe('Emit Calculate');
    expect(node.data.properties?.eventId).toBe('evt-1');
  });
});
