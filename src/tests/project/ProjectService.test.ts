/**
 * ProjectService.test.ts
 * 
 * Tests for the project management service.
 * Verifies project creation, saving, loading, and other operations.
 */

import { ProjectService } from '../../services/project/__mocks__/ProjectService';
import { Project, createEmptyProject } from '../../models/project';
import { Node, Edge } from 'reactflow';

// Mock IndexedDB for testing
beforeEach(() => {
  // Reset IndexedDB mock before each test
  if ((global as any).__resetIndexedDB) {
    (global as any).__resetIndexedDB();
  }
});

describe('ProjectService', () => {
  let projectService: ProjectService;
  
  beforeEach(() => {
    // Create a new instance for each test
    projectService = new ProjectService();
  });
  
  // Test project creation
  describe('createProject', () => {
    it('creates a new project with the specified name', async () => {
      const project = await projectService.createProject('Test Project');
      
      expect(project).toBeDefined();
      expect(project.metadata.id).toBeDefined();
      expect(project.metadata.name).toBe('Test Project');
      expect(project.flowData.nodes).toEqual([]);
      expect(project.flowData.edges).toEqual([]);
    });
    
    it('creates a project with default name if none provided', async () => {
      const project = await projectService.createProject();
      
      expect(project).toBeDefined();
      expect(project.metadata.name).toMatch(/Untitled Project \d+/);
    });
  });
  
  // Test project saving
  describe('saveProject', () => {
    it('saves a new project to the database', async () => {
      const project = createEmptyProject('Test Project');
      
      // Add test data to project
      project.flowData.nodes = [{ id: 'node1', type: 'input', position: { x: 100, y: 100 }, data: {} }] as Node[];
      project.flowData.edges = [{ id: 'edge1', source: 'node1', target: 'node2' }] as Edge[];
      
      // Save the project
      const savedProject = await projectService.saveProject(project);
      
      // Project should have an ID after saving
      expect(savedProject.metadata.id).toBeDefined();
      
      // Load the project to verify it was saved
      const loadedProject = await projectService.loadProject(savedProject.metadata.id);
      
      expect(loadedProject).toBeDefined();
      if (loadedProject) {
        expect(loadedProject.metadata.id).toBe(savedProject.metadata.id);
        expect(loadedProject.metadata.name).toBe('Test Project');
        expect(loadedProject.flowData.nodes).toHaveLength(1);
        expect(loadedProject.flowData.edges).toHaveLength(1);
      }
    });
    
    it('updates an existing project', async () => {
      // First create and save a project
      const project = await projectService.createProject('Initial Name');
      const savedProject = await projectService.saveProject(project);
      
      // Update the project
      savedProject.metadata.name = 'Updated Name';
      savedProject.flowData.nodes = [{ id: 'newNode', type: 'function', position: { x: 200, y: 200 }, data: {} }] as Node[];
      
      // Save the updated project
      const updatedProject = await projectService.saveProject(savedProject);
      
      // Load the project to verify changes
      const loadedProject = await projectService.loadProject(updatedProject.metadata.id);
      
      if (loadedProject) {
        expect(loadedProject.metadata.name).toBe('Updated Name');
        expect(loadedProject.flowData.nodes).toHaveLength(1);
        expect(loadedProject.flowData.nodes[0].id).toBe('newNode');
      }
    });
  });
  
  // Test project loading
  describe('loadProject', () => {
    it('loads a project by ID', async () => {
      // Create and save a project first
      const project = await projectService.createProject('Load Test');
      project.metadata.description = 'Test description';
      const savedProject = await projectService.saveProject(project);
      
      // Load the project
      const loadedProject = await projectService.loadProject(savedProject.metadata.id);
      
      expect(loadedProject).toBeDefined();
      if (loadedProject) {
        expect(loadedProject.metadata.id).toBe(savedProject.metadata.id);
        expect(loadedProject.metadata.name).toBe('Load Test');
        expect(loadedProject.metadata.description).toBe('Test description');
      }
    });
    
    it('returns null when loading a non-existent project', async () => {
      const loadedProject = await projectService.loadProject('non-existent-id');
      expect(loadedProject).toBeNull();
    });
  });
  
  // Test project deletion
  describe('deleteProject', () => {
    it('deletes a project by ID', async () => {
      // Create and save a project first
      const project = await projectService.createProject('Delete Test');
      const savedProject = await projectService.saveProject(project);
      
      // Verify project exists
      let loadedProject = await projectService.loadProject(savedProject.metadata.id);
      expect(loadedProject).toBeDefined();
      
      // Delete the project
      await projectService.deleteProject(savedProject.metadata.id);
      
      // Verify project was deleted
      loadedProject = await projectService.loadProject(savedProject.metadata.id);
      expect(loadedProject).toBeNull();
    });
  });
  
  // Test project listing
  describe('getProjectList', () => {
    it('returns a list of all projects', async () => {
      // Create and save several projects
      await projectService.createProject('Project 1').then(p => projectService.saveProject(p));
      await projectService.createProject('Project 2').then(p => projectService.saveProject(p));
      await projectService.createProject('Project 3').then(p => projectService.saveProject(p));
      
      // Get the project list
      const projectList = await projectService.getProjectList();
      
      expect(projectList).toBeDefined();
      expect(projectList.length).toBeGreaterThanOrEqual(3);
      
      // Verify project summaries contain expected fields
      const project1 = projectList.find(p => p.name === 'Project 1');
      expect(project1).toBeDefined();
      if (project1) {
        expect(project1.id).toBeDefined();
        expect(project1.updatedAt).toBeDefined();
      }
    });
  });
  
  // Test project export/import
  describe('exportProject', () => {
    it('exports a project to a JSON string', async () => {
      // Create a project with test data
      const project = await projectService.createProject('Export Test');
      project.flowData.nodes = [
        { id: 'node1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Input' } }
      ] as Node[];
      project.flowData.edges = [
        { id: 'edge1', source: 'node1', target: 'node2', type: 'default' }
      ] as Edge[];
      
      // Save the project
      const savedProject = await projectService.saveProject(project);
      
      // Export the project
      const exported = await projectService.exportProject(savedProject.metadata.id);
      
      expect(exported).toBeDefined();
      
      if (exported) {
        // Parse the exported JSON
        const parsed = JSON.parse(exported);
        
        expect(parsed.metadata.name).toBe('Export Test');
        expect(parsed.flowData.nodes).toHaveLength(1);
        expect(parsed.flowData.edges).toHaveLength(1);
      }
    });
  });
  
  describe('importProject', () => {
    it('imports a project from a JSON string', async () => {
      // Create a sample project JSON
      const projectJson = JSON.stringify({
        metadata: {
          name: 'Imported Project',
          description: 'Imported from JSON',
          author: 'Test User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          tags: []
        },
        flowData: {
          nodes: [
            { id: 'importedNode', type: 'function', position: { x: 300, y: 300 }, data: { label: 'Function' } }
          ],
          edges: [
            { id: 'importedEdge', source: 'importedNode', target: 'otherNode', type: 'default' }
          ],
          viewport: { x: 0, y: 0, zoom: 1 }
        }
      });
      
      // Import the project
      const importedProject = await projectService.importProject(projectJson);
      
      expect(importedProject).toBeDefined();
      
      if (importedProject) {
        expect(importedProject.metadata.id).toBeDefined();
        expect(importedProject.metadata.name).toBe('Imported Project');
        expect(importedProject.metadata.description).toBe('Imported from JSON');
        expect(importedProject.flowData.nodes).toHaveLength(1);
        expect(importedProject.flowData.edges).toHaveLength(1);
        
        // Verify the project was saved to the database
        const loadedProject = await projectService.loadProject(importedProject.metadata.id);
        expect(loadedProject).toBeDefined();
      }
    });
    
    it('throws an error when importing invalid JSON', async () => {
      const invalidJson = '{name: "Invalid JSON"';
      
      await expect(projectService.importProject(invalidJson)).rejects.toThrow();
    });
  });
}); 