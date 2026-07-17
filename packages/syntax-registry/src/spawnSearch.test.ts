import { describe, expect, test } from 'bun:test';
import { list } from './registry';
import { spawnItemMatchesQuery } from './spawnSearch';

describe('spawn catalog — U97 import module', () => {
  test('lists Import Module in Imports category', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const imports = categories.find((c) => c.name === 'Imports');
    expect(imports?.items.some((i) => i.kindId === 'vvs.project.import_module')).toBe(true);
    expect(imports?.items.some((i) => i.label === 'Import Class')).toBe(true);
  });

  test('search "import" matches Import Module and Import Class', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const importItems = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'import', c.name))
    );
    const kindIds = importItems.map((i) => i.kindId);
    expect(kindIds).toContain('import_class');
    expect(kindIds).toContain('vvs.project.import_module');
  });

  test('search "module" matches Import Module', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const hits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'module', c.name))
    );
    expect(hits.some((i) => i.kindId === 'vvs.project.import_module')).toBe(true);
  });

  test('search "declare" matches function declare', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const hits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'declare', c.name))
    );
    expect(hits.some((i) => i.kindId === 'function_define')).toBe(true);
  });
});
