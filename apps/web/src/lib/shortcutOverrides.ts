import type { GraphShortcutId } from '@/lib/graphShortcuts';
import { GRAPH_SHORTCUTS, getShortcutDef, isShortcutRebindable } from '@/lib/graphShortcuts';
import {
  isMacPlatform,
  normalizeChord,
} from '@/lib/chordMatching';
import { readUiPreferences, writeUiPreferences } from '@/lib/uiPreferences';

export type ShortcutOverrideMap = Partial<Record<GraphShortcutId, string>>;

/** Shortcuts users may rebind (single chord — no gestures or multi-key sequences). */
export const REBINDABLE_SHORTCUT_IDS: GraphShortcutId[] = GRAPH_SHORTCUTS.filter(
  isShortcutRebindable
).map((s) => s.id);

export function readShortcutOverrides(): ShortcutOverrideMap {
  return readUiPreferences().shortcutOverrides ?? {};
}

function effectiveKeysFor(id: GraphShortcutId): string {
  const override = readShortcutOverrides()[id];
  if (override) return override;
  const def = getShortcutDef(id);
  if (!def) return '';
  return isMacPlatform()
    ? (def.keysMac ?? def.keysWin.replace(/Ctrl\+/g, '⌘'))
    : def.keysWin;
}

export function writeShortcutOverride(id: GraphShortcutId, chord: string | null): void {
  const next = { ...readShortcutOverrides() };
  if (!chord) delete next[id];
  else next[id] = chord;
  writeUiPreferences({ shortcutOverrides: next });
}

export function resetShortcutOverrides(): void {
  writeUiPreferences({ shortcutOverrides: {} });
}

export { chordFromKeyboardEvent, matchKeyChord, normalizeChord } from '@/lib/chordMatching';

/**
 * Other rebindable shortcuts that already use this chord.
 * Intentional shared defaults (same keysWin, e.g. F for frame + find-from-symbol) are allowed.
 */
export function findShortcutConflicts(
  id: GraphShortcutId,
  chord: string
): GraphShortcutId[] {
  const target = normalizeChord(chord);
  if (!target) return [];
  const selfDef = getShortcutDef(id);
  const overrides = readShortcutOverrides();

  return REBINDABLE_SHORTCUT_IDS.filter((other) => {
    if (other === id) return false;
    if (normalizeChord(effectiveKeysFor(other)) !== target) return false;

    const otherDef = getShortcutDef(other);
    if (
      selfDef &&
      otherDef &&
      normalizeChord(selfDef.keysWin) === normalizeChord(otherDef.keysWin) &&
      normalizeChord(selfDef.keysWin) === target &&
      !overrides[other]
    ) {
      return false;
    }
    return true;
  });
}

export function effectiveShortcutKeys(
  id: GraphShortcutId,
  defaults: { keysWin: string; keysMac?: string }
): string {
  const override = readShortcutOverrides()[id];
  if (override) return override;
  return isMacPlatform()
    ? (defaults.keysMac ?? defaults.keysWin.replace(/Ctrl\+/g, '⌘'))
    : defaults.keysWin;
}
