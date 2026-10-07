import { expect, test } from 'bun:test';
import catalog from '../../../../catalog/vvs-catalog.json';
import { validatePublicGitCatalog } from './gitCatalog';
import { filterLibraryAssetsBySearch, matchesLibrarySearch } from './librarySearch';
test('asset IDs, aliases, reordered tokens and Unicode share the search contract', () => {
  const assets = [{ id: 'asset-one', title: 'Compiler', author: 'Team', description: 'C++ tools أدوات', type: 'Template', tags: ['JavaScript', 'C#'] }];
  for (const query of ['asset-one', 'cpp', 'JS', 'csharp', 'tools compiler', 'أدوات']) expect(filterLibraryAssetsBySearch(assets, query)).toHaveLength(1);
  expect(matchesLibrarySearch('anything', '!!!')).toBe(false);
  expect(filterLibraryAssetsBySearch(assets, 'nonexistent')).toHaveLength(0);
});
test('catalog rejects duplicate IDs and excessive metadata', () => {
  expect(validatePublicGitCatalog({ ...catalog, assets: [catalog.assets[0], catalog.assets[0]] })).toBe(false);
  expect(validatePublicGitCatalog({ ...catalog, assets: [{ ...catalog.assets[0], description: 'x'.repeat(4097) }] })).toBe(false);
});
