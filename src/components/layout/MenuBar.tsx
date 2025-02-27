import React from 'react';
import './MenuBar.css';

interface MenuBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onDuplicate: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  hasSelection: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onDuplicate,
  onSelectAll,
  onDeselectAll,
  canUndo,
  canRedo,
  canCopy,
  canPaste,
  hasSelection
}) => {
  return (
    <div className="menu-bar">
      <div className="menu-group">
        <button 
          className="menu-button" 
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo"
        >
          <i className="fas fa-undo"></i>
          <div className="button-content">
            <span>Undo</span>
            <span className="shortcut">Ctrl+Z</span>
          </div>
        </button>
        <button 
          className="menu-button" 
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo"
        >
          <i className="fas fa-redo"></i>
          <div className="button-content">
            <span>Redo</span>
            <span className="shortcut">Ctrl+Y</span>
          </div>
        </button>
      </div>
      <div className="menu-group">
        <button 
          className="menu-button" 
          onClick={onCopy}
          disabled={!canCopy}
          title="Copy"
        >
          <i className="fas fa-copy"></i>
          <div className="button-content">
            <span>Copy</span>
            <span className="shortcut">Ctrl+C</span>
          </div>
        </button>
        <button 
          className="menu-button" 
          onClick={onCut}
          disabled={!canCopy}
          title="Cut"
        >
          <i className="fas fa-cut"></i>
          <div className="button-content">
            <span>Cut</span>
            <span className="shortcut">Ctrl+X</span>
          </div>
        </button>
        <button 
          className="menu-button" 
          onClick={onPaste}
          disabled={!canPaste}
          title="Paste"
        >
          <i className="fas fa-paste"></i>
          <div className="button-content">
            <span>Paste</span>
            <span className="shortcut">Ctrl+V</span>
          </div>
        </button>
        <button 
          className="menu-button" 
          onClick={onDuplicate}
          disabled={!canCopy}
          title="Duplicate"
        >
          <i className="fas fa-clone"></i>
          <div className="button-content">
            <span>Duplicate</span>
            <span className="shortcut">Ctrl+D</span>
          </div>
        </button>
      </div>
      <div className="menu-group">
        <button 
          className="menu-button" 
          onClick={onSelectAll}
          title="Select All"
        >
          <i className="fas fa-object-group"></i>
          <div className="button-content">
            <span>Select All</span>
            <span className="shortcut">Ctrl+A</span>
          </div>
        </button>
        <button 
          className="menu-button" 
          onClick={onDeselectAll}
          disabled={!hasSelection}
          title="Deselect All"
        >
          <i className="fas fa-object-ungroup"></i>
          <div className="button-content">
            <span>Deselect All</span>
            <span className="shortcut">Esc</span>
          </div>
        </button>
      </div>
      <div className="menu-group">
        <div className="menu-items">
          <div className="menu-item">
            <span>File</span>
            <div className="dropdown-content">
              <div className="dropdown-item">New</div>
              <div className="dropdown-item">Open</div>
              <div className="dropdown-item">Save</div>
              <div className="dropdown-item">Save As</div>
              <div className="dropdown-item">Exit</div>
            </div>
          </div>
          <div className="menu-item">
            <span>Help</span>
            <div className="dropdown-content">
              <div className="dropdown-item">Documentation</div>
              <div className="dropdown-item">About</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuBar; 