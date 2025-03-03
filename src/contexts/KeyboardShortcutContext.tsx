/**
 * KeyboardShortcutContext
 * 
 * React context for providing keyboard shortcuts throughout the application.
 * Handles global keyboard events and manages the shortcut registry.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { keyboardShortcutService, ShortcutCategory, Shortcut } from '../services/keyboard/KeyboardShortcutService';
import { DEFAULT_SHORTCUTS, formatShortcutKey } from '../services/keyboard/ShortcutDefaults';
import { useProject } from './ProjectContext';

interface KeyboardShortcutContextValue {
  // Shortcut state
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  
  // Shortcut information
  getAllShortcuts: () => Shortcut[];
  getShortcutsByCategory: (category: ShortcutCategory) => Shortcut[];
  formatShortcutKey: (key: string) => string;
  
  // UI component for showing shortcut tips
  ShortcutTooltip: React.FC<ShortcutTooltipProps>;
}

interface ShortcutTooltipProps {
  shortcutKey: string | keyof typeof DEFAULT_SHORTCUTS;
  children: ReactNode;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextValue | null>(null);

export const useKeyboardShortcutContext = () => {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error('useKeyboardShortcutContext must be used within a KeyboardShortcutProvider');
  }
  return context;
};

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const project = useProject();
  
  // Initialize shortcut service with default shortcuts
  useEffect(() => {
    // Project shortcuts
    registerProjectShortcuts();
    
    // When the component unmounts, make sure to clean up
    return () => {
      // Disable shortcut service
      keyboardShortcutService.disable();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Effect to update shortcut service when enabled state changes
  useEffect(() => {
    if (isEnabled) {
      keyboardShortcutService.enable();
    } else {
      keyboardShortcutService.disable();
    }
  }, [isEnabled]);
  
  // Register project-related shortcuts with actual actions
  const registerProjectShortcuts = () => {
    // Only register if project context is available
    if (!project) return;
    
    const projectShortcuts: Shortcut[] = [
      {
        ...DEFAULT_SHORTCUTS.NEW_PROJECT,
        action: () => project.createNewProject()
      },
      {
        ...DEFAULT_SHORTCUTS.SAVE_PROJECT,
        action: () => project.saveProject()
      },
      {
        ...DEFAULT_SHORTCUTS.SAVE_PROJECT_AS,
        action: () => {
          // This requires user input, so we need to handle it differently
          // For now, we could trigger a modal or dialog event
          const projectName = prompt('Enter a name for this project:');
          if (projectName) {
            project.saveProjectAs(projectName);
          }
        }
      },
      {
        ...DEFAULT_SHORTCUTS.EXPORT_PROJECT,
        action: () => project.exportProject()
      }
    ];
    
    // Register each shortcut
    projectShortcuts.forEach(shortcut => {
      keyboardShortcutService.registerShortcut(shortcut);
    });
  };
  
  // Get all registered shortcuts
  const getAllShortcuts = () => {
    return keyboardShortcutService.getAllShortcuts();
  };
  
  // Get shortcuts by category
  const getShortcutsByCategory = (category: ShortcutCategory) => {
    return keyboardShortcutService.getShortcutsByCategory(category);
  };
  
  // Component for rendering a tooltip with shortcut information
  const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({ shortcutKey, children }) => {
    // Get the actual key string
    const actualKey = typeof shortcutKey === 'string'
      ? shortcutKey
      : (DEFAULT_SHORTCUTS[shortcutKey] as any)?.key || '';

    // Format the key for display
    const formattedKey = formatShortcutKey(actualKey);

    return (
      <div className="shortcut-tooltip">
        {children}
        <span className="shortcut-key">{formattedKey}</span>
      </div>
    );
  };
  
  const value: KeyboardShortcutContextValue = {
    isEnabled,
    setIsEnabled,
    getAllShortcuts,
    getShortcutsByCategory,
    formatShortcutKey,
    ShortcutTooltip
  };
  
  return (
    <KeyboardShortcutContext.Provider value={value}>
      {children}
    </KeyboardShortcutContext.Provider>
  );
}; 