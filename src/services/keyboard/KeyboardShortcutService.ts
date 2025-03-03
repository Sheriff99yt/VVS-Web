/**
 * KeyboardShortcutService
 * 
 * Service for managing keyboard shortcuts throughout the application.
 * Handles registration, execution, and organization of keyboard shortcuts.
 */

export type ShortcutKey = string; // e.g. 'ctrl+s', 'shift+delete'
export type ShortcutAction = () => void;
export type ShortcutCategory = 'general' | 'node' | 'canvas' | 'project' | 'editor';

export interface Shortcut {
  key: ShortcutKey;
  action: ShortcutAction;
  description: string;
  category: ShortcutCategory;
  disabled?: boolean;
}

class KeyboardShortcutService {
  private shortcuts: Map<ShortcutKey, Shortcut> = new Map();
  private listeners: Map<ShortcutKey, Set<ShortcutAction>> = new Map();
  private isEnabled = true;

  /**
   * Register a shortcut with the service
   */
  registerShortcut(shortcut: Shortcut): void {
    this.shortcuts.set(shortcut.key, shortcut);
    
    // Initialize the set of listeners for this key if it doesn't exist
    if (!this.listeners.has(shortcut.key)) {
      this.listeners.set(shortcut.key, new Set());
    }
    
    this.listeners.get(shortcut.key)?.add(shortcut.action);
  }

  /**
   * Unregister a shortcut from the service
   */
  unregisterShortcut(key: ShortcutKey, action?: ShortcutAction): void {
    if (action && this.listeners.has(key)) {
      this.listeners.get(key)?.delete(action);
      
      // Remove the key entirely if no listeners remain
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key);
        this.shortcuts.delete(key);
      }
    } else {
      // Remove all listeners for this key
      this.listeners.delete(key);
      this.shortcuts.delete(key);
    }
  }

  /**
   * Handle a keyboard event and execute the corresponding shortcut if registered
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    if (!this.isEnabled) return false;
    
    const key = this.normalizeKeyEvent(event);
    
    if (this.listeners.has(key)) {
      const shortcut = this.shortcuts.get(key);
      
      if (shortcut && !shortcut.disabled) {
        // Prevent default browser behavior for this shortcut
        event.preventDefault();
        
        // Execute all listeners for this shortcut
        this.listeners.get(key)?.forEach(action => action());
        return true;
      }
    }
    
    return false;
  }

  /**
   * Convert a keyboard event to a standardized shortcut key string
   */
  normalizeKeyEvent(event: KeyboardEvent): ShortcutKey {
    const key = event.key.toLowerCase();
    
    // Build the shortcut string (e.g., "ctrl+shift+s")
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    // Don't duplicate modifiers in the key
    if (key !== 'control' && key !== 'shift' && key !== 'alt' && key !== 'meta') {
      parts.push(key);
    }
    
    return parts.join('+');
  }

  /**
   * Enable the keyboard shortcut service
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable the keyboard shortcut service
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: ShortcutCategory): Shortcut[] {
    return this.getAllShortcuts().filter(shortcut => shortcut.category === category);
  }
}

// Export as a singleton
export const keyboardShortcutService = new KeyboardShortcutService(); 