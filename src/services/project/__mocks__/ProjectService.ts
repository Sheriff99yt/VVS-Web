/**
 * Mock ProjectService for testing
 * 
 * This mock implementation simulates the behavior of the real ProjectService
 * but doesn't actually persist data to localStorage.
 */

import { Project, ProjectSummary, createEmptyProject, createProjectSummary } from '../../../models/project';

export class ProjectService {
  private projects: Map<string, Project> = new Map();
  
  /**
   * Create a new project with the specified name
   */
  public async createProject(name?: string): Promise<Project> {
    const project = createEmptyProject(name);
    this.projects.set(project.metadata.id, project);
    return project;
  }
  
  /**
   * Save a project 
   */
  public async saveProject(project: Project): Promise<Project> {
    // Update the project's last modified date
    project.metadata.updatedAt = new Date().toISOString();
    
    // Save the project data
    this.projects.set(project.metadata.id, { ...project });
    
    return project;
  }
  
  /**
   * Load a project by ID
   */
  public async loadProject(projectId: string): Promise<Project | null> {
    const project = this.projects.get(projectId);
    return project ? { ...project } : null;
  }
  
  /**
   * Delete a project by ID
   */
  public async deleteProject(projectId: string): Promise<boolean> {
    if (this.projects.has(projectId)) {
      this.projects.delete(projectId);
      return true;
    }
    return false;
  }
  
  /**
   * Get a list of all project summaries
   */
  public async getProjectList(): Promise<ProjectSummary[]> {
    return Array.from(this.projects.values())
      .map(project => createProjectSummary(project))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  
  /**
   * Export a project to a JSON string
   */
  public async exportProject(projectId: string): Promise<string | null> {
    const project = this.projects.get(projectId);
    
    if (!project) {
      return null;
    }
    
    return JSON.stringify(project, null, 2);
  }
  
  /**
   * Import a project from a JSON string
   */
  public async importProject(projectJson: string): Promise<Project | null> {
    try {
      const project = JSON.parse(projectJson) as Project;
      
      // Generate a new ID for the imported project
      project.metadata.id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Save the imported project
      this.projects.set(project.metadata.id, project);
      
      return project;
    } catch (error) {
      console.error('Error importing project:', error);
      throw new Error('Invalid project file format');
    }
  }
} 