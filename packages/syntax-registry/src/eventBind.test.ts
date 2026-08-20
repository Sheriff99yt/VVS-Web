import { describe, expect, test } from 'bun:test';
import { inferKindIdFromLabel, list } from './registry';
import { spawnItemMatchesQuery } from './spawnSearch';

describe('event_bind spawn', () => {
  test('infer Bind Event label', () => {
    expect(inferKindIdFromLabel('Bind Event', 'Events')).toBe('event_bind');
    expect(inferKindIdFromLabel('Bind go', 'Events')).toBe('event_bind');
  });

  test('spawned on csharp, javascript, gdscript; hidden on python', () => {
    for (const lang of ['csharp', 'javascript', 'gdscript'] as const) {
      const cats = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: lang });
      expect(cats.some((c) => c.items.some((i) => i.kindId === 'event_bind'))).toBe(true);
    }
    const py = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'python' });
    expect(py.some((c) => c.items.some((i) => i.kindId === 'event_bind'))).toBe(false);
  });

  test('search bind/listen/connect hits Bind on csharp only', () => {
    const cs = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'csharp' });
    for (const q of ['bind', 'listen', 'connect']) {
      const hits = cs.flatMap((c) => c.items.filter((item) => spawnItemMatchesQuery(item, q, c.name)));
      expect(hits.some((i) => i.kindId === 'event_bind')).toBe(true);
    }
    const py = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'python' });
    const pyHits = py.flatMap((c) => c.items.filter((item) => spawnItemMatchesQuery(item, 'bind', c.name)));
    expect(pyHits.some((i) => i.kindId === 'event_bind')).toBe(false);
  });

  test('emit and subscribe stay excluded even when Bind is spawnable', () => {
    const cs = list({ currentGraphId: 'main', functions: [], events: [], targetLanguage: 'csharp' });
    const ids = cs.flatMap((c) => c.items.map((i) => i.kindId));
    expect(ids).not.toContain('event_emit');
    expect(ids).not.toContain('event_subscribe');
    expect(ids).toContain('event_bind');
  });
});