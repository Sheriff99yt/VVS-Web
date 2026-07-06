import { describe, expect, test } from 'bun:test';
import { migrateLegacyFunction, MAIN_CLASS_ID, MAIN_GRAPH_CONTAINER_ID, PROJECT_MAP_CONTAINER_NAME } from './symbols';
import { normalizeProjectSnapshot, createEmptyProjectSnapshot } from './snapshot';

const v2Base = {
  version: 2 as const,
  savedAt: new Date().toISOString(),
  projectDetails: { moduleName: 'Calculator', extendsType: 'Base', description: 'demo' },
  variables: [{ kind: 'variable' as const, id: 'v1', name: 'A', type: 'data_number' as const, binding: 'instance' as const, visibility: 'public' as const }],
  events: [{ id: 'e1', name: 'calculate', parameters: [] }],
  functions: [{ kind: 'function' as const, id: 'f1', name: 'Add', binding: 'instance' as const, visibility: 'public' as const, overloads: [{ id: 'o1', parameters: [], returnType: 'void' as const, graphTabId: 'f1' }] }],
  openTabs: [{ id: 'main', type: 'main' as const, name: 'Main graph' }],
  activeGraphTab: 'main',
  targetLanguage: 'python' as const,
  autoCompile: true,
  autoSave: false,
  documents: { main: { nodes: [], edges: [] } },
  installedLibrary: [],
};

describe('normalizeProjectSnapshot', () => {
  test('upgrades v1 function list to FunctionSymbol and v3', () => {
    const raw = {
      version: 1,
      savedAt: new Date().toISOString(),
      projectDetails: { moduleName: 'Test', extendsType: '', description: '' },
      variables: [],
      events: [],
      functions: [{ id: 'f1', name: 'Foo' }],
      openTabs: [{ id: 'main', type: 'main', name: 'Main graph' }],
      activeGraphTab: 'main',
      targetLanguage: 'python',
      autoCompile: true,
      autoSave: false,
      documents: {
        main: { nodes: [], edges: [] },
      },
      installedLibrary: [],
    };
    const snap = normalizeProjectSnapshot(raw);
    expect(snap?.version).toBe(3);
    expect(snap?.functions[0]?.kind).toBe('function');
    expect(snap?.functions[0]?.overloads.length).toBeGreaterThan(0);
    expect(snap?.classes).toHaveLength(1);
    expect(snap?.classes[0]?.id).toBe(MAIN_CLASS_ID);
    expect(snap?.activeClassId).toBe(MAIN_CLASS_ID);
  });

  test('upgrades v2 snapshot with synthetic main-class and stamps classId', () => {
    const snap = normalizeProjectSnapshot(v2Base);
    expect(snap?.version).toBe(3);
    expect(snap?.classes).toHaveLength(1);
    expect(snap?.classes[0]).toMatchObject({
      id: MAIN_CLASS_ID,
      name: 'Calculator',
      extendsType: 'Base',
    });
    expect(snap?.classes[0]?.graphTabId).toBeUndefined();
    expect(snap?.documents[MAIN_GRAPH_CONTAINER_ID]?.nodes.length).toBeGreaterThanOrEqual(0);
    expect(snap?.documents.main).toBeUndefined();
    expect(snap?.activeClassId).toBe(MAIN_CLASS_ID);
    expect(snap?.variables[0]?.classId).toBe(MAIN_CLASS_ID);
    expect(snap?.functions[0]?.classId).toBe(MAIN_CLASS_ID);
    expect(snap?.events[0]?.classId).toBe(MAIN_CLASS_ID);
  });

  test('preserves v3 classes and activeClassId on load', () => {
    const snap = normalizeProjectSnapshot({
      ...v2Base,
      version: 3,
      classes: [
        { kind: 'class', id: 'cls-a', name: 'Alpha', graphTabId: 'cls-a' },
        { kind: 'class', id: 'cls-b', name: 'Beta', graphTabId: 'cls-b' },
      ],
      activeClassId: 'cls-b',
    });
    expect(snap?.classes).toHaveLength(2);
    expect(snap?.activeClassId).toBe('cls-b');
  });

  test('createEmptyProjectSnapshot is v3 with default class and project map graph', () => {
    const snap = createEmptyProjectSnapshot();
    expect(snap.version).toBe(3);
    expect(snap.classes[0]?.id).toBe(MAIN_CLASS_ID);
    expect(snap.activeClassId).toBe(MAIN_CLASS_ID);
    expect(snap.activeGraphTab).toBe(MAIN_GRAPH_CONTAINER_ID);
    expect(snap.graphContainers[0]?.name).toBe(PROJECT_MAP_CONTAINER_NAME);
    expect(snap.documents[MAIN_GRAPH_CONTAINER_ID]).toBeDefined();
    expect(snap.openTabs.some((tab) => tab.type === 'container')).toBe(true);
  });

  test('upgrades v2 snapshot with container documents and tabs', () => {
    const snap = normalizeProjectSnapshot(v2Base);
    expect(snap?.documents[MAIN_GRAPH_CONTAINER_ID]).toBeDefined();
    expect(snap?.openTabs.some((tab) => tab.id === MAIN_GRAPH_CONTAINER_ID)).toBe(true);
  });
});

describe('migrateLegacyFunction', () => {
  test('creates default overload', () => {
    const fn = migrateLegacyFunction({ id: 'a', name: 'Bar' });
    expect(fn.name).toBe('Bar');
    expect(fn.binding).toBe('instance');
  });
});
