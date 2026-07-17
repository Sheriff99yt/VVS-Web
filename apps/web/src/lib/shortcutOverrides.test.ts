import { describe, expect, test } from 'bun:test';
import { findShortcutConflicts, normalizeChord } from './shortcutOverrides';

describe('shortcutOverrides', () => {
  test('normalizeChord equates Ctrl and ⌘', () => {
    expect(normalizeChord('Ctrl+D')).toBe(normalizeChord('⌘+D'));
    expect(normalizeChord('Ctrl+Shift+Z')).toBe(normalizeChord('⌘+⇧+Z'));
  });

  test('normalizeChord expands glued macOS keysMac forms', () => {
    expect(normalizeChord('⌘Z')).toBe('Mod+Z');
    expect(normalizeChord('⌘⇧Z')).toBe('Mod+Shift+Z');
    expect(normalizeChord('⌘D')).toBe(normalizeChord('Ctrl+D'));
  });

  test('shared factory defaults (F) are not conflicts', () => {
    expect(findShortcutConflicts('focus-selection', 'F')).toEqual([]);
  });

  test('findShortcutConflicts detects stealing another shortcut chord', () => {
    const conflicts = findShortcutConflicts('undo', 'Ctrl+D');
    expect(conflicts).toContain('duplicate');
  });

  test('findShortcutConflicts ignores self', () => {
    expect(findShortcutConflicts('undo', 'Ctrl+Z')).not.toContain('undo');
  });
});
