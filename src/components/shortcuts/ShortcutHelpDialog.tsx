/**
 * ShortcutHelpDialog
 * 
 * A dialog component that displays all available keyboard shortcuts to the user.
 * Organized by category for easy reference.
 */

import React from 'react';
import { ShortcutCategory } from '../../services/keyboard/KeyboardShortcutService';
import { useKeyboardShortcutContext } from '../../contexts/KeyboardShortcutContext';
import './ShortcutHelpDialog.css';

interface ShortcutHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutHelpDialog: React.FC<ShortcutHelpDialogProps> = ({ isOpen, onClose }) => {
  const { getAllShortcuts, getShortcutsByCategory, formatShortcutKey } = useKeyboardShortcutContext();
  
  // Skip rendering if the dialog is not open
  if (!isOpen) {
    return null;
  }
  
  // Category titles for display
  const categoryTitles: Record<ShortcutCategory, string> = {
    general: 'General',
    project: 'Project Management',
    canvas: 'Canvas Navigation & Editing',
    node: 'Node Operations',
    editor: 'Editor Controls'
  };
  
  // Get all categories from the registered shortcuts
  const categories = Array.from(
    new Set(getAllShortcuts().map(shortcut => shortcut.category))
  ) as ShortcutCategory[];
  
  return (
    <div className="shortcut-help-dialog-backdrop">
      <div className="shortcut-help-dialog">
        <div className="shortcut-help-header">
          <h2>Keyboard Shortcuts</h2>
          <button 
            className="shortcut-help-close" 
            onClick={onClose}
            aria-label="Close shortcut help dialog"
          >
            ×
          </button>
        </div>
        
        <div className="shortcut-help-content">
          {categories.map(category => {
            const shortcuts = getShortcutsByCategory(category);
            
            if (shortcuts.length === 0) {
              return null;
            }
            
            return (
              <div key={category} className="shortcut-category">
                <h3 className="shortcut-category-title">{categoryTitles[category]}</h3>
                <div className="shortcut-list">
                  {shortcuts.map((shortcut, index) => (
                    <div key={index} className="shortcut-item">
                      <div className="shortcut-description">{shortcut.description}</div>
                      <div className="shortcut-key-container">
                        <span className="shortcut-key">{formatShortcutKey(shortcut.key)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="shortcut-help-footer">
          <p>
            Keyboard shortcuts can be customized in the Settings panel.
          </p>
          <button onClick={onClose} className="shortcut-help-done">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}; 