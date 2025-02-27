import React from 'react';
import './NodeContextMenu.css';

interface NodeContextMenuProps {
  x: number;
  y: number;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canPaste: boolean;
  hasSelection: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  x,
  y,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  canPaste,
  hasSelection
}) => {
  return (
    <div 
      className="node-context-menu"
      style={{
        left: x,
        top: y,
      }}
    >
      <button 
        className="context-menu-item"
        onClick={onCopy}
        disabled={!hasSelection}
      >
        Copy
        <span className="shortcut">Ctrl+C</span>
      </button>
      <button 
        className="context-menu-item"
        onClick={onCut}
        disabled={!hasSelection}
      >
        Cut
        <span className="shortcut">Ctrl+X</span>
      </button>
      <button 
        className="context-menu-item"
        onClick={onPaste}
        disabled={!canPaste}
      >
        Paste
        <span className="shortcut">Ctrl+V</span>
      </button>
      <div className="context-menu-separator" />
      <button 
        className="context-menu-item"
        onClick={onDuplicate}
        disabled={!hasSelection}
      >
        Duplicate
        <span className="shortcut">Ctrl+D</span>
      </button>
      <button 
        className="context-menu-item delete"
        onClick={onDelete}
        disabled={!hasSelection}
      >
        Delete
        <span className="shortcut">Del</span>
      </button>
    </div>
  );
};

export default NodeContextMenu; 