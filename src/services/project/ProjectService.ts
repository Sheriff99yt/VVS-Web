/**
 * ProjectService
 * 
 * Service for managing VVS Web projects, including saving, loading,
 * listing, and deleting projects. This implementation uses localStorage
 * for persistence but could be extended to use other storage methods.
 */

import { Project, ProjectSummary, createProjectSummary } from '../../models/project';

export class ProjectService {
  private static readonly PROJECT_LIST_KEY = 'vvs-projects-list';
  private static readonly PROJECT_PREFIX = 'vvs-project-';
  
  /**
   * Save a project to localStorage
   */
  public saveProject(project: Project): void {
    // Update the project's last modified date
    project.metadata.updatedAt = new Date().toISOString();
    
    // Save the project data
    const projectKey = `${ProjectService.PROJECT_PREFIX}${project.metadata.id}`;
    localStorage.setItem(projectKey, JSON.stringify(project));
    
    // Update the project list
    this.updateProjectList(project);
  }
  
  /**
   * Load a project by ID
   */
  public loadProject(projectId: string): Project | null {
    const projectKey = `${ProjectService.PROJECT_PREFIX}${projectId}`;
    const projectJson = localStorage.getItem(projectKey);
    
    if (!projectJson) {
      return null;
    }
    
    try {
      return JSON.parse(projectJson) as Project;
    } catch (error) {
      console.error('Error parsing project data:', error);
      return null;
    }
  }
  
  /**
   * Delete a project by ID
   */
  public deleteProject(projectId: string): boolean {
    const projectKey = `${ProjectService.PROJECT_PREFIX}${projectId}`;
    
    // Remove from localStorage
    localStorage.removeItem(projectKey);
    
    // Update the project list
    this.removeProjectFromList(projectId);
    
    return true;
  }
  
  /**
   * Get a list of all project summaries
   */
  public getProjectList(): ProjectSummary[] {
    const listJson = localStorage.getItem(ProjectService.PROJECT_LIST_KEY);
    
    if (!listJson) {
      return [];
    }
    
    try {
      return JSON.parse(listJson) as ProjectSummary[];
    } catch (error) {
      console.error('Error parsing project list:', error);
      return [];
    }
  }
  
  /**
   * Update the project list with a new or updated project
   */
  private updateProjectList(project: Project): void {
    const projectList = this.getProjectList();
    const summary = createProjectSummary(project);
    
    // Check if project already exists in the list
    const existingIndex = projectList.findIndex(p => p.id === project.metadata.id);
    
    if (existingIndex >= 0) {
      // Update existing project summary
      projectList[existingIndex] = summary;
    } else {
      // Add new project summary
      projectList.push(summary);
    }
    
    // Sort by most recently updated
    projectList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Save updated list
    localStorage.setItem(ProjectService.PROJECT_LIST_KEY, JSON.stringify(projectList));
  }
  
  /**
   * Remove a project from the project list
   */
  private removeProjectFromList(projectId: string): void {
    const projectList = this.getProjectList();
    const updatedList = projectList.filter(p => p.id !== projectId);
    
    localStorage.setItem(ProjectService.PROJECT_LIST_KEY, JSON.stringify(updatedList));
  }
  
  /**
   * Export a project to a JSON file
   */
  public exportProject(project: Project): void {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportName = `${project.metadata.name.replace(/\s+/g, '_')}_${project.metadata.version}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    
    linkElement.click();
  }
  
  /**
   * Import a project from a JSON file
   */
  public async importProject(file: File): Promise<Project | null> {
    try {
      const text = await file.text();
      const project = JSON.parse(text) as Project;
      
      // Validate the project structure
      if (!this.validateProject(project)) {
        throw new Error('Invalid project file format');
      }
      
      // Save the imported project
      this.saveProject(project);
      
      return project;
    } catch (error) {
      console.error('Error importing project:', error);
      return null;
    }
  }
  
  /**
   * Validate a project structure
   */
  private validateProject(project: any): boolean {
    // Basic validation for required fields
    return (
      project &&
      project.metadata &&
      project.metadata.id &&
      project.metadata.name &&
      project.flowData &&
      Array.isArray(project.flowData.nodes) &&
      Array.isArray(project.flowData.edges)
    );
  }
} 