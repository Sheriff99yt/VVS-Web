/**
 * useKeyboardShortcuts
 * 
 * React hook for managing keyboard shortcuts in components.
 * Provides an easy way to register, unregister, and respond to keyboard shortcuts.
 */

import { useEffect, useCallback, useRef } from 'react';
import { keyboardShortcutService, Shortcut, ShortcutKey } from '../services/keyboard/KeyboardShortcutService';

interface UseKeyboardShortcutsProps {
  /**
   * An array of shortcuts to register when the component mounts.
   * Each shortcut will be unregistered when the component unmounts.
   */
  shortcuts?: Shortcut[];
  
  /**
   * A global handler for keyboard events, useful for implementing custom shortcut logic
   * beyond what is defined in the shortcuts array.
   */
  globalHandler?: (event: KeyboardEvent) => boolean;
  
  /**
   * Whether to globally enable or disable all shortcuts handled by this hook.
   * Defaults to true.
   */
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts = [],
  globalHandler,
  enabled = true
}: UseKeyboardShortcutsProps = {}) {
  // Keep track of registered shortcuts for cleanup
  const registeredShortcuts = useRef<Shortcut[]>([]);
  
  // Register event listener for keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabled) return;
      
      // First, check if our global handler wants to handle this event
      if (globalHandler && globalHandler(event)) {
        event.preventDefault();
        return;
      }
      
      // Then let the service handle any registered shortcuts
      keyboardShortcutService.handleKeyEvent(event);
    };
    
    // Register the keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [globalHandler, enabled]);
  
  // Register shortcuts when the component mounts or shortcuts change
  useEffect(() => {
    if (!enabled) return;
    
    // Unregister any previously registered shortcuts
    registeredShortcuts.current.forEach(shortcut => {
      keyboardShortcutService.unregisterShortcut(shortcut.key, shortcut.action);
    });
    
    // Register new shortcuts
    shortcuts.forEach(shortcut => {
      keyboardShortcutService.registerShortcut(shortcut);
    });
    
    // Update the ref with the current shortcuts
    registeredShortcuts.current = [...shortcuts];
    
    // Clean up when the component unmounts or shortcuts change
    return () => {
      registeredShortcuts.current.forEach(shortcut => {
        keyboardShortcutService.unregisterShortcut(shortcut.key, shortcut.action);
      });
    };
  }, [shortcuts, enabled]);
  
  // Helper function to register a single shortcut
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    keyboardShortcutService.registerShortcut(shortcut);
    registeredShortcuts.current = [...registeredShortcuts.current, shortcut];
  }, []);
  
  // Helper function to unregister a single shortcut
  const unregisterShortcut = useCallback((key: ShortcutKey, action?: () => void) => {
    keyboardShortcutService.unregisterShortcut(key, action);
    
    // Update the ref by removing the unregistered shortcut
    if (action) {
      registeredShortcuts.current = registeredShortcuts.current.filter(
        s => !(s.key === key && s.action === action)
      );
    } else {
      registeredShortcuts.current = registeredShortcuts.current.filter(s => s.key !== key);
    }
  }, []);
  
  return {
    registerShortcut,
    unregisterShortcut
  };
} 