/**
 * ProjectMenu
 * 
 * A menu component for project management operations, including
 * creating new projects, saving, loading, and exporting.
 */

import React, { useState, useRef } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import './ProjectMenu.css';

interface ProjectMenuProps {
  onClose?: () => void;
}

const ProjectMenu: React.FC<ProjectMenuProps> = ({ onClose }) => {
  const {
    currentProject,
    projectModified,
    createNewProject,
    saveProject,
    saveProjectAs,
    exportProject,
    importProject
  } = useProject();
  
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle new project click
  const handleNewProject = () => {
    if (projectModified) {
      if (window.confirm('You have unsaved changes. Create a new project anyway?')) {
        createNewProject();
        if (onClose) onClose();
      }
    } else {
      createNewProject();
      if (onClose) onClose();
    }
  };
  
  // Handle save click
  const handleSave = () => {
    if (currentProject) {
      saveProject();
      if (onClose) onClose();
    } else {
      setShowSaveAsDialog(true);
    }
  };
  
  // Handle save as click
  const handleSaveAs = () => {
    setShowSaveAsDialog(true);
  };
  
  // Handle save as dialog submit
  const handleSaveAsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (projectName.trim()) {
      saveProjectAs(projectName.trim(), projectDescription.trim() || undefined);
      setShowSaveAsDialog(false);
      setProjectName('');
      setProjectDescription('');
      if (onClose) onClose();
    }
  };
  
  // Handle export click
  const handleExport = () => {
    if (currentProject) {
      exportProject();
      if (onClose) onClose();
    } else {
      alert('No project to export. Please create or load a project first.');
    }
  };
  
  // Handle import click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file selection for import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    const file = files[0];
    
    if (projectModified) {
      if (window.confirm('You have unsaved changes. Import a project anyway?')) {
        await importProject(file);
        if (onClose) onClose();
      }
    } else {
      await importProject(file);
      if (onClose) onClose();
    }
    
    // Reset the file input
    e.target.value = '';
  };
  
  return (
    <div className="project-menu">
      <div className="project-menu-header">
        <h3>Project Menu</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="project-menu-content">
        <div className="menu-section">
          <h4>Project Operations</h4>
          <button className="menu-button" onClick={handleNewProject}>New Project</button>
          <button className="menu-button" onClick={handleSave}>Save Project</button>
          <button className="menu-button" onClick={handleSaveAs}>Save As...</button>
        </div>
        
        <div className="menu-section">
          <h4>Import & Export</h4>
          <button className="menu-button" onClick={handleExport}>Export Project</button>
          <button className="menu-button" onClick={handleImportClick}>Import Project</button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileChange}
          />
        </div>
        
        {currentProject && (
          <div className="project-info">
            <h4>Current Project</h4>
            <p><strong>Name:</strong> {currentProject.metadata.name}</p>
            <p><strong>Last Modified:</strong> {new Date(currentProject.metadata.updatedAt).toLocaleString()}</p>
            {projectModified && <span className="modified-badge">Modified</span>}
          </div>
        )}
      </div>
      
      {showSaveAsDialog && (
        <div className="dialog-overlay">
          <div className="save-as-dialog">
            <h3>Save Project As</h3>
            <form onSubmit={handleSaveAsSubmit}>
              <div className="form-group">
                <label htmlFor="project-name">Project Name:</label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="project-description">Description (optional):</label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              
              <div className="dialog-buttons">
                <button type="button" onClick={() => setShowSaveAsDialog(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMenu; 