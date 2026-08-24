import { describe, expect, it } from 'vitest';
import { CORE_NODE_REGISTRY } from '@vvs/syntax-registry';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getNodeDoc, listNodeDocKindIds, listNodeDocs, listNodeDocsByCategory } from './nodeDocCatalog';

describe('nodeDocCatalog', () => {
  it('covers every core registry kindId', () => {
    const ids = listNodeDocKindIds();
    expect(ids.length).toBeGreaterThan(10);
    for (const kindId of Object.keys(CORE_NODE_REGISTRY)) {
      expect(ids).toContain(kindId);
      expect(getNodeDoc(kindId)?.kindId).toBe(kindId);
    }
  });

  it('does not invent ports', () => {
    const branch = getNodeDoc('flow_branch');
    expect(branch?.title).toBe('Branch');
    expect(branch?.inputs.some((p) => p.id === 'exec_in' || p.type === 'execution')).toBe(true);
    const catalog = listNodeDocs();
    expect(catalog.some((n) => n.status === 'cut' && n.kindId === 'event_emit')).toBe(true);
  });

  it('groups by registry category without inventing names', () => {
    const groups = listNodeDocsByCategory();
    const cats = new Set(listNodeDocs().map((n) => n.category));
    expect(groups.map((g) => g.category).sort()).toEqual([...cats].sort());
    expect(groups.reduce((n, g) => n + g.nodes.length, 0)).toBe(listNodeDocs().length);
  });
});

describe('public sitemap', () => {
  it('lists every catalog kindId', () => {
    const xml = readFileSync(resolve(__dirname, '../../public/sitemap.xml'), 'utf8');
    for (const kindId of listNodeDocKindIds()) {
      expect(xml).toContain('/docs/nodes/' + kindId + '</loc>');
    }
  });
});