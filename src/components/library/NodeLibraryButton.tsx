/**
 * NodeLibraryButton
 * 
 * A button component that toggles the node library panel.
 */

import React, { useState } from 'react';
import NodeLibrary from './NodeLibrary';
import './NodeLibraryButton.css';

interface NodeLibraryButtonProps {
  className?: string;
}

const NodeLibraryButton: React.FC<NodeLibraryButtonProps> = ({ className = '' }) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  
  // Toggle library visibility
  const toggleLibrary = () => {
    setIsLibraryOpen(!isLibraryOpen);
  };
  
  // Close the library
  const closeLibrary = () => {
    setIsLibraryOpen(false);
  };
  
  return (
    <>
      <button 
        className={`node-library-button ${className} ${isLibraryOpen ? 'active' : ''}`}
        onClick={toggleLibrary}
        title="Open Node Library"
      >
        <span className="library-icon">📚</span>
        <span className="library-text">Nodes</span>
      </button>
      
      {isLibraryOpen && (
        <div className="library-overlay">
          <div className="library-container">
            <NodeLibrary onClose={closeLibrary} />
          </div>
        </div>
      )}
    </>
  );
};

export default NodeLibraryButton; 