/**
 * Edit History reveal — undo/redo jumps the camera/tab to where the change was.
 * Mouse Back/Forward use navigation history only (`editorNavigationHistory`);
 * they never call this path.
 */

import type { GraphHistoryReveal } from '@/lib/graphHistory';

export const REVEAL_EDIT_HISTORY_EVENT = 'vvs:reveal-edit-history';

export function dispatchRevealEditHistory(reveal: GraphHistoryReveal | null | undefined): void {
  if (typeof window === 'undefined' || !reveal?.tabId) return;
  window.dispatchEvent(
    new CustomEvent(REVEAL_EDIT_HISTORY_EVENT, {
      detail: reveal,
    })
  );
}
