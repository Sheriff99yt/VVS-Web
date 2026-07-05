import type { EditorNavigateEventDetail, EditorViewTab } from '@/types/editorNavigation';

/** Dispatch a versioned editor navigation request (handled by EditorNavigationProvider). */
export function dispatchEditorNavigate(
  frame: EditorNavigateEventDetail['frame'],
  options?: EditorNavigateEventDetail['options']
): void {
  window.dispatchEvent(
    new CustomEvent('vvs:editor-navigate', {
      detail: { frame, options } satisfies EditorNavigateEventDetail,
    })
  );
}

export function dispatchSwitchToCanvas(): void {
  dispatchEditorNavigate({ editorView: 'canvas' });
}

export function dispatchSwitchEditorView(view: EditorViewTab): void {
  dispatchEditorNavigate({ editorView: view });
}
