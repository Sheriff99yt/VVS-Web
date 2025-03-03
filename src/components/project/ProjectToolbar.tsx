/**
 * ProjectToolbar
 * 
 * A toolbar component for quick access to project operations,
 * including creating, saving, loading, and exporting projects.
 */

import React, { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import ProjectMenu from './ProjectMenu';
import ProjectList from './ProjectList';
import './ProjectToolbar.css';

interface ProjectToolbarProps {
  className?: string;
}

const ProjectToolbar: React.FC<ProjectToolbarProps> = ({ className = '' }) => {
  const { currentProject, projectModified, saveProject } = useProject();
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  
  // Toggle project menu
  const toggleProjectMenu = () => {
    setShowProjectMenu(!showProjectMenu);
    setShowProjectList(false);
  };
  
  // Toggle project list
  const toggleProjectList = () => {
    setShowProjectList(!showProjectList);
    setShowProjectMenu(false);
  };
  
  // Close all menus
  const closeMenus = () => {
    setShowProjectMenu(false);
    setShowProjectList(false);
  };
  
  // Quick save
  const handleQuickSave = () => {
    if (currentProject) {
      saveProject();
    } else {
      // If no current project, show project menu with save dialog
      setShowProjectMenu(true);
      setShowProjectList(false);
    }
  };
  
  return (
    <div className={`project-toolbar ${className}`}>
      <div className="toolbar-left">
        <button 
          className="toolbar-button menu-button"
          onClick={toggleProjectMenu}
          title="Project Menu"
        >
          <span className="button-icon">☰</span>
          <span className="button-text">Project</span>
        </button>
        
        <button 
          className="toolbar-button open-button"
          onClick={toggleProjectList}
          title="Open Project"
        >
          <span className="button-icon">📂</span>
          <span className="button-text">Open</span>
        </button>
      </div>
      
      <div className="toolbar-center">
        {currentProject && (
          <div className="current-project">
            <span className="project-name">
              {currentProject.metadata.name}
              {projectModified && <span className="modified-indicator">*</span>}
            </span>
          </div>
        )}
      </div>
      
      <div className="toolbar-right">
        <button 
          className="toolbar-button save-button"
          onClick={handleQuickSave}
          disabled={!projectModified && !!currentProject}
          title="Save Project"
        >
          <span className="button-icon">💾</span>
          <span className="button-text">Save</span>
        </button>
      </div>
      
      {showProjectMenu && (
        <div className="menu-overlay">
          <div className="menu-container">
            <ProjectMenu onClose={closeMenus} />
          </div>
        </div>
      )}
      
      {showProjectList && (
        <div className="menu-overlay">
          <div className="menu-container">
            <ProjectList onClose={closeMenus} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectToolbar; 