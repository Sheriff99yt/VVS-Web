import React, { useEffect, useRef } from 'react';
import './NodeContextMenu.css';

interface NodeContextMenuProps {
  onClose: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  onClose,
  onDelete,
  onDuplicate,
  onRename
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  return (
    <div className="node-context-menu" ref={menuRef}>
      <div className="context-menu-title">Node Actions</div>
      <div className="context-menu-items">
        {onDelete && (
          <div className="context-menu-item" onClick={onDelete}>
            <span className="context-menu-icon">🗑️</span>
            <span>Delete</span>
          </div>
        )}
        {onDuplicate && (
          <div className="context-menu-item" onClick={onDuplicate}>
            <span className="context-menu-icon">📋</span>
            <span>Duplicate</span>
          </div>
        )}
        {onRename && (
          <div className="context-menu-item" onClick={onRename}>
            <span className="context-menu-icon">✏️</span>
            <span>Rename</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeContextMenu; 