import { describe, expect, test } from 'bun:test';
import { cloneGraphSnapshot, cloneProjectSlice, type ProjectHistorySlice } from './graphHistory';

describe('graphHistory project slice', () => {
  const slice: ProjectHistorySlice = {
    variables: [{ id: 'v1', name: 'score', type: 'data_number', binding: 'instance', classId: 'c1' }],
    functions: [],
    events: [],
    classes: [{ kind: 'class', id: 'c1', name: 'App', containerId: 'main' }],
    activeClassId: 'c1',
    projectDetails: { moduleName: 'App', extendsType: '', description: '' },
    documents: {
      main: {
        nodes: [{ id: 'n1', type: 'vvs', position: { x: 0, y: 0 }, data: { kindId: 'var_define' } }],
        edges: [],
      },
    },
    openTabs: [{ id: 'main', type: 'main', name: 'Main' }],
    activeGraphTab: 'main',
  };

  test('cloneProjectSlice deep-copies arrays and documents', () => {
    const copy = cloneProjectSlice(slice);
    expect(copy).toEqual(slice);
    expect(copy.variables).not.toBe(slice.variables);
    expect(copy.documents.main).not.toBe(slice.documents.main);
    copy.variables[0]!.name = 'mutated';
    expect(slice.variables[0]!.name).toBe('score');
  });

  test('cloneGraphSnapshot attaches project when provided', () => {
    const snap = cloneGraphSnapshot([], [], 'Add variable score', 'main', slice);
    expect(snap.label).toBe('Add variable score');
    expect(snap.activeGraphTab).toBe('main');
    expect(snap.project?.variables[0]?.name).toBe('score');
    expect(snap.project?.classes[0]?.name).toBe('App');
    expect(snap.project?.variables).not.toBe(slice.variables);
  });

  test('cloneGraphSnapshot omits project when null (lean canvas entry)', () => {
    const snap = cloneGraphSnapshot([], [], 'Edit graph', 'fn-1', null);
    expect(snap.project).toBeUndefined();
    expect(snap.activeGraphTab).toBe('fn-1');
  });
});
