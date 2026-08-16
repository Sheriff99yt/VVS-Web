import { describe, expect, test } from 'bun:test';
import {
  anySettingsMatch,
  matchingSettingsBlockIds,
  settingsBlockMatches,
} from './settingsSearch';

describe('settingsSearch', () => {
  test('covers About, Project defaults, pack lock, portability, and COA by name', () => {
    expect(settingsBlockMatches('about', 'about')).toBe(true);
    expect(settingsBlockMatches('project defaults', 'project-defaults')).toBe(true);
    expect(settingsBlockMatches('default language', 'project-defaults')).toBe(true);
    expect(settingsBlockMatches('syntax pack', 'pack-lock')).toBe(true);
    expect(settingsBlockMatches('pack lock', 'pack-lock')).toBe(true);
    expect(settingsBlockMatches('portability', 'portability')).toBe(true);
    expect(settingsBlockMatches('coa', 'coa')).toBe(true);
    expect(settingsBlockMatches('cross over', 'coa')).toBe(true);
  });

  test('finds editor, audio, and export controls by their real labels', () => {
    expect(settingsBlockMatches('author comments', 'editor')).toBe(true);
    expect(settingsBlockMatches('naming convention', 'editor')).toBe(true);
    expect(settingsBlockMatches('unsupported as', 'editor')).toBe(true);
    expect(settingsBlockMatches('volume', 'audio')).toBe(true);
    expect(settingsBlockMatches('enable audio', 'audio')).toBe(true);
    expect(settingsBlockMatches('output directory', 'export-paths')).toBe(true);
    expect(settingsBlockMatches('module name', 'graph-details')).toBe(true);
    expect(settingsBlockMatches('openapi', 'environment')).toBe(true);
  });

  test('finds shortcuts by action label', () => {
    expect(settingsBlockMatches('undo', 'shortcuts')).toBe(true);
    expect(settingsBlockMatches('extract to function', 'shortcuts')).toBe(true);
  });

  test('unknown query matches nothing', () => {
    expect(matchingSettingsBlockIds('xyzzy-no-such-setting')).toEqual([]);
    expect(anySettingsMatch('xyzzy-no-such-setting')).toBe(false);
  });

  test('section names surface their blocks', () => {
    expect(settingsBlockMatches('editor', 'editor')).toBe(true);
    expect(settingsBlockMatches('shortcuts', 'shortcuts')).toBe(true);
    expect(settingsBlockMatches('audio', 'audio')).toBe(true);
    expect(settingsBlockMatches('project', 'this-graph')).toBe(true);
    expect(settingsBlockMatches('about', 'about')).toBe(true);
  });
});
