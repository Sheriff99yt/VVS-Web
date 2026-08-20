import { describe, expect, test } from 'bun:test';
import {
  collectEnvironmentLanguages,
  filterEnvironmentsByLanguage,
  filterEnvironmentsBySearch,
  filterGitReposBySearch,
  filterLibraryAssetsBySearch,
  libraryTemplateEmptyLabel,
  visibleEnvironmentLanguages,
  matchesLibrarySearch,
  tokenizeLibrarySearch,
} from './librarySearch';

describe('librarySearch', () => {
  test('tokenizes on words and ignores extra punctuation', () => {
    expect(tokenizeLibrarySearch('  Rust, console!  ')).toEqual(['rust', 'console']);
    expect(tokenizeLibrarySearch('')).toEqual([]);
  });

  test('empty query matches everything', () => {
    expect(matchesLibrarySearch('anything', '')).toBe(true);
    expect(matchesLibrarySearch('anything', '   ')).toBe(true);
  });

  test('filters environments by name, category, language, description', () => {
    const envs = [
      {
        id: 'env.rust.console-app',
        displayName: 'Rust Console App',
        description: 'Native Rust binary with println!',
        category: 'console',
        defaultTarget: 'rust',
        supportedTargets: ['rust', 'python'],
      },
      {
        id: 'env.javascript.http-service',
        displayName: 'Node HTTP Service',
        description: 'Node http.createServer skeleton',
        category: 'api',
        defaultTarget: 'javascript',
        supportedTargets: ['javascript', 'python'],
      },
    ];

    expect(filterEnvironmentsBySearch(envs, 'rust').map((e) => e.id)).toEqual([
      'env.rust.console-app',
    ]);
    expect(filterEnvironmentsBySearch(envs, 'console').map((e) => e.id)).toEqual([
      'env.rust.console-app',
    ]);
    expect(filterEnvironmentsBySearch(envs, 'javascript api').map((e) => e.id)).toEqual([
      'env.javascript.http-service',
    ]);
    expect(filterEnvironmentsBySearch(envs, 'println').map((e) => e.id)).toEqual([
      'env.rust.console-app',
    ]);
    expect(filterEnvironmentsBySearch(envs, 'no-such-pack')).toEqual([]);
    expect(filterEnvironmentsBySearch(envs, '').length).toBe(2);
  });

  test('filters git catalog repos by name and description', () => {
    const repos = [
      {
        name: 'VVS Official Syntax Packs',
        description: 'Official core target language packs (Python, JS, Rust)',
        owner: 'Sheriff99yt',
        repo: 'VVS-Web',
      },
      {
        name: 'acme/extra',
        description: 'Custom community Git pack repository',
        owner: 'acme',
        repo: 'extra',
      },
    ];
    expect(filterGitReposBySearch(repos, 'rust').map((r) => r.repo)).toEqual(['VVS-Web']);
    expect(filterGitReposBySearch(repos, 'acme').map((r) => r.repo)).toEqual(['extra']);
  });

  test('filters installed library assets by title and tags', () => {
    const assets = [
      {
        title: 'Rust Console App',
        description: 'Native Rust binary',
        type: 'Environments',
        tags: ['Console & CLI', 'rust'],
        environmentCategory: 'console',
      },
      {
        title: 'Math Utilities Pack',
        description: 'Vector math nodes',
        type: 'Node packs',
        tags: ['Math', 'Vectors'],
      },
    ];
    expect(filterLibraryAssetsBySearch(assets, 'console rust').map((a) => a.title)).toEqual([
      'Rust Console App',
    ]);
    expect(filterLibraryAssetsBySearch(assets, 'vectors').map((a) => a.title)).toEqual([
      'Math Utilities Pack',
    ]);
  });
});

describe('library language chips', () => {
  const envs = [
    {
      id: 'env.rust.console-app',
      displayName: 'Rust Console App',
      description: 'Native Rust binary',
      category: 'console',
      defaultTarget: 'rust',
      supportedTargets: ['rust', 'python'],
    },
    {
      id: 'env.javascript.http-service',
      displayName: 'Node HTTP Service',
      description: 'Node http.createServer skeleton',
      category: 'api',
      defaultTarget: 'javascript',
      supportedTargets: ['javascript', 'python'],
    },
  ];

  test('collects languages from default + supported targets', () => {
    expect(collectEnvironmentLanguages(envs)).toEqual(['rust', 'python', 'javascript']);
  });

  test('filters by language chip without using embeddings', () => {
    expect(filterEnvironmentsByLanguage(envs, 'rust').map((e) => e.id)).toEqual([
      'env.rust.console-app',
    ]);
    expect(filterEnvironmentsByLanguage(envs, 'python').map((e) => e.id)).toEqual([
      'env.rust.console-app',
      'env.javascript.http-service',
    ]);
    expect(filterEnvironmentsByLanguage(envs, 'all')).toHaveLength(2);
    expect(filterEnvironmentsByLanguage(envs, 'verse')).toEqual([]);
  });

  test('language chip stacks with token search', () => {
    const searched = filterEnvironmentsBySearch(envs, 'http');
    expect(filterEnvironmentsByLanguage(searched, 'javascript').map((e) => e.id)).toEqual([
      'env.javascript.http-service',
    ]);
    expect(filterEnvironmentsByLanguage(searched, 'rust')).toEqual([]);
  });
});

describe('visibleEnvironmentLanguages', () => {
  const rust = {
    id: 'env.rust.console-app',
    displayName: 'Rust Console App',
    description: 'Native Rust binary',
    category: 'console',
    defaultTarget: 'rust',
    supportedTargets: ['rust', 'python'],
  };

  test('keeps a stuck language chip after search removes that family', () => {
    expect(visibleEnvironmentLanguages([rust], 'verse')).toEqual(['rust', 'python', 'verse']);
    expect(visibleEnvironmentLanguages([rust], 'all')).toEqual(['rust', 'python']);
    expect(visibleEnvironmentLanguages([rust], 'rust')).toEqual(['rust', 'python']);
  });
});

describe('libraryTemplateEmptyLabel', () => {
  test('search-only miss names the query', () => {
    expect(libraryTemplateEmptyLabel('rust', 'all')).toBe('No templates match “rust”.');
  });

  test('search + language chip names both so a stuck chip cannot blame search alone', () => {
    expect(libraryTemplateEmptyLabel('rust', 'verse')).toBe('No templates match “rust” for Verse.');
  });

  test('language-only leaves copy to the panel', () => {
    expect(libraryTemplateEmptyLabel('', 'verse')).toBeUndefined();
    expect(libraryTemplateEmptyLabel('   ', 'all')).toBeUndefined();
  });
});
