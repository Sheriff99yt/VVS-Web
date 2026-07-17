'use client';

import { useEffect } from 'react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { isTypingTarget, matchesGraphShortcut } from '@/lib/graphShortcuts';
import {
  dispatchFocusGraphNodeSearch,
  dispatchFocusProjectTreeFilter,
  dispatchToggleCompilerLogPin,
  dispatchToggleGraphChrome,
} from '@/lib/uiPreferences';

export interface GraphKeyboardHandlers {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** @deprecated Space now focuses node search; spawn remains right-click. */
  onSpawnMenu?: () => void;
  onToggleHelp: () => void;
  isHelpOpen: boolean;
  /** When true, canvas shortcuts are suppressed (e.g. node search expanded). */
  suppressCanvasShortcuts?: boolean;
  /**
   * Prefill Find (Ctrl+F / Ctrl+Shift+F) from Project-tree symbol(s) and/or selected canvas nodes.
   * One name → single query; several → match-any (multi results).
   * Bare F frames the canvas selection — it does not search.
   */
  nodeSearchQueryFromSelection?: () => string | string[] | undefined;
}

/**
 * Single window listener for graph-editor keyboard shortcuts.
 * Project-level save/compile remain in TopNav; everything else routes through graphActions or handlers here.
 */
export function useGraphKeyboardShortcuts(handlers: GraphKeyboardHandlers) {
  const {
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onToggleHelp,
    isHelpOpen,
    suppressCanvasShortcuts = false,
    nodeSearchQueryFromSelection,
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHelpOpen && e.key === 'Escape') {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (isHelpOpen) return;

      // Panel filter — works even while typing / node search is open.
      if (matchesGraphShortcut(e, 'panel-filter')) {
        e.preventDefault();
        dispatchFocusProjectTreeFilter();
        return;
      }

      // Find — allow from plain inputs; leave TEXTAREA / contenteditable alone.
      // Check all-graphs first (Ctrl+Shift+F) before this-graph (Ctrl+F).
      if (
        matchesGraphShortcut(e, 'node-search-all') ||
        matchesGraphShortcut(e, 'node-search')
      ) {
        const el = document.activeElement as HTMLElement | null;
        const tag = el?.tagName;
        if (tag === 'TEXTAREA' || el?.isContentEditable) {
          return;
        }
        e.preventDefault();
        const query = nodeSearchQueryFromSelection?.();
        dispatchFocusGraphNodeSearch(query, {
          searchAllGraphs: matchesGraphShortcut(e, 'node-search-all'),
        });
        return;
      }

      if (isTypingTarget()) return;
      if (suppressCanvasShortcuts) return;

      if (matchesGraphShortcut(e, 'help')) {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      // U75: bare A expands to full undirected exec chain (Ctrl+A remains select-all).
      // Keep hardcoded until select-chain gets its own rebindable shortcut id.
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (key === 'a' && !mod && !e.shiftKey && !e.altKey) {
        if (e.repeat) return;
        e.preventDefault();
        dispatchGraphAction('select-chain-full');
        return;
      }

      // U75: S = select downstream; second S (armed in GraphCanvas) = layout.
      if (key === 's' && !mod && !e.shiftKey && !e.altKey) {
        if (e.repeat) return;
        e.preventDefault();
        dispatchGraphAction('select-chain-downstream');
        return;
      }

      if (matchesGraphShortcut(e, 'delete')) {
        e.preventDefault();
        dispatchGraphAction('delete-selection');
        return;
      }

      if (matchesGraphShortcut(e, 'undo')) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }

      if (matchesGraphShortcut(e, 'redo')) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      if (matchesGraphShortcut(e, 'copy')) {
        e.preventDefault();
        dispatchGraphAction('copy');
        return;
      }

      if (matchesGraphShortcut(e, 'paste')) {
        e.preventDefault();
        dispatchGraphAction('paste');
        return;
      }

      if (matchesGraphShortcut(e, 'cut')) {
        e.preventDefault();
        dispatchGraphAction('cut');
        return;
      }

      if (matchesGraphShortcut(e, 'duplicate')) {
        e.preventDefault();
        dispatchGraphAction('duplicate');
        return;
      }

      if (matchesGraphShortcut(e, 'select-all')) {
        e.preventDefault();
        dispatchGraphAction('select-all');
        return;
      }

      if (matchesGraphShortcut(e, 'select-similar')) {
        e.preventDefault();
        dispatchGraphAction('select-similar');
        return;
      }

      if (matchesGraphShortcut(e, 'disconnect')) {
        e.preventDefault();
        dispatchGraphAction('disconnect-selection');
        return;
      }

      if (matchesGraphShortcut(e, 'group-comment')) {
        e.preventDefault();
        dispatchGraphAction('group-comment');
        return;
      }

      if (matchesGraphShortcut(e, 'ungroup-comment')) {
        e.preventDefault();
        dispatchGraphAction('ungroup-comment');
        return;
      }

      if (matchesGraphShortcut(e, 'toggle-comment-lock')) {
        e.preventDefault();
        dispatchGraphAction('toggle-comment-lock');
        return;
      }

      if (matchesGraphShortcut(e, 'snap-comment-members')) {
        e.preventDefault();
        dispatchGraphAction('snap-comment-members');
        return;
      }

      if (matchesGraphShortcut(e, 'toggle-minimap')) {
        e.preventDefault();
        dispatchToggleGraphChrome();
        return;
      }

      if (matchesGraphShortcut(e, 'extract-function')) {
        e.preventDefault();
        dispatchGraphAction('extract-function');
        return;
      }

      if (matchesGraphShortcut(e, 'focus-selection')) {
        e.preventDefault();
        dispatchGraphAction('focus-selection');
        return;
      }

      if (matchesGraphShortcut(e, 'toggle-log-pin')) {
        e.preventDefault();
        dispatchToggleCompilerLogPin();
        return;
      }

      if (
        matchesGraphShortcut(e, 'focus-node-search') ||
        matchesGraphShortcut(e, 'focus-node-search-palette')
      ) {
        e.preventDefault();
        dispatchFocusGraphNodeSearch();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onToggleHelp,
    isHelpOpen,
    suppressCanvasShortcuts,
    nodeSearchQueryFromSelection,
  ]);
}
