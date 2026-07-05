import { describe, expect, test } from 'bun:test';
import { migrateLegacyFunction } from './symbols';
import { normalizeProjectSnapshot } from './snapshot';

describe('normalizeProjectSnapshot', () => {
  test('upgrades v1 function list to FunctionSymbol', () => {
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
    expect(snap?.version).toBe(2);
    expect(snap?.functions[0]?.kind).toBe('function');
    expect(snap?.functions[0]?.overloads.length).toBeGreaterThan(0);
  });
});

describe('migrateLegacyFunction', () => {
  test('creates default overload', () => {
    const fn = migrateLegacyFunction({ id: 'a', name: 'Bar' });
    expect(fn.name).toBe('Bar');
    expect(fn.binding).toBe('instance');
  });
});
