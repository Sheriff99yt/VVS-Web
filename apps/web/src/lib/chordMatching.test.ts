import { describe, expect, test } from 'bun:test';
import {
  expandGluedModifiers,
  matchKeyChord,
  normalizeChord,
} from './chordMatching';

function fakeKey(partial: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    code: '',
    ...partial,
  } as KeyboardEvent;
}

describe('chordMatching', () => {
  test('expandGluedModifiers splits macOS keysMac forms', () => {
    expect(expandGluedModifiers('⌘Z')).toBe('⌘+Z');
    expect(expandGluedModifiers('⌘⇧Z')).toBe('⌘+⇧+Z');
    expect(expandGluedModifiers('Ctrl+Z')).toBe('Ctrl+Z');
  });

  test('normalizeChord equates glued Mac and Win chords', () => {
    expect(normalizeChord('⌘Z')).toBe(normalizeChord('Ctrl+Z'));
    expect(normalizeChord('⌘⇧Z')).toBe(normalizeChord('Ctrl+Shift+Z'));
  });

  test('matchKeyChord accepts glued Mac undo chord', () => {
    expect(
      matchKeyChord(fakeKey({ key: 'z', metaKey: true }), '⌘Z')
    ).toBe(true);
    expect(
      matchKeyChord(fakeKey({ key: 'z', ctrlKey: true, shiftKey: true }), '⌘⇧Z')
    ).toBe(true);
  });

  test('matchKeyChord handles Space', () => {
    expect(matchKeyChord(fakeKey({ key: ' ', code: 'Space' }), 'Space')).toBe(true);
    expect(
      matchKeyChord(fakeKey({ key: ' ', code: 'Space', ctrlKey: true }), 'Ctrl+Space')
    ).toBe(true);
  });
});
