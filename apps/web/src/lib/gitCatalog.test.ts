import { describe, expect, test } from 'bun:test';
import catalog from '../../../../catalog/vvs-catalog.json';
import { parseGitHubUrl, validatePublicGitCatalog } from './gitCatalog';

describe('public Git catalog', () => {
  test('the checked-in catalog matches the client contract', () => {
    expect(validatePublicGitCatalog(catalog)).toBe(true);
  });

  test('rejects non-GitHub hosts and extra repository paths', () => {
    expect(parseGitHubUrl('https://github.com.evil.example/owner/repo')).toBeNull();
    expect(parseGitHubUrl('https://github.com/owner/repo/tree/main')).toBeNull();
    expect(parseGitHubUrl('https://github.com/owner/repo')).toEqual({ owner: 'owner', repo: 'repo' });
  });

  test('rejects malformed assets', () => {
    expect(validatePublicGitCatalog({ ...catalog, assets: [{ ...catalog.assets[0], repoUrl: 'https://example.com/x' }] })).toBe(false);
  });
});
