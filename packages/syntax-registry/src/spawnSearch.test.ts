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

  test('search "declare" matches member declare; function declare only for C++', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    const hits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'declare', c.name))
    );
    expect(hits.some((i) => i.kindId === 'class_define')).toBe(true);
    expect(hits.some((i) => i.kindId === 'function_define')).toBe(false);

    const cpp = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'cpp' });
    const cppHits = cpp.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'declare', c.name))
    );
    expect(cppHits.some((i) => i.kindId === 'function_define')).toBe(true);
  });

  test('search custom synonyms matches core-pack nodes', () => {
    const categories = list({ currentGraphId: 'main', functions: [], events: [] });
    
    // search '+' matches math_add
    const plusHits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, '+', c.name))
    );
    expect(plusHits.some((i) => i.kindId === 'math_add')).toBe(true);

    // search 'tick' matches On handler (role tick), not the folded event_on_update kind
    const tickHits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'tick', c.name))
    );
    expect(tickHits.some((i) => i.kindId === 'event_define')).toBe(true);
    expect(tickHits.some((i) => i.kindId === 'event_on_update')).toBe(false);

    const excluded = categories.flatMap((c) => c.items.map((i) => i.kindId));
    for (const kindId of ['event_on_start', 'event_on_update', 'event_emit', 'event_subscribe', 'flow_sequence', 'action_await_wait', 'graph_ref']) {
      expect(excluded).not.toContain(kindId);
    }

    // search 'append' matches array_push
    const appendHits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'append', c.name))
    );
    expect(appendHits.some((i) => i.kindId === 'array_push')).toBe(true);

    // search 'concat' matches string_concat
    const concatHits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'concat', c.name))
    );
    expect(concatHits.some((i) => i.kindId === 'string_concat')).toBe(true);
  });
});

describe('spawn catalog — U106 inherited Get/Set', () => {
  test('search Get Power finds ancestor field when variables are in scope', () => {
    const categories = list({
      currentGraphId: 'sensor-graph',
      functions: [],
      events: [],
      variables: [
        {
          kind: 'variable',
          id: 'var-power',
          name: 'Power',
          type: 'data_number',
          binding: 'instance',
          visibility: 'public',
          classId: 'main-class',
        },
      ],
    });
    const hits = categories.flatMap((c) =>
      c.items.filter((item) => spawnItemMatchesQuery(item, 'get power', c.name))
    );
    expect(hits.some((i) => i.kindId === 'variable_get' && i.label === 'Get Power')).toBe(true);
    expect(hits.some((i) => i.graphBinding?.symbolId === 'var-power')).toBe(true);
  });
});
