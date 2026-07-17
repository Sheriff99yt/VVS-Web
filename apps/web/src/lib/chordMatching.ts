/** Platform and chord parsing — no imports from graphShortcuts (avoids circular deps). */

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

/**
 * Expand glued macOS display chords (`⌘⇧Z` → `⌘+⇧+Z`, `⌘Z` → `⌘+Z`)
 * so split('+') matching works with GRAPH_SHORTCUTS keysMac forms.
 */
export function expandGluedModifiers(chord: string): string {
  const trimmed = chord.trim();
  if (!trimmed || trimmed.includes('+')) return trimmed;
  const mods: string[] = [];
  let i = 0;
  while (i < trimmed.length) {
    const ch = trimmed[i]!;
    if (ch === '⌘' || ch === '⇧' || ch === '⌥') {
      mods.push(ch);
      i += 1;
      continue;
    }
    break;
  }
  if (mods.length === 0) return trimmed;
  const key = trimmed.slice(i);
  return key ? [...mods, key].join('+') : mods.join('+');
}

/** Normalize chords so Ctrl/⌘ and Shift/⇧ compare equal. */
export function normalizeChord(chord: string): string {
  return expandGluedModifiers(chord)
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      if (p === '⌘' || p === 'Ctrl' || p === 'Control') return 'Mod';
      if (p === '⇧' || p === 'Shift') return 'Shift';
      if (p === '⌥' || p === 'Alt' || p === 'Option') return 'Alt';
      if (p === 'Backspace') return 'Delete';
      return p.length === 1 ? p.toUpperCase() : p;
    })
    .join('+');
}

/** Parse a stored chord like `Ctrl+Shift+Z` against a keydown event. */
export function matchKeyChord(e: KeyboardEvent, chord: string): boolean {
  if (!chord.trim()) return false;
  const parts = expandGluedModifiers(chord)
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  const keyToken = parts[parts.length - 1]!;
  const needCtrl = parts.some((p) => p === 'Ctrl' || p === '⌘');
  const needShift = parts.some((p) => p === 'Shift' || p === '⇧');
  const needAlt = parts.some((p) => p === 'Alt' || p === '⌥');
  const mod = e.ctrlKey || e.metaKey;

  if (needCtrl !== mod) return false;
  if (needShift !== e.shiftKey) return false;
  if (needAlt !== e.altKey) return false;

  const key = e.key;
  if (keyToken === 'Delete' || keyToken === 'Backspace') {
    return key === 'Delete' || key === 'Backspace';
  }
  if (keyToken === 'Space') {
    return key === ' ' || key === 'Space' || e.code === 'Space';
  }
  if (keyToken.length === 1) {
    return key.toLowerCase() === keyToken.toLowerCase();
  }
  if (keyToken === 'F2') return key === 'F2';
  if (keyToken === '`') return key === '`' || key === '~';
  if (keyToken === '?') return key === '?' || (e.shiftKey && key === '/');
  return key === keyToken;
}

/**
 * Format a captured keydown into a chord string for storage.
 * Allows bare letter keys (S, A, C, …) so defaults can be reassigned.
 */
export function chordFromKeyboardEvent(e: KeyboardEvent): string | null {
  if (e.key === 'Escape') return null;
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;

  const mod = e.ctrlKey || e.metaKey;
  const parts: string[] = [];
  if (mod) parts.push(isMacPlatform() ? '⌘' : 'Ctrl');
  if (e.shiftKey && e.key !== '?') parts.push(isMacPlatform() ? '⇧' : 'Shift');
  if (e.altKey) parts.push(isMacPlatform() ? '⌥' : 'Alt');

  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key === 'Backspace') key = 'Delete';
  if (key.length === 1) key = key.toUpperCase();
  if (key === '/') key = '?';

  parts.push(key);
  return parts.join('+');
}
