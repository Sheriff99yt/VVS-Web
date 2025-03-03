/**
 * ProjectContext
 * 
 * React context for managing projects throughout the application.
 * Provides current project state and methods for project operations.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useReactFlow, Node, Edge, ReactFlowProvider } from 'reactflow';
import { Project, ProjectSummary, createEmptyProject } from '../models/project';
import { ProjectService } from '../services/project/ProjectService';

interface ProjectContextValue {
  // Current project state
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projectModified: boolean;
  setProjectModified: (modified: boolean) => void;
  
  // Project operations
  createNewProject: (name?: string) => void;
  saveProject: () => void;
  saveProjectAs: (name: string, description?: string) => void;
  loadProject: (projectId: string) => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  
  // Project list
  projectList: ProjectSummary[];
  refreshProjectList: () => void;
  
  // Import/Export
  exportProject: () => void;
  importProject: (file: File) => Promise<boolean>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

// This is the actual provider implementation that uses React Flow hooks
const ProjectProviderImplementation: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectModified, setProjectModified] = useState(false);
  const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
  const [projectService] = useState(() => new ProjectService());
  
  const reactFlowInstance = useReactFlow();
  
  // Load project list on mount
  useEffect(() => {
    refreshProjectList();
  }, []);
  
  // Update current project's flow data when nodes or edges change
  useEffect(() => {
    if (currentProject && projectModified && reactFlowInstance) {
      try {
        const { nodes, edges, viewport } = reactFlowInstance.toObject();
        
        setCurrentProject({
          ...currentProject,
          flowData: {
            nodes,
            edges,
            viewport: {
              x: viewport.x,
              y: viewport.y,
              zoom: viewport.zoom
            }
          }
        });
      } catch (error) {
        console.error('Error updating project with flow data:', error);
      }
    }
  }, [projectModified]);
  
  const refreshProjectList = () => {
    setProjectList(projectService.getProjectList());
  };
  
  const createNewProject = (name = 'Untitled Project') => {
    // Create a new empty project
    const newProject = createEmptyProject(name);
    
    // Set the current project
    setCurrentProject(newProject);
    
    // Reset the flow editor if available
    if (reactFlowInstance) {
      try {
        reactFlowInstance.setNodes([]);
        reactFlowInstance.setEdges([]);
      } catch (error) {
        console.error('Error resetting flow editor:', error);
      }
    }
    
    // Reset modified flag
    setProjectModified(false);
  };
  
  const saveProject = () => {
    if (!currentProject) {
      return;
    }
    
    // Update flow data from the current state if reactFlowInstance is available
    if (reactFlowInstance) {
      try {
        const { nodes, edges, viewport } = reactFlowInstance.toObject();
        
        const updatedProject: Project = {
          ...currentProject,
          flowData: {
            nodes,
            edges,
            viewport: {
              x: viewport.x,
              y: viewport.y,
              zoom: viewport.zoom
            }
          }
        };
        
        // Save the project
        projectService.saveProject(updatedProject);
        
        // Update state
        setCurrentProject(updatedProject);
        setProjectModified(false);
        
        // Refresh project list
        refreshProjectList();
      } catch (error) {
        console.error('Error saving project:', error);
      }
    } else {
      // If reactFlowInstance is not available, just save the current project as is
      projectService.saveProject(currentProject);
      setProjectModified(false);
      refreshProjectList();
    }
  };
  
  const saveProjectAs = (name: string, description = 'A VVS Web project') => {
    if (!currentProject) {
      return;
    }
    
    // Create a new project with a new ID
    const newProject = createEmptyProject(name);
    newProject.metadata.description = description;
    
    // Add flow data if reactFlowInstance is available
    if (reactFlowInstance) {
      try {
        const { nodes, edges, viewport } = reactFlowInstance.toObject();
        
        newProject.flowData = {
          nodes,
          edges,
          viewport: {
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom
          }
        };
      } catch (error) {
        console.error('Error getting flow data for saveProjectAs:', error);
        // Use current project's flow data as fallback
        newProject.flowData = currentProject.flowData;
      }
    } else {
      // Use current project's flow data if reactFlowInstance is not available
      newProject.flowData = currentProject.flowData;
    }
    
    // Save the new project
    projectService.saveProject(newProject);
    
    // Update state
    setCurrentProject(newProject);
    setProjectModified(false);
    
    // Refresh project list
    refreshProjectList();
  };
  
  const loadProject = async (projectId: string): Promise<boolean> => {
    // Load the project
    const project = projectService.loadProject(projectId);
    
    if (!project) {
      return false;
    }
    
    // Update the current project
    setCurrentProject(project);
    
    // Update the flow editor with the project data if reactFlowInstance is available
    if (reactFlowInstance) {
      try {
        reactFlowInstance.setNodes(project.flowData.nodes as Node[]);
        reactFlowInstance.setEdges(project.flowData.edges as Edge[]);
        
        // Set viewport
        if (project.flowData.viewport) {
          reactFlowInstance.setViewport({
            x: project.flowData.viewport.x,
            y: project.flowData.viewport.y,
            zoom: project.flowData.viewport.zoom
          });
        }
      } catch (error) {
        console.error('Error loading project into flow editor:', error);
      }
    }
    
    // Reset modified flag
    setProjectModified(false);
    
    return true;
  };
  
  const deleteProject = async (projectId: string): Promise<boolean> => {
    // Check if trying to delete the current project
    if (currentProject && currentProject.metadata.id === projectId) {
      // Create a new empty project
      createNewProject();
    }
    
    // Delete the project
    const success = projectService.deleteProject(projectId);
    
    // Refresh project list
    refreshProjectList();
    
    return success;
  };
  
  const exportProject = () => {
    if (!currentProject) {
      return;
    }
    
    let exportableProject: Project = { ...currentProject };
    
    // Update flow data from the current state if reactFlowInstance is available
    if (reactFlowInstance) {
      try {
        const { nodes, edges, viewport } = reactFlowInstance.toObject();
        
        exportableProject = {
          ...currentProject,
          flowData: {
            nodes,
            edges,
            viewport: {
              x: viewport.x,
              y: viewport.y,
              zoom: viewport.zoom
            }
          }
        };
      } catch (error) {
        console.error('Error getting flow data for export:', error);
        // Use current project's data as is
      }
    }
    
    // Export the project
    projectService.exportProject(exportableProject);
  };
  
  const importProject = async (file: File): Promise<boolean> => {
    const project = await projectService.importProject(file);
    
    if (!project) {
      return false;
    }
    
    // Update the current project
    setCurrentProject(project);
    
    // Update the flow editor with the project data if reactFlowInstance is available
    if (reactFlowInstance) {
      try {
        reactFlowInstance.setNodes(project.flowData.nodes as Node[]);
        reactFlowInstance.setEdges(project.flowData.edges as Edge[]);
        
        // Set viewport if available
        if (project.flowData.viewport) {
          reactFlowInstance.setViewport({
            x: project.flowData.viewport.x,
            y: project.flowData.viewport.y,
            zoom: project.flowData.viewport.zoom
          });
        }
      } catch (error) {
        console.error('Error loading imported project into flow editor:', error);
      }
    }
    
    // Reset modified flag
    setProjectModified(false);
    
    return true;
  };
  
  // Context value
  const value: ProjectContextValue = {
    currentProject,
    setCurrentProject,
    projectModified,
    setProjectModified,
    createNewProject,
    saveProject,
    saveProjectAs,
    loadProject,
    deleteProject,
    projectList,
    refreshProjectList,
    exportProject,
    importProject
  };
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

// This is the exported provider that wraps the implementation with ReactFlowProvider
export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  return (
    <ReactFlowProvider>
      <ProjectProviderImplementation>{children}</ProjectProviderImplementation>
    </ReactFlowProvider>
  );
}; 