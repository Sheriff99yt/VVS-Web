'use client';

import { useEffect } from 'react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { isTypingTarget } from '@/lib/graphShortcuts';
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
   * Name of the selected Project-tree symbol (if any) for Find shortcuts.
   * F → find in this graph; Ctrl+F → find in all graphs.
   */
  nodeSearchQueryFromSelection?: () => string | undefined;
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

      // Ctrl+Space — left panel filter (works even while typing / node search is open).
      // Prefer ctrl over meta (⌘Space is Spotlight on macOS).
      if (e.code === 'Space' && e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        dispatchFocusProjectTreeFilter();
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Ctrl/Cmd+F — graph node search (all graphs). Allow from plain inputs (incl. node search);
      // leave TEXTAREA / contenteditable to code-editor find.
      if (mod && key === 'f' && !e.shiftKey && !e.altKey) {
        const el = document.activeElement as HTMLElement | null;
        const tag = el?.tagName;
        if (tag === 'TEXTAREA' || el?.isContentEditable) {
          return;
        }
        e.preventDefault();
        dispatchFocusGraphNodeSearch(nodeSearchQueryFromSelection?.(), {
          searchAllGraphs: true,
        });
        return;
      }

      if (isTypingTarget()) return;
      if (suppressCanvasShortcuts) return;

      if (e.key === '?' && !mod && !e.altKey) {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      // U75: bare A expands to full undirected exec chain (Ctrl+A remains select-all).
      if (key === 'a' && !mod && !e.shiftKey && !e.altKey) {
        if (e.repeat) return;
        e.preventDefault();
        dispatchGraphAction('select-chain-full');
        return;
      }

      // U75: S = select downstream; second S (armed in GraphCanvas) = layout.
      // Ignore key-repeat so holding S cannot fake S S.
      if (key === 's' && !mod && !e.shiftKey && !e.altKey) {
        if (e.repeat) return;
        e.preventDefault();
        dispatchGraphAction('select-chain-downstream');
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        dispatchGraphAction('delete-selection');
        return;
      }

      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }

      if (mod && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      if (mod && key === 'c') {
        e.preventDefault();
        dispatchGraphAction('copy');
        return;
      }

      if (mod && key === 'v') {
        e.preventDefault();
        dispatchGraphAction('paste');
        return;
      }

      if (mod && key === 'x') {
        e.preventDefault();
        dispatchGraphAction('cut');
        return;
      }

      if (mod && e.shiftKey && key === 'a') {
        e.preventDefault();
        dispatchGraphAction('select-similar');
        return;
      }

      if (mod && key === 'a' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchGraphAction('select-all');
        return;
      }

      if (mod && key === 'd' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchGraphAction('duplicate');
        return;
      }

      if (e.altKey && key === 'd' && !mod) {
        e.preventDefault();
        dispatchGraphAction('disconnect-selection');
        return;
      }

      if (mod && e.shiftKey && key === 'g') {
        e.preventDefault();
        dispatchGraphAction('group-comment');
        return;
      }

      // U68: plain C comments the selection (Ctrl/Cmd+C remains copy).
      if (key === 'c' && !mod && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchGraphAction('group-comment');
        return;
      }

      if (mod && e.shiftKey && key === 'u') {
        e.preventDefault();
        dispatchGraphAction('ungroup-comment');
        return;
      }

      if (key === 'l' && !mod && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchGraphAction('toggle-comment-lock');
        return;
      }

      if (mod && e.shiftKey && key === 'm') {
        e.preventDefault();
        dispatchGraphAction('snap-comment-members');
        return;
      }

      if (key === 'm' && !mod && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchToggleGraphChrome();
        return;
      }

      if (mod && e.shiftKey && key === 'e') {
        e.preventDefault();
        dispatchGraphAction('extract-function');
        return;
      }

      if (key === 'f' && !mod && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        const symbolQuery = nodeSearchQueryFromSelection?.();
        if (symbolQuery) {
          // Find selected symbol in the current graph only.
          dispatchFocusGraphNodeSearch(symbolQuery, { searchAllGraphs: false });
          return;
        }
        dispatchGraphAction('focus-selection');
        return;
      }

      // Backtick / tilde — toggle compiler log open/closed.
      if ((e.key === '`' || e.key === '~') && !mod && !e.altKey) {
        e.preventDefault();
        dispatchToggleCompilerLogPin();
        return;
      }

      // Space / Ctrl+K — open search; respect current all-graphs toggle (Ctrl+F forces on).
      if (e.code === 'Space' && !mod) {
        e.preventDefault();
        dispatchFocusGraphNodeSearch();
        return;
      }

      if (mod && key === 'k' && !e.shiftKey && !e.altKey) {
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
