'use client';

import { useEffect } from 'react';
import { dispatchGraphAction } from '@/lib/graphActions';
import { isTypingTarget } from '@/lib/graphShortcuts';
import {
  dispatchFocusGraphNodeSearch,
  dispatchToggleCompilerLogPin,
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
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isHelpOpen && e.key === 'Escape') {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (isHelpOpen) return;

      if (isTypingTarget()) return;
      if (suppressCanvasShortcuts) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.key === '?' && !mod && !e.altKey) {
        e.preventDefault();
        onToggleHelp();
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

      if (mod && e.shiftKey && key === 'u') {
        e.preventDefault();
        dispatchGraphAction('ungroup-comment');
        return;
      }

      if (mod && e.shiftKey && key === 'e') {
        e.preventDefault();
        dispatchGraphAction('extract-function');
        return;
      }

      if (key === 'f' && !mod && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchGraphAction('focus-selection');
        return;
      }

      // Backtick / tilde — toggle compiler log pin.
      if ((e.key === '`' || e.key === '~') && !mod && !e.altKey) {
        e.preventDefault();
        dispatchToggleCompilerLogPin();
        return;
      }

      if (e.code === 'Space' && !mod) {
        e.preventDefault();
        dispatchFocusGraphNodeSearch();
        return;
      }

      // Keep Ctrl/Cmd+K as alternate search focus.
      if (mod && key === 'k' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        dispatchFocusGraphNodeSearch();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, canUndo, canRedo, onToggleHelp, isHelpOpen, suppressCanvasShortcuts]);
}
