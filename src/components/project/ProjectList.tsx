/**
 * ProjectList
 * 
 * A component for displaying a list of saved projects,
 * with options to load, delete, or create a new project.
 */

import React, { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { ProjectSummary } from '../../models/project';
import './ProjectList.css';

interface ProjectListProps {
  onClose?: () => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ onClose }) => {
  const { 
    projectList, 
    loadProject, 
    deleteProject, 
    createNewProject,
    refreshProjectList
  } = useProject();
  
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
  };
  
  // Handle loading a project
  const handleLoadProject = async () => {
    if (selectedProject) {
      setLoading(true);
      try {
        const success = await loadProject(selectedProject);
        if (success && onClose) {
          onClose();
        }
      } catch (error) {
        console.error('Error loading project:', error);
        alert('Failed to load project. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Handle confirming deletion
  const handleConfirmDelete = (projectId: string) => {
    setConfirmDelete(projectId);
  };
  
  // Handle actual deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      const success = await deleteProject(projectId);
      if (success) {
        setConfirmDelete(null);
        setSelectedProject(null);
        refreshProjectList();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };
  
  // Handle canceling deletion
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };
  
  // Handle creating a new project
  const handleNewProject = () => {
    createNewProject();
    if (onClose) onClose();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render each project item
  const renderProjectItem = (project: ProjectSummary) => {
    const isSelected = selectedProject === project.id;
    const isConfirmingDelete = confirmDelete === project.id;
    
    return (
      <li 
        key={project.id} 
        className={`project-item ${isSelected ? 'selected' : ''}`}
        onClick={() => handleSelectProject(project.id)}
      >
        <div className="project-item-content">
          <div className="project-item-header">
            <h4>{project.name}</h4>
            <span className="project-date">{formatDate(project.updatedAt)}</span>
          </div>
          
          <div className="project-description">
            {project.description}
          </div>
          
          {project.tags && project.tags.length > 0 && (
            <div className="project-tags">
              {project.tags.map(tag => (
                <span key={tag} className="project-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        
        {isSelected && !isConfirmingDelete && (
          <div className="project-actions">
            <button 
              className="action-button load" 
              onClick={handleLoadProject}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
            <button 
              className="action-button delete" 
              onClick={() => handleConfirmDelete(project.id)}
            >
              Delete
            </button>
          </div>
        )}
        
        {isConfirmingDelete && (
          <div className="delete-confirmation">
            <p>Are you sure you want to delete this project?</p>
            <div className="confirmation-buttons">
              <button 
                className="confirmation-button cancel" 
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button 
                className="confirmation-button confirm" 
                onClick={() => handleDeleteProject(project.id)}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </li>
    );
  };
  
  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h3>Your Projects</h3>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="project-list-actions">
        <button className="new-project-button" onClick={handleNewProject}>
          + New Project
        </button>
      </div>
      
      {projectList.length === 0 ? (
        <div className="no-projects">
          <p>You don't have any saved projects yet.</p>
          <button className="start-project-button" onClick={handleNewProject}>
            Start a New Project
          </button>
        </div>
      ) : (
        <ul className="project-list">
          {projectList.map(renderProjectItem)}
        </ul>
      )}
    </div>
  );
};

export default ProjectList; 