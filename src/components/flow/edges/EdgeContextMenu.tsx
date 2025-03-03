/**
 * EdgeContextMenu
 * 
 * A context menu component for edges in the flow editor.
 * Provides options to delete, label, or change the appearance of edges.
 */

import React, { useState, useEffect, useRef, FC } from 'react';
import './EdgeContextMenu.css';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  edgeLabel?: string;
  isValid?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onLabelChange?: (label: string) => void;
  onValidityToggle?: (isValid: boolean) => void;
}

const EdgeContextMenu: FC<EdgeContextMenuProps> = ({
  x,
  y,
  edgeId,
  edgeLabel = '',
  isValid = true,
  onClose,
  onDelete,
  onLabelChange,
  onValidityToggle
}) => {
  const [position, setPosition] = useState({ x, y });
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [label, setLabel] = useState(edgeLabel);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Adjust position if needed to ensure menu is visible
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Check if menu is outside right edge
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10;
      }
      
      // Check if menu is outside bottom edge
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10;
      }
      
      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);
  
  // Handle click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle label input
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };
  
  const handleLabelSubmit = () => {
    if (onLabelChange) {
      onLabelChange(label);
    }
    setShowLabelInput(false);
  };
  
  // Handle keypress in label input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLabelSubmit();
    } else if (e.key === 'Escape') {
      setShowLabelInput(false);
    }
  };
  
  return (
    <div 
      className="edge-context-menu"
      style={{
        left: position.x,
        top: position.y
      }}
      ref={menuRef}
    >
      <div className="menu-title">Edge Menu</div>
      <div className="menu-items">
        <button 
          className="menu-item delete-item" 
          onClick={onDelete}
        >
          Delete Connection
        </button>
        
        {onLabelChange && (
          <>
            {showLabelInput ? (
              <div className="label-input-container">
                <input
                  type="text"
                  value={label}
                  onChange={handleLabelChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter label"
                  autoFocus
                  className="label-input"
                />
                <button 
                  className="submit-label-button"
                  onClick={handleLabelSubmit}
                >
                  ✓
                </button>
              </div>
            ) : (
              <button 
                className="menu-item label-item" 
                onClick={() => setShowLabelInput(true)}
              >
                {edgeLabel ? 'Edit Label' : 'Add Label'}
              </button>
            )}
          </>
        )}
        
        {onValidityToggle && (
          <button 
            className={`menu-item validity-item ${isValid ? 'valid' : 'invalid'}`}
            onClick={() => onValidityToggle(!isValid)}
          >
            {isValid ? 'Mark as Invalid' : 'Mark as Valid'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EdgeContextMenu; 